package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"chantingkakigori/services/gateway-api/internal/usecase"
)

// OrderHandler handles order-related HTTP requests.
type OrderHandler struct {
	Usecase usecase.OrderUsecase
}

func NewOrderHandler(u usecase.OrderUsecase) *OrderHandler { return &OrderHandler{Usecase: u} }

// PostOrders processes POST /v1/stores/orders requests.
func (h *OrderHandler) PostOrders(w http.ResponseWriter, r *http.Request, storeID string) {
	ctx := r.Context()
	if _, hasDeadline := ctx.Deadline(); !hasDeadline {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
	}

	var body struct {
		MenuItemID string `json:"menu_item_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.MenuItemID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":   "Bad Request",
			"message": "Invalid request body",
		})
		return
	}

	order, err := h.Usecase.PostOrder(ctx, storeID, body.MenuItemID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":   "Bad Gateway",
			"message": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(&order)
}

func (h *OrderHandler) GetOrderByID(w http.ResponseWriter, r *http.Request, storeID string, orderID string) {
	ctx := r.Context()
	if _, hasDeadline := ctx.Deadline(); !hasDeadline {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
	}

	order, err := h.Usecase.GetOrderByID(ctx, storeID, orderID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":   "Bad Gateway",
			"message": err.Error(),
		})
		return
	}

	if order == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":   "Not Found",
			"message": "order not found",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(order)
}
