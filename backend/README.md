## ChantingKakigori Backend

技育祭2025秋のハッカソン用のバックエンドサービス。Go マイクロサービス構成。OpenAPI/Proto の自動生成を用います。

### 構成
- services/gateway-api: REST API + gRPC(OrderService) サーバー
  - OpenAPI 仕様: `api/swagger/gateway-api.yml` → 型生成: `services/gateway-api/internal/swagger/gateway-api.gen.go`
  - エンドポイント(REST): `/api/v1/...`
  - エンドポイント(gRPC): `OrderService` on `:9090`
- services/gateway-ws: WebSocket ゲートウェイ(`/ws`, `/ws/health`)
  - kakigori-ws と gRPC 双方向ストリームで接続し、平均値を配信
  - Swagger 提供: `/swagger.yaml` (実体 `api/swagger/gateway-ws.yml`)
- services/gateway-waiting-ws: 待機/同時開始/注文確定用 WebSocket サービス(`/ws/stay`, `/ws/confirm`, `/ws/health`)
  - `OrderService`(gateway-api gRPC) を呼び出して注文作成
  - Swagger 提供: `/swagger.yaml` (実体 `api/swagger/gateway-waiting-ws.yml`)
- services/kakigori-ws: WebSocket 集約専用 gRPC バックエンド
  - Proto 定義: `proto/kakigori_ws/v1/aggregator.proto`
  - 生成コード: `gen/go/kakigori_ws/v1/`
- api/swagger: OpenAPI 仕様 (gateway-api, gateway-waiting-ws, gateway-ws)
- deploy/nginx: エッジ(Nginx) リバースプロキシ設定（Docker Compose 用）
  - `/ws` → gateway-ws, `/ws/stay` `/ws/confirm` → gateway-waiting-ws, `/api` → gateway-api
- k8s: GKE 用マニフェスト（ConfigMap で Nginx 設定を配布、LoadBalancer + Ingress）

### 主要エンドポイント
- REST (via Nginx `/api` → gateway-api):
  - GET `/api/v1/healthz` → {"status":"ok"}
  - GET `/api/v1/stores/menu`
  - POST `/api/v1/stores/orders` (body: `{ "menu_item_id": "..." }`)
  - GET `/api/v1/stores/orders/{orderId}`
  - POST `/api/v1/chant` (body: `{ "menu_item_id": "giiku-sai|giiku-haku|giiku-ten|giiku-camp" }`)
- WebSocket:
  - `/ws?room=<ROOM_ID>` (gateway-ws)
    - 送信(クライアント→サーバ): `{ "value": number }` (0 は無視)
    - 受信(サーバ→クライアント): `{ "average": number, "count": number }`（直近5秒の単純平均/件数）
  - `/ws/stay?room=<ROOM_ID>` (gateway-waiting-ws)
    - 接続数に応じてブロードキャスト: `{ "stay_num": "1|2|3", "start_time": "RFC3339|\"null\"" }`
    - 3人目接続時、JST で現在時刻+10秒の `start_time` を返し、サーバ側で切断
  - `/ws/confirm?room=<MENU_ID>` (gateway-waiting-ws)
    - 各クライアントが1回 `{ "status": "ready" }` を送信
    - 「接続中のクライアント数」=「ready 済みクライアント数」となった時点で注文作成し、全員に注文レスポンスを送信してサーバ側から切断
  - ヘルス: `/ws/health` (両 WS サービスで JSON `{"status":"ok"}`)

### アーキテクチャ概要
- サービス境界
  - `edge(nginx)`: 入口リバプロ。`/ws` → gateway-ws、`/ws/stay`/`/ws/confirm` → gateway-waiting-ws、`/api` → gateway-api
  - `gateway-ws`: WebSocket 入出力。gRPC 経由で `kakigori-ws` と接続し集計結果を配信
  - `gateway-waiting-ws`: WebSocket 待機/同時開始/注文確定。gRPC で `gateway-api` の `OrderService` を呼び出し
  - `gateway-api`: REST + gRPC(OrderService)。メニュー/注文/詠唱 API を提供
  - `kakigori-ws`: gRPC の `KakigoriWsAggregatorService` を提供し、room ごとの 5 秒平均を計算
- 通信方式
  - Client ⇄ Nginx ⇄ gateway-ws: WebSocket `/ws`
  - gateway-ws ⇄ kakigori-ws: gRPC 双方向ストリーム `Aggregate`
  - Client ⇄ Nginx ⇄ gateway-waiting-ws: WebSocket `/ws/stay`, `/ws/confirm`
  - gateway-waiting-ws ⇄ gateway-api: gRPC `OrderService` (9090)
  - Client ⇄ Nginx ⇄ gateway-api: REST `/api`
- スケーラビリティ/注意点
  - `gateway-ws`/`gateway-waiting-ws` はステートレスで水平スケール可能
  - `kakigori-ws` はメモリ内で room を管理。レプリカ増加時は sticky-session もしくは外部共有(例: Redis Pub/Sub)を検討

### 自動生成(Proto/OpenAPI)
- Proto(buf):
  - 定義: `proto/kakigori_ws/v1/aggregator.proto`, `proto/gateway_api/v1/order_service.proto`
  - 生成: `gen/go/kakigori_ws/v1/`, `gen/go/gateway_api/v1/`
  - コマンド: `make proto`（`buf lint` → `buf generate`）
- OpenAPI(oapi-codegen):
  - 仕様: `api/swagger/*.yml`
  - 生成対象: Go 型(types)のみ（各サービス `internal/swagger/*.gen.go`）
  - コマンド: `make swagger-gen` / 差分検出: `make swagger-check`

### Makefile ターゲット
```bash
# Proto
make proto-lint     # buf lint
make proto-gen      # buf generate
make proto          # lint → gen の合成

# Go
make test           # go test ./...
make tidy           # go mod tidy

# Docker
make compose-up     # docker compose up -d
make compose-down   # docker compose down

# OpenAPI
make swagger-gen    # api/swagger/*.yml → internal/swagger/*.gen.go
make swagger-check  # 生成の整合性チェック
```

### ローカル実行(Docker Compose)
```bash
cd backend
make proto          # Proto の lint & 生成（必要に応じて）
make swagger-gen    # OpenAPI 型生成（必要に応じて）
make test           # 単体テスト
make compose-up     # サービス起動 (edge:8080)
```
- エッジ: `http://localhost:8080/healthz`
- REST: `http://localhost:8080/api/v1/...`
- WebSocket: `ws://localhost:8080/ws?room=demo`
- 待機WS: `ws://localhost:8080/ws/stay?room=demo`
- 確認WS: `ws://localhost:8080/ws/confirm?room=giiku-sai`

### ディレクトリ構成（抜粋）
```
backend/
  api/swagger/
    gateway-api.yml
    gateway-waiting-ws.yml
    gateway-ws.yml
  proto/
    gateway_api/v1/order_service.proto
    kakigori_ws/v1/aggregator.proto
  gen/go/
    gateway_api/v1/
    kakigori_ws/v1/
  services/
    gateway-api/
      cmd/server/main.go
      internal/interface/handler/*
      internal/swagger/gateway-api.gen.go
    gateway-ws/
      cmd/server/main.go
      internal/interface/handler/ws_handler.go
    gateway-waiting-ws/
      cmd/server/main.go
      internal/interface/handler/ws_stay_handler.go
      internal/interface/handler/ws_confirm_handler.go
    kakigori-ws/
      cmd/server/main.go
      internal/interface/grpcserver/aggregator_server.go
      internal/usecase/aggregate.go
  deploy/nginx/nginx.conf
  docker-compose.yml
  Makefile
```

## GKE デプロイ

### 前提
- Project: `chanting-472914`
- Cluster: `chanting-kakigori` (us-central1)
- Artifact Registry: `chanting-kakigori-repo`

### 1. 認証/準備
```bash
gcloud auth login
gcloud config set project chanting-472914

# Artifact Registry
gcloud services enable artifactregistry.googleapis.com
gcloud artifacts repositories create chanting-kakigori-repo \
  --repository-format=docker \
  --location=us-central1 || true
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### 2. Docker イメージのビルド/プッシュ
```bash
cd backend
# linux/amd64 を想定

docker build --platform linux/amd64 \
  -f services/gateway-api/Dockerfile \
  -t us-central1-docker.pkg.dev/chanting-472914/chanting-kakigori-repo/gateway-api:latest .

docker build --platform linux/amd64 \
  -f services/kakigori-ws/Dockerfile \
  -t us-central1-docker.pkg.dev/chanting-472914/chanting-kakigori-repo/kakigori-ws:latest .

docker build --platform linux/amd64 \
  -f services/gateway-ws/Dockerfile \
  -t us-central1-docker.pkg.dev/chanting-472914/chanting-kakigori-repo/gateway-ws:latest .

docker build --platform linux/amd64 \
  -f services/gateway-waiting-ws/Dockerfile \
  -t us-central1-docker.pkg.dev/chanting-472914/chanting-kakigori-repo/gateway-waiting-ws:latest .

# Push
docker push us-central1-docker.pkg.dev/chanting-472914/chanting-kakigori-repo/gateway-api:latest
docker push us-central1-docker.pkg.dev/chanting-472914/chanting-kakigori-repo/kakigori-ws:latest
docker push us-central1-docker.pkg.dev/chanting-472914/chanting-kakigori-repo/gateway-ws:latest
docker push us-central1-docker.pkg.dev/chanting-472914/chanting-kakigori-repo/gateway-waiting-ws:latest
```

### 3. クラスタ接続
```bash
gcloud container clusters get-credentials chanting-kakigori --location=us-central1
```

### 4. マニフェスト適用
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml         # GEMINI_API_KEY (Base64)
kubectl apply -f k8s/configmap.yaml      # Nginx 設定

kubectl apply -f k8s/kakigori-ws.yaml
kubectl apply -f k8s/gateway-api.yaml
kubectl apply -f k8s/gateway-ws.yaml
kubectl apply -f k8s/gateway-waiting-ws.yaml
kubectl apply -f k8s/nginx.yaml          # LoadBalancer(Service) + Deployment
# Ingress を使う場合
kubectl apply -f k8s/gclb-backendconfig.yaml
kubectl apply -f k8s/ingress.yaml
```

### 5. 動作確認
```bash
# 外部 IP (LoadBalancer)
kubectl get service nginx-service -n chanting-kakigori

# API
curl http://<EXTERNAL_IP>/api/v1/stores/menu
curl http://<EXTERNAL_IP>/api/v1/healthz

# WS
# 平均値配信
websocat ws://<EXTERNAL_IP>/ws?room=demo
# 待機
websocat ws://<EXTERNAL_IP>/ws/stay?room=demo
# 確認(メニューIDを room として利用)
websocat -E ws://<EXTERNAL_IP>/ws/confirm?room=giiku-sai
```

### 6. トラブルシューティング
```bash
kubectl logs -n chanting-kakigori -l app=nginx
kubectl logs -n chanting-kakigori -l app=gateway-api
kubectl logs -n chanting-kakigori -l app=gateway-ws
kubectl logs -n chanting-kakigori -l app=gateway-waiting-ws
kubectl logs -n chanting-kakigori -l app=kakigori-ws

kubectl describe pod <POD> -n chanting-kakigori
kubectl get ingress -n chanting-kakigori | cat
kubectl describe ingress chanting-kakigori-ingress -n chanting-kakigori | cat
```

### デプロイ済みコンポーネント
- **nginx**: リバースプロキシ（LoadBalancer / Ingress 経由）
- **gateway-api**: REST API + gRPC(OrderService)
- **gateway-ws**: WebSocket ゲートウェイ
- **gateway-waiting-ws**: 待機/確認 WebSocket サービス
- **kakigori-ws**: WebSocket 集約 gRPC サービス

### 補足
- OpenAPI は型生成のみとしサーバ生成は未使用。必要に応じて `-generate chi-server` などの採用を検討
- 生成物はコミット対象。差分は `make proto` / `make swagger-gen` で再生成してコミットしてください


