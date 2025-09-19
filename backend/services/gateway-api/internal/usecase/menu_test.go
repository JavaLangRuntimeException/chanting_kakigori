package usecase

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"
)

type roundTripperFunc func(*http.Request) (*http.Response, error)

func (f roundTripperFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

type httpClient struct{ rt http.RoundTripper }

func (c *httpClient) Do(req *http.Request) (*http.Response, error) {
	return c.rt.RoundTrip(req)
}

func TestFetchMenu_Success(t *testing.T) {
	uc := &MenuUsecase{BaseURL: "https://example", Client: &httpClient{rt: roundTripperFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Path != "/v1/stores/HKWZRTNL/menu" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		body := `{"menu":[{"id":"giiku-sai","name":"x","description":"y"}]}`
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}, nil
	})}}

	items, err := uc.FetchMenu(context.Background(), "HKWZRTNL")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(items))
	}
	if items[0].Id == nil || *items[0].Id != "giiku-sai" {
		t.Fatalf("unexpected id: %#v", items[0].Id)
	}
}

func TestFetchMenu_UpstreamError(t *testing.T) {
	uc := &MenuUsecase{BaseURL: "https://example", Client: &httpClient{rt: roundTripperFunc(func(r *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: 500, Body: io.NopCloser(strings.NewReader("oops")), Header: make(http.Header)}, nil
	})}}

	_, err := uc.FetchMenu(context.Background(), "HKWZRTNL")
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}
