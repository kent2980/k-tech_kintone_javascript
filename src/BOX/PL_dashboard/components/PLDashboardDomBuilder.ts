import { TabContainerResult } from "../types";
import { DomUtil } from "../utils";
import { FilterContainer } from "./FilterContainer";

/**
 * PLダッシュボード用のDOM構築ユーティリティクラス
 */
export class PLDashboardDomBuilder {
    /**
     * オプション要素をセレクトボックスに追加する
     * @param selectElement - セレクトボックス要素
     * @param value - オプションの値
     * @param text - オプションの表示テキスト
     */
    static addOption(selectElement: HTMLSelectElement, value: string | number, text: string): void {
        DomUtil.addOption(selectElement, value, text);
    }

    /**
     * 年選択セレクトボックスを作成する
     * @param yearCount - 過去何年分を表示するか
     * @returns 年選択セレクトボックス
     */
    static createYearSelect(yearCount: number = 10): HTMLSelectElement {
        return FilterContainer.createYearSelect(yearCount);
    }

    /**
     * 月選択セレクトボックスを作成する
     * @returns 月選択セレクトボックス
     */
    static createMonthSelect(): HTMLSelectElement {
        return FilterContainer.createMonthSelect();
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
        return DomUtil.createLabel(text, forId, marginLeft);
    }

    /**
     * フィルターコンテナを作成する
     * @returns フィルターコンテナ
     */
    static createFilterContainer(): HTMLDivElement {
        const container = document.createElement("div");
        container.style.margin = "10px 0";

        // 年フィルター
        container.appendChild(this.createLabel("年: ", "year-select"));
        container.appendChild(this.createYearSelect(10));

        // 月フィルター
        container.appendChild(this.createLabel("月: ", "month-select", "20px"));
        container.appendChild(this.createMonthSelect());

        return container;
    }

    /**
     * 表示スペース切替ボタンを作成する
     * @returns 切替ボタン
     */
    static createToggleViewButton(): HTMLButtonElement {
        const button = document.createElement("button");
        button.id = "toggle-view-button";
        button.innerText = "表示スペース切替";
        button.className = "kintoneplugin-button-dialog-cancel";
        button.style.marginLeft = "20px";
        button.style.padding = "6px 12px";
        button.style.cursor = "pointer";
        return button;
    }

    /**
     * タブコンテナを作成する関数
     * @returns タブコンテナ、ボタンコンテナ、コンテンツコンテナ
     */
    static createTabContainer(): TabContainerResult {
        // メインコンテナ
        const tabContainer = document.createElement("div");
        tabContainer.id = "tab-container";
        tabContainer.style.marginTop = "20px";

        // タブボタンエリア
        const tabButtonsContainer = document.createElement("div");
        tabButtonsContainer.id = "tab-buttons";
        tabButtonsContainer.style.display = "flex";
        tabButtonsContainer.style.borderBottom = "2px solid #3498db";
        tabButtonsContainer.style.marginBottom = "10px";

        // タブコンテンツエリア
        const tabContentsContainer = document.createElement("div");
        tabContentsContainer.id = "tab-contents";

        tabContainer.appendChild(tabButtonsContainer);
        tabContainer.appendChild(tabContentsContainer);

        return { tabContainer, tabButtonsContainer, tabContentsContainer };
    }

    /**
     * タブボタンを作成する関数
     * @param tabId - タブのID
     * @param tabLabel - タブのラベル
     * @param isActive - アクティブかどうか
     * @returns タブボタン
     */
    static createTabButton(
        tabId: string,
        tabLabel: string,
        isActive: boolean = false
    ): HTMLButtonElement {
        const button = document.createElement("button");
        button.id = `${tabId}-button`;
        button.textContent = tabLabel;
        button.className = "tab-button";
        button.style.border = "none";
        button.style.backgroundColor = isActive ? "#3498db" : "#ecf0f1";
        button.style.color = isActive ? "#fff" : "#2c3e50";
        button.style.cursor = "pointer";
        button.style.borderRadius = "4px 4px 0 0";
        button.style.marginRight = "2px";
        button.style.transition = "all 0.3s";

        // ホバーエフェクト
        button.addEventListener("mouseenter", function () {
            if (!isActive) {
                this.style.backgroundColor = "#bdc3c7";
            }
        });

        button.addEventListener("mouseleave", function () {
            if (!isActive) {
                this.style.backgroundColor = "#ecf0f1";
            }
        });

        return button;
    }

    /**
     * タブコンテンツを作成する関数
     * @param contentId - コンテンツのID
     * @param content - 追加するコンテンツ（HTMLElementまたはstring）
     * @param isActive - アクティブかどうか
     * @returns タブコンテンツ要素
     */
    static createTabContent(
        contentId: string,
        content: HTMLElement | string,
        isActive: boolean = false
    ): HTMLDivElement {
        const contentDiv = document.createElement("div");
        contentDiv.id = `${contentId}-content`;
        contentDiv.className = "tab-content";
        contentDiv.style.display = isActive ? "block" : "none";

        if (typeof content === "string") {
            contentDiv.innerHTML = content;
        } else {
            contentDiv.appendChild(content);
        }

        return contentDiv;
    }

    /**
     * データが存在しない場合のメッセージを作成
     * @param message - 表示するメッセージ
     * @returns メッセージ要素
     */
    static createNoDataMessage(message: string): HTMLDivElement {
        const noDataMessage = document.createElement("div");
        noDataMessage.textContent = message;
        noDataMessage.style.marginTop = "20px";
        noDataMessage.style.padding = "20px";
        noDataMessage.style.backgroundColor = "#f8f9fa";
        noDataMessage.style.border = "1px solid #e9ecef";
        noDataMessage.style.borderRadius = "4px";
        noDataMessage.style.textAlign = "center";
        noDataMessage.style.color = "#6c757d";
        return noDataMessage;
    }

    /**
     * スクロール可能なコンテナを作成
     * @param id - コンテナのID
     * @param maxHeight - 最大高さ（デフォルト: "600px"）
     * @returns スクロール可能なコンテナ
     */
    static createScrollableContainer(id: string, maxHeight: string = "600px"): HTMLDivElement {
        const container = document.createElement("div");
        container.id = id;
        container.style.marginTop = "20px";
        container.style.maxHeight = maxHeight;
        container.style.overflowY = "auto";
        container.style.position = "relative";
        return container;
    }
}
