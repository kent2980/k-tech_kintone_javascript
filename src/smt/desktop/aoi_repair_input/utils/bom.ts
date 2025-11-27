/**
 * BOMデータ取得ユーティリティ
 */

import { FIELD_CODES, PartsData, PartsDictionary, ReferenceAppData } from "../types";

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
export async function getReferenceAppRecords(appId: number, instruction: string): Promise<any[]> {
    console.log("instruction:", instruction);
    const allRecords: any[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
        // クエリの構築（指図フィールドで検索）
        const query = `${FIELD_CODES.INSTRUCTION} = "${instruction.replace(/"/g, '\\"')}" limit ${limit} offset ${offset}`;
        console.log("query:", query);
        const response = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
            app: appId,
            fields: [FIELD_CODES.MODEL_CODE, FIELD_CODES.REFERENCE, FIELD_CODES.INSTRUCTION],
            query: query,
        });

        allRecords.push(...response.records);

        if (response.records.length < limit) {
            break;
        }
        offset += limit;
    }

    return allRecords;
}

/**
 * レコードからY番とリファレンスを抽出
 */
export function extractModelCodeAndRef(record: any): ReferenceAppData | null {
    if (!record[FIELD_CODES.MODEL_CODE] || !record[FIELD_CODES.REFERENCE]) {
        return null;
    }

    return {
        model_code: record[FIELD_CODES.MODEL_CODE].value || "",
        reference: record[FIELD_CODES.REFERENCE].value || "",
    };
}

/**
 * 複数レコードからY番とリファレンスの配列を抽出
 */
export function extractModelCodeAndRefList(records: any[]): ReferenceAppData[] {
    console.log("records:", records);
    const result: ReferenceAppData[] = [];

    records.forEach((record) => {
        const data = extractModelCodeAndRef(record);
        if (data) {
            result.push(data);
        }
    });

    return result;
}

/**
 * BOM構成部品アプリから部品データを取得
 */
export async function getBomPartsData(modelCode: string, reference: string): Promise<PartsData[]> {
    const bomAppId = import.meta.env.VITE_APP_ID_BOM_ITEM;
    console.log("bomAppId:", bomAppId);
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
            fields: [
                FIELD_CODES.PARTS_CODE,
                FIELD_CODES.VERSION,
                FIELD_CODES.MODEL_CODE,
                FIELD_CODES.REFERENCE,
            ],
            query: `${query} limit ${limit} offset ${offset}`,
        });

        response.records.forEach((record: any) => {
            allParts.push({
                parts_code: record[FIELD_CODES.PARTS_CODE]?.value || "",
                version: record[FIELD_CODES.VERSION]?.value || "",
                model_code: record[FIELD_CODES.MODEL_CODE]?.value || "",
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
    referenceDataList: ReferenceAppData[]
): Promise<PartsDictionary> {
    const dictionary: PartsDictionary = {};

    // 重複を除去
    const uniqueDataList = Array.from(
        new Map(
            referenceDataList.map((data) => [`${data.model_code}_${data.reference}`, data])
        ).values()
    );

    // 各Y番とリファレンスの組み合わせに対して部品データを取得
    for (const data of uniqueDataList) {
        const key = `${data.model_code}_${data.reference}`;
        const partsData = await getBomPartsData(data.model_code, data.reference);
        if (partsData.length > 0) {
            dictionary[key] = partsData;
        }
    }
    console.log("dictionary:", dictionary);

    return dictionary;
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
