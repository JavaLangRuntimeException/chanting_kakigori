package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"chantingkakigori/services/gateway-api/internal/usecase"
)

// MenuHandler handles menu-related HTTP requests.
// Currently supports GET, and is structured to make adding POST/PUT easy.
type MenuHandler struct {
	Fetcher usecase.MenuFetcher
}

func NewMenuHandler(f usecase.MenuFetcher) *MenuHandler {
	return &MenuHandler{Fetcher: f}
}

// GetMenu processes GET /v1/stores/menu requests.
func (h *MenuHandler) GetMenu(w http.ResponseWriter, r *http.Request, storeID string) {
	ctx := r.Context()
	if _, hasDeadline := ctx.Deadline(); !hasDeadline {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
	}

	if storeID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":   "Bad Request",
			"message": "missing store id",
		})
		return
	}

	items, err := h.Fetcher.FetchMenu(ctx, storeID)
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
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{"menu": *items})
}
