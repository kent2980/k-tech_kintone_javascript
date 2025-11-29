/**
 * DOM操作関連のユーティリティ関数
 */
export class DomUtil {
    /**
     * 要素を作成する
     * クラス名を指定可能（オプション）
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
     */
    static addOption(selectElement: HTMLSelectElement, value: string | number, text: string): void {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = text;
        selectElement.appendChild(option);
    }

    /**
     * ラベル要素を作成する
     * 左マージンを指定可能（オプション）
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
        if (marginLeft) {
            label.style.marginLeft = marginLeft;
        }
        return label;
    }

    /**
     * テーブルセルを作成する
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
     */
    static applyStyles(element: HTMLElement, styles: Record<string, string>): void {
        Object.assign(element.style, styles);
    }

    /**
     * 要素を安全に削除する
     */
    static safeRemove(element: HTMLElement | null): void {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    /**
     * 指定されたIDの要素を取得する（型安全）
     */
    static getElementById<T extends HTMLElement>(id: string, type?: { new (): T }): T | null {
        const element = document.getElementById(id);
        if (!element) return null;
        if (type && !(element instanceof type)) return null;
        return element as T;
    }
}
