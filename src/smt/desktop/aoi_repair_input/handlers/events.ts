/**
 * イベントハンドラー
 */

/// <reference path="../../../../app/AoiDefectFields.d.ts" />

import { addPartsTypeColumnToTable } from "../builders/dropdown";
import { addPartsNumberColumnToTable } from "../builders/partsColumn";
import {
    createPartsDictionary,
    extractModelCodeAndRefList,
    getCurrentInstruction,
    getReferenceAppRecords,
    getRelatedAppId,
} from "../utils/bom";
import {
    getEditButtonArea,
    getOrCreateButtonArea,
    getRelatedRecordsTable,
    getRelatedRecordsTableWrapper,
    getRelatedRecordsWrapper,
} from "../utils/dom";
import { extractUpdatedRecords, updateReferenceAppRecords } from "../utils/record";
import { toggleButtonArea, toggleEditButton } from "../utils/ui";

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
    customButton.className = "kintoneplugin-button-dialog-ok";
    customButton.innerText = "編集";

    // kintoneの標準ボタンスタイルを適用
    customButton.style.minWidth = "80px";
    customButton.style.height = "32px";
    customButton.style.padding = "0 16px";
    customButton.style.fontSize = "13px";
    customButton.style.fontWeight = "normal";
    customButton.style.lineHeight = "1.5";
    customButton.style.border = "1px solid #e3e7e8";
    customButton.style.borderRadius = "4px";
    customButton.style.backgroundColor = "#ffffff";
    customButton.style.color = "#333333";
    customButton.style.cursor = "pointer";
    customButton.style.transition = "all 0.2s ease";

    // ホバー効果
    customButton.addEventListener("mouseenter", () => {
        customButton.style.backgroundColor = "#f5f5f5";
        customButton.style.borderColor = "#d1d5d9";
    });
    customButton.addEventListener("mouseleave", () => {
        customButton.style.backgroundColor = "#ffffff";
        customButton.style.borderColor = "#e3e7e8";
    });

    // アクティブ効果
    customButton.addEventListener("mousedown", () => {
        customButton.style.backgroundColor = "#e8e8e8";
    });
    customButton.addEventListener("mouseup", () => {
        customButton.style.backgroundColor = "#f5f5f5";
    });

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
 * 保存ボタンクリック時の処理
 */
async function handleSaveButtonClick(table: HTMLTableElement, relatedAppId: number): Promise<void> {
    try {
        // 更新レコードを抽出
        const updatedRecords = extractUpdatedRecords(table);

        if (updatedRecords.length === 0) {
            alert("更新するレコードがありません。");
            return;
        }

        // 参照先アプリのレコードを更新
        await updateReferenceAppRecords(relatedAppId, updatedRecords);

        // 編集ボタンは非表示のまま、保存ボタンも表示したまま
        alert("保存が完了しました。");
    } catch (error) {
        console.error("保存エラー:", error);
        alert("保存に失敗しました。");
    }
}

/**
 * 保存ボタンを作成
 */
function createSaveButton(
    table: HTMLTableElement,
    relatedAppId: number,
    buttonArea: HTMLElement
): void {
    // 既存のボタンを削除
    buttonArea.innerHTML = "";

    // 保存ボタンを作成
    const saveButton = document.createElement("button");
    saveButton.id = "custom-save-button";
    saveButton.className = "kintoneplugin-button-dialog-ok";
    saveButton.innerText = "保存";

    // kintoneの標準ボタンスタイルを適用（保存ボタンは強調色）
    saveButton.style.minWidth = "80px";
    saveButton.style.height = "32px";
    saveButton.style.padding = "0 16px";
    saveButton.style.fontSize = "13px";
    saveButton.style.fontWeight = "normal";
    saveButton.style.lineHeight = "1.5";
    saveButton.style.border = "1px solid #3498db";
    saveButton.style.borderRadius = "4px";
    saveButton.style.backgroundColor = "#3498db";
    saveButton.style.color = "#ffffff";
    saveButton.style.cursor = "pointer";
    saveButton.style.transition = "all 0.2s ease";

    // ホバー効果
    saveButton.addEventListener("mouseenter", () => {
        saveButton.style.backgroundColor = "#2980b9";
        saveButton.style.borderColor = "#2980b9";
    });
    saveButton.addEventListener("mouseleave", () => {
        saveButton.style.backgroundColor = "#3498db";
        saveButton.style.borderColor = "#3498db";
    });

    // アクティブ効果
    saveButton.addEventListener("mousedown", () => {
        saveButton.style.backgroundColor = "#21618c";
    });
    saveButton.addEventListener("mouseup", () => {
        saveButton.style.backgroundColor = "#2980b9";
    });

    saveButton.addEventListener("click", () => {
        handleSaveButtonClick(table, relatedAppId);
    });

    buttonArea.appendChild(saveButton);
}

/**
 * 編集ボタンクリック時の処理
 */
async function handleEditButtonClick(): Promise<void> {
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

    // 1. 編集ボタンを非表示にする
    toggleEditButton(false);

    // BOMデータの取得と処理
    try {
        // 2. 関連レコード一覧の参照先アプリIDを取得
        const relatedAppId = getRelatedAppId();
        if (!relatedAppId) {
            // 参照先アプリIDが取得できない場合は処理を終了
            toggleEditButton(true); // 編集ボタンを再表示
            return;
        }

        // 3. 現在のレコードの指図を取得
        const instruction = getCurrentInstruction();
        if (!instruction) {
            toggleEditButton(true); // 編集ボタンを再表示
            return;
        }

        // 4. 参照先アプリから指図で抽出したレコードを取得
        const referenceRecords = await getReferenceAppRecords(relatedAppId, instruction);

        // 5. Y番とリファレンスのデータを抽出
        const referenceDataList = extractModelCodeAndRefList(referenceRecords);

        if (referenceDataList.length === 0) {
            // データが存在しない場合は処理を終了
            toggleEditButton(true); // 編集ボタンを再表示
            return;
        }

        // 6. BOM構成部品アプリから部品データを取得して辞書を作成
        const partsDictionary = await createPartsDictionary(referenceDataList);

        // 7. 既存テーブルに部品タイプ列を追加（参照先アプリのデータを初期値として設定）
        addPartsTypeColumnToTable(relatedRecordsTable, referenceRecords);

        // 8. 既存テーブルに部品番号列を追加
        addPartsNumberColumnToTable(relatedRecordsTable, partsDictionary, referenceRecords);

        // 9. テーブルの下のエリアに保存ボタンを作成または表示
        const buttonArea = getOrCreateButtonArea(relatedRecordsTableWrapper);
        createSaveButton(relatedRecordsTable, relatedAppId, buttonArea);
        toggleButtonArea(buttonArea, true);
    } catch (error) {
        // エラーが発生した場合は処理を終了
        console.error("列追加エラー:", error);
        toggleEditButton(true); // 編集ボタンを再表示
        return;
    }
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
