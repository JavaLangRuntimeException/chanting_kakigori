package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	gatewayapiv1 "chantingkakigori/gen/go/gateway_api/v1"

	"github.com/gorilla/websocket"
)

type confirmRoom struct {
	id      string
	clients map[*websocket.Conn]struct{}
	mu      sync.Mutex
	ordered bool
	ready   map[*websocket.Conn]struct{}
	timer   *time.Timer
}

type wsConfirmHandler struct {
	rooms       map[string]*confirmRoom
	mu          sync.Mutex
	orderClient gatewayapiv1.OrderServiceClient
}

func NewWSConfirmHandler(c gatewayapiv1.OrderServiceClient) *wsConfirmHandler {
	return &wsConfirmHandler{rooms: make(map[string]*confirmRoom), orderClient: c}
}

func (h *wsConfirmHandler) getOrCreateRoom(id string) *confirmRoom {
	h.mu.Lock()
	defer h.mu.Unlock()
	if rm, ok := h.rooms[id]; ok {
		return rm
	}
	rm := &confirmRoom{id: id, clients: make(map[*websocket.Conn]struct{}), ready: make(map[*websocket.Conn]struct{})}
	h.rooms[id] = rm
	return rm
}

func (h *wsConfirmHandler) HandleWebSocketConfirm(w http.ResponseWriter, r *http.Request) {
	room := r.URL.Query().Get("room")
	if room == "" {
		http.Error(w, "room is required", http.StatusBadRequest)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("confirm ws upgrade error: %v", err)
		return
	}
	rm := h.getOrCreateRoom(room)

	rm.mu.Lock()
	wasEmpty := len(rm.clients) == 0
	rm.clients[conn] = struct{}{}
	// Start 3-minute timer when the first client joins the room
	if wasEmpty {
		if rm.timer != nil {
			rm.timer.Stop()
		}
		rm.timer = time.AfterFunc(3*time.Minute, func() {
			h.orderForRoom(room, rm)
		})
	}
	rm.mu.Unlock()

	defer func() {
		rm.mu.Lock()
		delete(rm.clients, conn)
		delete(rm.ready, conn)
		empty := len(rm.clients) == 0
		shouldOrder := !rm.ordered && !empty && len(rm.ready) == len(rm.clients)
		if empty {
			// reset state when no one remains in the room
			if rm.timer != nil {
				rm.timer.Stop()
				rm.timer = nil
			}
			rm.ordered = false
			rm.ready = make(map[*websocket.Conn]struct{})
		}
		rm.mu.Unlock()
		if shouldOrder {
			h.orderForRoom(room, rm)
		}
		_ = conn.Close()
		if empty {
			// remove the room entry to fully reset counts/state
			h.mu.Lock()
			delete(h.rooms, room)
			h.mu.Unlock()
		}
	}()

	// Keep connection open (noop read loop)
	type confirmMessage struct {
		Status string `json:"status"`
	}
	for {
		msgType, msgData, err := conn.ReadMessage()
		if err != nil {
			break
		}
		if msgType != websocket.TextMessage {
			continue
		}
		var m confirmMessage
		if err := json.Unmarshal(msgData, &m); err != nil {
			continue
		}
		if m.Status != "ready" {
			continue
		}
		rm.mu.Lock()
		if _, ok := rm.ready[conn]; !ok {
			rm.ready[conn] = struct{}{}
		}
		shouldOrder := !rm.ordered && len(rm.clients) > 0 && len(rm.ready) == len(rm.clients)
		rm.mu.Unlock()
		if shouldOrder {
			h.orderForRoom(room, rm)
		}
	}
}

func (h *wsConfirmHandler) orderForRoom(menuID string, rm *confirmRoom) {
	rm.mu.Lock()
	if rm.timer != nil {
		rm.timer.Stop()
		rm.timer = nil
	}
	if rm.ordered {
		rm.mu.Unlock()
		return
	}
	if len(rm.clients) == 0 {
		rm.mu.Unlock()
		return
	}
	rm.ordered = true
	conns := make([]*websocket.Conn, 0, len(rm.clients))
	for c := range rm.clients {
		conns = append(conns, c)
	}
	rm.mu.Unlock()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	for _, c := range conns {
		resp, err := h.orderClient.PostOrder(ctx, &gatewayapiv1.PostOrderRequest{MenuItemId: menuID})
		if err != nil {
			log.Printf("order PostOrder error: %v", err)
			_ = c.WriteMessage(websocket.TextMessage, []byte(`{"error":"order failed"}`))
			continue
		}
		out := map[string]any{
			"id":           resp.GetId(),
			"menu_item_id": resp.GetMenuItemId(),
			"menu_name":    resp.GetMenuName(),
			"status":       resp.GetStatus(),
			"order_number": resp.GetOrderNumber(),
		}
		b, _ := json.Marshal(out)
		_ = c.WriteMessage(websocket.TextMessage, b)
	}

	// After sending results, close connections from the server side as requested
	deadline := time.Now().Add(2 * time.Second)
	for _, c := range conns {
		_ = c.WriteControl(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "order completed"), deadline)
		_ = c.Close()
	}

	// Optional: cleanup empty room to avoid leaks
	rm.mu.Lock()
	if len(rm.clients) == 0 {
		// best-effort removal; ignore if not present
		// actual client defers will remove from maps upon close
		fmt.Println("cleanup empty room")
	}
	rm.mu.Unlock()
}
