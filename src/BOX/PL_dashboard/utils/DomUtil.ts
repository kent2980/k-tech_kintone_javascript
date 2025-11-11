/**
 * DOM操作関連のユーティリティ関数
 */
export class DomUtil {
    /**
     * 要素を作成する
     * @param tagName - 作成するタグ名
     * @param className - クラス名（オプション）
     * @returns 作成された要素
     */
    static createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        className?: string
    ): HTMLElementTagNameMap[K] {
        const element = document.createElement(tagName);
        if (className) {
            element.className = className;
        }
        return element;
    }

    /**
     * セレクトボックスにオプションを追加する
     * @param selectElement - セレクトボックス要素
     * @param value - オプションの値
     * @param text - オプションの表示テキスト
     */
    static addOption(selectElement: HTMLSelectElement, value: string | number, text: string): void {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = text;
        selectElement.appendChild(option);
    }

    /**
     * ラベル要素を作成する
     * @param text - ラベルのテキスト
     * @param forId - for属性の値
     * @param marginLeft - 左マージン（オプション）
     * @returns ラベル要素
     */
    static createLabel(
        text: string,
        forId: string,
        marginLeft: string | null = null
    ): HTMLLabelElement {
        const label = document.createElement("label");
        label.textContent = text;
        label.setAttribute("for", forId);
        label.className = "filter-label" + (marginLeft ? " with-margin" : "");
        return label;
    }

    /**
     * テーブルセルを作成する
     * @param content - セルの内容
     * @param options - セルのオプション
     * @returns テーブルセル要素
     */
    static createTableCell(
        content: string | number,
        options: {
            tag?: "td" | "th";
            className?: string;
            styles?: Record<string, string>;
            isSticky?: boolean;
            stickyLeft?: string;
        } = {}
    ): HTMLTableCellElement {
        const {
            tag = "td",
            className = "",
            styles = {},
            isSticky = false,
            stickyLeft = "0",
        } = options;

        const cell = document.createElement(tag) as HTMLTableCellElement;
        cell.textContent = String(content);

        if (className) {
            cell.className = className;
        }

        // 基本スタイルを適用
        const defaultStyles = {
            border: "1px solid #ccc",
            padding: tag === "th" ? "8px" : "6px",
            textAlign: "center",
        };

        Object.assign(cell.style, defaultStyles, styles);

        // Stickyスタイルを適用
        if (isSticky) {
            cell.style.position = "sticky";
            cell.style.left = stickyLeft;
            cell.style.backgroundColor = tag === "th" ? "#f5f5f5" : "#fff";
            cell.style.zIndex = tag === "th" ? "11" : "9";
        }

        return cell;
    }

    /**
     * テーブル行を作成する
     * @param className - 行のクラス名
     * @returns テーブル行要素
     */
    static createTableRow(className: string = ""): HTMLTableRowElement {
        const row = document.createElement("tr");
        if (className) {
            row.className = className;
        }
        return row;
    }

    /**
     * 要素にスタイルを一括適用する
     * @param element - 対象要素
     * @param styles - 適用するスタイル
     */
    static applyStyles(element: HTMLElement, styles: Record<string, string>): void {
        Object.assign(element.style, styles);
    }

    /**
     * 要素を安全に削除する
     * @param element - 削除する要素
     */
    static safeRemove(element: HTMLElement | null): void {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    /**
     * 指定されたIDの要素を取得する（型安全）
     * @param id - 要素のID
     * @param type - 要素の型
     * @returns 要素またはnull
     */
    static getElementById<T extends HTMLElement>(id: string, type?: { new (): T }): T | null {
        const element = document.getElementById(id);
        if (!element) return null;
        if (type && !(element instanceof type)) return null;
        return element as T;
    }
}
