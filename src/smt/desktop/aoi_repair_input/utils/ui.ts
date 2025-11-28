/**
 * UI更新ユーティリティ
 */

import { UpdatedRecord } from "../types";
import { getRecordIdFromRow } from "./dom";

/**
 * 編集ボタンの表示/非表示を切り替え
 */
export function toggleEditButton(show: boolean): void {
    const editButton = document.getElementById("custom-edit-button") as HTMLElement | null;
    if (editButton) {
        editButton.style.display = show ? "inline-block" : "none";
    }
}

/**
 * 関連レコードエリアの表示/非表示を切り替え
 */
export function toggleRelatedRecordsWrapper(wrapper: HTMLElement, show: boolean): void {
    wrapper.style.display = show ? "block" : "none";
}

/**
 * カスタムテーブルエリアをクリア
 */
export function clearCustomTableArea(area: HTMLElement): void {
    area.innerHTML = "";
}

/**
 * 元のテーブルを更新されたレコードで更新
 */
export function updateOriginalTable(
    table: HTMLTableElement,
    updatedRecords: UpdatedRecord[]
): void {
    const rows = table.querySelectorAll("tr");

    rows.forEach((row: Element) => {
        const tableRow = row as HTMLTableRowElement;
        const recordId = getRecordIdFromRow(tableRow);
        const recordUpdate = updatedRecords.find((rec) => rec.id === recordId);

        if (recordUpdate) {
            const cells = tableRow.querySelectorAll("td");
            if (cells.length >= 7) {
                const cell7 = cells[6] as HTMLTableCellElement;
                cell7.textContent = recordUpdate.dropdownValue;
            }
        }
    });
}

/**
 * 編集モードを終了（元のUIを表示）
 */
export function exitEditMode(
    customTableArea: HTMLElement,
    relatedRecordsWrapper: HTMLElement
): void {
    clearCustomTableArea(customTableArea);
    toggleRelatedRecordsWrapper(relatedRecordsWrapper, true);
    toggleEditButton(true);
}

/**
 * ボタンエリアの表示/非表示を切り替え
 */
export function toggleButtonArea(buttonArea: HTMLElement, show: boolean): void {
    buttonArea.style.display = show ? "block" : "none";
}

