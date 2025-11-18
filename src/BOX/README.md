# BOXディレクトリ概要

BOXディレクトリは、kintoneカスタマイズJavaScriptの機能別実装を格納するディレクトリです。各サブディレクトリは特定の業務機能に対応したモジュール化された実装となっています。

## ディレクトリ構造

```text
src/BOX/
└── PL_dashboard/          # 損益計算書（P&L）ダッシュボード機能
    ├── PL_dashboard.ts     # メインエントリーポイント（デスクトップ版）
    ├── PL_dashboard.mobile.ts  # モバイル版エントリーポイント
    ├── components/            # UIコンポーネント
    │   ├── tables/           # テーブル管理コンポーネント
    │   │   ├── BaseTableManager.ts      # テーブル管理基底クラス
    │   │   └── PLDashboardTableManager.ts # PL専用テーブル管理
    │   ├── graphs/           # グラフ管理コンポーネント
    │   │   ├── BaseGraphManager.ts       # グラフ管理基底クラス
    │   │   └── PLDashboardGraphBuilder.ts # PL専用グラフ構築
            │   ├── dom/              # DOM構築コンポーネント
            │   │   ├── BaseDomBuilder.ts         # DOM構築基底クラス
            │   │   ├── PLDomBuilder.ts           # PL専用DOM構築
            │   │   └── HeaderContainer.ts        # PLヘッダーコンテナ
    │   ├── FilterContainer.ts # フィルターコンテナ
    │   └── TabContainer.ts    # タブコンテナ
    ├── services/             # ビジネスロジック・API呼び出し
    ├── utils/               # ユーティリティ関数
    ├── types/               # TypeScript型定義
    ├── config/              # 設定ファイル
    ├── store/               # 状態管理
    ├── hooks/               # カスタムフック
    ├── importers/           # ファイルインポーター
    ├── fields/             # kintoneフィールド型定義
    └── styles/             # スタイルシート
```

## 各ディレクトリの役割と責務

### PLダッシュボード/

**目的**: 生産日報データから損益計算書（Profit & Loss）を生成・表示するダッシュボード機能

**主な機能**:

- 生産実績データの可視化
- 利益率計算とグラフ表示
- フィルタリング機能（年月別）
- データエクスポート（CSV、印刷）
- リアルタイムデータ更新
- 過去データのExcelインポート

#### components/ - UIコンポーネント

**役割**: ユーザーインターフェース部品の実装

**アーキテクチャ**: 親子クラス構造による責務分離

##### tables/ - テーブル管理

- **BaseTableManager.ts**: テーブル管理の基底クラス
  - 汎用的なテーブル作成・管理機能
  - DataTables統合機能
  - テーブル状態管理
  
- **PLDashboardTableManager.ts**: PL専用テーブル管理クラス
  - 生産実績テーブル
  - 損益計算テーブル
  - 収益分析サマリテーブル
  - 各テーブルのデータ変換・レンダリング・DataTables統合を分離

##### graphs/ - グラフ管理

- **BaseGraphManager.ts**: グラフ管理の基底クラス
  - 汎用的なグラフ作成・管理機能
  - Chart.js統合機能
  - グラフ状態管理
  
- **PLDashboardGraphBuilder.ts**: PL専用グラフ構築クラス
  - 混合チャート（棒グラフ + 折れ線グラフ）
  - PL固有のデータ変換・表示

##### dom/ - DOM構築

- **BaseDomBuilder.ts**: DOM構築の基底クラス
  - 汎用的なDOM要素管理機能
  - 要素の登録・取得・削除
  
- **PLDomBuilder.ts**: PL専用DOM構築クラス
  - 年・月選択ドロップダウン
  - PL固有のDOM要素作成
  
- **HeaderContainer.ts**: PLヘッダーコンテナクラス（`PLHeaderContainer`）
  - `BaseDomBuilder`を継承
  - フィルターコンテナ
  - 設定リンク
  - 過去データ読み込みボタン
  - オーバーレイ表示機能

##### その他のコンポーネント

- **FilterContainer.ts**: フィルタリング用UI（年月選択など）
- **TabContainer.ts**: タブ切り替え機能

**新機能追加方法**:

1. 新しいコンポーネントファイルを作成（例: `NewComponent.ts`）
2. 適切なサブディレクトリに配置（tables/, graphs/, dom/など）
3. 基底クラスを継承する場合は親子関係を明確に
4. `index.ts`にエクスポート文を追加
5. TypeScriptクラス形式で実装
6. DOM操作は `DomUtil`を使用し、統一した方式で実装

#### services/ - ビジネスロジック

**役割**: データ処理・API通信・ビジネスロジックの実装

**含まれるサービス**:

- **KintoneApiService.ts**: kintone REST APIとの通信
- **BusinessCalculationService.ts**: 経営指標計算
- **BusinessCalculationHelperService.ts**: 計算ヘルパー（検証・異常値検出）
- **ProfitCalculationService.ts**: 損益計算
- **RevenueAnalysisCalculationService.ts**: 収益分析計算
- **DataProcessor.ts**: データ変換・計算処理

**新機能追加方法**:

1. 新サービスクラスを作成（例: `NewService.ts`）
2. `index.ts`にエクスポート文を追加
3. 既存のサービスクラスを参考に実装
4. エラーハンドリングは統一した形式で実装

#### utils/ - ユーティリティ

**役割**: 汎用的な共通関数・ヘルパー関数の実装

**含まれるユーティリティ**:

- **CalculationUtil.ts**: 数値計算・利益率算出
- **DateUtil.ts**: 日付操作・フォーマット
- **DomUtil.ts**: DOM操作ヘルパー
- **Logger.ts**: ログ出力・デバッグ
- **PerformanceUtil.ts**: パフォーマンス測定
- **FieldsUtil.ts**: フィールド操作ユーティリティ

**新機能追加方法**:

1. 新ユーティリティファイルを作成
2. 静的メソッドまたは関数として実装
3. `index.ts`にエクスポート文を追加
4. 単体テストを `**tests**/`に作成

#### types/ - 型定義

**役割**: TypeScript型定義の集約管理

**主な型定義**:

- **ProductHistoryData**: 生産実績データ型
- **TotalsByDate**: 日別集計データ型
- **FilterConfig**: フィルター設定型
- **RevenueAnalysis**: 収益分析データ型
- **TableRowData**: テーブル行データ型
- **DataTablesOptions**: DataTables設定型

**新機能追加方法**:

1. `index.ts`または適切な型定義ファイルに新しい型定義を追加
2. インターフェースまたは型エイリアスで定義
3. JSDoc コメントで詳細な説明を記載

#### config/ - 設定ファイル

**役割**: アプリケーション全体で使用する設定の管理

**含まれる設定**:

- **api.ts**: API設定（アプリIDなど）
- **app.ts**: アプリ設定
- **table.ts**: テーブルカラム定義

#### store/ - 状態管理

**役割**: アプリケーションの状態管理

**含まれるストア**:

- **ActiveFilterStore.ts**: アクティブフィルター状態管理
- **HolidayStore.ts**: 休日データ管理
- **MasterModelStore.ts**: 機種マスタデータ管理

#### hooks/ - カスタムフック

**役割**: 再利用可能なロジックの集約

**含まれるフック**:

- **useDataFetcher.ts**: データ取得フック
- **useTableFilters.ts**: テーブルフィルター管理フック

#### importers/ - ファイルインポーター

**役割**: 外部ファイル（Excel、CSV）のインポート処理

**含まれるインポーター**:

- **FileImporter.ts**: ファイルインポート基底クラス
- **ExcelImporter.ts**: Excelインポート基底クラス
- **PLExcelImporter.ts**: PL専用Excelインポーター
- **CsvImporter.ts**: CSVインポーター

#### fields/ - kintoneフィールド型定義

**役割**: kintoneアプリのフィールド型定義

**含まれる定義**:

- **daily_fields.d.ts**: 生産日報フィールド
- **line_daily_fields.d.ts**: ライン日別フィールド
- **month_fields.d.ts**: 月次フィールド
- **model_master_fields.d.ts**: 機種マスタフィールド
- **holiday_fields.d.ts**: 休日マスタフィールド

**新機能追加方法**:

1. 新しいkintoneアプリに対応するフィールド定義ファイルを作成
2. kintone CLI等で型定義を生成
3. メインファイルで `/// <reference path="..." />`で参照

#### styles/ - スタイルシート

**役割**: CSSスタイルの管理

**含まれるスタイル**:

- **desktop.css**: デスクトップ版スタイル
- **mobile.css**: モバイル版スタイル
- **components/**: コンポーネント別スタイル
  - **filter.css**: フィルターコンポーネント
  - **table.css**: テーブルコンポーネント
  - **tabs.css**: タブコンポーネント

## アーキテクチャパターン

このプロジェクトは以下のアーキテクチャパターンを採用しています:

### レイヤードアーキテクチャ

- **Presentation Layer** (components/): UI表示・ユーザー操作
- **Business Layer** (services/): ビジネスロジック・データ処理
- **Utility Layer** (utils/): 共通処理・ヘルパー
- **Data Layer** (store/, hooks/): 状態管理・データ取得

### 継承による責務分離

- **基底クラス**: 汎用的な機能を提供（BaseTableManager, BaseGraphManager, BaseDomBuilder）
- **派生クラス**: 特定の業務ロジックを実装（PLDashboardTableManager, PLDashboardGraphBuilder, PLDomBuilder）
- **責務の明確化**: 各クラスは単一の責務を持つ

### テーブル作成の3層構造

各テーブルの`create`メソッドは以下の3つの専用メソッドに分離されています:

1. **データ変換専用メソッド** (`transform*Data`): 生データからテーブル表示用データに変換
2. **レンダリング専用メソッド** (`render*Table`): DOM要素を作成してテーブルを描画
3. **DataTables統合専用メソッド** (`integrateDataTablesFor*`): DataTablesを適用

## 開発ガイドライン

### コーディング規約

1. **命名規則**:

   - クラス名: PascalCase
   - メソッド・変数名: camelCase
   - 定数: UPPER_SNAKE_CASE
   - ファイル名: PascalCase
   - 基底クラス: `Base*` プレフィックス
   - 派生クラス: 業務固有のプレフィックス（例: `PL*`）

2. **ファイル構成**:

   - 1ファイル1クラスを基本とする
   - `index.ts`でエクスポートを集約
   - 循環依存を避ける
   - 関連するクラスはサブディレクトリに整理

3. **TypeScript活用**:

   - 型安全性を重視
   - `any`型の使用を避ける
   - インターフェースでコントラクトを定義
   - ジェネリクスを適切に活用

4. **クラス設計**:

   - 基底クラスは汎用的な機能のみを提供
   - 派生クラスは業務固有のロジックを実装
   - メソッドの責務を明確に分離

### 新機能開発フロー

1. **設計フェーズ**

   ```text
   要件定義 → 型定義作成 → インターフェース設計 → クラス階層設計
   ```

2. **実装フェーズ**

   ```text
   基底クラス → 派生クラス → サービス → コンポーネント → メイン処理
   ```

3. **テストフェーズ**

   ```text
   単体テスト → 統合テスト → E2Eテスト
   ```

### ファイル追加時のチェックリスト

- [ ] 適切なディレクトリに配置
- [ ] 基底クラスがある場合は継承関係を明確に
- [ ] `index.ts`にエクスポート追加
- [ ] 型定義の追加（必要に応じて）
- [ ] JSDocコメントの記載
- [ ] 単体テストの作成
- [ ] ESLintエラーの解消

## 関連技術スタック

- **フレームワーク**: TypeScript, Vite
- **テスト**: Jest
- **kintone**: REST API, JavaScript/CSS カスタマイズ
- **外部ライブラリ**:
  - DataTables.js: テーブル機能強化
  - Chart.js: グラフ描画
  - xlsx: Excelファイル処理

## トラブルシューティング

### よくある問題

1. **型エラー**: `globals.d.ts`と `kintone.d.ts`の参照を確認
2. **ビルドエラー**: 循環依存がないかチェック
3. **実行時エラー**: kintoneアプリIDと実際のアプリが一致するか確認
4. **継承エラー**: 基底クラスのメソッドシグネチャを確認

### デバッグ方法

1. `Logger.ts`を使用したログ出力
2. ブラウザ開発者ツールでのデバッグ
3. `PerformanceUtil.ts`でのパフォーマンス測定
4. TypeScriptの型チェック: `npx tsc --noEmit`

---

## 今後の拡張予定

このディレクトリ構造は今後以下のような機能追加を予定しています:

- **新規ダッシュボード機能**: 売上分析、品質管理等
- **共通UIライブラリ**: 再利用可能なコンポーネント
- **データ可視化強化**: より高度なグラフ・チャート機能
- **テストカバレッジ向上**: 単体テスト・統合テストの拡充

新機能を追加する際は、このドキュメントの構造とガイドラインに従って実装してください。
