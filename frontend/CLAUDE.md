# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開発コマンド

```bash
# 開発サーバー起動（Turbopack使用、ポート3000）
pnpm dev

# プロダクションビルド
pnpm build

# TypeScript型チェック
pnpm run type-check

# Biomeによるコード整形とリント（自動修正）
pnpm run check

# Aspida APIクライアント生成（OpenAPIから型定義生成）
pnpm gen-aspida
```

## アーキテクチャ

### API統合（Aspida）
このプロジェクトはAspidaを使用してOpenAPI定義から型安全なAPIクライアントを自動生成しています：
- OpenAPI定義: `../backend/api/swagger/gateway-api.yml`
- 生成先: `src/api/`
- 設定: `aspida.config.js`
- APIクライアント使用時は `src/api/$api.ts` からインポート
- APIエンドポイントのベースURLはデフォルトで `http://localhost:8080`

### ディレクトリ構造
```
src/
├── api/              # Aspida生成APIクライアント
│   ├── $api.ts      # メインAPIクライアント
│   └── @types/      # API型定義
├── app/             # Next.js App Router
│   ├── _components/ # ページコンポーネント
│   ├── layout.tsx   # ルートレイアウト
│   └── page.tsx     # ホームページ
└── lib/
    └── utils.ts     # ユーティリティ関数（cn関数など）
```

### UIコンポーネント
- **スタイリング**: TailwindCSS v4 + class-variance-authority (CVA)
- **ユーティリティ**: `tailwind-merge` と `clsx` を使用した `cn` 関数
- **アイコン**: lucide-react
- **アニメーション**: tw-animate-css

## 技術スタック

- **Framework**: Next.js 15.5.3（App Router、Turbopack）
- **UI**: React 19.1.0
- **Language**: TypeScript（strict mode、`@/*` エイリアス）
- **Styling**: TailwindCSS v4
- **Code Quality**: Biome（タブインデント、ダブルクォート、import自動整理）
- **API Client**: Aspida + Axios
- **Package Manager**: pnpm

## Git Hooks（lefthook）

- **pre-commit**: Biomeでコード整形・リント（自動修正）
- **pre-push**: TypeScript型チェック

注: lefthookコマンドは全て `cd frontend &&` でディレクトリ移動してから実行される