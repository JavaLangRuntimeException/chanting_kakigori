package usecase

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"

	testhttpclient "chantingkakigori/pkg/testhttpclient"
)

func TestPostOrder_Success(t *testing.T) {
	uc := &OrderClient{BaseURL: "https://example", Client: &testhttpclient.Client{RT: testhttpclient.RoundTripperFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Path != "/v1/stores/HKWZRTNL/orders" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		if r.Method != http.MethodPost {
			t.Fatalf("unexpected method: %s", r.Method)
		}
		body := `{"id":"o-1","menu_item_id":"giiku-sai","menu_name":"x","order_number":1,"status":"pending"}`
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}, nil
	})}}

	order, err := uc.PostOrder(context.Background(), "HKWZRTNL", "giiku-sai")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if order.Id == nil || *order.Id != "o-1" {
		t.Fatalf("unexpected id: %#v", order.Id)
	}
	if order.MenuItemId == nil || *order.MenuItemId != "giiku-sai" {
		t.Fatalf("unexpected menu_item_id: %#v", order.MenuItemId)
	}
	if order.MenuName == nil || *order.MenuName != "x" {
		t.Fatalf("unexpected menu_name: %#v", order.MenuName)
	}
	if order.OrderNumber == nil || *order.OrderNumber != 1 {
		t.Fatalf("unexpected order_number: %#v", order.OrderNumber)
	}
	if order.Status == nil || string(*order.Status) != "pending" {
		t.Fatalf("unexpected status: %#v", order.Status)
	}
}

func TestPostOrder_UpstreamError(t *testing.T) {
	uc := &OrderClient{BaseURL: "https://example", Client: &testhttpclient.Client{RT: testhttpclient.RoundTripperFunc(func(r *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: 500, Body: io.NopCloser(strings.NewReader("oops")), Header: make(http.Header)}, nil
	})}}

	_, err := uc.PostOrder(context.Background(), "HKWZRTNL", "giiku-sai")
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}

func TestGetOrderByID_Success(t *testing.T) {
	uc := &OrderClient{BaseURL: "https://example", Client: &testhttpclient.Client{RT: testhttpclient.RoundTripperFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Path != "/v1/stores/HKWZRTNL/orders/o-1" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		body := `{"id":"o-1","menu_item_id":"giiku-sai","menu_name":"x","order_number":1,"status":"pending"}`
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}, nil
	})}}

	order, err := uc.GetOrderByID(context.Background(), "HKWZRTNL", "o-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if order.Id == nil || *order.Id != "o-1" {
		t.Fatalf("unexpected id: %#v", order.Id)
	}
}

func TestGetOrderByID_UpstreamError(t *testing.T) {
	uc := &OrderClient{BaseURL: "https://example", Client: &testhttpclient.Client{RT: testhttpclient.RoundTripperFunc(func(r *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: 500, Body: io.NopCloser(strings.NewReader("oops")), Header: make(http.Header)}, nil
	})}}
	_, err := uc.GetOrderByID(context.Background(), "HKWZRTNL", "o-1")
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}
