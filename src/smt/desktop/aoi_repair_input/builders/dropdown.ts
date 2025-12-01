/**
 * ドロップダウン作成ユーティリティ
 */

/// <reference path="../../../../app/AoiDefectFields.d.ts" />

import { DROPDOWN_OPTIONS } from "../types";
import { getRecordIdFromRow } from "../utils/dom";

/**
 * ドロップダウンオプションを作成
 */
function createDropdownOption(value: string, isSelected: boolean): HTMLOptionElement {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = isSelected;
    option.style.fontSize = "14px";
    return option;
}

/**
 * ドロップダウン要素を作成
 */
export function createDropdown(currentValue: string): HTMLSelectElement {
    const select = document.createElement("select");
    select.style.width = "calc(100% - 8px)";
    select.style.padding = "4px 8px";
    select.style.margin = "4px";
    select.style.verticalAlign = "middle";
    select.style.boxSizing = "border-box";
    select.style.fontSize = "14px";

    DROPDOWN_OPTIONS.forEach((optionValue) => {
        const isSelected =
            (currentValue && optionValue === currentValue) ||
            (!currentValue && optionValue === "C/R");
        const option = createDropdownOption(optionValue, isSelected);
        select.appendChild(option);
    });

    return select;
}

/**
 * セルにドロップダウンを追加
 */
export function addDropdownToCell(cell: HTMLTableCellElement, currentValue: string): void {
    // セルのスタイルを調整（中央寄せ）
    cell.style.textAlign = "center";
    cell.style.verticalAlign = "middle";
    cell.style.padding = "0";

    // セルの内容をクリアしてドロップダウンを追加
    cell.innerHTML = "";
    const select = createDropdown(currentValue);
    cell.appendChild(select);
}

/**
 * テーブルヘッダーに部品タイプ列を追加
 */
export function addPartsTypeHeader(table: HTMLTableElement): void {
    const thead = table.querySelector("thead");
    if (!thead) {
        return;
    }

    const headerRow = thead.querySelector("tr");
    if (!headerRow) {
        return;
    }

    // 既に部品タイプ列が存在するかチェック
    const existingHeaders = headerRow.querySelectorAll("th");
    for (let i = 0; i < existingHeaders.length; i++) {
        const headerText = existingHeaders[i].textContent?.trim() || "";
        if (headerText.includes("部品タイプ") || headerText.includes("parts_type")) {
            return; // 既に存在する場合は追加しない
        }
    }

    const th = document.createElement("th");
    th.className = "subtable-label-gaia subtable-label-single_line_text-gaia";
    th.style.minWidth = "150px";
    const span = document.createElement("span");
    span.textContent = "部品タイプ";
    span.className = "subtable-label-inner-gaia";
    th.appendChild(span);
    headerRow.appendChild(th);
}

/**
 * テーブル行に部品タイプセルを追加
 */
export function addPartsTypeCell(row: HTMLTableRowElement, currentValue: string | null): void {
    const td = document.createElement("td");
    td.className = "recordlist-cell-gaia";
    td.style.padding = "8px";
    td.style.border = "1px solid #ddd";
    td.style.textAlign = "center";
    td.style.verticalAlign = "middle";

    // currentValueがnullの場合は空文字列を渡す（createDropdown内でデフォルト値が設定される）
    const valueToUse = currentValue || "";
    const select = createDropdown(valueToUse);

    // 初期値を明示的に設定（念のため）
    if (currentValue && DROPDOWN_OPTIONS.includes(currentValue as any)) {
        select.value = currentValue;
    }

    td.appendChild(select);
    row.appendChild(td);
}

/**
 * テーブルに部品タイプ列を追加
 * 参照先アプリのレコードからparts_typeの初期値を取得する
 */
export function addPartsTypeColumnToTable(
    table: HTMLTableElement,
    referenceRecords?: aoiDefect.SavedFields[]
): void {
    // ヘッダーに列を追加
    addPartsTypeHeader(table);

    // 参照先アプリのレコードをレコードIDでマッピング
    const recordMap = new Map<string, aoiDefect.SavedFields>();
    if (referenceRecords) {
        referenceRecords.forEach((record) => {
            const recordId = record.$id?.value;
            if (recordId) {
                recordMap.set(recordId, record);
            }
        });
    }

    // 各行にセルを追加
    const rows = table.querySelectorAll("tbody tr");
    const rowsArray = Array.from(rows);

    rowsArray.forEach((row: Element, index: number) => {
        const tableRow = row as HTMLTableRowElement;
        const cells = tableRow.querySelectorAll("td");

        // 既存の部品タイプ列の値を取得（存在する場合）
        let currentValue: string | null = null;

        // まず、参照先アプリのレコードからparts_typeの値を取得
        // 方法1: レコードIDでマッピング
        const recordId = getRecordIdFromRow(tableRow);
        if (recordId && recordMap.has(recordId)) {
            const record = recordMap.get(recordId)!;
            if (record.parts_type?.value) {
                currentValue = record.parts_type.value;
            }
        }

        // 方法2: インデックスベースでマッピング（レコードIDが取得できない場合のフォールバック）
        if (!currentValue && referenceRecords && index < referenceRecords.length) {
            const record = referenceRecords[index];
            if (record.parts_type?.value) {
                currentValue = record.parts_type.value;
            }
        }

        // 既存の部品タイプ列の値が取得できない場合、テーブル内の既存値を確認
        if (!currentValue && cells.length >= 7) {
            const cell7 = cells[6] as HTMLTableCellElement;
            const select = cell7.querySelector("select");
            if (select) {
                currentValue = select.value;
            } else {
                currentValue = cell7.textContent?.trim() || null;
            }
        }

        addPartsTypeCell(tableRow, currentValue);
    });
}
