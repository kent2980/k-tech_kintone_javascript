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
    const thead = table.querySelector("thead");
    if (!thead) {
        return { modelCodeIndex: null, referenceIndex: null };
    }

    const headerRow = thead.querySelector("tr");
    if (!headerRow) {
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
    const select = document.createElement("select");
    select.style.width = "calc(100% - 8px)";
    select.style.padding = "4px 8px";
    select.style.margin = "4px";
    select.style.verticalAlign = "middle";
    select.style.boxSizing = "border-box";
    select.style.fontSize = "14px";

    // 部品データから選択肢を作成
    partsList.forEach((parts, index) => {
        const option = document.createElement("option");
        const value = `${parts.parts_code}_${parts.version}`;
        option.value = value;
        option.textContent = `${parts.parts_code} (v${parts.version})`;

        // 既存値と一致する場合は選択状態にする
        // 既存値がない場合は1番目の部品をデフォルトで選択
        if (currentValue && currentValue === value) {
            option.selected = true;
        } else if (!currentValue && index === 0) {
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
    th.className = "subtable-label-gaia subtable-label-single_line_text-gaia label-13457510";
    th.style.minWidth = "300px";
    const span = document.createElement("span");
    span.textContent = "部品番号";
    span.className = "subtable-label-inner-gaia";
    th.appendChild(span);
    headerRow.appendChild(th);
}

/**
 * テーブル行に部品番号セルを追加
 */
function addPartsNumberCell(
    row: HTMLTableRowElement,
    partsDictionary: PartsDictionary,
    currentValue: string | null
): void {
    // 新しい形式の辞書から、該当するreferenceの部品データをフィルタリング

    const td = document.createElement("td");
    td.style.padding = "8px";
    td.style.border = "1px solid #ddd";
    td.style.textAlign = "center";

    if (partsDictionary.length > 0) {
        // PartsData形式に変換してドロップダウンを作成
        const partsDataList: PartsData[] = partsDictionary.map((parts) => ({
            parts_code: parts.parts_code,
            version: String(parts.version),
            reference: parts.reference,
        }));
        const select = createPartsNumberDropdown(partsDataList, currentValue);
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
    // ヘッダーに列を追加
    addPartsNumberHeader(table);

    // 各行にセルを追加
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row: Element) => {
        const tableRow = row as HTMLTableRowElement;
        // 既存の部品番号値を取得（存在する場合）
        // 現在は既存値がない前提で実装（将来的に既存値取得機能を追加可能）
        const currentValue: string | null = null;
        addPartsNumberCell(tableRow, partsDictionary, currentValue);
    });
}
