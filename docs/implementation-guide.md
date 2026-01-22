# 開発実装手順書

**作成日**: 2026年1月20日
**対象プロジェクト**: 金融資産シミュレーター (asset-vision)

---

## 概要

本ドキュメントは、金融資産シミュレーターの開発実装手順を定義する。
要求仕様書（requirements.md）に基づき、7つのフェーズに分けて段階的に実装を進める。

---

## 前提条件

### 開発環境

| 項目 | バージョン/内容 |
|------|----------------|
| Node.js | v20以上推奨 |
| パッケージマネージャ | npm |
| エディタ | VSCode推奨 |

### セットアップ済み

- [x] React 19 + Vite 7
- [x] TypeScript 5.9
- [x] Tailwind CSS v4
- [x] shadcn/ui（button, card, input, table, dialog, select, tabs, label）
- [x] @supabase/supabase-js
- [x] recharts
- [x] `.env`ファイル（Supabase接続情報）

---

## Phase 1: 基盤構築

### 1-1. Supabaseクライアント設定

**ファイル**: `src/lib/supabase.ts`

```typescript
// 実装内容
- Supabaseクライアントの初期化
- 環境変数からURL/Anon Keyを読み込み
- 型安全なクライアントのエクスポート
```

**依存関係**: なし

---

### 1-2. 型定義ファイル作成

**ファイル**: `src/types/index.ts`

```typescript
// 定義する型
- Stock: 株式銘柄（銘柄名、保有額）
- Assets: 資産全体（株式配列、国債、現金、年齢）
- IncomeExpensePlan: 収支計画（基本設定）
- AnnualPlan: 年次計画（年、年齢、収入、支出①、支出②）
- RegimeSettings: レジーム設定（利回り、確率、継続年数）
- WithdrawalPriority: 取崩し優先順位
- Scenario: シナリオ（名前、レジームパラメータ）
- SimulationResult: シミュレーション結果
- YearlyResult: 年次結果（パーセンタイル別資産）
- SummaryMetrics: サマリー指標
```

**依存関係**: なし

---

### 1-3. 認証機能

**ファイル**:
- `src/contexts/AuthContext.tsx`
- `src/components/auth/LoginDialog.tsx`
- `src/components/auth/SignUpDialog.tsx`

```typescript
// 実装内容
- AuthContext: 認証状態管理（user, loading, signIn, signUp, signOut）
- LoginDialog: ログインフォーム（メール/パスワード）
- SignUpDialog: 新規登録フォーム
- パスワードリセット機能
```

**依存関係**: 1-1

---

### 1-4. メインレイアウト

**ファイル**:
- `src/components/layout/Header.tsx`
- `src/components/layout/MainLayout.tsx`
- `src/App.tsx`の更新

```
┌─────────────────────────────────────────────────────────────────────────┐
│  金融資産シミュレーター                    [ログイン] or [ユーザー名]  │
├───────────────────────────────┬─────────────────────────────────────────┤
│  【入力エリア】               │  【シミュレーション結果】               │
│  （左カラム: 40%）            │  （右カラム: 60%）                      │
└───────────────────────────────┴─────────────────────────────────────────┘
```

**依存関係**: 1-3

---

## Phase 2: 入力UI実装

### 2-1. 現在の資産入力

**ファイル**: `src/components/input/AssetsInput.tsx`

```typescript
// 実装内容
- 株式リスト（複数銘柄の追加/編集/削除）
- 国債保有額入力
- 現金保有額入力
- 年齢入力
- 合計表示
```

**UI要素**: Card, Input, Button, Table

**依存関係**: 1-2, 1-4

---

### 2-2. 収支計画 - 基本設定

**ファイル**: `src/components/input/IncomeExpenseSettings.tsx`

```typescript
// 入力項目
- 開始年（デフォルト: 現在年）
- シミュレーション期間（デフォルト: 30年）
- 初期収入（万円）
- 収入成長率（デフォルト: 0%）
- 初期基本生活費（万円）
- 基本生活費成長率（デフォルト: 1%）
```

**依存関係**: 1-2, 1-4

---

### 2-3. 収支計画 - 年次テーブル

**ファイル**: `src/components/input/AnnualPlanTable.tsx`

```typescript
// 実装内容
- 基本設定から年次データを自動生成
- 各行の編集機能（収入、基本生活費、臨時支出）
- 列: 年、年齢、収入、基本生活費（支出①）、臨時支出（支出②）
```

**UI要素**: Table, Input

**依存関係**: 2-2

---

### 2-4. レジーム設定

**ファイル**: `src/components/input/RegimeSettings.tsx`

```typescript
// 入力項目（株式）
- 通常期利回り（デフォルト: 8%）
- 暴落期利回り（デフォルト: -30%）
- 戻り期利回り（デフォルト: 15%）
- 暴落発生確率（デフォルト: 10%）
- 戻り期継続年数（デフォルト: 4年）

// 入力項目（その他）
- 国債リターン（デフォルト: 1.2%）
- 現金リターン（デフォルト: 0%）
```

**依存関係**: 1-2, 1-4

---

### 2-5. 取崩し優先順位設定

**ファイル**: `src/components/input/WithdrawalPrioritySettings.tsx`

```typescript
// 実装内容
- 通常時の優先順位（デフォルト: 株式→国債→現金）
- 暴落時の優先順位（デフォルト: 国債→現金→株式）
- ドラッグ&ドロップまたはSelect UIで順位変更
```

**UI要素**: Select, Card

**依存関係**: 1-2, 1-4

---

## Phase 3: シミュレーションエンジン

### 3-1. レジーム遷移ロジック

**ファイル**: `src/lib/simulation/regime.ts`

```typescript
// 実装内容
- Regime型: 'normal' | 'crash' | 'recovery'
- determineNextRegime(): 現在のレジームから次のレジームを決定
- getRegimeReturn(): レジームに応じた利回りを返す

// 遷移ルール
- 通常期 → 暴落期（確率で遷移）
- 暴落期 → 戻り期（翌年自動遷移）
- 戻り期 → 通常期（継続年数終了後）
```

**依存関係**: 1-2

---

### 3-2. 取崩しロジック

**ファイル**: `src/lib/simulation/withdrawal.ts`

```typescript
// 実装内容
- withdraw(): 優先順位に従って資産から取崩し
- 入力: 取崩し額、資産状態、優先順位リスト
- 出力: 更新後の資産状態、不足額

// ロジック
for each asset in priorityList:
  actualWithdrawal = min(assetBalance, remainingAmount)
  assetBalance -= actualWithdrawal
  remainingAmount -= actualWithdrawal
```

**依存関係**: 1-2

---

### 3-3. モンテカルロシミュレーション

**ファイル**: `src/lib/simulation/monteCarlo.ts`

```typescript
// 実装内容
- runSimulation(): 1回のシミュレーション試行を実行
- runMonteCarloSimulation(): 1,000回の試行を実行
- 各年の資産推移を記録
- 枯渇判定と枯渇年の記録

// パラメータ
- 試行回数: 1,000回（デフォルト）
- 時間単位: 年次
```

**依存関係**: 3-1, 3-2

---

### 3-4. 統計量計算

**ファイル**: `src/lib/simulation/statistics.ts`

```typescript
// 実装内容
- calculatePercentile(): パーセンタイル計算（5%, 50%, 95%）
- calculateDepletionProbability(): 枯渇確率計算
- calculateMedianDepletionYear(): 枯渇年の中央値
- calculateAverageCrashCount(): 平均暴落回数
- aggregateResults(): 年次別の統計量集計
```

**依存関係**: 3-3

---

## Phase 4: 出力UI実装

### 4-1. 資産推移グラフ

**ファイル**: `src/components/output/AssetChart.tsx`

```typescript
// 実装内容
- rechartsを使用した折れ線グラフ
- 中央値ライン（実線）
- 信頼区間（5%-95%）を帯で表示
- 枯渇ライン（資産0の参照線）
- X軸: 年、Y軸: 資産額（万円）
```

**UI要素**: recharts (LineChart, Area, Line, XAxis, YAxis, Tooltip)

**依存関係**: 3-4

---

### 4-2. サマリー指標表示

**ファイル**: `src/components/output/SummaryMetrics.tsx`

```typescript
// 表示項目
- 資産枯渇確率（%）
- 枯渇年の中央値（枯渇する場合）
- 期末資産（中央値）
- 期末資産（5%タイル）
- 期末資産（95%タイル）
- 暴落発生回数（平均）
```

**UI要素**: Card

**依存関係**: 3-4

---

### 4-3. 年次結果テーブル

**ファイル**: `src/components/output/YearlyResultTable.tsx`

```typescript
// 表示列
- 年
- 年齢
- 収入
- 支出①（基本生活費）
- 支出②（臨時支出）
- 資産（5%タイル）
- 資産（中央値）
- 資産（95%タイル）
```

**UI要素**: Table

**依存関係**: 3-4

---

## Phase 5: シナリオ管理

### 5-1. シナリオCRUD機能

**ファイル**:
- `src/components/input/ScenarioManager.tsx`
- `src/components/input/ScenarioDialog.tsx`

```typescript
// 実装内容
- シナリオ一覧表示（テーブル形式）
- 新規作成ダイアログ
- 編集ダイアログ
- 削除確認ダイアログ
- シナリオ名とレジームパラメータの保存
```

**依存関係**: 2-4

---

### 5-2. 複数シナリオ比較シミュレーション

**ファイル**: `src/lib/simulation/compareScenarios.ts`

```typescript
// 実装内容
- 選択された複数シナリオを一括シミュレーション
- 各シナリオの結果を配列で返す
- シナリオ名と結果の紐付け
```

**依存関係**: 3-3, 5-1

---

### 5-3. 比較グラフ表示

**ファイル**: `src/components/output/ComparisonChart.tsx`

```typescript
// 実装内容
- 複数シナリオの中央値を異なる色で表示
- 凡例でシナリオ名を表示
- ホバーで詳細値表示
```

**依存関係**: 4-1, 5-2

---

## Phase 6: データ永続化

### 6-1. Supabase DBテーブル設計・作成

**ファイル**: `docs/database-schema.sql`（参考用）

```sql
-- テーブル構成
- user_assets: ユーザーの資産データ
- user_stocks: 株式銘柄データ
- user_income_expense_plans: 収支計画データ
- user_annual_plans: 年次計画データ
- user_regime_settings: レジーム設定データ
- user_withdrawal_priorities: 取崩し優先順位データ
- user_scenarios: シナリオデータ

-- RLS (Row Level Security)
- 各テーブルにユーザー単位のアクセス制御を設定
```

**依存関係**: 1-1

---

### 6-2. データ保存/読込機能

**ファイル**: `src/lib/database/userDataService.ts`

```typescript
// 実装内容
- saveUserData(): 全データをSupabaseに保存
- loadUserData(): Supabaseからデータを読み込み
- 各テーブルへのCRUD操作
```

**依存関係**: 6-1

---

### 6-3. ログイン状態に応じた保存先切替

**ファイル**: `src/hooks/useUserData.ts`

```typescript
// 実装内容
- 未ログイン: useState/useReducerでメモリ管理
- ログイン済: Supabase DBに永続化
- ログイン時にローカルデータをDBにマージ（オプション）
```

**依存関係**: 1-3, 6-2

---

## Phase 7: 過去データ分析（任意機能）

### 7-1. CSVアップロード・パース機能

**ファイル**: `src/components/input/CsvUploader.tsx`

```typescript
// 実装内容
- ファイル選択UI
- CSVパース（年月, リターン列）
- バリデーション（フォーマットチェック）
- エラーハンドリング
```

**依存関係**: 1-4

---

### 7-2. 基本統計量・リスク指標計算

**ファイル**: `src/lib/analysis/riskMetrics.ts`

```typescript
// 基本統計量
- 年平均リターン
- 年標準偏差
- 最大/最小リターン

// リスク指標
- 最大ドローダウン
- シャープレシオ
- ソルティノレシオ
- VaR（95%）

// レジーム分析
- 暴落頻度
- 平均回復期間
- 局面別平均リターン
```

**依存関係**: 7-1

---

### 7-3. 分析結果UI・レジーム設定反映機能

**ファイル**: `src/components/input/AnalysisResult.tsx`

```typescript
// 実装内容
- 分析結果の表示（テーブル形式）
- 推奨レジーム設定の表示
- 「この値をレジーム設定に反映」ボタン
- 2-4のレジーム設定に値を反映
```

**依存関係**: 7-2, 2-4

---

## 実装順序と依存関係図

```
Phase 1 ──────────────────────────────────────────────────────────────────
  1-1 Supabase設定
    │
    ├─→ 1-2 型定義
    │     │
    │     └─→ 1-3 認証機能 ─→ 1-4 レイアウト
    │
Phase 2 ──────────────────────────────────────────────────────────────────
    │
    └─→ 2-1 資産入力
    └─→ 2-2 収支基本設定 ─→ 2-3 年次テーブル
    └─→ 2-4 レジーム設定
    └─→ 2-5 取崩し優先順位

Phase 3 ──────────────────────────────────────────────────────────────────
          │
          ├─→ 3-1 レジーム遷移 ─┬─→ 3-3 モンテカルロ ─→ 3-4 統計量計算
          └─→ 3-2 取崩しロジック─┘

Phase 4 ──────────────────────────────────────────────────────────────────
                                                    │
                                                    ├─→ 4-1 資産グラフ
                                                    ├─→ 4-2 サマリー
                                                    └─→ 4-3 年次テーブル

Phase 5 ──────────────────────────────────────────────────────────────────
          │
          └─→ 5-1 シナリオCRUD ─→ 5-2 比較シミュレーション ─→ 5-3 比較グラフ

Phase 6 ──────────────────────────────────────────────────────────────────
    │
    └─→ 6-1 DBテーブル ─→ 6-2 保存/読込 ─→ 6-3 保存先切替

Phase 7 ──────────────────────────────────────────────────────────────────
          │
          └─→ 7-1 CSVアップロード ─→ 7-2 リスク指標計算 ─→ 7-3 分析結果UI
```

---

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド（型チェック + Viteビルド）
npm run build

# リント
npm run lint

# プレビュー
npm run preview
```

---

## 注意事項

1. **型安全性**: TypeScript strictモードが有効。`noUnusedLocals`, `noUnusedParameters`も有効
2. **インポート**: `@/`エイリアスを使用（例: `import { cn } from "@/lib/utils"`）
3. **UIコンポーネント**: shadcn/uiの追加は `npx shadcn@latest add <component>`
4. **セキュリティ**: Supabase RLSを適切に設定し、ユーザーデータを保護

---

## 改訂履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| 1.0 | 2026/01/20 | 初版作成 |
