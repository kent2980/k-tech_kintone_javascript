/**
 * イベントハンドラー
 */

import { createButtonContainer } from "../builders/button";
import { addDropdownsToTable } from "../builders/dropdown";
import { addPartsNumberColumnToTable } from "../builders/partsColumn";
import { cloneTableAndTitle, setupClonedTableInArea } from "../builders/table";
import {
    createPartsDictionary,
    extractModelCodeAndRefList,
    getCurrentInstruction,
    getReferenceAppRecords,
    getRelatedAppId,
} from "../utils/bom";
import {
    getCustomTableArea,
    getEditButtonArea,
    getRelatedRecordsTable,
    getRelatedRecordsTableWrapper,
    getRelatedRecordsWrapper,
} from "../utils/dom";
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
    console.log("handleRecordShow");
    createAndAppendEditButton();
    return event;
}

/**
 * 編集ボタンクリック時の処理
 */
async function handleEditButtonClick(): Promise<void> {
    const relatedRecordsWrapper = getRelatedRecordsWrapper();
    if (!relatedRecordsWrapper) {
        console.warn("関連レコードエリアが取得できませんでした");
        return;
    }

    const relatedRecordsTableWrapper = getRelatedRecordsTableWrapper(relatedRecordsWrapper);
    if (!relatedRecordsTableWrapper) {
        console.warn("関連レコードテーブルエリアが取得できませんでした");
        return;
    }

    const relatedRecordsTable = getRelatedRecordsTable(relatedRecordsTableWrapper);
    if (!relatedRecordsTable) {
        console.warn("関連レコードテーブルが取得できませんでした");
        return;
    }

    const customTableArea = getCustomTableArea();
    if (!customTableArea) {
        console.warn("カスタムテーブルエリアが取得できませんでした");
        return;
    }

    // テーブルとタイトルをクローン
    const { clonedTable, clonedTitle } = cloneTableAndTitle(
        relatedRecordsWrapper,
        relatedRecordsTable
    );

    // ドロップダウンを追加
    addDropdownsToTable(clonedTable);

    // BOMデータの取得と処理
    try {
        console.log("BOMデータの取得と処理を開始します");
        // 1. 関連レコード一覧の参照先アプリIDを取得
        const relatedAppId = getRelatedAppId();
        console.log("参照先アプリID:", relatedAppId);
        if (!relatedAppId) {
            console.warn("参照先アプリIDが取得できませんでした");
        } else {
            // 2. 現在のレコードの指図を取得
            const instruction = getCurrentInstruction();
            console.log("指図:", instruction);
            if (instruction) {
                // 3. 参照先アプリから指図で抽出したレコードを取得
                const referenceRecords = await getReferenceAppRecords(relatedAppId, instruction);

                // 4. Y番とリファレンスのデータを抽出
                const referenceDataList = extractModelCodeAndRefList(referenceRecords);

                // 5. BOM構成部品アプリから部品データを取得して辞書を作成
                const partsDictionary = await createPartsDictionary(referenceDataList);

                // 6. 関連レコード一覧に新しい列を作成して部品番号を挿入
                addPartsNumberColumnToTable(clonedTable, partsDictionary);
            }
        }
    } catch (error) {
        console.error("BOMデータの取得中にエラーが発生しました:", error);
    }

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
