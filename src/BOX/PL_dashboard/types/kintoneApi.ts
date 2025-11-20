/**
 * Kintone保存結果（複数）
 *
 * @category Types
 */
export interface KintoneSaveResults {
    ok: boolean;
    records: {
        id: string;
        revision: string;
    }[];
}

/**
 * Kintone保存結果（単一）
 *
 * @category Types
 */
export interface KintoneSaveResult {
    ok: boolean;
    id: string;
    revision: string;
}

/**
 * Kintone重複チェック結果
 *
 * @category Types
 */
export interface KintoneDuplicateResult {
    ok: boolean;
}

// Kintone APIレスポンスの型定義
export interface KintoneApiResponse {
    records: KintoneRecord[];
    totalCount?: number;
}

/**
 * Kintoneレコード
 *
 * @category Types
 */
export interface KintoneRecord {
    id: string;
    revision: string;
    [key: string]: unknown;
}

// Kintone APIバッチレスポンスの型定義
export interface KintoneBatchResponse {
    records: KintoneRecord[];
}

// Kintone APIレコード登録レスポンスの型定義
export interface KintoneRecordPostResponse {
    id: string;
    revision: string;
}

// Kintone APIレコード一括登録レスポンスの型定義
export interface KintoneRecordsPostResponse {
    records: KintoneRecordPostResponse[];
}