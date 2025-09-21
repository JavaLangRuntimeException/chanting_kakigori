package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"chantingkakigori/services/gateway-waiting-ws/internal/interface/handler"
)

func main() {
	httpPort := os.Getenv("PORT")
	if httpPort == "" {
		httpPort = "8080"
	}

	wsHandler := handler.NewWSStayHandler()

	mux := http.NewServeMux()
	mux.HandleFunc("/ws/stay", wsHandler.HandleWebSocketStay)
	mux.HandleFunc("/ws/health", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("/ws/health called from %s", r.RemoteAddr)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})
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
