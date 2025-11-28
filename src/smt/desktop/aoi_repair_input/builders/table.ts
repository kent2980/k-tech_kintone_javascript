/**
 * テーブル作成処理
 */

/// <reference path="../../../../app/aoiDefectFields.d.ts" />

/**
 * 元のテーブルからヘッダー構造を取得
 */
function getTableHeaders(originalTable: HTMLTableElement): string[] {
    const headers: string[] = [];
    const thead = originalTable.querySelector("thead");
    if (!thead) {
        return headers;
    }

    const headerRow = thead.querySelector("tr");
    if (!headerRow) {
        return headers;
    }

    const thElements = headerRow.querySelectorAll("th");
    thElements.forEach((th) => {
        headers.push(th.textContent?.trim() || "");
    });

    return headers;
}

/**
 * ファイルURLからimgタグとaタグを作成
 */
function createImageLink(imageUrl: string): HTMLAnchorElement | null {
    if (!imageUrl) {
        return null;
    }

    const img = document.createElement("img");
    img.src = imageUrl;
    img.style.maxWidth = "100px";
    img.style.maxHeight = "100px";
    img.style.objectFit = "contain";

    // imgタグをaタグでラップ
    const a = document.createElement("a");
    a.href = imageUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.appendChild(img);

    return a;
}

/**
 * レコードからテーブル行を作成
 */
function createTableRow(record: aoiDefect.SavedFields, headers: string[]): HTMLTableRowElement {
    const row = document.createElement("tr");
    row.className = "recordlist-row-gaia recordlist-row-gaia-hover-highlight";

    // レコードIDを取得（$idフィールドから）
    const recordId = record.$id?.value || "";

    headers.forEach((headerText, index) => {
        const cell = document.createElement("td");
        cell.className = "recordlist-cell-gaia";

        // ヘッダーに基づいて適切な値を設定
        if (
            headerText.includes("Y番") ||
            headerText.includes("model_code") ||
            headerText.includes("モデルコード")
        ) {
            cell.textContent = record.model_code?.value || "";
        } else if (
            headerText.includes("リファレンス") ||
            headerText.includes("reference") ||
            headerText.includes("参照")
        ) {
            cell.textContent = record.reference?.value || "";
        } else if (headerText.includes("基板番号") || headerText.includes("current_board_index")) {
            cell.textContent = String(record.current_board_index?.value || "");
        } else if (headerText.includes("不良番号") || headerText.includes("defect_number")) {
            cell.textContent = String(record.defect_number?.value || "");
        } else if (headerText.includes("不良名") || headerText.includes("defect_name")) {
            cell.textContent = record.defect_name?.value || "";
        } else if (headerText.includes("不良画像") || headerText.includes("defect_image")) {
            // ファイル型の画像を表示
            if (record.defect_image?.value && record.defect_image.value.length > 0) {
                const fileKey = record.defect_image.value[0].fileKey;
                const imageUrl = kintone.api.url("/k/v1/file", true) + `?fileKey=${fileKey}`;
                const imageLink = createImageLink(imageUrl);
                if (imageLink) {
                    cell.appendChild(imageLink);
                }
            }
        } else if (headerText.includes("操作") || headerText.includes("action")) {
            // アクションリンクを作成
            const actionLink = document.createElement("a");
            actionLink.href = `/k/${kintone.app.getId()}/show#record=${recordId}`;
            actionLink.className = "listTable-action-gaia";
            actionLink.textContent = "表示";
            cell.appendChild(actionLink);
        } else {
            // その他の列は空にする（後でドロップダウンなどが追加される可能性がある）
            cell.textContent = "";
        }

        row.appendChild(cell);
    });

    return row;
}

/**
 * API取得データから新規テーブルを作成
 * @param records - aoiDefect.SavedFields型のレコード配列
 * @param originalTable - 元のテーブル（ヘッダー構造を取得するため）
 * @returns 作成されたテーブル要素
 */
export function createTableFromRecords(
    records: aoiDefect.SavedFields[],
    originalTable: HTMLTableElement
): HTMLTableElement {
    // 元のテーブルからヘッダー構造を取得
    const headers = getTableHeaders(originalTable);

    // 新規テーブルを作成
    const table = document.createElement("table");
    table.className = "recordlist-table-gaia";

    // ヘッダーを作成
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headers.forEach((headerText) => {
        const th = document.createElement("th");
        th.className = "recordlist-header-gaia";
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // ボディを作成
    const tbody = document.createElement("tbody");
    records.forEach((record) => {
        const row = createTableRow(record, headers);
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    return table;
}

/**
 * テーブルとタイトルをカスタムエリアに配置
 */
export function setupTableInArea(
    customTableArea: HTMLElement,
    table: HTMLTableElement,
    title: Node | null
): void {
    customTableArea.innerHTML = "";

    if (title) {
        customTableArea.appendChild(title);
    }

    customTableArea.appendChild(table);
}
