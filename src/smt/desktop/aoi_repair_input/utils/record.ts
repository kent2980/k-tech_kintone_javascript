/**
 * レコード処理ユーティリティ
 */

import { UpdatedRecord, RecordUpdateBody, APP_ID } from "../types";
import { getRecordIdFromRow } from "./dom";

/**
 * テーブル行から更新レコード情報を抽出
 */
export function extractUpdatedRecords(
    table: HTMLTableElement
): UpdatedRecord[] {
    const updatedRecords: UpdatedRecord[] = [];
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row: Element) => {
        const tableRow = row as HTMLTableRowElement;
        const cells = tableRow.querySelectorAll("td");

        // レコードIDを取得
        const recordId = getRecordIdFromRow(tableRow);

        // 7列目（インデックス6）のドロップダウンの選択値を取得
        let dropdownValue: string | null = null;
        if (cells.length >= 7) {
            const cell7 = cells[6] as HTMLTableCellElement;
            const select = cell7.querySelector("select") as HTMLSelectElement | null;
            if (select) {
                dropdownValue = select.value;
            }
        }

        updatedRecords.push({
            id: recordId,
            dropdownValue: dropdownValue,
        });
    });

    return updatedRecords;
}

/**
 * 更新レコードをAPIリクエスト形式に変換
 */
export function createUpdateRequestBody(
    updatedRecords: UpdatedRecord[]
): RecordUpdateBody {
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

