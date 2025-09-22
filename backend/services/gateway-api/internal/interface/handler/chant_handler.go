package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	openapi "chantingkakigori/services/gateway-api/internal/swagger"
	"chantingkakigori/services/gateway-api/internal/usecase"
)

type ChantHandler struct {
	Usecase usecase.ChantUsecase
}

func NewChantHandler(u usecase.ChantUsecase) *ChantHandler { return &ChantHandler{Usecase: u} }

func (h *ChantHandler) PostChant(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if _, hasDeadline := ctx.Deadline(); !hasDeadline {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, 15*time.Second)
		defer cancel()
	}

	var body openapi.PostApiV1ChantJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.MenuItemId == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":   "Bad Request",
			"message": "Invalid request body",
		})
		return
	}

	res, err := h.Usecase.GenerateChant(ctx, body)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(res)
}
