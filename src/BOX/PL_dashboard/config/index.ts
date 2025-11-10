/**
 * 設定ファイルのエクスポート
 */

import { API_CONFIG } from "./api";
import { APP_CONFIG } from "./app";
import { TABLE_CONFIG } from "./table";

// 各設定オブジェクトをエクスポート
export { API_CONFIG, APP_CONFIG, TABLE_CONFIG };

// 曜日定数（共通で使用）
export const DAYS_OF_WEEK = ["日", "月", "火", "水", "木", "金", "土"] as const;

// 後方互換性のため既存の定数をre-export
export const APP_IDS = API_CONFIG.APP_IDS;
export const API_LIMITS = API_CONFIG.LIMITS;
export const DATATABLE_CONFIG = TABLE_CONFIG.DATATABLE;
export const TABLE_COLUMNS = TABLE_CONFIG.COLUMNS;
export const OVERTIME_MULTIPLIER = TABLE_CONFIG.CALCULATION.OVERTIME_MULTIPLIER;
export const CSS_CLASSES = APP_CONFIG.CSS_CLASSES;
export const DISPLAY_LABELS = APP_CONFIG.DISPLAY_LABELS;
