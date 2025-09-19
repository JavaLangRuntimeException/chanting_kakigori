package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"chantingkakigori/services/gateway-api/internal/interface/handler"
	"chantingkakigori/services/gateway-api/internal/usecase"

	"github.com/labstack/echo/v4"
)

const (
	upstreamBaseURL = "https://kakigori-api.fly.dev"
	storeID         = "HKWZRTNL"
)

func main() {
	httpPort := os.Getenv("PORT")
	if httpPort == "" {
		httpPort = "8080"
	}

	// DI(Usecase)
	menuUsecase := usecase.NewMenuUsecase(upstreamBaseURL)

	// DI(Handler)
	menuHandler := handler.NewMenuHandler(menuUsecase)

	// Routing
	e := echo.New()
	e.GET("/api/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})
	e.GET("/swagger.yaml", func(c echo.Context) error {
		return c.File("/api/swagger/gateway-api.yml")
	})
	e.GET("/api/v1/stores/menu", func(c echo.Context) error {
		menuHandler.GetMenu(c.Response().Writer, c.Request(), storeID)
		return nil
	})

	srv := &http.Server{
		Addr:              ":" + httpPort,
		Handler:           e,
		ReadTimeout:       15 * time.Second,
		ReadHeaderTimeout: 15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Printf("gateway-api HTTP listening on :%s", httpPort)
	if err := e.StartServer(srv); err != nil && err != http.ErrServerClosed {
		log.Fatalf("http server error: %v", err)
	}
}
