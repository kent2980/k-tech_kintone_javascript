/**
 * DOM要素取得ユーティリティ
 */

import { SELECTORS } from "../types";

/**
 * 編集ボタンエリアを取得
 */
export function getEditButtonArea(): HTMLElement | null {
    return document.getElementById(SELECTORS.EDIT_BUTTON_AREA);
}

/**
 * 関連レコードラッパーを取得
 */
export function getRelatedRecordsWrapper(): HTMLElement | null {
    return document.querySelector(
        SELECTORS.RELATED_RECORDS_WRAPPER
    ) as HTMLElement | null;
}

/**
 * 関連レコードタイトルを取得
 */
export function getRelatedRecordsTitle(
    wrapper: HTMLElement
): HTMLElement | null {
    return wrapper.querySelector(SELECTORS.RELATED_RECORDS_TITLE) as HTMLElement | null;
}

/**
 * 関連レコードテーブルラッパーを取得
 */
export function getRelatedRecordsTableWrapper(
    wrapper: HTMLElement
): HTMLElement | null {
    return wrapper.querySelector(
        SELECTORS.RELATED_RECORDS_TABLE_WRAPPER
    ) as HTMLElement | null;
}

/**
 * 関連レコードテーブルを取得
 */
export function getRelatedRecordsTable(
    tableWrapper: HTMLElement
): HTMLTableElement | null {
    return tableWrapper.querySelector("table") as HTMLTableElement | null;
}

/**
 * カスタムテーブルエリアを取得
 */
export function getCustomTableArea(): HTMLElement | null {
    return document.getElementById(SELECTORS.CUSTOM_TABLE_AREA) as HTMLElement | null;
}

/**
 * 編集ボタンを取得
 */
export function getEditButton(): HTMLElement | null {
    return document.getElementById(SELECTORS.CUSTOM_EDIT_BUTTON) as HTMLElement | null;
}

/**
 * レコードIDをhrefから抽出
 */
export function extractRecordIdFromHref(href: string | null): string | null {
    if (!href) {
        return null;
    }
    const match = href.match(/record=(\d+)/);
    return match && match[1] ? match[1] : null;
}

/**
 * アクションリンクからレコードIDを取得
 */
export function getRecordIdFromRow(row: HTMLTableRowElement): string | null {
    const actionLink = row.querySelector(
        SELECTORS.ACTION_LINK
    ) as HTMLAnchorElement | null;
    if (!actionLink) {
        return null;
    }
    const href = actionLink.getAttribute("href");
    return extractRecordIdFromHref(href);
}

/**
 * テーブル下のボタンエリアを取得または作成
 */
export function getOrCreateButtonArea(tableWrapper: HTMLElement): HTMLElement {
    // 既存のボタンエリアを探す
    let buttonArea = tableWrapper.querySelector(".custom-button-area") as HTMLElement | null;
    
    if (!buttonArea) {
        // ボタンエリアが存在しない場合は作成
        buttonArea = document.createElement("div");
        buttonArea.className = "custom-button-area";
        buttonArea.style.marginTop = "10px";
        buttonArea.style.textAlign = "right";
        tableWrapper.appendChild(buttonArea);
    }
    
    return buttonArea;
}

