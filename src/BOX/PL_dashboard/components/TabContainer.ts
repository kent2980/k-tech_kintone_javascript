import { TabContainerResult } from "../types";

/**
 * タブコンテナコンポーネント
 */
export class TabContainer {
    private tabContainer!: HTMLDivElement;
    private tabButtonsContainer!: HTMLDivElement;
    private tabContentsContainer!: HTMLDivElement;
    private activeTabId: string | null = null;

    constructor() {
        this.createContainers();
    }

    /**
     * タブコンテナを作成する
     */
    private createContainers(): void {
        // メインコンテナ
        this.tabContainer = document.createElement("div");
        this.tabContainer.id = "tab-container";
        this.tabContainer.style.marginTop = "20px";

        // タブボタンエリア
        this.tabButtonsContainer = document.createElement("div");
        this.tabButtonsContainer.id = "tab-buttons";
        this.tabButtonsContainer.style.display = "flex";
        this.tabButtonsContainer.style.borderBottom = "2px solid #3498db";
        this.tabButtonsContainer.style.marginBottom = "10px";

        // タブコンテンツエリア
        this.tabContentsContainer = document.createElement("div");
        this.tabContentsContainer.id = "tab-contents";

        this.tabContainer.appendChild(this.tabButtonsContainer);
        this.tabContainer.appendChild(this.tabContentsContainer);
    }

    /**
     * タブボタンを作成して追加する
     *      * tabId: タブのID
     *      * tabLabel: タブのラベル
     *      * isActive: アクティブかどうか
     * *  作成されたタブボタン
     */
    addTab(
        tabId: string,
        tabLabel: string,
        content: HTMLElement,
        isActive: boolean = false
    ): HTMLButtonElement {
        // タブボタンを作成
        const button = this.createTabButton(tabId, tabLabel, isActive);

        // タブコンテンツを作成
        const contentDiv = this.createTabContent(tabId, content, isActive);

        // イベントリスナーを追加
        button.addEventListener("click", () => {
            this.switchTab(tabId);
        });

        // コンテナに追加
        this.tabButtonsContainer.appendChild(button);
        this.tabContentsContainer.appendChild(contentDiv);

        if (isActive) {
            this.activeTabId = tabId;
        }

        return button;
    }

    /**
     * タブボタンを作成する
     *      * tabId: タブのID
     *      * tabLabel: タブのラベル
     *      * isActive: アクティブかどうか
     * *  タブボタン
     */
    private createTabButton(
        tabId: string,
        tabLabel: string,
        isActive: boolean = false
    ): HTMLButtonElement {
        const button = document.createElement("button");
        button.className = "tab-button";
        button.dataset.tabId = tabId;
        button.textContent = tabLabel;

        // スタイル設定
        Object.assign(button.style, {
            border: "none",
            backgroundColor: isActive ? "#3498db" : "#ecf0f1",
            color: isActive ? "#fff" : "#333",
            cursor: "pointer",
            marginRight: "2px",
            fontWeight: isActive ? "bold" : "normal",
            transition: "all 0.3s",
        });

        // ホバー効果
        this.addHoverEffects(button);

        if (isActive) {
            button.classList.add("active");
        }

        return button;
    }

    /**
     * タブボタンにホバー効果を追加する
     *      * button: タブボタン
     */
    private addHoverEffects(button: HTMLButtonElement): void {
        button.addEventListener("mouseenter", function () {
            if (!this.classList.contains("active")) {
                this.style.backgroundColor = "#bdc3c7";
            }
        });

        button.addEventListener("mouseleave", function () {
            if (!this.classList.contains("active")) {
                this.style.backgroundColor = "#ecf0f1";
            }
        });
    }

    /**
     * タブコンテンツを作成する
     *      * tabId: タブのID
     *      * content: コンテンツ要素
     *      * isActive: アクティブかどうか
     * *  タブコンテンツ
     */
    private createTabContent(
        tabId: string,
        content: HTMLElement,
        isActive: boolean = false
    ): HTMLDivElement {
        const contentDiv = document.createElement("div");
        contentDiv.className = "tab-content";
        contentDiv.dataset.tabId = tabId;
        contentDiv.style.display = isActive ? "block" : "none";
        contentDiv.appendChild(content);
        return contentDiv;
    }

    /**
     * タブを切り替える
     *      * targetTabId: 切り替え先のタブID
     */
    switchTab(targetTabId: string): void {
        // すべてのタブボタンを非アクティブ化
        const allTabButtons = this.tabButtonsContainer.querySelectorAll(".tab-button");
        allTabButtons.forEach((button) => {
            const htmlButton = button as HTMLButtonElement;
            button.classList.remove("active");
            htmlButton.style.backgroundColor = "#ecf0f1";
            htmlButton.style.color = "#333";
            htmlButton.style.fontWeight = "normal";
        });

        // すべてのタブコンテンツを非表示
        const allTabContents = this.tabContentsContainer.querySelectorAll(".tab-content");
        allTabContents.forEach((content) => {
            const htmlContent = content as HTMLElement;
            htmlContent.style.display = "none";
        });

        // 指定されたタブをアクティブ化
        const targetButton = this.tabButtonsContainer.querySelector(
            `.tab-button[data-tab-id="${targetTabId}"]`
        ) as HTMLElement | null;
        if (targetButton) {
            targetButton.classList.add("active");
            targetButton.style.backgroundColor = "#3498db";
            targetButton.style.color = "#fff";
            targetButton.style.fontWeight = "bold";
        }

        // 指定されたコンテンツを表示
        const targetContent = this.tabContentsContainer.querySelector(
            `.tab-content[data-tab-id="${targetTabId}"]`
        ) as HTMLElement | null;
        if (targetContent) {
            targetContent.style.display = "block";
        }

        this.activeTabId = targetTabId;
    }

    /**
     * 現在アクティブなタブIDを取得する
     * *  アクティブなタブID
     */
    getActiveTabId(): string | null {
        return this.activeTabId;
    }

    /**
     * タブコンテナ要素を取得する
     * *  タブコンテナ要素
     */
    getElement(): HTMLDivElement {
        return this.tabContainer;
    }

    /**
     * タブコンテナの結果を取得する（レガシー対応）
     * *  タブコンテナの結果
     */
    getContainers(): TabContainerResult {
        return {
            tabContainer: this.tabContainer,
            tabButtonsContainer: this.tabButtonsContainer,
            tabContentsContainer: this.tabContentsContainer,
        };
    }

    /**
     * タブを削除する
     *      * tabId: 削除するタブのID
     */
    removeTab(tabId: string): void {
        const button = this.tabButtonsContainer.querySelector(
            `.tab-button[data-tab-id="${tabId}"]`
        );
        const content = this.tabContentsContainer.querySelector(
            `.tab-content[data-tab-id="${tabId}"]`
        );

        if (button) {
            this.tabButtonsContainer.removeChild(button);
        }
        if (content) {
            this.tabContentsContainer.removeChild(content);
        }

        if (this.activeTabId === tabId) {
            this.activeTabId = null;
        }
    }

    /**
     * すべてのタブをクリアする
     */
    clearTabs(): void {
        this.tabButtonsContainer.innerHTML = "";
        this.tabContentsContainer.innerHTML = "";
        this.activeTabId = null;
    }
}
