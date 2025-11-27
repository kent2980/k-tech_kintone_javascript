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
 * ドロップダウンオプション
 */
export const DROPDOWN_OPTIONS = ["C/R", "異形"] as const;

/**
 * アプリID
 */
export const APP_ID = 15;

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

