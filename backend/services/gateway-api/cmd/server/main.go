package main

import (
	"log"
	"net"
	"net/http"
	"os"
	"time"

	gatewayapiv1 "chantingkakigori/gen/go/gateway_api/v1"
	"chantingkakigori/services/gateway-api/internal/interface/handler"
	"chantingkakigori/services/gateway-api/internal/usecase"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"google.golang.org/grpc"
)

const (
	baseURL = "https://kakigori-api.fly.dev"
	storeID = "HKWZRTNL"
)

func init() {
	_ = godotenv.Load(".env")
}

func main() {
	httpPort := os.Getenv("PORT")
	if httpPort == "" {
		httpPort = "8080"
	}

	// DI(Usecase)
	menuUsecase := usecase.NewMenuUsecase(baseURL)
	orderUsecase := usecase.NewOrderUsecase(baseURL)
	chantUsecase, err := usecase.NewChantUsecase()
	if err != nil {
		log.Fatalf("failed to init chant usecase: %v", err)
	}

	// DI(Handler)
	menuHandler := handler.NewMenuHandler(menuUsecase)
	orderHandler := handler.NewOrderHandler(orderUsecase)
	chantHandler := handler.NewChantHandler(chantUsecase)

	// gRPC server for OrderService
	grpcAddr := os.Getenv("GRPC_ADDR")
	if grpcAddr == "" {
		grpcAddr = ":9090"
	}
	go func() {
		lis, err := net.Listen("tcp", grpcAddr)
		if err != nil {
			log.Fatalf("failed to listen gRPC: %v", err)
		}
		s := grpc.NewServer()
		gatewayapiv1.RegisterOrderServiceServer(s, handler.NewOrderGRPCServer(orderUsecase, storeID))
		log.Printf("gateway-api gRPC listening on %s", grpcAddr)
		if err := s.Serve(lis); err != nil {
			log.Fatalf("gRPC server error: %v", err)
		}
	}()

	// Routing
	e := echo.New()
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{"*"},
	}))
	e.GET("/api/v1/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})
	e.GET("/api/v1/swagger.yaml", func(c echo.Context) error {
		return c.File("/v1/swagger/gateway-api.yml")
	})
	e.GET("/api/v1/stores/menu", func(c echo.Context) error {
		menuHandler.GetMenu(c.Response().Writer, c.Request(), storeID)
		return nil
	})
	e.POST("/api/v1/stores/orders", func(c echo.Context) error {
		orderHandler.PostOrders(c.Response().Writer, c.Request(), storeID)
		return nil
	})
	e.GET("/api/v1/stores/orders/:order_id", func(c echo.Context) error {
		orderHandler.GetOrderByID(c.Response().Writer, c.Request(), storeID, c.Param("order_id"))
		return nil
	})
	e.POST("/api/v1/chant", func(c echo.Context) error {
		chantHandler.PostChant(c.Response().Writer, c.Request())
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
