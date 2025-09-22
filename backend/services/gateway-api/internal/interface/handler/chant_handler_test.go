package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	openapi "chantingkakigori/services/gateway-api/internal/swagger"
	"chantingkakigori/services/gateway-api/internal/usecase"
)

type fakeChantUsecase struct {
	resp *usecase.ChantResponse
	err  error
}

func (f fakeChantUsecase) GenerateChant(_ context.Context, _ openapi.PostApiV1ChantJSONRequestBody) (*usecase.ChantResponse, error) {
	return f.resp, f.err
}

func TestChantHandler_BadRequest_InvalidBody(t *testing.T) {
	h := NewChantHandler(fakeChantUsecase{})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/chant", strings.NewReader(`{}`))
	rec := httptest.NewRecorder()
	h.PostChant(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}

	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body["error"] != "Bad Request" || body["message"] != "Invalid request body" {
		t.Fatalf("unexpected body: %s", rec.Body.String())
	}
}

func TestChantHandler_Success(t *testing.T) {
	h := NewChantHandler(fakeChantUsecase{resp: &usecase.ChantResponse{Chant: "詠唱"}})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/chant", strings.NewReader(`{"menu_item_id":"giiku-sai"}`))
	rec := httptest.NewRecorder()
	h.PostChant(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}

	var resp usecase.ChantResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Chant != "詠唱" {
		t.Fatalf("unexpected chant: %s", resp.Chant)
	}
}

func TestChantHandler_UsecaseError(t *testing.T) {
	h := NewChantHandler(fakeChantUsecase{err: errors.New("nope")})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/chant", strings.NewReader(`{"menu_item_id":"giiku-sai"}`))
	rec := httptest.NewRecorder()
	h.PostChant(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}

	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body["error"] != "Bad Request" || body["message"] != "nope" {
		t.Fatalf("unexpected body: %s", rec.Body.String())
	}
}
