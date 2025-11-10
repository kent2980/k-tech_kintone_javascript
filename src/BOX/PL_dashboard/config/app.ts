/**
 * アプリケーション設定
 */

export const APP_CONFIG = {
    // UIとパフォーマンス設定
    DEBOUNCE_DELAY: 500,
    TABLE_MAX_HEIGHT: 600,
    MOBILE_BREAKPOINT: 768,

    // ユーザーインタラクション設定
    DEFAULT_YEAR_RANGE: 10,
    AUTO_REFRESH_INTERVAL: 300000, // 5分（milliseconds）

    // キャッシュ設定
    CACHE_DURATION: {
        MASTER_MODEL: 1800000, // 30分（マスタデータは変更頻度低）
        PL_MONTHLY: 300000, // 5分
        DAILY_DATA: 60000, // 1分
    },

    // デバッグ設定
    DEBUG_MODE: process.env.NODE_ENV === "development",
    VERBOSE_LOGGING: false,

    // 表示設定
    DISPLAY_LABELS: {
        SELECT_PLACEHOLDER: "-- 選択 --",
        YEAR_LABEL: "年: ",
        MONTH_LABEL: "月: ",
        ALL_OPTION: "全て",
        MONTHS: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
    },

    // CSS クラス名
    CSS_CLASSES: {
        KINTONE_BUTTON: "kintoneplugin-button-dialog-cancel",
        GAIA_BUTTON: "gaia-ui-actionmenu-cancel",
        RECORDLIST_GAIA: "recordlist-gaia recordlist-consistent-column-width-gaia",
        RECORDLIST_HEADER:
            "sorting recordlist-header-cell-gaia label-13458061 recordlist-header-sortable-gaia",
        RECORDLIST_BODY: "recordlist-body-gaia",
        RECORDLIST_ROW: "recordlist-row-gaia recordlist-row-gaia-hover-highlight",
    },
} as const;
