/**
 * DOMバッチ更新ユーティリティ
 * DocumentFragmentを使用してDOM操作を最適化
 */

/**
 * DOMバッチ更新クラス
 * 複数のDOM要素を一度に追加することで、リフロー・リペイントを最小化
 */
export class DomBatchUpdater {
    private fragment: DocumentFragment;

    /**
     * コンストラクタ
     */
    constructor() {
        this.fragment = document.createDocumentFragment();
    }

    /**
     * 要素をフラグメントに追加
     */
    append(element: Node): DomBatchUpdater {
        this.fragment.appendChild(element);
        return this;
    }

    /**
     * 複数の要素をフラグメントに追加
     */
    appendAll(elements: Node[]): DomBatchUpdater {
        elements.forEach((element) => {
            this.fragment.appendChild(element);
        });
        return this;
    }

    /**
     * フラグメントを親要素に追加（一括更新）
     */
    appendTo(parent: Node): Node {
        parent.appendChild(this.fragment);
        // 新しいフラグメントを作成（再利用可能にする）
        this.fragment = document.createDocumentFragment();
        return parent;
    }

    /**
     * フラグメントをクリア
     */
    clear(): DomBatchUpdater {
        this.fragment = document.createDocumentFragment();
        return this;
    }

    /**
     * フラグメントの子要素数を取得
     */
    getChildCount(): number {
        return this.fragment.childNodes.length;
    }
}

/**
 * DocumentFragmentを使用して複数の要素を一度に追加するヘルパー関数
 */
export function batchAppend(parent: Node, elements: Node[]): Node {
    const fragment = document.createDocumentFragment();
    elements.forEach((element) => {
        fragment.appendChild(element);
    });
    parent.appendChild(fragment);
    return parent;
}

/**
 * DocumentFragmentを使用してテーブル行を一度に追加するヘルパー関数
 */
export function batchAppendRows(
    tbody: HTMLTableSectionElement,
    rows: HTMLTableRowElement[]
): HTMLTableSectionElement {
    const fragment = document.createDocumentFragment();
    rows.forEach((row) => {
        fragment.appendChild(row);
    });
    tbody.appendChild(fragment);
    return tbody;
}

/**
 * DocumentFragmentを使用してテーブルセルを一度に追加するヘルパー関数
 */
export function batchAppendCells(
    row: HTMLTableRowElement,
    cells: HTMLTableCellElement[]
): HTMLTableRowElement {
    const fragment = document.createDocumentFragment();
    cells.forEach((cell) => {
        fragment.appendChild(cell);
    });
    row.appendChild(fragment);
    return row;
}
