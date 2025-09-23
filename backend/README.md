## ChantingKakigori Backend

技育祭2025秋のハッカソン用のバックエンドサービス。Goマイクロサービスでの実装をします。OpenAPI/Proto の自動生成をするプロジェクトです

### 構成
- services/gateway-ws: HTTP(WebSocket) ゲートウェイ（/ws, /ws/health）
- services/kakigori-ws: WebSocket 集約専用の gRPC バックエンド
  - Proto 定義: `proto/kakigori_ws/v1/aggregator.proto`
  - 生成コード: `gen/go/kakigori_ws/v1/`
- api/swagger: WebSocket ゲートウェイ仕様 `api/swagger/gateway-ws.yml`
- deploy/nginx: エッジ（リバースプロキシ）設定。`/ws` を gateway-ws、（将来）`/api` を別サービスに振り分け
- docker-compose: `backend/docker-compose.yml`

### 主要機能
- WebSocket `/ws`
  - 接続先: `ws://<host>/ws?room=<ROOM_ID>`（本番は `wss://` の予定です）
  - 送信（クライアント → サーバ）例:
    ```json
    { "value": 0.7 }
    ```
  - 受信（サーバ → クライアント）例:
    ```json
    { "average": 0.733, "count": 3 }
    ```
  - 仕様の要点:
    - `value` は 0 以外の数値をご送信ください
    - `average` は同一 room の直近 5 秒間に送られたサンプルの単純平均です
    - `count` は同一 room の直近 5 秒間のサンプル総数です

### 開発ツール/自動生成
- Proto(buf):
  - 定義: `proto/kakigori_ws/v1/aggregator.proto`
  - 生成: `gen/go/kakigori_ws/v1/`
  - コマンド: `make proto`（`buf lint` → `buf generate`）
※ OpenAPI は現状コード生成していません（仕様は `api/swagger/gateway-ws.yml`）。

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
```

### ローカル実行手順
```bash
cd backend
make proto          # Proto の lint & 生成
make test           # 単体テスト
make compose-up     # サービス起動（edge:8080, kakigori-ws:50051）
```
- Edge: `http://localhost:8080`
- WebSocket: `ws://localhost:8080/ws?room=demo`
- Health: `GET /healthz`（edge）, `GET /ws/health`（gateway-ws）
- Swagger: `api/swagger/gateway-ws.yml`（gateway-ws は `/swagger.yaml` を提供）

### CI（GitHub Actions）
- `.github/workflows/test.yml`
  - buf lint/gen → go test → docker compose up -d（スモーク）
- `.github/workflows/swagger.yml`
  - OpenAPI 生成の整合性チェック（`make swagger-check`）
- `.github/workflows/proto.yml`
  - Proto の lint/gen と生成差分チェック（PR 時）
- そのほか（必要に応じて）
  - `build.yml`, `lint.yml` など

### アーキテクチャ概要
- サービス境界
  - `edge(nginx)`: 入口リバプロ。`/ws` → gateway-ws、（将来）`/api` → 別RESTサービス。
  - `gateway-ws`: クライアント入出力（WebSocket/ヘルス）。ビジネスロジックは保持しません。
  - `kakigori-ws`: gRPC の `KakigoriWsAggregatorService` を提供し、room ごとの 5 秒平均を計算・配信します。
- 通信方式
  - クライアント ⇄ `edge` ⇄ `gateway-ws`: WebSocket `/ws`
  - `gateway-ws` ⇄ `kakigori-ws`: gRPC（双方向ストリーミング `Aggregate`）
- スケール/注意点
  - `gateway-ws` はステートレスで水平スケール可能です。
  - `kakigori-ws` はメモリ内で room を管理します。レプリカ数を増やす場合は sticky-session や Redis Pub/Sub 等の導入をご検討ください。

### ディレクトリ構成（抜粋）
```
backend/
  api/swagger/gateway-ws.yml               # WS Gateway の仕様
  proto/kakigori_ws/v1/aggregator.proto    # Proto 定義
  gen/go/kakigori_ws/v1/                   # 生成 Go コード
  deploy/nginx/nginx.conf                  # エッジ(Nginx)設定
  services/
    gateway-ws/
      cmd/server/main.go
      internal/interface/handler/ws_handler.go
    kakigori-ws/
      cmd/server/main.go
      internal/interface/grpcserver/aggregator_server.go
      internal/usecase/aggregate.go
  docker-compose.yml
  Makefile
```

## GKE デプロイ手順

### 前提条件
- Google Cloud Project: `chanting-472914`
- GKE クラスタ: `chanting-kakigori` (us-central1)
- Artifact Registry: `chanting-kakigori-repo`

### 1. 環境準備
```bash
# Google Cloud 認証
gcloud auth login
gcloud config set project chanting-472914

# Artifact Registry の設定
gcloud services enable artifactregistry.googleapis.com
gcloud artifacts repositories create chanting-kakigori-repo \
  --repository-format=docker \
  --location=us-central1
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### 2. Docker イメージのビルド・プッシュ
```bash
cd backend

# 各サービスのイメージをビルド（Linux/amd64 プラットフォーム）
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

# Artifact Registry にプッシュ
docker push us-central1-docker.pkg.dev/chanting-472914/chanting-kakigori-repo/gateway-api:latest
docker push us-central1-docker.pkg.dev/chanting-472914/chanting-kakigori-repo/kakigori-ws:latest
docker push us-central1-docker.pkg.dev/chanting-472914/chanting-kakigori-repo/gateway-ws:latest
docker push us-central1-docker.pkg.dev/chanting-472914/chanting-kakigori-repo/gateway-waiting-ws:latest
```

### 3. GKE クラスタへの接続
```bash
gcloud container clusters get-credentials chanting-kakigori --location=us-central1
```

### 4. Kubernetes マニフェストの適用
```bash
# 名前空間の作成
kubectl apply -f k8s/namespace.yaml

# シークレットの作成（GEMINI_API_KEY）(Secret.yamlはgit管理していません)
kubectl apply -f k8s/secret.yaml

# 設定マップの適用
kubectl apply -f k8s/configmap.yaml

# サービスのデプロイ
kubectl apply -f k8s/kakigori-ws.yaml
kubectl apply -f k8s/gateway-api.yaml
kubectl apply -f k8s/gateway-ws.yaml
kubectl apply -f k8s/gateway-waiting-ws.yaml
kubectl apply -f k8s/nginx.yaml
```

### 5. カスタムドメインの設定（任意）
```bash
# 静的 IP アドレスの予約
gcloud compute addresses create chanting-kakigori-ip --global

# Ingress の適用
kubectl apply -f k8s/ingress.yaml
```

### 6. デプロイ状況の確認
```bash
# デプロイメントの状況
kubectl get deployments -n chanting-kakigori

# ポッドの状況
kubectl get pods -n chanting-kakigori

# サービスの状況
kubectl get services -n chanting-kakigori

# Ingress の状況
kubectl get ingress -n chanting-kakigori
```

### 7. 動作確認
```bash
# LoadBalancer の外部 IP を取得
kubectl get service nginx-service -n chanting-kakigori

# API の動作確認
curl http://<EXTERNAL_IP>/api/v1/stores/menu
curl http://<EXTERNAL_IP>/api/v1/healthz

# カスタムドメインの場合
curl http://chanting-kakigori-backend.taramanji.com/api/v1/stores/menu
```

### 8. トラブルシューティング
```bash
# ポッドのログ確認
kubectl logs -n chanting-kakigori -l app=nginx
kubectl logs -n chanting-kakigori -l app=gateway-api

# ポッドの詳細確認
kubectl describe pod <POD_NAME> -n chanting-kakigori

# Ingress の詳細確認
kubectl describe ingress chanting-kakigori-ingress -n chanting-kakigori
```

### デプロイ済みサービス
- **nginx**: リバースプロキシ（LoadBalancer）
- **gateway-api**: REST API + gRPC サーバー
- **gateway-ws**: WebSocket ゲートウェイ
- **gateway-waiting-ws**: 待機 WebSocket サービス
- **kakigori-ws**: WebSocket 集約 gRPC サービス

### 補足
- OpenAPI からの chi サーバ生成も可能ですが、依存増を避けるため当面は types のみの生成にしています。必要になりましたら `-generate chi-server` を併用してください。
- 生成物をコミットする運用です。CI で整合性チェックを行いますので、差分が出た場合は `make proto` / `make swagger-gen` を実行してからコミットいただけますと幸いです。


