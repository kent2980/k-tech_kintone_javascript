/**
 * レコード処理ユーティリティ
 */

import { UpdatedRecord, RecordUpdateBody, APP_ID } from "../types";
import { getRecordIdFromRow } from "./dom";

/**
 * テーブル行から更新レコード情報を抽出（部品タイプ列から）
 */
export function extractUpdatedRecords(table: HTMLTableElement): UpdatedRecord[] {
    const updatedRecords: UpdatedRecord[] = [];
    const rows = table.querySelectorAll("tbody tr");

    // ヘッダーから部品タイプ列のインデックスを取得
    const thead = table.querySelector("thead");
    let partsTypeIndex: number | null = null;
    if (thead) {
        const headerRow = thead.querySelector("tr");
        if (headerRow) {
            const headers = headerRow.querySelectorAll("th");
            headers.forEach((header, index) => {
                const headerText = header.textContent?.trim() || "";
                if (headerText.includes("部品タイプ") || headerText.includes("parts_type")) {
                    partsTypeIndex = index;
                }
            });
        }
    }

    rows.forEach((row: Element) => {
        const tableRow = row as HTMLTableRowElement;
        const cells = tableRow.querySelectorAll("td");

        // レコードIDを取得
        const recordId = getRecordIdFromRow(tableRow);

        // 部品タイプ列のドロップダウンの選択値を取得
        let dropdownValue: string | null = null;
        if (partsTypeIndex !== null && cells.length > partsTypeIndex) {
            const partsTypeCell = cells[partsTypeIndex] as HTMLTableCellElement;
            const select = partsTypeCell.querySelector("select") as HTMLSelectElement | null;
            if (select) {
                dropdownValue = select.value;
            }
        }

        if (recordId) {
            updatedRecords.push({
                id: recordId,
                dropdownValue: dropdownValue,
            });
        }
    });

    return updatedRecords;
}

/**
 * 更新レコードをAPIリクエスト形式に変換
 */
export function createUpdateRequestBody(updatedRecords: UpdatedRecord[]): RecordUpdateBody {
    return {
        app: APP_ID,
        records: updatedRecords.map((record) => ({
            id: record.id,
            record: {
                parts_type: {
                    value: record.dropdownValue,
                },
            },
        })),
    };
}

/**
 * レコードを更新
 */
export async function updateRecords(body: RecordUpdateBody): Promise<void> {
    await kintone.api(kintone.api.url("/k/v1/records", true), "PUT", body);
}

/**
 * 参照先アプリのレコードを更新
 */
export async function updateReferenceAppRecords(
    appId: number,
    records: UpdatedRecord[]
): Promise<void> {
    const body: RecordUpdateBody = {
        app: appId,
        records: records.map((record) => ({
            id: record.id,
            record: {
                parts_type: {
                    value: record.dropdownValue,
                },
            },
        })),
    };

    await updateRecords(body);
}
