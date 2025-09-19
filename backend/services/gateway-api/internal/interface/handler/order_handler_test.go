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

type fakeOrderUsecase struct {
	order   openapi.OrderResponse
	getByID *usecase.GetOrderByIDResponse
	err     error
}

func (f fakeOrderUsecase) PostOrder(_ context.Context, _ string, _ string) (*openapi.OrderResponse, error) {
	return &f.order, f.err
}

func (f fakeOrderUsecase) GetOrderByID(_ context.Context, _ string, _ string) (*usecase.GetOrderByIDResponse, error) {
	return f.getByID, f.err
}

func TestOrderHandler_BadRequest_InvalidBody(t *testing.T) {
	h := NewOrderHandler(fakeOrderUsecase{})

	req := httptest.NewRequest(http.MethodPost, "/v1/stores/HKWZRTNL/orders", strings.NewReader(`{}`))
	rec := httptest.NewRecorder()
	h.PostOrders(rec, req, "HKWZRTNL")

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

func TestOrderHandler_PostOrders_Success(t *testing.T) {
	id := "o-1"
	menuItemID := "giiku-sai"
	menuName := "x"
	orderNumber := 1
	status := openapi.Pending
	uc := fakeOrderUsecase{order: openapi.OrderResponse{
		Id:          &id,
		MenuItemId:  &menuItemID,
		MenuName:    &menuName,
		OrderNumber: &orderNumber,
		Status:      &status,
	}}

	h := NewOrderHandler(uc)
	req := httptest.NewRequest(http.MethodPost, "/v1/stores/HKWZRTNL/orders", strings.NewReader(`{"menu_item_id":"giiku-sai"}`))
	rec := httptest.NewRecorder()
	h.PostOrders(rec, req, "HKWZRTNL")

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}

	var resp openapi.OrderResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Id == nil || *resp.Id != id {
		t.Fatalf("unexpected id: %#v", resp.Id)
	}
	if resp.MenuItemId == nil || *resp.MenuItemId != menuItemID {
		t.Fatalf("unexpected menu_item_id: %#v", resp.MenuItemId)
	}
}

func TestOrderHandler_PostOrders_UpstreamError(t *testing.T) {
	h := NewOrderHandler(fakeOrderUsecase{err: errors.New("oops")})

	req := httptest.NewRequest(http.MethodPost, "/v1/stores/HKWZRTNL/orders", strings.NewReader(`{"menu_item_id":"giiku-sai"}`))
	rec := httptest.NewRecorder()
	h.PostOrders(rec, req, "HKWZRTNL")

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected 502, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}

	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body["error"] != "Bad Gateway" || body["message"] != "oops" {
		t.Fatalf("unexpected body: %s", rec.Body.String())
	}
}

func TestOrderHandler_GetOrderByID_Success(t *testing.T) {
	id := "o-1"
	h := NewOrderHandler(fakeOrderUsecase{getByID: &usecase.GetOrderByIDResponse{Id: &id}})

	req := httptest.NewRequest(http.MethodGet, "/v1/stores/HKWZRTNL/orders/o-1", nil)
	rec := httptest.NewRecorder()
	h.GetOrderByID(rec, req, "HKWZRTNL", "o-1")

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}

	var resp usecase.GetOrderByIDResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Id == nil || *resp.Id != "o-1" {
		t.Fatalf("unexpected id: %#v", resp.Id)
	}
}

func TestOrderHandler_GetOrderByID_UpstreamError(t *testing.T) {
	h := NewOrderHandler(fakeOrderUsecase{err: errors.New("oops")})

	req := httptest.NewRequest(http.MethodGet, "/v1/stores/HKWZRTNL/orders/o-1", nil)
	rec := httptest.NewRecorder()
	h.GetOrderByID(rec, req, "HKWZRTNL", "o-1")

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected 502, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}

	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body["error"] != "Bad Gateway" || body["message"] != "oops" {
		t.Fatalf("unexpected body: %s", rec.Body.String())
	}
}
