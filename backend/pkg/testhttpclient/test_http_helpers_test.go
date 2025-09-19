package testhttpclient

import "net/http"

type roundTripperFunc func(*http.Request) (*http.Response, error)

func (f roundTripperFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

type httpClient struct{ rt http.RoundTripper }

func (c *httpClient) Do(req *http.Request) (*http.Response, error) {
	return c.rt.RoundTrip(req)
}
