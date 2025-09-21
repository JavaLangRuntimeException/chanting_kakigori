package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type stayPayload struct {
	StayNum   string `json:"stay_num"`
	StartTime string `json:"start_time"`
}

type stayClient struct {
	conn *websocket.Conn
}

type stayRoom struct {
	id            string
	clients       map[*stayClient]struct{}
	mu            sync.Mutex
	thirdJoinedAt time.Time
}

type wsStayHandler struct {
	rooms map[string]*stayRoom
	mu    sync.Mutex
}

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

func NewWSStayHandler() *wsStayHandler {
	return &wsStayHandler{rooms: make(map[string]*stayRoom)}
}

func (h *wsStayHandler) getOrCreateRoom(id string) *stayRoom {
	h.mu.Lock()
	defer h.mu.Unlock()
	if rm, ok := h.rooms[id]; ok {
		return rm
	}
	rm := &stayRoom{id: id, clients: make(map[*stayClient]struct{})}
	h.rooms[id] = rm
	return rm
}

func (h *wsStayHandler) broadcast(rm *stayRoom, payload stayPayload) {
	data, _ := json.Marshal(payload)
	rm.mu.Lock()
	clients := make([]*stayClient, 0, len(rm.clients))
	for c := range rm.clients {
		clients = append(clients, c)
	}
	rm.mu.Unlock()
	for _, c := range clients {
		if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("stay ws write error: room=%s err=%v", rm.id, err)
		}
	}
}

func (h *wsStayHandler) HandleWebSocketStay(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("room")
	if roomID == "" {
		http.Error(w, "room is required", http.StatusBadRequest)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("stay ws upgrade error: %v", err)
		return
	}
	log.Printf("stay ws connected: room=%s remote=%s", roomID, r.RemoteAddr)

	rm := h.getOrCreateRoom(roomID)
	cl := &stayClient{conn: conn}

	rm.mu.Lock()
	rm.clients[cl] = struct{}{}
	count := len(rm.clients)
	if count == 3 {
		rm.thirdJoinedAt = time.Now()
	}
	rm.mu.Unlock()

	// Ensure cleanup on exit
	defer func() {
		rm.mu.Lock()
		delete(rm.clients, cl)
		rm.mu.Unlock()
		_ = conn.Close()
		log.Printf("stay ws disconnected: room=%s remote=%s", roomID, r.RemoteAddr)
	}()

	// Immediately broadcast current state per spec
	switch count {
	case 1:
		h.broadcast(rm, stayPayload{StayNum: "1", StartTime: "null"})
	case 2:
		h.broadcast(rm, stayPayload{StayNum: "2", StartTime: "null"})
	case 3:
		// After 10 seconds, broadcast with start_time then disconnect all
		go func(joinedAt time.Time) {
			// initial broadcast can be optional; spec wants after 10s with time
			// Wait 10 seconds from third join
			delay := time.Until(joinedAt.Add(10 * time.Second))
			if delay < 0 {
				delay = 0
			}
			timer := time.NewTimer(delay)
			<-timer.C
			startISO := joinedAt.Add(10 * time.Second).UTC().Format(time.RFC3339)
			h.broadcast(rm, stayPayload{StayNum: "3", StartTime: startISO})
			// disconnect everyone
			rm.mu.Lock()
			clients := make([]*stayClient, 0, len(rm.clients))
			for c := range rm.clients {
				clients = append(clients, c)
			}
			rm.mu.Unlock()
			for _, c := range clients {
				_ = c.conn.WriteControl(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "session ended"), time.Now().Add(2*time.Second))
				_ = c.conn.Close()
			}
		}(rm.thirdJoinedAt)
	default:
		// 4 以上は仕様外だが、3 と同様に終了扱いにしておく
		// broadcast latest known state without start_time
		h.broadcast(rm, stayPayload{StayNum: "3", StartTime: "null"})
	}

	// Keep connection open until client closes or server closes on 3rd rule
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}
