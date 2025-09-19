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
	baseURL = "https://kakigori-api.fly.dev"
	storeID = "HKWZRTNL"
)

func main() {
	httpPort := os.Getenv("PORT")
	if httpPort == "" {
		httpPort = "8080"
	}

	// DI(Usecase)
	menuUsecase := usecase.NewMenuUsecase(baseURL)
	orderUsecase := usecase.NewOrderUsecase(baseURL)

	// DI(Handler)
	menuHandler := handler.NewMenuHandler(menuUsecase)
	orderHandler := handler.NewOrderHandler(orderUsecase)

	// Routing
	e := echo.New()
	e.GET("/v1/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})
	e.GET("/swagger.yaml", func(c echo.Context) error {
		return c.File("/v1/swagger/gateway-api.yml")
	})
	e.GET("/v1/stores/menu", func(c echo.Context) error {
		menuHandler.GetMenu(c.Response().Writer, c.Request(), storeID)
		return nil
	})
	e.POST("/v1/stores/orders", func(c echo.Context) error {
		orderHandler.PostOrders(c.Response().Writer, c.Request(), storeID)
		return nil
	})
	e.GET("/v1/stores/orders/:order_id", func(c echo.Context) error {
		orderHandler.GetOrderByID(c.Response().Writer, c.Request(), storeID, c.Param("order_id"))
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
