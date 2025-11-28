/**
 * 部品番号列作成ユーティリティ
 */

import { PartsData, PartsDictionary } from "../types";

/**
 * 部品番号用のドロップダウンを作成
 */
function createPartsNumberDropdown(
    partsList: PartsData[],
    currentValue: string | null = null
): HTMLSelectElement {
    const select = document.createElement("select");
    select.style.width = "calc(100% - 8px)";
    select.style.padding = "4px 8px";
    select.style.margin = "4px";
    select.style.verticalAlign = "middle";
    select.style.boxSizing = "border-box";
    select.style.fontSize = "14px";

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

    // トースト通知を表示する処理
    const showToast = (message: string, isSuccess: boolean = true): void => {
        // 既存のトーストがあれば削除
        const existingToast = document.getElementById("parts-code-copy-toast");
        if (existingToast) {
            existingToast.remove();
        }

        // トースト要素を作成
        const toast = document.createElement("div");
        toast.id = "parts-code-copy-toast";
        toast.textContent = message;
        toast.style.position = "fixed";
        toast.style.top = "20px";
        toast.style.right = "20px";
        toast.style.padding = "12px 24px";
        toast.style.backgroundColor = isSuccess ? "#4caf50" : "#f44336";
        toast.style.color = "#ffffff";
        toast.style.borderRadius = "4px";
        toast.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
        toast.style.zIndex = "10000";
        toast.style.fontSize = "14px";
        toast.style.fontWeight = "500";
        toast.style.transition = "opacity 0.3s ease-in-out";
        toast.style.opacity = "0";

        document.body.appendChild(toast);

        // フェードイン
        setTimeout(() => {
            toast.style.opacity = "1";
        }, 10);

        // 3秒後にフェードアウトして削除
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    };

    // クリップボードにコピーする処理
    const copyToClipboard = async (partsCode: string): Promise<void> => {
        if (!partsCode) {
            return;
        }

        try {
            await navigator.clipboard.writeText(partsCode);
            console.log("クリップボードにコピーしました:", partsCode);
            showToast(`部品コード「${partsCode}」をクリップボードにコピーしました`, true);
        } catch (error) {
            console.error("クリップボードへのコピーに失敗しました:", error);
            // フォールバック: 古い方法でコピーを試みる
            try {
                const textArea = document.createElement("textarea");
                textArea.value = partsCode;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                console.log("クリップボードにコピーしました（フォールバック）:", partsCode);
                showToast(`部品コード「${partsCode}」をクリップボードにコピーしました`, true);
            } catch (fallbackError) {
                console.error(
                    "クリップボードへのコピーに失敗しました（フォールバック）:",
                    fallbackError
                );
                showToast("クリップボードへのコピーに失敗しました", false);
            }
        }
    };

    // 選択が変更されたときに選択した部品コードをクリップボードにコピー
    select.addEventListener("change", async () => {
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption) {
            // valueから部品コードを取得（value形式: "部品コード_バージョン"）
            const value = selectedOption.value;
            const partsCode = value.split("_")[0] || "";
            await copyToClipboard(partsCode);
        }
    });

    // ドロップダウンを開いて同じ値を選択したときも発火するように、clickイベントも追加
    select.addEventListener("click", async () => {
        // 少し遅延を入れて、選択が確定してから処理を実行
        setTimeout(async () => {
            const selectedOption = select.options[select.selectedIndex];
            if (selectedOption) {
                // valueから部品コードを取得（value形式: "部品コード_バージョン"）
                const value = selectedOption.value;
                const partsCode = value.split("_")[0] || "";
                await copyToClipboard(partsCode);
            }
        }, 10);
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

    // 既に部品番号列が存在するかチェック
    const existingHeaders = headerRow.querySelectorAll("th");
    for (let i = 0; i < existingHeaders.length; i++) {
        const headerText = existingHeaders[i].textContent?.trim() || "";
        if (headerText.includes("部品番号") || headerText.includes("parts_code")) {
            return; // 既に存在する場合は追加しない
        }
    }

    const th = document.createElement("th");
    th.className = "subtable-label-gaia subtable-label-single_line_text-gaia";
    th.style.minWidth = "300px";
    const span = document.createElement("span");
    span.textContent = "部品番号";
    span.className = "subtable-label-inner-gaia";
    th.appendChild(span);
    headerRow.appendChild(th);
}

/**
 * テーブル行に部品番号セルを追加(複数部品表示の為、ドロップボックスを追加する)
 */
function addPartsNumberCell(row: HTMLTableRowElement, partsDataList: PartsData[]): void {
    const td = document.createElement("td");
    td.className = "recordlist-cell-gaia";
    td.style.padding = "8px";
    td.style.border = "1px solid #ddd";
    td.style.textAlign = "center";
    td.style.verticalAlign = "middle";
    const select = createPartsNumberDropdown(partsDataList);
    td.appendChild(select);
    row.appendChild(td);
}
/**
 * テーブルに部品番号列を追加
 */
export function addPartsNumberColumnToTable(
    table: HTMLTableElement,
    partsDictionary: PartsDictionary,
    referenceRecords: aoiDefect.SavedFields[]
): void {
    // ヘッダーに列を追加
    addPartsNumberHeader(table);

    // 各行にセルを追加
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row: Element, index: number) => {
        const tableRow = row as HTMLTableRowElement;
        // 該当行のリファレンスを取得
        const reference = referenceRecords[index].reference.value;
        // 該当リファレンスの部品データを取得し、PartsData型に変換
        const partsData: PartsData[] = partsDictionary
            .filter((parts) => parts.reference === reference)
            .map((parts) => ({
                parts_code: parts.parts_code,
                version: String(parts.version),
                reference: parts.reference,
            }));
        // 該当行の部品番号セルを追加
        addPartsNumberCell(tableRow, partsData);
    });
}
