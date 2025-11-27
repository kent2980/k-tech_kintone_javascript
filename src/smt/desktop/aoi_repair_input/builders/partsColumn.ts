/**
 * 部品番号列作成ユーティリティ
 */

import { PartsData, PartsDictionary } from "../types";

/**
 * テーブルヘッダーから列インデックスを取得
 */
function getColumnIndexes(table: HTMLTableElement): {
    modelCodeIndex: number | null;
    referenceIndex: number | null;
} {
    console.log("getColumnIndexes:start");
    const thead = table.querySelector("thead");
    if (!thead) {
        console.log("thead:", thead);
        return { modelCodeIndex: null, referenceIndex: null };
    }

    const headerRow = thead.querySelector("tr");
    if (!headerRow) {
        console.log("headerRow:", headerRow);
        return { modelCodeIndex: null, referenceIndex: null };
    }

    const headers = headerRow.querySelectorAll("th");
    let modelCodeIndex: number | null = null;
    let referenceIndex: number | null = null;

    headers.forEach((header, index) => {
        const headerText = header.textContent?.trim() || "";
        // ヘッダーテキストからY番（model_code）とリファレンス（reference）の列を特定
        // 実際の列名に合わせて調整が必要
        if (
            headerText.includes("Y番") ||
            headerText.includes("model_code") ||
            headerText.includes("モデルコード")
        ) {
            modelCodeIndex = index;
        }
        if (
            headerText.includes("リファレンス") ||
            headerText.includes("reference") ||
            headerText.includes("参照")
        ) {
            referenceIndex = index;
        }
    });

    console.log("getColumnIndexes:end");

    return { modelCodeIndex, referenceIndex };
}

/**
 * テーブル行からY番とリファレンスを取得
 */
function getModelCodeAndRefFromRow(
    row: HTMLTableRowElement,
    modelCodeIndex: number | null,
    referenceIndex: number | null
): {
    model_code: string;
    reference: string;
} | null {
    if (modelCodeIndex === null || referenceIndex === null) {
        return null;
    }

    const cells = row.querySelectorAll("td");
    if (cells.length <= Math.max(modelCodeIndex, referenceIndex)) {
        return null;
    }

    const modelCodeCell = cells[modelCodeIndex];
    const referenceCell = cells[referenceIndex];

    const model_code = modelCodeCell?.textContent?.trim() || "";
    const reference = referenceCell?.textContent?.trim() || "";

    if (!model_code || !reference) {
        return null;
    }

    return { model_code, reference };
}

/**
 * 部品番号用のドロップダウンを作成
 */
function createPartsNumberDropdown(
    partsList: PartsData[],
    currentValue: string | null
): HTMLSelectElement {
    console.log("createPartsNumberDropdown:start");
    const select = document.createElement("select");
    select.style.width = "calc(100% - 8px)";
    select.style.padding = "4px 8px";
    select.style.margin = "4px";
    select.style.verticalAlign = "middle";
    select.style.boxSizing = "border-box";

    // デフォルトオプション（空欄）
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "選択してください";
    select.appendChild(defaultOption);

    // 部品データから選択肢を作成
    partsList.forEach((parts) => {
        const option = document.createElement("option");
        const value = `${parts.parts_code}_${parts.version}`;
        option.value = value;
        option.textContent = `${parts.parts_code} (v${parts.version})`;

        // 既存値と一致する場合は選択状態にする
        if (currentValue && currentValue === value) {
            option.selected = true;
        }

        select.appendChild(option);
    });

    return select;
}

/**
 * テーブルヘッダーに部品番号列を追加
 */
function addPartsNumberHeader(table: HTMLTableElement): void {
    const thead = table.querySelector("thead");
    if (!thead) {
        return;
    }

    const headerRow = thead.querySelector("tr");
    if (!headerRow) {
        return;
    }

    const th = document.createElement("th");
    th.textContent = "部品番号";
    th.style.padding = "8px";
    th.style.textAlign = "left";
    th.style.border = "1px solid #ddd";
    headerRow.appendChild(th);
}

/**
 * テーブル行に部品番号セルを追加
 */
function addPartsNumberCell(
    row: HTMLTableRowElement,
    partsDictionary: PartsDictionary,
    currentValue: string | null,
    modelCodeIndex: number | null,
    referenceIndex: number | null
): void {
    const modelCodeAndRef = getModelCodeAndRefFromRow(row, modelCodeIndex, referenceIndex);
    if (!modelCodeAndRef) {
        // Y番とリファレンスが取得できない場合は空のセルを追加
        const td = document.createElement("td");
        td.textContent = "-";
        td.style.padding = "8px";
        td.style.border = "1px solid #ddd";
        td.style.textAlign = "center";
        row.appendChild(td);
        return;
    }

    const key = `${modelCodeAndRef.model_code}_${modelCodeAndRef.reference}`;
    const partsList = partsDictionary[key] || [];

    const td = document.createElement("td");
    td.style.padding = "8px";
    td.style.border = "1px solid #ddd";
    td.style.textAlign = "center";

    console.log("partsList:", partsList);
    if (partsList.length > 0) {
        const select = createPartsNumberDropdown(partsList, currentValue);
        td.appendChild(select);
    } else {
        td.textContent = "-";
    }

    row.appendChild(td);
}

/**
 * テーブルに部品番号列を追加
 */
export function addPartsNumberColumnToTable(
    table: HTMLTableElement,
    partsDictionary: PartsDictionary
): void {
    console.log("partsDictionary:", partsDictionary);
    console.log("table:", table);
    // ヘッダーから列インデックスを取得
    const { modelCodeIndex, referenceIndex } = getColumnIndexes(table);

    // if (modelCodeIndex === null || referenceIndex === null) {
    //     console.warn("Y番またはリファレンスの列が見つかりません");
    //     return;
    // }

    // ヘッダーに列を追加
    addPartsNumberHeader(table);

    // 各行にセルを追加
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row: Element) => {
        const tableRow = row as HTMLTableRowElement;
        // 既存の部品番号値を取得（存在する場合）
        // 現在は既存値がない前提で実装（将来的に既存値取得機能を追加可能）
        const currentValue: string | null = null;
        addPartsNumberCell(tableRow, partsDictionary, currentValue, modelCodeIndex, referenceIndex);
    });
}
