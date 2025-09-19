package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
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

// ServeHTTP keeps backward compatibility for tests; routing is done in main.go.
func (h *MenuHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	storeID := os.Getenv("STORE_ID")
	if storeID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":   "Bad Request",
			"message": "STORE_ID is required",
		})
		return
	}
	// Delegate to explicit method which is used by main.go as well
	h.GetMenu(w, r, storeID)
}

// GetMenu processes GET /v1/stores/menu requests.
func (h *MenuHandler) GetMenu(w http.ResponseWriter, r *http.Request, storeID string) {
	ctx := r.Context()
	if _, hasDeadline := ctx.Deadline(); !hasDeadline {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
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
	_ = json.NewEncoder(w).Encode(map[string]any{"menu": items})
}
