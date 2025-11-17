/// <reference path="../../../../kintone.d.ts" />

import { PLExcelImporter } from "../importers/index";
import { KintoneApiService } from "../services/KintoneApiService";
import { DomUtil } from "../utils";
import { PLDashboardDomBuilder } from "./PLDashboardDomBuilder";
/**
 * ヘッダーコンテナを作成するクラス
 */
export class HeaderContainer {
    /**
     * フィルターコンテナを作成する
     * @returns フィルターコンテナ
     */
    private static createFilterContainer(): HTMLDivElement {
        const container = document.createElement("div");
        container.className = "header-filter-container";

        // 年フィルター
        container.appendChild(DomUtil.createLabel("年: ", "year-select"));
        container.appendChild(PLDashboardDomBuilder.createYearSelect(10));

        // 月フィルター
        container.appendChild(DomUtil.createLabel("月: ", "month-select", "20px"));
        container.appendChild(PLDashboardDomBuilder.createMonthSelect());

        return container;
    }

    /**
     * 設定リンクを作成する
     * @returns 設定リンク
     */
    private static createSettingsLink(): HTMLAnchorElement {
        const thisAppId = kintone.app.getId();
        const settingsHref = `https://d5wpzdj4iuwp.cybozu.com/k/admin/app/flow?app=${thisAppId}#section=form`;
        const settingsLink = document.createElement("a");
        settingsLink.textContent = "⚙️ 設定";
        settingsLink.href = settingsHref;
        settingsLink.target = "_blank";
        settingsLink.className = "header-settings-link";
        return settingsLink;
    }

    /**
     * 過去データ読み込みボタンを作成する
     * @returns 過去データ読み込みボタン
     */
    private static createLoadPastDataButton(): HTMLButtonElement {
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
            overlay.innerHTML = `
                <div class="upload-progress-box">
                    <div id="upload-progress-title">アップロード中...</div>
                    <div class="upload-progress-bar-container">
                        <div id="upload-progress-bar" class="upload-progress-bar"></div>
                    </div>
                    <div id="upload-progress-text" class="upload-progress-text">0 / 0</div>
                </div>
            `;
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
                        HeaderContainer.showDataUploadingOverlay(document.body);
                        // ファイルを読み込み、データをキントーンに保存
                        const importer = new PLExcelImporter(file);
                        await importer.load();
                        const validate = importer.validateFormat();
                        if (!validate.ok) {
                            alert("選択されたファイルの形式が正しくありません。");
                            throw new Error("Invalid file format");
                        }
                        const monthData = importer.getMonthlyData();
                        const productData = importer.getProductionData();
                        const expenseData = importer.getExpenseCalculationData();

                        // progress event handlers
                        const onStart = (e: any) => {
                            const total = e?.detail?.totalTasks || 0;
                            showOverlay(total);
                        };
                        const onProgress = (e: any) => {
                            const completed = e?.detail?.completed || 0;
                            const total = e?.detail?.total || 0;
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

                        await Promise.all([
                            KintoneApiService.savePLMonthlyData(monthData),
                            KintoneApiService.savePLDailyData(expenseData),
                            KintoneApiService.saveProductionReportData(productData),
                        ]);

                        // イベントリスナーを削除
                        window.removeEventListener("uploadStart", onStart as EventListener);
                        window.removeEventListener("uploadProgress", onProgress as EventListener);
                        window.removeEventListener("uploadComplete", onComplete as EventListener);
                        window.removeEventListener("uploadError", onError as EventListener);

                        // オーバーレイ非表示
                        HeaderContainer.hideDataUploadingOverlay();

                        // 成功メッセージ（中央表示）
                        HeaderContainer.hideDataUploadingOverlay();
                        const resultMsg = `${monthData.year.value}年${monthData.month.value}月のデータ登録が完了しました。`;
                        HeaderContainer.showCenteredAlert(resultMsg);
                    } catch (error) {
                        console.error("過去データの登録が失敗しました。", error);
                        // オーバーレイ非表示
                        HeaderContainer.hideDataUploadingOverlay();
                        // エラーメッセージ（中央表示）
                        HeaderContainer.showCenteredAlert("過去データの登録が失敗しました。");
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

        return button;
    }

    /**
     * ヘッダーコンテナを作成する（フィルターと設定リンクを横並びに配置）
     * @returns ヘッダーコンテナ
     */
    static create(): HTMLDivElement {
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

        return headerContainer;
    }

    /**
     * データ登録中オーバーレイ表示
     * @param parent - オーバーレイを追加する親要素
     */
    static showDataUploadingOverlay(parent: HTMLElement): void {
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
        } catch (e) {
            console.error("データ登録中オーバーレイの作成に失敗しました。", e);
        }
    }
    /**
     * データ登録中オーバーレイ非表示
     */
    static hideDataUploadingOverlay(): void {
        const overlay = document.getElementById("File-loading-overlay");
        if (overlay && overlay.parentElement) {
            overlay.parentElement.removeChild(overlay);
        }
    }

    /**
     * 中央表示のモーダルアラートを作成して表示するヘルパー
     * @param message - 表示するメッセージ
     * @param autoCloseMs - 自動で閉じるまでの時間（ミリ秒）。省略または0以下の場合は自動で閉じない
     */
    static showCenteredAlert = (message: string, autoCloseMs?: number) => {
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

        if (autoCloseMs && autoCloseMs > 0) {
            setTimeout(() => overlay.remove(), autoCloseMs);
        }
    };
}
