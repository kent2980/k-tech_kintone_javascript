/**
 * API設定
 */

// 環境変数から APP_IDS を取得する関数
function getAppIds(): Record<string, number> {
    // Vite環境（ブラウザ）の場合
    if (typeof import.meta !== "undefined" && import.meta.env) {
        const env = import.meta.env;
        return {
            PRODUCTION_REPORT: parseInt(env.VITE_APP_ID_PRODUCTION_REPORT || "22", 10),
            MASTER_MODEL: parseInt(env.VITE_APP_ID_MASTER_MODEL || "25", 10),
            PL_DAILY: parseInt(env.VITE_APP_ID_PL_DAILY || "32", 10),
            PL_MONTHLY: parseInt(env.VITE_APP_ID_PL_MONTHLY || "39", 10),
            HOLIDAY: parseInt(env.VITE_APP_ID_HOLIDAY || "44", 10),
        };
    }
    
    // Node.js/Jest環境の場合（フォールバック）
    const env = process.env;
    return {
        PRODUCTION_REPORT: parseInt(env.VITE_APP_ID_PRODUCTION_REPORT || "22", 10),
        MASTER_MODEL: parseInt(env.VITE_APP_ID_MASTER_MODEL || "25", 10),
        PL_DAILY: parseInt(env.VITE_APP_ID_PL_DAILY || "32", 10),
        PL_MONTHLY: parseInt(env.VITE_APP_ID_PL_MONTHLY || "39", 10),
        HOLIDAY: parseInt(env.VITE_APP_ID_HOLIDAY || "44", 10),
    };
}

export const API_CONFIG = {
    // アプリID（.envから読み込み）
    APP_IDS: getAppIds(),

    // API制限とパフォーマンス設定
    LIMITS: {
        RECORDS_PER_REQUEST: 100,
        MAX_RETRIES: 3,
        RETRY_DELAY_BASE: 1000, // 1秒（指数バックオフのベース）
        TIMEOUT: 30000, // 30秒
    },

    // フィールド設定
    FIELDS: {
        PL_MONTHLY: ["inside_unit", "outside_unit", "direct", "dispatch", "indirect"],
        PL_DAILY: [
            "date",
            "direct_personnel",
            "temporary_employees",
            "indirect_personnel",
            "labor_costs",
            "indirect_material_costs",
            "other_indirect_material_costs",
            "night_shift_allowance",
            "total_sub_cost",
            "inside_overtime_cost",
            "outside_overtime_cost",
            "inside_holiday_expenses",
            "outside_holiday_expenses",
        ],
        PRODUCTION_REPORT: [
            "date",
            "line_name",
            "model_name",
            "model_code",
            "actual_number",
            "inside_time",
            "outside_time",
            "inside_overtime",
            "outside_overtime",
            "added_value",
        ],
        MASTER_MODEL: [
            "line_name",
            "model_code",
            "model_name",
            "customer",
            "time",
            "number_of_people",
            "added_value",
        ],
    },

    // クエリ設定
    QUERY: {
        ORDER_BY: {
            DATE_ASC: "order by date asc",
            DATE_DESC: "order by date desc",
            LINE_MODEL_ASC: "order by line_name asc, model_name asc",
        },
        BATCH_SIZE: 100, // 一括処理のサイズ
    },

    // エラーハンドリング
    ERROR_CODES: {
        NETWORK_ERROR: "NETWORK_ERROR",
        TIMEOUT_ERROR: "TIMEOUT_ERROR",
        PERMISSION_ERROR: "PERMISSION_ERROR",
        INVALID_QUERY: "INVALID_QUERY",
    },
} as const;
