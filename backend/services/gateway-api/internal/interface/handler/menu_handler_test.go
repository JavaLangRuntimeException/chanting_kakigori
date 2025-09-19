package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	openapi "chantingkakigori/services/gateway-api/internal/swagger"
)

type fakeMenuFetcher struct {
	items []openapi.MenuItem
	err   error
}

func (f fakeMenuFetcher) FetchMenu(_ context.Context, _ string) (*[]openapi.MenuItem, error) {
	return &f.items, f.err
}

func TestMenuHandler_BadRequestWhenNoStoreID(t *testing.T) {
	t.Setenv("STORE_ID", "")
	h := NewMenuHandler(fakeMenuFetcher{items: []openapi.MenuItem{}, err: nil})

	req := httptest.NewRequest(http.MethodGet, "/v1/stores/menu", nil)
	rec := httptest.NewRecorder()
	h.GetMenu(rec, req, "")

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestMenuHandler_Success(t *testing.T) {
	id := "giiku-sai"
	name := "x"
	desc := "y"
	items := []openapi.MenuItem{{Id: &id, Name: &name, Description: &desc}}
	h := NewMenuHandler(fakeMenuFetcher{items: items})

	req := httptest.NewRequest(http.MethodGet, "/v1/stores/menu", nil)
	rec := httptest.NewRecorder()
	h.GetMenu(rec, req, "HKWZRTNL")

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}

	var resp struct {
		Menu []openapi.MenuItem `json:"menu"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.Menu) != 1 || resp.Menu[0].Id == nil || *resp.Menu[0].Id != id {
		t.Fatalf("unexpected body: %s", rec.Body.String())
	}
}
