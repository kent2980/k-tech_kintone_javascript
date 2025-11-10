/**
 * PLダッシュボードで使用する型定義
 */

// =======================================================================
// 基本的な型定義
// =======================================================================

export interface ProductHistoryData {
    /** 日付 */
    date: string;
    /** ライン名 */
    line_name: string;
    /** 実績数 */
    actual_number: string;
    /** 付加価値 */
    addedValue: number;
    /** コスト */
    totalCost: number;
    /** 粗利 */
    grossProfit: number;
    /** 粗利率 */
    profitRate: string;
    /** 社内残業時間 */
    insideOvertime: string;
    /** 社外残業時間 */
    outsideOvertime: string;
    /** 社内定時時間 */
    insideRegularTime: string;
    /** 社外定時時間 */
    outsideRegularTime: string;
}

export interface TotalsByDate {
    /** 日付 */
    date: string;
    /** 総実績数 */
    totalActualNumber: number;
    /** 総付加価値 */
    totalAddedValue: number;
    /** 総コスト */
    totalCost: number;
    /** 総粗利 */
    totalGrossProfit: number;
    /** 粗利率 */
    profitRate: string | number;
    /** 総社内残業時間 */
    totalInsideOvertime: number;
    /** 総社外残業時間 */
    totalOutsideOvertime: number;
    /** 総社内休日残業時間 */
    totalInsideHolidayOvertime: number;
    /** 総社外休日残業時間 */
    totalOutsideHolidayOvertime: number;
}

export interface TabContainerResult {
    tabContainer: HTMLDivElement;
    tabButtonsContainer: HTMLDivElement;
    tabContentsContainer: HTMLDivElement;
}

// API レスポンス型
export interface ApiResponse<T> {
    records: T[];
    totalCount?: number;
}

// フィルター設定型
export interface FilterConfig {
    year: string | null;
    month: string | null;
}

// DataTables API 関連の型定義
export interface DataTableApi {
    button: (index: number | string) => DataTableButtonApi;
    buttons: () => DataTableButtonApi[];
    [key: string]: unknown;
}

export interface DataTableButtonApi {
    enable: (enableFlag?: boolean) => DataTableButtonApi;
    disable: () => DataTableButtonApi;
    text: (textValue?: string) => string | DataTableButtonApi;
    [key: string]: unknown;
}

export interface DataTableNode extends HTMLElement {
    removeClass: () => DataTableNode;
    addClass: (classNameValue: string) => DataTableNode;
    [key: string]: unknown;
}

export interface PdfMakeDocument {
    defaultStyle: {
        font: string;
        fontSize: number;
    };
    pageMargins: number[];
    [key: string]: unknown;
}

// DataTables ボタン設定型
export interface DataTableButton {
    extend: string;
    text?: string;
    className: string;
    orientation?: string;
    pageSize?: string;
    customize?: (pdfDocument: PdfMakeDocument) => void;
    init?: (tableApiInstance: DataTableApi, buttonElement: DataTableNode) => void;
    action?: (
        e: Event,
        dt: DataTableApi,
        button: DataTableNode,
        config: DataTableButton
    ) => void | Promise<void>;
}

// =======================================================================
// 新しい拡張型定義（Phase 5で追加）
// =======================================================================

// アプリケーション状態管理
export interface AppState {
    masterModelData: model_master.SavedFields[] | null;
    dailyReportData: daily.SavedFields[];
    product_history_data: ProductHistoryData[];
    plMonthlyData: monthly.SavedFields | null;
    filteredRecords: line_daily.SavedFields[];
    isLoading: boolean;
    error: string | null;
}

// テーブルビルダーパラメータ
export interface TableBuilderParams {
    records: line_daily.SavedFields[];
    plMonthlyData: monthly.SavedFields | null;
    masterModelData: model_master.SavedFields[];
    product_history_data: ProductHistoryData[];
}

// テーブル種別
export type TableType = "production" | "profit";

// デバイス種別
export type DeviceType = "desktop" | "mobile";

// UI状態
export interface UIState {
    activeTab: string;
    selectedTable: TableType;
    deviceType: DeviceType;
    isCompactMode: boolean;
}

// 設定オプション
export interface ConfigOptions {
    debounceDelay: number;
    maxHeight: number;
    enableCache: boolean;
    cacheExpiry: number;
    debugMode: boolean;
}

// エラー情報
export interface ErrorInfo {
    code: string;
    message: string;
    details?: unknown;
    timestamp: Date;
}

// パフォーマンス測定
export interface PerformanceMetrics {
    fetchTime: number;
    renderTime: number;
    totalTime: number;
    cacheHits: number;
    cacheMisses: number;
}

// イベントハンドラー型
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// データ変換関数型
export type DataTransformer<TInput, TOutput> = (input: TInput) => TOutput;
export type AsyncDataTransformer<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

// フィルター関数型
export type DataFilter<T> = (item: T) => boolean;

// ソート関数型
export type DataSorter<T> = (a: T, b: T) => number;

// 将来のReact化準備用型（現在はコメントアウト）
export interface ComponentProps {
    className?: string;
    id?: string;
    // style?: React.CSSProperties;  // React型定義が必要
    // children?: React.ReactNode;   // React型定義が必要
}

export interface HookResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}
