/**
 * テーブル設定
 */

export const TABLE_CONFIG = {
    // DataTables基本設定
    DATATABLE: {
        LANGUAGE_URL: "//cdn.datatables.net/plug-ins/1.13.7/i18n/ja.json",
        PAGE_LENGTH: -1,
        LENGTH_MENU: [
            [25, 50, 100, -1],
            [25, 50, 100, "全て"],
        ],
        DOM: "Blfrtip",
        SCROLL_Y: "400px",
        SCROLL_COLLAPSE: true,
    },

    // テーブルカラム定義
    COLUMNS: {
        PRODUCTION: [
            "日付",
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
    },

    // 計算設定
    CALCULATION: {
        OVERTIME_MULTIPLIER: 1.25,
        DECIMAL_PLACES: 2,
        CURRENCY_DECIMAL_PLACES: 0,
        PERCENTAGE_DECIMAL_PLACES: 1,
    },

    // モバイル版テーブル設定
    MOBILE: {
        CARD_MAX_WIDTH: "100%",
        ITEMS_PER_PAGE: 10,
        COMPACT_MODE: true,
    },

    // 色設定（条件付きフォーマット用）
    COLORS: {
        POSITIVE: "#4CAF50",
        NEGATIVE: "#F44336",
        NEUTRAL: "#757575",
        HIGHLIGHT: "#2196F3",
    },
} as const;
