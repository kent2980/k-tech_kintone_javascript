/**
 * ボタン作成ユーティリティ
 */

import { extractUpdatedRecords, createUpdateRequestBody, updateRecords } from "../utils/record";
import { exitEditMode, updateOriginalTable } from "../utils/ui";

/**
 * 保存ボタンを作成
 */
export function createSaveButton(
    clonedTable: HTMLTableElement,
    originalTable: HTMLTableElement,
    customTableArea: HTMLElement,
    relatedRecordsWrapper: HTMLElement
): HTMLButtonElement {
    const saveButton = document.createElement("button");
    saveButton.id = "custom-save-button";
    saveButton.innerText = "保存";
    saveButton.style.marginRight = "10px";

    saveButton.addEventListener("click", async () => {
        // 更新レコードを抽出
        const updatedRecords = extractUpdatedRecords(clonedTable);

        // APIリクエストボディを作成
        const body = createUpdateRequestBody(updatedRecords);

        // レコードを更新
        await updateRecords(body);

        // 編集モードを終了
        exitEditMode(customTableArea, relatedRecordsWrapper);

        // 元のテーブルを更新
        updateOriginalTable(originalTable, updatedRecords);
    });

    return saveButton;
}

/**
 * キャンセルボタンを作成
 */
export function createCancelButton(
    customTableArea: HTMLElement,
    relatedRecordsWrapper: HTMLElement
): HTMLButtonElement {
    const cancelButton = document.createElement("button");
    cancelButton.id = "custom-cancel-button";
    cancelButton.innerText = "キャンセル";

    cancelButton.addEventListener("click", () => {
        exitEditMode(customTableArea, relatedRecordsWrapper);
    });

    return cancelButton;
}

/**
 * ボタンコンテナを作成
 */
export function createButtonContainer(
    clonedTable: HTMLTableElement,
    originalTable: HTMLTableElement,
    customTableArea: HTMLElement,
    relatedRecordsWrapper: HTMLElement
): HTMLDivElement {
    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "10px";

    const saveButton = createSaveButton(
        clonedTable,
        originalTable,
        customTableArea,
        relatedRecordsWrapper
    );
    const cancelButton = createCancelButton(customTableArea, relatedRecordsWrapper);

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);

    return buttonContainer;
}

