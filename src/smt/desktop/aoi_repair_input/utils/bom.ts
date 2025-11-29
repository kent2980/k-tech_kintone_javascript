/**
 * BOMデータ取得ユーティリティ
 */

/// <reference path="../../../../app/AoiDefectFields.d.ts" />

import { FIELD_CODES, PartsData, PartsDictionary } from "../types";

/**
 * 関連レコード一覧の参照先アプリIDを取得
 */
export function getRelatedAppId(): number | null {
    const relatedAppId = kintone.app.getRelatedRecordsTargetAppId(FIELD_CODES.RELATED_RECORDS);
    if (!isNaN(Number(relatedAppId))) {
        return Number(relatedAppId);
    }
    return null;
}

/**
 * 参照先アプリから指図で抽出したレコードを取得
 */
export async function getReferenceAppRecords(
    appId: number,
    instruction: string
): Promise<aoiDefect.SavedFields[]> {
    const allRecords: aoiDefect.SavedFields[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
        // クエリの構築（指図フィールドで検索）
        // kintoneのクエリ記法: 検索条件 -> order by -> limit -> offset
        const query = `${FIELD_CODES.INSTRUCTION} = "${instruction.replace(/"/g, '\\"')}" order by current_board_index asc, defect_number asc limit ${limit} offset ${offset}`;
        const response = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
            app: appId,
            fields: [
                FIELD_CODES.MODEL_CODE,
                FIELD_CODES.REFERENCE,
                FIELD_CODES.INSTRUCTION,
                "current_board_index",
                "defect_number",
                "defect_name",
                "defect_image",
                "parts_type",
            ],
            query: query,
        });

        allRecords.push(...(response.records as aoiDefect.SavedFields[]));

        if (response.records.length < limit) {
            break;
        }
        offset += limit;
    }

    return allRecords;
}

/**
 * 複数レコードからY番とリファレンスの配列を抽出
 * 必須フィールド（model_codeとreference）が存在するもののみを返す
 */
export function extractModelCodeAndRefList(
    records: aoiDefect.SavedFields[]
): aoiDefect.SavedFields[] {
    return records.filter((record) => {
        // 必須フィールド（model_codeとreference）が存在するかチェック
        return record.model_code && record.reference;
    });
}

/**
 * BOM構成部品アプリから部品データを取得
 */
export async function getBomPartsData(modelCode: string, reference: string): Promise<PartsData[]> {
    const bomAppId = Number(import.meta.env.VITE_APP_ID_BOM_ITEM);
    const allParts: PartsData[] = [];
    let offset = 0;
    const limit = 100;

    // Y番とリファレンスで検索（エスケープ処理）
    const escapedModelCode = modelCode.replace(/"/g, '\\"');
    const escapedReference = reference.replace(/"/g, '\\"');
    const query = `${FIELD_CODES.MODEL_CODE} = "${escapedModelCode}" and ${FIELD_CODES.REFERENCE} = "${escapedReference}"`;
    while (true) {
        const response = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
            app: bomAppId,
            fields: [FIELD_CODES.PARTS_CODE, FIELD_CODES.VERSION, FIELD_CODES.REFERENCE],
            query: `${query} order by ${FIELD_CODES.VERSION} desc limit ${limit} offset ${offset}`,
        });
        response.records.forEach((record: any) => {
            allParts.push({
                parts_code: record[FIELD_CODES.PARTS_CODE]?.value || "",
                version: record[FIELD_CODES.VERSION]?.value || "",
                reference: record[FIELD_CODES.REFERENCE]?.value || "",
            });
        });

        if (response.records.length < limit) {
            break;
        }
        offset += limit;
    }
    return allParts;
}

/**
 * Y番とリファレンスのリストから部品データ辞書を作成
 */
export async function createPartsDictionary(
    referenceDataList: aoiDefect.SavedFields[]
): Promise<PartsDictionary> {
    try {
        const dictionary: PartsDictionary = [];
        const bomAppId = Number(import.meta.env.VITE_APP_ID_BOM_ITEM);

        // Y番とリファレンスの値を取得（重複を除去）
        const modelCodeValues = Array.from(
            new Set(
                referenceDataList
                    .map((record) => record.model_code?.value)
                    .filter((value): value is string => !!value)
            )
        );
        const referenceValues = Array.from(
            new Set(
                referenceDataList
                    .map((record) => record.reference?.value)
                    .filter((value): value is string => !!value)
            )
        );

        if (modelCodeValues.length === 0 || referenceValues.length === 0) {
            return dictionary;
        }

        // クエリを構築（in演算子を使用、文字列値は引用符で囲む）
        const escapedModelCodes = modelCodeValues
            .map((value) => `"${value.replace(/"/g, '\\"')}"`)
            .join(",");
        const escapedReferences = referenceValues
            .map((value) => `"${value.replace(/"/g, '\\"')}"`)
            .join(",");

        const query = `${FIELD_CODES.MODEL_CODE} in (${escapedModelCodes}) and ${FIELD_CODES.REFERENCE} in (${escapedReferences})`;
        const response = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
            app: bomAppId,
            fields: [
                FIELD_CODES.PARTS_CODE,
                FIELD_CODES.VERSION,
                FIELD_CODES.REFERENCE,
                FIELD_CODES.MODEL_CODE,
            ],
            query: query,
        });

        response.records.forEach((record: any) => {
            dictionary.push({
                reference: record[FIELD_CODES.REFERENCE]?.value || "",
                parts_code: record[FIELD_CODES.PARTS_CODE]?.value || "",
                version: record[FIELD_CODES.VERSION]?.value || "",
            });
        });
        return dictionary;
    } catch {
        return [];
    }
}

/**
 * 現在のレコードの指図フィールド値を取得
 */
export function getCurrentInstruction(): string | null {
    // id=6_13457484-:r-text input要素を取得
    const instructionInput = document.getElementById("6_13457484-:r-text");
    if (instructionInput instanceof HTMLInputElement) {
        return instructionInput.value;
    }
    return null;
}
