package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"

	kakigoriwsv1 "chantingkakigori/gen/go/kakigori_ws/v1"
	openapi "chantingkakigori/services/gateway-ws/internal"

	"github.com/gorilla/websocket"
)

type wsMessage struct {
	Value float64 `json:"value"`
}

type wsOut struct {
	Average float64 `json:"average"`
	Count   int     `json:"count"`
}

type client struct {
	conn *websocket.Conn
}

type room struct {
	id      string
	clients map[*client]struct{}
	mu      sync.Mutex
}

type wsHandler struct {
	rooms  map[string]*room
	mu     sync.Mutex
	client kakigoriwsv1.KakigoriWsAggregatorServiceClient
}

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

func NewWSHandler(c kakigoriwsv1.KakigoriWsAggregatorServiceClient) *wsHandler {
	return &wsHandler{rooms: make(map[string]*room), client: c}
}

func (h *wsHandler) getOrCreateRoom(id string) *room {
	h.mu.Lock()
	defer h.mu.Unlock()
	if rm, ok := h.rooms[id]; ok {
		return rm
	}
	rm := &room{id: id, clients: make(map[*client]struct{})}
	h.rooms[id] = rm
	return rm
}

func (h *wsHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Bind query into generated params type for consistency with OpenAPI
	params := openapi.GetWsParams{Room: r.URL.Query().Get("room")}
	if params.Room == "" {
		http.Error(w, "room is required", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade error: %v", err)
		return
	}
	log.Printf("ws connected: room=%s remote=%s", params.Room, r.RemoteAddr)

	rm := h.getOrCreateRoom(params.Room)
	cl := &client{conn: conn}

	rm.mu.Lock()
	rm.clients[cl] = struct{}{}
	rm.mu.Unlock()

	defer func() {
		rm.mu.Lock()
		delete(rm.clients, cl)
		empty := len(rm.clients) == 0
		rm.mu.Unlock()
		_ = conn.Close()
		log.Printf("ws disconnected: room=%s remote=%s", params.Room, r.RemoteAddr)
		if empty {
			// remove empty room so next session starts cleanly
			h.mu.Lock()
			delete(h.rooms, params.Room)
			h.mu.Unlock()
		}
	}()

	// Bridge to kakigori Aggregate stream
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()
	stream, err := h.client.Aggregate(ctx)
	if err != nil {
		log.Printf("aggregate stream error: %v", err)
		return
	}
	log.Printf("grpc aggregate stream opened: room=%s", params.Room)

	// Receive loop from gRPC -> WS
	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			resp, err := stream.Recv()
			if err != nil {
				log.Printf("grpc recv closed: room=%s err=%v", params.Room, err)
				return
			}
			if resp.GetRoom() != params.Room {
				continue
			}
			out := wsOut{Average: resp.GetAverage(), Count: int(resp.GetCount())}
			payload, _ := json.Marshal(out)
			// broadcast to all ws clients in the room
			rm.mu.Lock()
			clients := make([]*client, 0, len(rm.clients))
			for c := range rm.clients {
				clients = append(clients, c)
			}
			rm.mu.Unlock()
			for _, c := range clients {
				if err := c.conn.WriteMessage(websocket.TextMessage, payload); err != nil {
					log.Printf("ws write error: room=%s err=%v", params.Room, err)
				}
			}
			log.Printf("ws wrote(broadcast): room=%s avg=%.3f count=%d recipients=%d", params.Room, out.Average, out.Count, len(clients))
		}
	}()

	// Send loop WS -> gRPC
	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			log.Printf("ws read closed: room=%s err=%v", params.Room, err)
			break
		}
		var msg wsMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			log.Printf("ws json unmarshal error: room=%s err=%v data=%s", params.Room, err, string(data))
			continue
		}
		if msg.Value == 0 {
			// Do not send zero; nothing to return
			continue
		}
		if err := stream.Send(&kakigoriwsv1.AggregateRequest{Room: params.Room, Value: msg.Value}); err != nil {
			log.Printf("grpc send error: room=%s err=%v", params.Room, err)
			break
		}
		log.Printf("grpc sent: room=%s value=%.3f", params.Room, msg.Value)
	}
	// Close stream and wait receiver to end
	_ = stream.CloseSend()
	<-done
}
