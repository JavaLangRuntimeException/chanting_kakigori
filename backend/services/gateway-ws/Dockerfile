FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/gateway-ws ./services/gateway-ws/cmd/server

FROM gcr.io/distroless/base-debian12
ENV PORT=8080
COPY --from=builder /bin/gateway-ws /gateway-ws
COPY api/swagger/gateway-ws.yml /api/swagger/gateway-ws.yml
EXPOSE 8080
ENTRYPOINT ["/gateway-ws"]


