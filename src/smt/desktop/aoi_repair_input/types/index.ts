/**
 * 型定義
 */

/**
 * 更新対象レコード
 */
export interface UpdatedRecord {
    id: string | null;
    dropdownValue: string | null;
}

/**
 * レコード更新APIリクエストボディ
 */
export interface RecordUpdateBody {
    app: number;
    records: Array<{
        id: string | null;
        record: {
            parts_type: {
                value: string | null;
            };
        };
    }>;
}

/**
 * 参照先アプリのデータ
 */
export interface ReferenceAppData {
    model_code: string; // Y番（モデルコード）
    reference: string; // リファレンス
}

/**
 * 部品データ
 */
export interface PartsData {
    parts_code: string; // 部品コード
    version: string; // バージョン
    model_code: string; // Y番（モデルコード）
    reference: string; // リファレンス
}

/**
 * 部品データ辞書（key: "model_code_reference"形式）
 */
export interface PartsDictionary {
    [key: string]: PartsData[];
}

/**
 * ドロップダウンオプション
 */
export const DROPDOWN_OPTIONS = ["C/R", "異形"] as const;

/**
 * アプリID
 */
export const APP_ID = 15;

/**
 * BOM構成部品アプリID（要設定）
 */
export const BOM_APP_ID = 0; // TODO: 実際のアプリIDに設定

/**
 * フィールドコード定数
 */
export const FIELD_CODES = {
    RELATED_RECORDS: "RelatedRecords",
    INSTRUCTION: "lot_number", // 指図フィールドコード
    MODEL_CODE: "model_code", // Y番フィールドコード
    REFERENCE: "reference", // リファレンスフィールドコード
    PARTS_CODE: "parts_code", // 部品コードフィールドコード
    VERSION: "version", // バージョンフィールドコード
} as const;

/**
 * セレクター定数
 */
export const SELECTORS = {
    EDIT_BUTTON_AREA: "user-js-button-space-RelatedRecords",
    CUSTOM_EDIT_BUTTON: "custom-edit-button",
    CUSTOM_TABLE_AREA: "user-js-custom-table-space-RelatedRecords",
    RELATED_RECORDS_WRAPPER: ".control-reference_table-field-gaia",
    RELATED_RECORDS_TITLE: ".label-13457485",
    RELATED_RECORDS_TABLE_WRAPPER: ".value-13457485",
    ACTION_LINK: "a.listTable-action-gaia",
} as const;
