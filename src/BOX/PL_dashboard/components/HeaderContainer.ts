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

                        // キントーンへ並列保存（効率向上）
                        await Promise.all([
                            KintoneApiService.savePLMonthlyData(monthData),
                            KintoneApiService.savePLDailyData(expenseData),
                            KintoneApiService.saveProductionReportData(productData),
                        ]);

                        // cleanup listeners
                        window.removeEventListener("uploadStart", onStart as EventListener);
                        window.removeEventListener("uploadProgress", onProgress as EventListener);
                        window.removeEventListener("uploadComplete", onComplete as EventListener);
                        window.removeEventListener("uploadError", onError as EventListener);

                        hideOverlay();
                        // 必要ならここで保存完了後の処理を追加
                    } catch (error) {
                        console.error("過去データの読み込み／保存に失敗しました。", error);
                        hideOverlay();
                    } finally {
                        button.disabled = false;
                        button.classList.remove("loading");
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
}
