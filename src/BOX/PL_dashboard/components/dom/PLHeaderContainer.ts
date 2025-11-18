/// <reference path="../../../../../kintone.d.ts" />

import { PLExcelImporter } from "../../importers/index";
import { KintoneApiService } from "../../services/KintoneApiService";
import {
    UploadStartEvent,
    UploadProgressEvent,
    UploadCompleteEvent,
    UploadErrorEvent,
} from "../../types";
import { DomUtil, ErrorHandler, XssProtection } from "../../utils";
import { BaseDomBuilder, BaseDomElementInfo } from "./BaseDomBuilder";
import { PLDomBuilder } from "./PLDomBuilder";

/**
 * ヘッダー要素情報を管理するインターフェース（Header固有の拡張）
 */
interface PLHeaderElementInfo extends BaseDomElementInfo {
    /** 要素の種類 */
    type: "container" | "filter" | "link" | "button" | "overlay" | "alert";
}

/**
 * ヘッダーコンテナを作成・管理するクラス
 * BaseDomBuilderを継承し、ヘッダー要素の状態を管理する
 */
export class PLHeaderContainer extends BaseDomBuilder {
    /** ヘッダーコンテナ要素 */
    private headerContainer: HTMLDivElement | null = null;

    /** フィルターコンテナ要素 */
    private filterContainer: HTMLDivElement | null = null;

    /** 設定リンク要素 */
    private settingsLink: HTMLAnchorElement | null = null;

    /** 過去データ読み込みボタン要素 */
    private loadPastDataButton: HTMLButtonElement | null = null;

    /** PLDomBuilderのインスタンス */
    private domBuilder: PLDomBuilder;

    /**
     * コンストラクタ
     * @param domBuilder - PLDomBuilderのインスタンス（オプション、渡されない場合は内部で作成）
     */
    constructor(domBuilder?: PLDomBuilder) {
        super();
        this.domBuilder = domBuilder || new PLDomBuilder();
    }

    /**
     * ヘッダー要素情報を登録（Header固有の拡張）
     * @param id - 要素ID
     * @param element - DOM要素
     * @param type - 要素の種類
     */
    protected registerElementWithType(
        id: string,
        element: HTMLElement,
        type: PLHeaderElementInfo["type"]
    ): void {
        this.registerElement(id, element);
        const elementInfo = this.getElementInfo(id);
        if (elementInfo) {
            (elementInfo as PLHeaderElementInfo).type = type;
        }
    }
    /**
     * フィルターコンテナを作成する
     * @returns フィルターコンテナ
     */
    private createFilterContainer(): HTMLDivElement {
        const container = document.createElement("div");
        container.className = "header-filter-container";

        // 年フィルター
        container.appendChild(DomUtil.createLabel("年: ", "year-select"));
        container.appendChild(this.domBuilder.createYearSelect(10));

        // 月フィルター
        container.appendChild(DomUtil.createLabel("月: ", "month-select", "20px"));
        container.appendChild(this.domBuilder.createMonthSelect());

        // 要素を登録
        this.registerElementWithType("filter-container", container, "filter");

        this.filterContainer = container;
        return container;
    }

    /**
     * 設定リンクを作成する
     * @returns 設定リンク
     */
    private createSettingsLink(): HTMLAnchorElement {
        const thisAppId = kintone.app.getId();
        const settingsHref = `https://d5wpzdj4iuwp.cybozu.com/k/admin/app/flow?app=${thisAppId}#section=form`;
        const settingsLink = document.createElement("a");
        settingsLink.textContent = "⚙️ 設定";
        settingsLink.href = settingsHref;
        settingsLink.target = "_blank";
        settingsLink.className = "header-settings-link";

        // 要素を登録
        this.registerElementWithType("settings-link", settingsLink, "link");

        this.settingsLink = settingsLink;
        return settingsLink;
    }

    /**
     * 過去データ読み込みボタンを作成する
     * @returns 過去データ読み込みボタン
     */
    private createLoadPastDataButton(): HTMLButtonElement {
        // キントーンAPIサービスのインスタンスを作成

        const button = document.createElement("button");
        button.textContent = "過去データ読み込み";
        button.id = "load-past-data-button";
        button.className = "header-load-past-data-button";

        // クリックイベントリスナーを追加（可読性と効率を改善）
        const LOAD_EVENT = "loadPastData";
        const FILE_EVENT = "excelFileSelected";

        // progress overlay helpers
        const ensureOverlay = () => {
            const el = document.getElementById("upload-progress-overlay");
            if (el) return el as HTMLDivElement;
            const overlay = document.createElement("div");
            overlay.id = "upload-progress-overlay";
            // XSS対策: 固定のHTML文字列をサニタイズ（念のため）
            XssProtection.setInnerHtml(
                overlay,
                `
                <div class="upload-progress-box">
                    <div id="upload-progress-title">アップロード中...</div>
                    <div class="upload-progress-bar-container">
                        <div id="upload-progress-bar" class="upload-progress-bar"></div>
                    </div>
                    <div id="upload-progress-text" class="upload-progress-text">0 / 0</div>
                </div>
            `
            );
            document.body.appendChild(overlay);
            return overlay;
        };

        const showOverlay = (total: number) => {
            const o = ensureOverlay();
            o.style.display = "flex";
            const bar = document.getElementById("upload-progress-bar") as HTMLDivElement;
            const text = document.getElementById("upload-progress-text");
            if (bar) bar.style.width = "0%";
            if (text) text.textContent = `0 / ${total}`;
        };

        const updateOverlay = (completed: number, total: number) => {
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const bar = document.getElementById("upload-progress-bar") as HTMLDivElement;
            const text = document.getElementById("upload-progress-text");
            if (bar) bar.style.width = `${pct}%`;
            if (text) text.textContent = `${completed} / ${total}`;
        };

        const hideOverlay = () => {
            const o = document.getElementById("upload-progress-overlay");
            if (o) o.style.display = "none";
        };

        button.addEventListener("click", async () => {
            if (button.disabled) return; // 二重クリック防止
            button.disabled = true;
            button.classList.add("loading");

            // 読み込み開始イベントを通知
            window.dispatchEvent(new CustomEvent(LOAD_EVENT));

            // 一時的なファイル入力要素を作成し、1回だけ処理する
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".xlsx,.xls,.xlsm";

            const cleanup = () => {
                input.remove();
            };

            input.addEventListener(
                "change",
                async () => {
                    const file = input.files?.[0];
                    if (!file) {
                        button.disabled = false;
                        button.classList.remove("loading");
                        cleanup();
                        return;
                    }

                    // ファイル選択イベントを通知
                    window.dispatchEvent(new CustomEvent(FILE_EVENT, { detail: { file } }));

                    try {
                        // データ登録中オーバーレイ表示
                        // 注意: このメソッドは静的メソッドのまま（後方互換性のため）
                        PLHeaderContainer.showDataUploadingOverlay(document.body);

                        // ファイルを読み込み、データをキントーンに保存
                        const importer = new PLExcelImporter(file);

                        // ファイル検証を実行（サイズ、拡張子、MIMEタイプ、マジックナンバー）
                        try {
                            await importer.load(true, 10); // 10MB制限
                        } catch (validationError) {
                            const errorMessage =
                                validationError instanceof Error
                                    ? validationError.message
                                    : "ファイルの検証に失敗しました";
                            ErrorHandler.logError("ファイル検証エラー", validationError, {
                                method: "savePastData",
                                fileName: file.name,
                                fileSize: file.size,
                            });
                            const userFriendlyMessage = ErrorHandler.getUserFriendlyMessage(
                                validationError,
                                { method: "savePastData" },
                                "選択されたファイルが正しい形式ではありません。Excelファイル（.xlsx または .xls）を選択してください。"
                            );
                            PLHeaderContainer.showCenteredAlert(userFriendlyMessage);
                            throw validationError;
                        }

                        // ファイル形式の検証（シート構造の検証）
                        const validate = importer.validateFormat();
                        if (!validate.ok) {
                            const errorMessage = validate.messages.join("\n");
                            ErrorHandler.logError("ファイル形式検証エラー", new Error(errorMessage), {
                                method: "savePastData",
                                fileName: file.name,
                            });
                            const userFriendlyMessage = ErrorHandler.getUserFriendlyMessage(
                                new Error(errorMessage),
                                { method: "savePastData" },
                                "選択されたファイルの形式が正しくありません。必要なシートや列が不足しています。"
                            );
                            PLHeaderContainer.showCenteredAlert(userFriendlyMessage);
                            throw new Error("Invalid file format");
                        }
                        const monthData = importer.getMonthlyData();
                        const productData = importer.getProductionData();
                        const expenseData = importer.getExpenseCalculationData();

                        // progress event handlers
                        const onStart = (e: UploadStartEvent) => {
                            const total = e.detail?.totalTasks || 0;
                            showOverlay(total);
                        };
                        const onProgress = (e: UploadProgressEvent) => {
                            const completed = e.detail?.completed || 0;
                            const total = e.detail?.total || 0;
                            updateOverlay(completed, total);
                        };
                        const onComplete = () => {
                            updateOverlay(1, 1); // ensure full
                            hideOverlay();
                        };
                        const onError = () => {
                            hideOverlay();
                        };

                        window.addEventListener("uploadStart", onStart as EventListener);
                        window.addEventListener("uploadProgress", onProgress as EventListener);
                        window.addEventListener("uploadComplete", onComplete as EventListener);
                        window.addEventListener("uploadError", onError as EventListener);

                        const apiService = new KintoneApiService();
                        await Promise.all([
                            apiService.savePLMonthlyData(monthData),
                            apiService.savePLDailyData(expenseData),
                            apiService.saveProductionReportData(productData),
                        ]);

                        // イベントリスナーを削除
                        window.removeEventListener("uploadStart", onStart as EventListener);
                        window.removeEventListener("uploadProgress", onProgress as EventListener);
                        window.removeEventListener("uploadComplete", onComplete as EventListener);
                        window.removeEventListener("uploadError", onError as EventListener);

                        // オーバーレイ非表示
                        PLHeaderContainer.hideDataUploadingOverlay();

                        // 成功メッセージ（中央表示）
                        PLHeaderContainer.hideDataUploadingOverlay();
                        const resultMsg = `${monthData.year.value}年${monthData.month.value}月のデータ登録が完了しました。`;
                        PLHeaderContainer.showCenteredAlert(resultMsg);
                    } catch (error) {
                        ErrorHandler.logError("過去データの登録が失敗しました", error, {
                            method: "savePastData",
                        });
                        // オーバーレイ非表示
                        PLHeaderContainer.hideDataUploadingOverlay();
                        // エラーメッセージ（中央表示）
                        const userFriendlyMessage = ErrorHandler.getUserFriendlyMessage(
                            error,
                            { method: "savePastData" },
                            "過去データの登録が失敗しました。しばらく待ってから再度お試しください。"
                        );
                        PLHeaderContainer.showCenteredAlert(userFriendlyMessage);
                    } finally {
                        // ボタンの状態をリセット
                        button.disabled = false;
                        // ローディングクラスを削除
                        button.classList.remove("loading");
                        // 一時的なファイル入力要素を削除
                        cleanup();
                    }
                },
                { once: true }
            );

            // ファイル選択ダイアログを開く
            input.click();
        });

        // 要素を登録
        this.registerElementWithType(button.id, button, "button");

        this.loadPastDataButton = button;
        return button;
    }

    /**
     * ヘッダーコンテナを作成する（フィルターと設定リンクを横並びに配置）
     * @returns ヘッダーコンテナ
     */
    public create(): HTMLDivElement {
        if (this.headerContainer) {
            return this.headerContainer;
        }

        const headerContainer = document.createElement("div");
        headerContainer.className = "header-container";

        // フィルターコンテナを作成
        const filterContainer = this.createFilterContainer();
        headerContainer.appendChild(filterContainer);

        // 設定スペースを作成
        const spacer = document.createElement("div");
        spacer.id = "header-spacer";
        headerContainer.appendChild(spacer);

        // 設定リンクを作成
        const settingsLink = this.createSettingsLink();
        spacer.appendChild(settingsLink);

        // 過去データ読み込みボタンを作成
        const loadPastDataButton = this.createLoadPastDataButton();
        spacer.appendChild(loadPastDataButton);

        // 要素を登録
        this.registerElementWithType("header-container", headerContainer, "container");

        this.headerContainer = headerContainer;
        return headerContainer;
    }

    /**
     * ヘッダーコンテナ要素を取得
     * @returns ヘッダーコンテナ要素、作成されていない場合はnull
     */
    public getElement(): HTMLDivElement | null {
        return this.headerContainer;
    }

    /**
     * フィルターコンテナ要素を取得
     * @returns フィルターコンテナ要素、作成されていない場合はnull
     */
    public getFilterContainer(): HTMLDivElement | null {
        return this.filterContainer;
    }

    /**
     * 設定リンク要素を取得
     * @returns 設定リンク要素、作成されていない場合はnull
     */
    public getSettingsLink(): HTMLAnchorElement | null {
        return this.settingsLink;
    }

    /**
     * 過去データ読み込みボタン要素を取得
     * @returns 過去データ読み込みボタン要素、作成されていない場合はnull
     */
    public getLoadPastDataButton(): HTMLButtonElement | null {
        return this.loadPastDataButton;
    }

    /**
     * データ登録中オーバーレイ表示
     * @param parent - オーバーレイを追加する親要素
     */
    public showDataUploadingOverlay(parent: HTMLElement): void {
        try {
            if (!parent) return;
            // 親要素を相対配置にしてオーバーレイを絶対配置で被せる
            const prevPosition = parent.style.position;
            if (!prevPosition || prevPosition === "") {
                parent.style.position = "relative";
            }

            if (document.getElementById("File-loading-overlay")) return;
            const overlay = document.createElement("div");
            overlay.id = "File-loading-overlay";
            overlay.className = "File-loading-overlay";
            overlay.style.position = "absolute";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.display = "flex";
            overlay.style.alignItems = "center";
            overlay.style.justifyContent = "center";
            overlay.style.background = "rgba(255,255,255,0.85)";
            overlay.style.zIndex = "9999";
            const box = document.createElement("div");
            box.style.display = "flex";
            box.style.flexDirection = "column";
            box.style.alignItems = "center";
            box.style.gap = "10px";

            const spinner = document.createElement("div");
            spinner.style.width = "36px";
            spinner.style.height = "36px";
            spinner.style.border = "4px solid #ddd";
            spinner.style.borderTop = "4px solid #1e90ff";
            spinner.style.borderRadius = "50%";
            spinner.style.animation = "pl-spin 1s linear infinite";

            const label = document.createElement("div");
            label.textContent = "データ登録中...";
            label.style.color = "#333";
            label.style.fontSize = "14px";

            box.appendChild(spinner);
            box.appendChild(label);
            overlay.appendChild(box);

            parent.appendChild(overlay);

            // 要素を登録
            this.registerElementWithType(overlay.id, overlay, "overlay");
        } catch (e) {
            console.error("データ登録中オーバーレイの作成に失敗しました。", e);
        }
    }

    /**
     * データ登録中オーバーレイ非表示
     */
    public hideDataUploadingOverlay(): void {
        const overlay = document.getElementById("File-loading-overlay");
        if (overlay && overlay.parentElement) {
            overlay.parentElement.removeChild(overlay);
            // 要素を削除
            this.removeElement(overlay.id);
        }
    }

    /**
     * 中央表示のモーダルアラートを作成して表示するヘルパー
     * @param message - 表示するメッセージ
     * @param autoCloseMs - 自動で閉じるまでの時間（ミリ秒）。省略または0以下の場合は自動で閉じない
     */
    public showCenteredAlert(message: string, autoCloseMs?: number): void {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.background = "rgba(0,0,0,0.4)";
        overlay.style.zIndex = "10000";

        const box = document.createElement("div");
        box.style.background = "#fff";
        box.style.padding = "18px 22px";
        box.style.borderRadius = "8px";
        box.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)";
        box.style.maxWidth = "90%";
        box.style.textAlign = "center";
        box.style.color = "#333";

        const msg = document.createElement("div");
        msg.textContent = message;
        msg.style.marginBottom = "12px";

        const btn = document.createElement("button");
        btn.textContent = "OK";
        btn.style.padding = "8px 14px";
        btn.style.border = "none";
        btn.style.borderRadius = "4px";
        btn.style.background = "#1e90ff";
        btn.style.color = "#fff";
        btn.style.cursor = "pointer";

        btn.addEventListener("click", () => {
            overlay.remove();
        });

        // オーバーレイをクリックして閉じる
        overlay.addEventListener("click", (ev) => {
            if (ev.target === overlay) overlay.remove();
        });

        box.appendChild(msg);
        box.appendChild(btn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // 要素を登録
        const alertId = `centered-alert-${Date.now()}`;
        overlay.id = alertId;
        this.registerElementWithType(alertId, overlay, "alert");

        if (autoCloseMs && autoCloseMs > 0) {
            setTimeout(() => {
                overlay.remove();
                this.removeElement(alertId);
            }, autoCloseMs);
        }
    }

    /**
     * 静的メソッドとしての後方互換性のためのメソッド
     * @param domBuilder - PLDomBuilderのインスタンス（オプション）
     * @returns ヘッダーコンテナ
     */
    static create(domBuilder?: PLDomBuilder): HTMLDivElement {
        const instance = new PLHeaderContainer(domBuilder);
        return instance.create();
    }

    /**
     * 静的メソッドとしての後方互換性のためのメソッド
     * @param parent - オーバーレイを追加する親要素
     */
    static showDataUploadingOverlay(parent: HTMLElement): void {
        // グローバルインスタンスを使用（後方互換性のため）
        const instance = new PLHeaderContainer();
        instance.showDataUploadingOverlay(parent);
    }

    /**
     * 静的メソッドとしての後方互換性のためのメソッド
     */
    static hideDataUploadingOverlay(): void {
        // グローバルインスタンスを使用（後方互換性のため）
        const instance = new PLHeaderContainer();
        instance.hideDataUploadingOverlay();
    }

    /**
     * 静的メソッドとしての後方互換性のためのメソッド
     * @param message - 表示するメッセージ
     * @param autoCloseMs - 自動で閉じるまでの時間（ミリ秒）
     */
    static showCenteredAlert(message: string, autoCloseMs?: number): void {
        // グローバルインスタンスを使用（後方互換性のため）
        const instance = new PLHeaderContainer();
        instance.showCenteredAlert(message, autoCloseMs);
    }
}
