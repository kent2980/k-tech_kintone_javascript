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

        // クリックイベントリスナーを追加
        button.addEventListener("click", () => {
            const event = new CustomEvent("loadPastData");
            window.dispatchEvent(event);
            console.log("過去データ読み込みイベントが発火しました。");

            // エクセルファイルを選択して読み込む処理をここに追加
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".xlsx, .xls, .xlsm";
            input.onchange = (e: Event) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files.length > 0) {
                    const file = target.files[0];
                    const loadEvent = new CustomEvent("excelFileSelected", {
                        detail: { file: file },
                    });
                    window.dispatchEvent(loadEvent);
                    console.log("エクセルファイル選択イベントが発火しました。");
                    const importer = new PLExcelImporter(file);
                    importer
                        .load()
                        .then(() => {
                            console.log("エクセルファイルの読み込みが完了しました。");
                            const monthData = importer.getMonthlyData();
                            const productData = importer.getProductionData();
                            const expenceData = importer.getExpenseCalculationData();
                            console.log("月次データ:", monthData);
                            console.log("生産実績データ:", productData);
                            console.log("損益データ:", expenceData);
                            // KintoneApiService.savePLMonthlyData(monthData);
                            // KintoneApiService.savePLDailyData(expenceData);
                            KintoneApiService.saveProductionReportData(productData);
                        })
                        .catch((error) => {
                            console.error("エクセルファイルの読み込みに失敗しました。", error);
                        });
                }
            };
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
