/**
 * ドロップダウン作成ユーティリティ
 */

import { DROPDOWN_OPTIONS } from "../types";

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
 * テーブルの各行の7列目にドロップダウンを追加
 */
export function addDropdownsToTable(table: HTMLTableElement): void {
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row: Element) => {
        const tableRow = row as HTMLTableRowElement;
        const cells = tableRow.querySelectorAll("td");

        // 7列目（インデックス6）を取得
        if (cells.length >= 7) {
            const cell7 = cells[6] as HTMLTableCellElement;
            const currentValue = cell7.textContent?.trim() || "";
            addDropdownToCell(cell7, currentValue);
        }
    });
}
