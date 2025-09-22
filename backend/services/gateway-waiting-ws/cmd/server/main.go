package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	gatewayapiv1 "chantingkakigori/gen/go/gateway_api/v1"
	"chantingkakigori/services/gateway-waiting-ws/internal/interface/handler"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	httpPort := os.Getenv("PORT")
	if httpPort == "" {
		httpPort = "8080"
	}

	// gRPC client to gateway-api
	gatewayApiGrpcAddr := os.Getenv("GATEWAY_API_GRPC_ADDR")
	if gatewayApiGrpcAddr == "" {
		gatewayApiGrpcAddr = "gateway-api:9090"
	}
	conn, err := grpc.Dial(gatewayApiGrpcAddr, grpc.WithTransportCredentials(insecure.NewCredentials())) //nolint:staticcheck // grpc.Dial is deprecated but supported throughout 1.x; migrate later
	if err != nil {
		log.Fatalf("failed to dial gateway-api gRPC: %v", err)
	}
	orderClient := gatewayapiv1.NewOrderServiceClient(conn)

	wsHandler := handler.NewWSStayHandler()
	confirmHandler := handler.NewWSConfirmHandler(orderClient)

	mux := http.NewServeMux()
	mux.HandleFunc("/ws/stay", wsHandler.HandleWebSocketStay)
	mux.HandleFunc("/ws/health", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("/ws/health called from %s", r.RemoteAddr)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})
	mux.HandleFunc("/ws/confirm", confirmHandler.HandleWebSocketConfirm)
	mux.HandleFunc("/swagger.yaml", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "/api/swagger/gateway-waiting-ws.yml")
	})

	srv := &http.Server{
		Addr:              ":" + httpPort,
		Handler:           mux,
		ReadTimeout:       15 * time.Second,
		ReadHeaderTimeout: 15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Printf("gateway-waiting-ws HTTP listening on :%s", httpPort)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("http server error: %v", err)
	}
}
