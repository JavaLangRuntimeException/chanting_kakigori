# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

技育祭2025秋ハッカソン用のWebアプリケーション。モノレポ構造で、フロントエンドはNext.js 15、バックエンドはGoマイクロサービスで構成。

## プロジェクト構造

```
.
├── frontend/         # Next.js 15 フロントエンドアプリケーション
├── backend/          # Go マイクロサービス（WebSocket/gRPC実装）
├── .github/          # GitHub Actions ワークフロー
└── lefthook.yml      # Git Hooks設定（pre-commit/pre-push）
```

## 開発コマンド

### フロントエンド開発

```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係のインストール
pnpm install

# 開発サーバー起動（Turbopack使用、ポート3000）
pnpm dev

# プロダクションビルド
pnpm build

# TypeScript型チェック
pnpm run type-check

# Biomeによるフォーマット・リント（自動修正）
pnpm run check

# OpenAPIからAPI型定義を生成（Aspida使用）
pnpm gen-aspida
```

### バックエンド開発

```bash
# バックエンドディレクトリに移動
cd backend

# Protoファイルのリント＆コード生成
make proto

# 単体テスト実行
make test

# Docker Compose起動（Edge:8080, Services起動）
make compose-up

# Docker Compose停止
make compose-down

# OpenAPI型定義生成
make swagger-gen

# Goモジュール整理
make tidy
```

### Git Hooks初期化（初回のみ）

```bash
cd frontend
pnpx lefthook install
```

## 技術スタック詳細

### フロントエンド
- **Framework**: Next.js 15.5.3（App Router, Turbopack）
- **UI Library**: React 19.1.0
- **Styling**: TailwindCSS v4、tw-animate-css
- **Language**: TypeScript（strict mode）
- **Code Quality**: Biome（formatter & linter）
- **API Client**: Aspida + Axios（OpenAPI連携）
- **Package Manager**: pnpm

### バックエンド
- **Language**: Go
- **API Gateway**: gateway-ws（WebSocket）
- **gRPC Service**: kakigori-ws（集約処理）
- **Edge Proxy**: Nginx
- **Protocol Buffers**: buf（lint & generate）
- **OpenAPI**: oapi-codegen v2

### 設定の特徴
- **TypeScript**: `@/*` エイリアスが `src/*` にマップ
- **Biome**: タブインデント、ダブルクォート、import自動整理
- **Git Hooks** (Lefthook):
  - pre-commit: Biomeチェック（自動修正）
  - pre-push: TypeScript型チェック
- **Aspida**: `/backend/api/swagger/gateway-api.yml` から型定義を自動生成

## アーキテクチャ

### フロントエンド構造
- `/frontend/src/app/`: Next.js App Router
- `/frontend/src/api/`: Aspida生成API型定義
- `/frontend/public/`: 静的ファイル（画像等）
- `/frontend/aspida.config.js`: API型生成設定

### バックエンド構造
- `/backend/services/gateway-ws/`: WebSocketゲートウェイ
- `/backend/services/kakigori-ws/`: gRPC集約サービス
- `/backend/proto/`: Protocol Buffers定義
- `/backend/api/swagger/`: OpenAPI仕様
- `/backend/deploy/nginx/`: エッジプロキシ設定

### WebSocketエンドポイント
- **接続**: `ws://localhost:8080/ws?room=<ROOM_ID>`（本番: `wss://`）
- **送信形式**: `{ "value": 0.7 }`（0以外の数値）
- **受信形式**: `{ "average": 0.733, "count": 3 }`（5秒間平均）
- **ヘルスチェック**: `GET /ws/health`

### GitHub Actions
- `build.yml`: ビルドチェック
- `lint.yml`: リントチェック
- `test.yml`: テスト実行（Go test含む）
- `claude.yml`: Claude AI統合
- `proto.yml`: Proto生成差分チェック
- `swagger.yml`: OpenAPI整合性チェック

## 開発ワークフロー

1. `feature/*` ブランチで機能開発
2. コミット時にBiomeが自動実行（pre-commit）
3. プッシュ時に型チェック実行（pre-push）
4. PRでGitHub Actionsによる各種チェック
5. mainブランチへマージ

## 重要な注意事項

- Lefthookコマンドは全て `cd frontend &&` でディレクトリ移動してから実行される
- API型定義更新時は `cd frontend && pnpm gen-api` を実行してコミット
- Proto/OpenAPI生成物はコミットする運用（CIで差分チェック）
- バックエンドのkakigori-wsはメモリ内room管理（スケール時は要検討）