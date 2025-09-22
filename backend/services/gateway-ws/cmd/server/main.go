package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	kakigoriwsv1 "chantingkakigori/gen/go/kakigori_ws/v1"
	"chantingkakigori/pkg/grpcjson"
	"chantingkakigori/services/gateway-ws/internal/interface/handler"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	// Env
	httpPort := os.Getenv("PORT")
	if httpPort == "" {
		httpPort = "8080"
	}
	kakigoriAddr := os.Getenv("KAKIGORI_GRPC_ADDR")
	if kakigoriAddr == "" {
		kakigoriAddr = "localhost:50051"
	}

	// gRPC client to kakigori-ws
	grpcjson.Register()
	dialOpts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithDefaultCallOptions(grpc.ForceCodec(grpcjson.Codec{})),
	}
	conn, err := grpc.NewClient(kakigoriAddr, dialOpts...)
	if err != nil {
		log.Fatalf("failed to dial kakigori-ws: %v", err)
	}
	defer func() { _ = conn.Close() }()
	aggregatorClient := kakigoriwsv1.NewKakigoriWsAggregatorServiceClient(conn)

	// Handlers
	wsHandler := handler.NewWSHandler(aggregatorClient)

	mux := http.NewServeMux()
	// CORS middleware wrapper
	withCORS := func(h http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "*")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			h(w, r)
		}
	}

	mux.HandleFunc("/ws", withCORS(wsHandler.HandleWebSocket))
	mux.HandleFunc("/ws/health", withCORS(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("/ws/health called from %s", r.RemoteAddr)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}))
	// Serve swagger alias to gateway-ws.yml
	mux.HandleFunc("/swagger.yaml", withCORS(func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "/api/swagger/gateway-ws.yml")
	}))

	srv := &http.Server{
		Addr:              ":" + httpPort,
		Handler:           mux,
		ReadTimeout:       15 * time.Second,
		ReadHeaderTimeout: 15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Printf("gateway-ws HTTP listening on :%s (kakigori-ws=%s)", httpPort, kakigoriAddr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("http server error: %v", err)
	}
}
