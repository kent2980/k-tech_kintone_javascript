/**
 * テーブルクローン処理
 */

import { getRelatedRecordsTitle } from "../utils/dom";

/**
 * テーブルとタイトルをクローン
 */
export function cloneTableAndTitle(
    wrapper: HTMLElement,
    table: HTMLTableElement
): {
    clonedTable: HTMLTableElement;
    clonedTitle: Node | null;
} {
    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    const relatedRecordsTitle = getRelatedRecordsTitle(wrapper);
    const clonedTitle = relatedRecordsTitle ? relatedRecordsTitle.cloneNode(true) : null;

    return {
        clonedTable,
        clonedTitle,
    };
}

/**
 * クローンしたテーブルとタイトルをカスタムエリアに配置
 */
export function setupClonedTableInArea(
    customTableArea: HTMLElement,
    clonedTable: HTMLTableElement,
    clonedTitle: Node | null
): void {
    customTableArea.innerHTML = "";

    if (clonedTitle) {
        customTableArea.appendChild(clonedTitle);
    }

    customTableArea.appendChild(clonedTable);
}

