/**
 * PLダッシュボードで使用する定数定義
 */

// アプリID
export const APP_IDS = {
    PRODUCTION_REPORT: 22, // 生産日報報告書
    MASTER_MODEL: 25, // マスタ機種一覧
    PL_DAILY: 32, // PL日次
    PL_MONTHLY: 39, // PL月次
    HOLIDAY: 44, // 祝日マスタ
} as const;

// 曜日
export const DAYS_OF_WEEK = ["日", "月", "火", "水", "木", "金", "土"] as const;

// DataTables 設定
export const DATATABLE_CONFIG = {
    LANGUAGE_URL: "//cdn.datatables.net/plug-ins/1.13.7/i18n/ja.json",
    PAGE_LENGTH: -1,
    LENGTH_MENU: [
        [25, 50, 100, -1],
        [25, 50, 100, "全て"],
    ],
    DOM: "Blfrtip",
} as const;

// テーブルカラム定義
export const TABLE_COLUMNS = {
    PRODUCTION: [
        "日付s",
        "ライン",
        "機種名",
        "台数",
        "付加価値",
        "社員工数(h)",
        "社員工数(円)",
        "派遣工数(h)",
        "派遣工数(円)",
        "【社】残業工数(h)",
        "【社】残業工数(円)",
        "派残業工数(h)",
        "派残業工数(円)",
        "経費合計",
        "粗利益",
        "利益率",
    ],
    PROFIT_CALCULATION: [
        "日付",
        "付加価値売上高",
        "直行人員",
        "直行経費",
        "派遣社員",
        "派遣経費",
        "間接人員",
        "間接経費",
        "直行残業(h)",
        "直行休出(h)",
        "直行経費",
        "派遣残業(h)",
        "派遣休出(h)",
        "派遣経費",
        "間接残業(h)",
        "間接休出(h)",
        "間接経費",
        "直行/間接人件費(残業・休出含まない）",
        "間接材料費",
        "間接材料費,残業休出経費以外",
        "夜勤手当",
        "工具器具消耗品、荷造運賃",
        "残業経費（社員）",
        "残業経費（派遣）",
        "休出経費（社員）",
        "休出経費（派遣）",
        "派遣人員経費",
        "総人員/製造経費 計",
        "一人当/付加価値（打）",
        "一人当/粗利益（打）",
        "実績 粗利益率（打）",
        "EBITDA（打）",
        "EBITDA率",
    ],
} as const;

// 残業係数
export const OVERTIME_MULTIPLIER = 1.25;

// API取得限界
export const API_LIMITS = {
    RECORDS_PER_REQUEST: 500,
    MAX_RETRIES: 3,
} as const;

// CSS クラス名
export const CSS_CLASSES = {
    KINTONE_BUTTON: "kintoneplugin-button-dialog-cancel",
    GAIA_BUTTON: "gaia-ui-actionmenu-cancel",
    RECORDLIST_GAIA: "recordlist-gaia recordlist-consistent-column-width-gaia",
    RECORDLIST_HEADER:
        "sorting recordlist-header-cell-gaia label-13458061 recordlist-header-sortable-gaia",
    RECORDLIST_BODY: "recordlist-body-gaia",
    RECORDLIST_ROW: "recordlist-row-gaia recordlist-row-gaia-hover-highlight",
} as const;

// Display labels
export const DISPLAY_LABELS = {
    SELECT_PLACEHOLDER: "-- 選択 --",
    YEAR_LABEL: "年: ",
    MONTH_LABEL: "月: ",
    ALL_OPTION: "全て",
    MONTHS: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
} as const;
