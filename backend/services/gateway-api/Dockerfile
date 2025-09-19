FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/gateway-api ./services/gateway-api/cmd/server

FROM gcr.io/distroless/base-debian12
ENV PORT=8080
COPY --from=builder /bin/gateway-api /gateway-api
COPY api/swagger/gateway-api.yml /api/swagger/gateway-api.yml
EXPOSE 8080
ENTRYPOINT ["/gateway-api"]


