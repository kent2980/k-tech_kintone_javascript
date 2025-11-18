import { TabContainerResult } from "../../types";
import { DateUtil, DomUtil } from "../../utils";
import { BaseDomBuilder, BaseDomElementInfo } from "./BaseDomBuilder";

/**
 * DOM要素情報を管理するインターフェース（PL固有の拡張）
 */
interface PLDomElementInfo extends BaseDomElementInfo {
    /** 要素の種類 */
    type: "select" | "label" | "button" | "container" | "tab" | "message" | "scrollable";
}

/**
 * PLダッシュボード用のDOM構築クラス
 * BaseDomBuilderを継承し、PL管理に特化したDOM構築機能を提供
 */
export class PLDomBuilder extends BaseDomBuilder {
    /**
     * コンストラクタ
     */
    constructor() {
        super();
    }

    /**
     * DOM要素情報を登録（PL固有の拡張）
     * @param id - 要素ID
     * @param element - DOM要素
     * @param type - 要素の種類
     */
    protected registerElementWithType(
        id: string,
        element: HTMLElement,
        type: PLDomElementInfo["type"]
    ): void {
        this.registerElement(id, element);
        const elementInfo = this.getElementInfo(id);
        if (elementInfo) {
            (elementInfo as PLDomElementInfo).type = type;
        }
    }
    /**
     * オプション要素をセレクトボックスに追加する
     * @param selectElement - セレクトボックス要素
     * @param value - オプションの値
     * @param text - オプションの表示テキスト
     */
    public addOption(selectElement: HTMLSelectElement, value: string | number, text: string): void {
        DomUtil.addOption(selectElement, value, text);
    }

    /**
     * 年選択セレクトボックスを作成する
     * @param yearCount - 過去何年分を表示するか
     * @returns 年選択セレクトボックス
     */
    public createYearSelect(yearCount: number = 10): HTMLSelectElement {
        const yearSelect = document.createElement("select");
        yearSelect.id = "year-select";

        // デフォルトオプション
        DomUtil.addOption(yearSelect, "", "-- 選択 --");

        // 過去yearCount年分のオプションを追加
        const currentYear = DateUtil.getCurrentYear();
        for (let i = 0; i < yearCount; i++) {
            const year = currentYear - i;
            DomUtil.addOption(yearSelect, year, year.toString());
        }

        // 現在の年をデフォルト選択
        yearSelect.value = currentYear.toString();

        // 要素を登録
        this.registerElementWithType(yearSelect.id, yearSelect, "select");

        return yearSelect;
    }

    /**
     * 月選択セレクトボックスを作成する
     * @returns 月選択セレクトボックス
     */
    public createMonthSelect(): HTMLSelectElement {
        const monthSelect = document.createElement("select");
        monthSelect.id = "month-select";

        // デフォルトオプション
        DomUtil.addOption(monthSelect, "", "-- 選択 --");

        // 12ヶ月分のオプションを追加
        for (let i = 1; i <= 12; i++) {
            DomUtil.addOption(monthSelect, i.toString(), `${i}月`);
        }

        // 現在の月をデフォルト選択
        const currentMonth = DateUtil.getCurrentMonth();
        monthSelect.value = currentMonth.toString();

        // 要素を登録
        this.registerElementWithType(monthSelect.id, monthSelect, "select");

        return monthSelect;
    }

    /**
     * ラベル要素を作成する
     * @param text - ラベルのテキスト
     * @param forId - for属性の値
     * @param marginLeft - 左マージン（オプション）
     * @returns ラベル要素
     */
    public createLabel(
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
    public createFilterContainer(): HTMLDivElement {
        const container = document.createElement("div");
        container.style.margin = "10px 0";

        // 年フィルター
        container.appendChild(this.createLabel("年: ", "year-select"));
        container.appendChild(this.createYearSelect(10));

        // 月フィルター
        container.appendChild(this.createLabel("月: ", "month-select", "20px"));
        container.appendChild(this.createMonthSelect());

        // 要素を登録
        this.registerElementWithType("filter-container", container, "container");

        return container;
    }

    /**
     * 表示スペース切替ボタンを作成する
     * @returns 切替ボタン
     */
    public createToggleViewButton(): HTMLButtonElement {
        const button = document.createElement("button");
        button.id = "toggle-view-button";
        button.innerText = "表示スペース切替";
        button.className = "kintoneplugin-button-dialog-cancel";
        button.style.marginLeft = "20px";
        button.style.padding = "6px 12px";
        button.style.cursor = "pointer";

        // 要素を登録
        this.registerElementWithType(button.id, button, "button");

        return button;
    }

    /**
     * タブコンテナを作成する関数
     * @returns タブコンテナ、ボタンコンテナ、コンテンツコンテナ
     */
    public createTabContainer(): TabContainerResult {
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

        // 要素を登録
        this.registerElementWithType(tabContainer.id, tabContainer, "tab");

        return { tabContainer, tabButtonsContainer, tabContentsContainer };
    }

    /**
     * タブボタンを作成する関数
     * @param tabId - タブのID
     * @param tabLabel - タブのラベル
     * @param isActive - アクティブかどうか
     * @returns タブボタン
     */
    public createTabButton(
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

        // 要素を登録
        this.registerElementWithType(button.id, button, "button");

        return button;
    }

    /**
     * タブコンテンツを作成する関数
     * @param contentId - コンテンツのID
     * @param content - 追加するコンテンツ（HTMLElementまたはstring）
     * @param isActive - アクティブかどうか
     * @returns タブコンテンツ要素
     */
    public createTabContent(
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

        // 要素を登録
        this.registerElementWithType(contentDiv.id, contentDiv, "tab");

        return contentDiv;
    }

    /**
     * データが存在しない場合のメッセージを作成
     * @param message - 表示するメッセージ
     * @returns メッセージ要素
     */
    public createNoDataMessage(message: string): HTMLDivElement {
        const noDataMessage = document.createElement("div");
        noDataMessage.textContent = message;
        noDataMessage.style.marginTop = "20px";
        noDataMessage.style.padding = "20px";
        noDataMessage.style.backgroundColor = "#f8f9fa";
        noDataMessage.style.border = "1px solid #e9ecef";
        noDataMessage.style.borderRadius = "4px";
        noDataMessage.style.textAlign = "center";
        noDataMessage.style.color = "#6c757d";

        // 要素を登録（IDがない場合は自動生成）
        const messageId = `no-data-message-${Date.now()}`;
        noDataMessage.id = messageId;
        this.registerElementWithType(messageId, noDataMessage, "message");

        return noDataMessage;
    }

    /**
     * スクロール可能なコンテナを作成
     * @param id - コンテナのID
     * @param maxHeight - 最大高さ（デフォルト: "600px"）
     * @returns スクロール可能なコンテナ
     */
    public createScrollableContainer(id: string, maxHeight: string = "600px"): HTMLDivElement {
        const container = document.createElement("div");
        container.id = id;
        container.style.marginTop = "20px";
        container.style.maxHeight = maxHeight;
        container.style.overflowY = "auto";
        container.style.position = "relative";

        // 要素を登録
        this.registerElementWithType(id, container, "scrollable");

        return container;
    }

    /**
     * DOM要素情報を取得（PL固有の型で返す）
     * @param id - 要素ID
     * @returns DOM要素情報、存在しない場合はnull
     */
    public getElementInfo(id: string): PLDomElementInfo | null {
        return super.getElementInfo(id) as PLDomElementInfo | null;
    }
}
