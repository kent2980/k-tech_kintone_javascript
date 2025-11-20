import BaseButton from "./baseButton";

class TableCreateButton extends BaseButton {
    private headerSpace: HTMLElement | null = null;
    private tableId: string;

    constructor(id: string, text: string, className: string, tableId?: string) {
        super(id, text, className);
        this.tableId = tableId || `table-${id}`;
    }

    /**
     * ヘッダースペースを設定
     * @param headerSpace ヘッダースペース要素
     */
    setHeaderSpace(headerSpace: HTMLElement): void {
        this.headerSpace = headerSpace;
    }

    /**
     * ボタンを作成し、クリックイベントを設定
     * @returns 作成されたボタン要素
     */
    createButton(): HTMLButtonElement {
        const button = super.createButton();
        button.addEventListener("click", () => {
            this.handleClick();
        });
        return button;
    }

    /**
     * クリックイベントの処理
     * テーブルが存在する場合は削除、存在しない場合は作成
     */
    private handleClick(): void {
        if (!this.headerSpace) {
            console.error("ヘッダースペースが設定されていません");
            return;
        }

        const existingTable = document.getElementById(this.tableId);
        if (existingTable) {
            // テーブルが存在する場合は削除
            this.removeTable();
            this.updateButtonText("テーブル作成");
        } else {
            // テーブルが存在しない場合は作成
            this.addTable();
            this.updateButtonText("テーブル削除");
        }
    }

    /**
     * テーブルを作成
     * @returns 作成されたテーブル要素
     */
    createTable(): HTMLTableElement {
        const table = document.createElement("table");
        table.id = this.tableId;
        table.className = this.className;
        return table;
    }

    /**
     * ヘッダースペースにテーブルを追加
     */
    addTable(): void {
        if (!this.headerSpace) {
            console.error("ヘッダースペースが設定されていません");
            return;
        }

        // 既にテーブルが存在する場合は何もしない
        if (document.getElementById(this.tableId)) {
            return;
        }

        const table = this.createTable();
        this.headerSpace.appendChild(table);
        console.log(`テーブル「${this.tableId}」を作成しました`);
    }

    /**
     * ヘッダースペースからテーブルを削除
     */
    removeTable(): void {
        if (!this.headerSpace) {
            console.error("ヘッダースペースが設定されていません");
            return;
        }

        const existingTable = document.getElementById(this.tableId);
        if (existingTable && this.headerSpace.contains(existingTable)) {
            this.headerSpace.removeChild(existingTable);
            console.log(`テーブル「${this.tableId}」を削除しました`);
        }
    }

    /**
     * ボタンのテキストを更新
     * @param newText 新しいテキスト
     */
    private updateButtonText(newText: string): void {
        const button = document.getElementById(this.id) as HTMLButtonElement;
        if (button) {
            button.innerText = newText;
        }
    }
}

export default TableCreateButton;
