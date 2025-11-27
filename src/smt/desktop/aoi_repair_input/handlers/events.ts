/**
 * イベントハンドラー
 */

import { getEditButtonArea } from "../utils/dom";
import {
    getRelatedRecordsWrapper,
    getRelatedRecordsTableWrapper,
    getRelatedRecordsTable,
    getCustomTableArea,
} from "../utils/dom";
import { addDropdownsToTable } from "../builders/dropdown";
import { cloneTableAndTitle, setupClonedTableInArea } from "../builders/table";
import { createButtonContainer } from "../builders/button";
import { toggleEditButton, toggleRelatedRecordsWrapper } from "../utils/ui";

/**
 * 編集ボタンを作成して追加
 */
function createAndAppendEditButton(): void {
    const editButtonArea = getEditButtonArea();
    if (!editButtonArea) {
        return;
    }

    const customButton = document.createElement("button");
    customButton.id = "custom-edit-button";
    customButton.innerText = "編集";
    editButtonArea.appendChild(customButton);
}

/**
 * レコード追加・編集画面表示時の処理
 */
export function handleRecordShow(event: any): any {
    createAndAppendEditButton();
    return event;
}

/**
 * 編集ボタンクリック時の処理
 */
function handleEditButtonClick(): void {
    const relatedRecordsWrapper = getRelatedRecordsWrapper();
    if (!relatedRecordsWrapper) {
        return;
    }

    const relatedRecordsTableWrapper = getRelatedRecordsTableWrapper(relatedRecordsWrapper);
    if (!relatedRecordsTableWrapper) {
        return;
    }

    const relatedRecordsTable = getRelatedRecordsTable(relatedRecordsTableWrapper);
    if (!relatedRecordsTable) {
        return;
    }

    const customTableArea = getCustomTableArea();
    if (!customTableArea) {
        return;
    }

    // テーブルとタイトルをクローン
    const { clonedTable, clonedTitle } = cloneTableAndTitle(
        relatedRecordsWrapper,
        relatedRecordsTable
    );

    // ドロップダウンを追加
    addDropdownsToTable(clonedTable);

    // クローンしたテーブルをカスタムエリアに配置
    setupClonedTableInArea(customTableArea, clonedTable, clonedTitle);

    // ボタンコンテナを作成して追加
    const buttonContainer = createButtonContainer(
        clonedTable,
        relatedRecordsTable,
        customTableArea,
        relatedRecordsWrapper
    );
    customTableArea.appendChild(buttonContainer);

    // 元の関連レコードエリアを非表示
    toggleRelatedRecordsWrapper(relatedRecordsWrapper, false);
    toggleEditButton(false);
}

/**
 * 編集ボタンクリックイベントを登録
 */
export function registerEditButtonClickHandler(): void {
    document.addEventListener("click", (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && target.id === "custom-edit-button") {
            handleEditButtonClick();
        }
    });
}

