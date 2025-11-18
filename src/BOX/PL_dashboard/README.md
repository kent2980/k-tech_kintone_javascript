# PLダッシュボード

PL（損益計算書）ダッシュボードは、生産日報データから損益計算書を生成・表示するkintoneカスタマイズアプリケーションです。

## 概要

このアプリケーションは、kintoneの生産日報データを基に、以下の機能を提供します：

- 📊 **生産実績テーブル**: 日次生産データの可視化
- 💰 **損益計算テーブル**: 日別の損益計算と分析
- 📈 **収益分析サマリ**: 累積データを含む収益分析
- 📉 **グラフ表示**: Chart.jsを使用した混合チャート
- 📅 **フィルタリング**: 年月別のデータフィルタリング
- 📤 **データエクスポート**: CSV出力・印刷機能
- 📥 **過去データインポート**: Excelファイルからの一括登録

## アーキテクチャ

### クラス階層構造

このアプリケーションは、基底クラスと派生クラスによる階層構造を採用しています：

```
BaseTableManager (基底クラス)
  └── PLDashboardTableManager (PL専用実装)

BaseGraphManager (基底クラス)
  └── PLDashboardGraphBuilder (PL専用実装)

BaseDomBuilder (基底クラス)
  ├── PLDomBuilder (PL専用実装)
  └── HeaderContainer (ヘッダー専用実装)
```

### コンポーネント構造

```
components/
├── tables/              # テーブル管理
│   ├── BaseTableManager.ts      # 汎用テーブル管理機能
│   └── PLDashboardTableManager.ts # PL専用テーブル実装
├── graphs/              # グラフ管理
│   ├── BaseGraphManager.ts      # 汎用グラフ管理機能
│   └── PLDashboardGraphBuilder.ts # PL専用グラフ実装
├── dom/                 # DOM構築
│   ├── BaseDomBuilder.ts        # 汎用DOM構築機能
│   ├── PLDomBuilder.ts          # PL専用DOM構築
│   └── HeaderContainer.ts      # ヘッダーコンテナ
├── FilterContainer.ts   # フィルターコンテナ
└── TabContainer.ts      # タブコンテナ
```

### テーブル作成の3層構造

各テーブルの`create`メソッドは、以下の3つの専用メソッドに分離されています：

1. **データ変換専用メソッド** (`transform*Data`)
   - 生データからテーブル表示用データに変換
   - 計算処理・データ整形を実行

2. **レンダリング専用メソッド** (`render*Table`)
   - DOM要素を作成してテーブルを描画
   - スタイル適用・色分け処理

3. **DataTables統合専用メソッド** (`integrateDataTablesFor*`)
   - DataTables.jsを適用
   - ソート・検索・エクスポート機能を有効化

## 主要コンポーネント

### PLDashboardTableManager

生産実績・損益計算・収益分析の各テーブルを管理します。

**主要メソッド**:

- `createProductionPerformanceTable()`: 生産実績テーブル作成
- `createProfitCalculationTable()`: 損益計算テーブル作成
- `createRevenueAnalysisSummaryTable()`: 収益分析サマリテーブル作成

**内部メソッド**:

- `transformProductionData()`: 生産データ変換
- `renderProductionTable()`: 生産テーブルレンダリング
- `integrateDataTablesForProduction()`: DataTables統合

### PLDashboardGraphBuilder

Chart.jsを使用したグラフ表示を管理します。

**主要メソッド**:

- `createMixedChartContainer()`: 混合チャート（棒グラフ + 折れ線グラフ）作成
- `updateMixedChart()`: グラフデータ更新

### PLDomBuilder

PL専用のDOM要素構築を担当します。

**主要メソッド**:

- `createYearSelect()`: 年選択ドロップダウン作成
- `createMonthSelect()`: 月選択ドロップダウン作成

### HeaderContainer

ヘッダー領域のコンテナを管理します。

**主要メソッド**:

- `create()`: ヘッダーコンテナ作成
- `showDataUploadingOverlay()`: データ登録中オーバーレイ表示
- `showCenteredAlert()`: 中央表示アラート

## サービス層

### KintoneApiService

kintone REST APIとの通信を担当します。

**主要メソッド**:

- `fetchPLDailyData()`: 日次データ取得
- `fetchPLMonthlyData()`: 月次データ取得
- `savePLMonthlyData()`: 月次データ保存
- `savePLDailyData()`: 日次データ保存

### BusinessCalculationService

経営指標の計算を担当します。

**主要メソッド**:

- `calculateBusinessMetrics()`: 経営指標計算
- 付加価値・コスト・利益率の算出

### ProfitCalculationService

損益計算を担当します。

**主要メソッド**:

- `calculateDailyProfit()`: 日別損益計算
- 直行・派遣・間接経費の計算

### RevenueAnalysisCalculationService

収益分析計算を担当します。

**主要メソッド**:

- `createRevenueAnalysisItem()`: 収益分析アイテム作成
- `createCumulativeDataManager()`: 累積データ管理

## 状態管理

### ActiveFilterStore

アクティブなフィルター（年・月）を管理します。

### HolidayStore

会社休日マスタデータを管理します。

### MasterModelStore

機種マスタデータを管理します。

## ファイルインポーター

### PLExcelImporter

Excelファイルから過去データをインポートします。

**機能**:

- Excelファイルの読み込み（xlsxライブラリ使用）
- データ形式の検証
- 月次・日次・生産実績データの抽出
- kintoneへの一括登録

## 使用方法

### デスクトップ版

```typescript
// PL_dashboard.ts が自動的に実行されます
// kintoneアプリの一覧画面でカスタマイズが有効化されます
```

### モバイル版

```typescript
// PL_dashboard.mobile.ts が自動的に実行されます
// モバイルデバイスでアクセスすると自動的にモバイル版が表示されます
```

## 開発ガイドライン

### 新機能追加時の注意点

1. **基底クラスの活用**: 汎用的な機能は基底クラスに実装
2. **責務の分離**: データ変換・レンダリング・統合処理を分離
3. **型安全性**: TypeScriptの型定義を活用
4. **エラーハンドリング**: 統一したエラー処理方式を採用

### テーブル追加方法

1. `PLDashboardTableManager`に新しい`create*Table()`メソッドを追加
2. `transform*Data()`メソッドでデータ変換を実装
3. `render*Table()`メソッドでレンダリングを実装
4. `integrateDataTablesFor*()`メソッドでDataTables統合を実装

### グラフ追加方法

1. `PLDashboardGraphBuilder`に新しい`create*Chart()`メソッドを追加
2. Chart.jsの設定を実装
3. データ変換ロジックを実装

## トラブルシューティング

### テーブルが表示されない

- DataTables.jsが正しく読み込まれているか確認
- テーブルIDが重複していないか確認
- コンソールエラーを確認

### グラフが表示されない

- Chart.jsが正しく読み込まれているか確認
- データが正しい形式か確認
- キャンバス要素が正しく作成されているか確認

### データが更新されない

- フィルターが正しく設定されているか確認
- API呼び出しが成功しているか確認
- ストアの状態を確認

## 関連ドキュメント

- [BOXディレクトリ概要](../README.md)
- [モバイル版README](./README.mobile.md)
- [開発ガイド](../README.md#開発ガイドライン)

