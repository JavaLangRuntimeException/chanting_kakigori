FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/gateway-waiting-ws ./services/gateway-waiting-ws/cmd/server

FROM gcr.io/distroless/base-debian12
ENV PORT=8080
COPY --from=builder /bin/gateway-waiting-ws /gateway-waiting-ws
COPY api/swagger/gateway-waiting-ws.yml /api/swagger/gateway-waiting-ws.yml
EXPOSE 8080
ENTRYPOINT ["/gateway-waiting-ws"]


