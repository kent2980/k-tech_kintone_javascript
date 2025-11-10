/// <reference path="../../../kintone.d.ts" />
/// <reference path="../../../globals.d.ts" />
/// <reference path="./fields/daily_fields.d.ts" />
/// <reference path="./fields/line_daily_fields.d.ts" />
/// <reference path="./fields/month_fields.d.ts" />
/// <reference path="./fields/model_master_fields.d.ts" />
/// <reference path="./fields/holiday_fields.d.ts" />

// Import styles
import "./styles/components/filter.css";
import "./styles/components/table.css";
import "./styles/components/tabs.css";
import "./styles/desktop.css";

// Import modular components
import { FilterConfig, ProductHistoryData, TabContainerResult, TotalsByDate } from "./types";

import { DateUtil, Logger, PerformanceUtil } from "./utils";

import { KintoneApiService } from "./services";

import { HeaderContainer, PLDashboardGraphBuilder, PLDashboardTableBuilder } from "./components";

(function () {
    "use strict";

    // 型定義は types/index.ts から import済み

    // グローバル変数
    let masterModelData: model_master.SavedFields[] | null = null;
    let dailyReportData: daily.SavedFields[] = [];
    let product_history_data: ProductHistoryData[] = [];
    let plMonthlyData: monthly.SavedFields | null = null;
    let filteredRecords: line_daily.SavedFields[] = []; // line_dailyが見つからないのでdailyを使用
    let holidayData: holiday.SavedFields[] = [];

    // DOM構築関数は PLDashboardDomBuilder クラスに移動しました

    /**
     * 表示スペース切替ボタンを作成する
     * @returns 切替ボタン
     */
    function createToggleViewButton(): HTMLButtonElement {
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
     * Assy工程生産実績表を作成する関数
     * @param plMonthlyData - PL月次データのレコードオブジェクト
     * @returns Assy工程生産実績表コンテナ
     */
    /**
     * PL月次データを取得する関数
     * @param year - 年
     * @param month - 月
     * @returns 取得したレコードデータ
     */
    async function fetchPLMonthlyData(
        year: string,
        month: string
    ): Promise<monthly.SavedFields | null> {
        return await KintoneApiService.fetchPLMonthlyData(year, month);
    }

    /**
     * PL日次データを取得する関数
     * @param year - 年
     * @param month - 月
     * @returns レコードの配列
     */
    async function fetchPLDailyData(year: string, month: string): Promise<daily.SavedFields[]> {
        return await KintoneApiService.fetchPLDailyData(year, month);
    }

    /**生産日報報告書データを取得する関数
     * @param year - 年（nullの場合は全期間）
     * @param month - 月（nullの場合は年のみでフィルタ）
     * @returns レコードの配列
     */
    async function fetchProductionReportData(
        year: string | null = null,
        month: string | null = null
    ): Promise<line_daily.SavedFields[]> {
        const filterConfig: FilterConfig = { year, month };
        return await KintoneApiService.fetchProductionReportData(filterConfig);
    }

    /**
     * マスタ機種一覧データを取得する関数
     * @returns レコードの配列
     */
    async function fetchMasterModelData(): Promise<model_master.SavedFields[]> {
        return await KintoneApiService.fetchMasterModelData();
    }

    /**
     * 祝日データを取得する関数
     * @returns レコードの配列
     */
    async function fetchHolidayData(): Promise<holiday.SavedFields[]> {
        return await KintoneApiService.fetchHolidayData();
    }

    /**
     * フィルター変更時の処理（デバウンス処理付き）
     */
    const debouncedHandleFilterChange = PerformanceUtil.debounce(
        async function handleFilterChange(headerSpace: unknown): Promise<void> {
            const headerElement = headerSpace as HTMLElement;
            const yearSelect = document.getElementById("year-select") as HTMLSelectElement | null;
            const monthSelect = document.getElementById("month-select") as HTMLSelectElement | null;

            const selectedYear = yearSelect?.value || null;
            const selectedMonth = monthSelect?.value || null;

            try {
                PerformanceUtil.startMeasure("filter-change");

                // 既存のキャッシュをクリア（フィルター変更時）
                PerformanceUtil.clearCache("table-data-");

                // 月次データを取得
                if (selectedYear && selectedMonth) {
                    plMonthlyData = await fetchPLMonthlyData(selectedYear, selectedMonth);
                    // 日次データを取得
                    dailyReportData = await fetchPLDailyData(selectedYear, selectedMonth);
                }
                // 年月の条件でデータを再取得
                filteredRecords = await fetchProductionReportData(selectedYear, selectedMonth);

                // 既存のタブコンテナがあれば削除
                const existingTabContainer = document.getElementById("tab-container");
                if (existingTabContainer) {
                    headerElement.removeChild(existingTabContainer);
                }

                // タブコンテナを作成
                const { tabContainer, tabButtonsContainer, tabContentsContainer } =
                    createTabContainer();

                // 非同期でテーブルを作成（UIブロッキングを回避）
                const [
                    tableContainer,
                    profitTableContainer,
                    summaryTableContainer,
                    mixedChartContainer,
                ] = await Promise.all([
                    PerformanceUtil.createElementLazy(() =>
                        PLDashboardTableBuilder.createProductionPerformanceTable(
                            filteredRecords,
                            plMonthlyData,
                            masterModelData || [],
                            product_history_data,
                            DateUtil.getDayOfWeek
                        )
                    ),
                    PerformanceUtil.createElementLazy(() =>
                        PLDashboardTableBuilder.createProfitCalculationTable(
                            dailyReportData,
                            filteredRecords,
                            plMonthlyData,
                            getDateList,
                            getTotalsByDate,
                            getRecordsByDate,
                            DateUtil.getDayOfWeek
                        )
                    ),
                    PerformanceUtil.createElementLazy(() =>
                        PLDashboardTableBuilder.createRevenueAnalysisSummaryTable()
                    ),
                    PerformanceUtil.createElementLazy(() =>
                        PLDashboardGraphBuilder.createMixedChartContainer("mixed-chart")
                    ),
                ]);

                // タブボタンを作成
                const tab1Button = createTabButton("production-tab", "生産履歴（Assy）", true);
                const tab2Button = createTabButton("profit-tab", "損益計算表", false);
                const tab3Button = createTabButton("revenue-tab", "収益分析テーブル", false);
                const tab4Button = createTabButton("mixed-chart-tab", "収益分析サマリ", false);

                // タブボタンのクリックイベント
                tab1Button.addEventListener("click", function () {
                    switchTab("production-tab");
                });
                tab2Button.addEventListener("click", function () {
                    switchTab("profit-tab");
                });
                tab3Button.addEventListener("click", function () {
                    switchTab("revenue-tab");
                });
                tab4Button.addEventListener("click", function () {
                    switchTab("mixed-chart-tab");
                });

                // タブボタンを追加
                tabButtonsContainer.appendChild(tab1Button);
                tabButtonsContainer.appendChild(tab2Button);
                tabButtonsContainer.appendChild(tab3Button);
                tabButtonsContainer.appendChild(tab4Button);

                // タブコンテンツを作成
                const tab1Content = createTabContent("production-tab", tableContainer, true);
                const tab2Content = createTabContent("profit-tab", profitTableContainer, false);
                const tab3Content = createTabContent("revenue-tab", summaryTableContainer, false);
                const tab4Content = createTabContent("mixed-chart-tab", mixedChartContainer, false);

                // タブコンテンツを追加
                tabContentsContainer.appendChild(tab1Content);
                tabContentsContainer.appendChild(tab2Content);
                tabContentsContainer.appendChild(tab3Content);
                tabContentsContainer.appendChild(tab4Content);

                // タブコンテナをheaderSpaceに追加
                headerElement.appendChild(tabContainer);

                const filterTime = PerformanceUtil.endMeasure("filter-change");
                Logger.success(`フィルター処理完了: ${filterTime.toFixed(2)}ms`);
            } catch (error) {
                Logger.error("フィルタリング処理でエラー:", error);
                alert("データの取得に失敗しました。");
            }
        },
        500 // 500ms のデバウンス
    );

    /**
     * product_history_dataから指定した日付の合計値を取得する関数
     * @param date - 指定する日付（YYYY-MM-DD形式）
     * @returns 合計値のオブジェクト
     */
    function getTotalsByDate(date: string): TotalsByDate {
        /** 合計値の初期化 */
        let totalActualNumber = 0;
        /** 付加価値の合計 */
        let totalAddedValue = 0;
        /** 総コストの合計 */
        let totalCost = 0;
        /** 総利益の合計 */
        let totalGrossProfit = 0;
        /** 社内平日残業時間の合計 */
        let totalInsideOvertime = 0;
        /** 社外平日残業時間の合計 */
        let totalOutsideOvertime = 0;
        /** 社内休日残業時間の合計 */
        let totalInsideHolidayOvertime = 0;
        /** 社外休日残業時間の合計 */
        let totalOutsideHolidayOvertime = 0;
        const details: string[] = [];

        const holidayTypeCode = getHolidayTypeCode(date);

        product_history_data?.forEach((item, index) => {
            if (item.date === date) {
                // 各種合計値を加算
                totalActualNumber += Number(item.actual_number); // 実績数の合計
                totalAddedValue += Number(item.addedValue); // 付加価値の合計
                totalCost += Number(item.totalCost); // 総コストの合計
                totalGrossProfit += Number(item.grossProfit); // 総利益の合計
                // 平日の場合
                if (holidayTypeCode === 0) {
                    totalInsideOvertime += Number(item.insideOvertime); // 社内残業時間の合計
                    totalOutsideOvertime += Number(item.outsideOvertime); // 社外残業時間の合計
                    // 法定休日の場合
                } else if (holidayTypeCode === -1) {
                    totalInsideHolidayOvertime += Number(item.insideRegularTime); // 社内休日残業時間の合計
                    totalInsideHolidayOvertime += Number(item.insideOvertime); // 社内休日残業時間の合計
                    totalOutsideHolidayOvertime += Number(item.outsideOvertime); // 社外休日残業時間の合計
                    totalOutsideHolidayOvertime += Number(item.outsideRegularTime); // 社外休日残業時間の合計
                    // 所定休日の場合
                } else if (holidayTypeCode === -2) {
                    totalInsideOvertime += Number(item.insideRegularTime); // 社内休日残業時間の合計
                    totalInsideOvertime += Number(item.insideOvertime); // 社内休日残業時間の合計
                    totalOutsideOvertime += Number(item.outsideRegularTime); // 社外休日残業時間の合計
                    totalOutsideOvertime += Number(item.outsideOvertime); // 社外休日残業時間の合計
                }

                details.push(
                    `  [${index}] ライン: ${item.line_name}, 付加価値: ${Number(item.addedValue).toFixed(2)}`
                );
            }
        });

        // 利益とコストを1000で除算
        totalAddedValue /= 1000;
        totalCost /= 1000;
        totalGrossProfit /= 1000;

        const profitRate = totalCost > 0 ? ((totalGrossProfit / totalCost) * 100).toFixed(2) : 0;

        return {
            date,
            totalActualNumber,
            totalAddedValue,
            totalCost,
            totalGrossProfit,
            profitRate,
            totalInsideOvertime,
            totalOutsideOvertime,
            totalInsideHolidayOvertime,
            totalOutsideHolidayOvertime,
        };
    }

    /**
     * 指定された月の全日付リストを取得する関数
     * @param date - 基準となる日付（YYYY-MM形式）
     * @returns 休日タイプに応じたコードの数値
     */
    function getHolidayTypeCode(date: string): number {
        const holidayRecord = holidayData.find((item) => item.date?.value === date);
        if (!holidayRecord) {
            return 0; // 平日
        } else if (holidayRecord.holiday_type?.value === "法定休日") {
            return -1; // 法定休日
        } else if (holidayRecord.holiday_type?.value === "所定休日") {
            return -2; // 所定休日
        } else {
            return 0; // 平日
        }
    }

    /**
     * product_history_dataから日付リストを取得する関数
     * @return 日付リスト
     */
    function getDateList(): string[] {
        const dateSet = new Set<string>();
        product_history_data?.forEach((item) => {
            dateSet.add(item.date);
        });
        return Array.from(dateSet);
    }

    /**
     * dailyReportDataから指定した日付のレコードを取得する関数
     * @param date - 指定する日付（YYYY-MM-DD形式）
     * @returns レコードの配列
     */
    function getRecordsByDate(date: string): daily.SavedFields[] {
        if (!dailyReportData) {
            return [];
        }

        const filtered = dailyReportData.filter((item) => {
            const itemDate = item.date?.value || "";
            return itemDate === date;
        });

        return filtered;
    }

    /**
     * 利益計算表テーブルを作成する関数
     * @return 利益計算表テーブルコンテナ
     */
    /**
     * タブコンテナを作成する関数
     * @returns タブコンテナ、ボタンコンテナ、コンテンツコンテナ
     */
    function createTabContainer(): TabContainerResult {
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
    function createTabButton(
        tabId: string,
        tabLabel: string,
        isActive: boolean = false
    ): HTMLButtonElement {
        const button = document.createElement("button");
        button.className = "tab-button";
        button.dataset.tabId = tabId;
        button.textContent = tabLabel;
        button.style.padding = "10px 20px";
        button.style.border = "none";
        button.style.backgroundColor = isActive ? "#3498db" : "#ecf0f1";
        button.style.color = isActive ? "#fff" : "#333";
        button.style.cursor = "pointer";
        button.style.marginRight = "2px";
        button.style.fontWeight = isActive ? "bold" : "normal";
        button.style.transition = "all 0.3s";

        // ホバー効果
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

        if (isActive) {
            button.classList.add("active");
        }

        return button;
    }

    /**
     * タブコンテンツを作成する関数
     * @param tabId - タブのID
     * @param content - コンテンツ要素
     * @param isActive - アクティブかどうか
     * @returns タブコンテンツ
     */
    function createTabContent(
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
     * タブを切り替える関数
     * @param targetTabId - 切り替え先のタブID
     */
    function switchTab(targetTabId: string): void {
        // すべてのタブボタンを非アクティブ化
        const allTabButtons = document.querySelectorAll(".tab-button");
        allTabButtons.forEach((button) => {
            const htmlButton = button as HTMLElement;
            button.classList.remove("active");
            htmlButton.style.backgroundColor = "#ecf0f1";
            htmlButton.style.color = "#333";
            htmlButton.style.fontWeight = "normal";
        });

        // すべてのタブコンテンツを非表示
        const allTabContents = document.querySelectorAll(".tab-content");
        allTabContents.forEach((content) => {
            const htmlContent = content as HTMLElement;
            htmlContent.style.display = "none";
        });

        // 指定されたタブをアクティブ化
        const targetButton = document.querySelector(
            `.tab-button[data-tab-id="${targetTabId}"]`
        ) as HTMLElement | null;
        if (targetButton) {
            targetButton.classList.add("active");
            targetButton.style.backgroundColor = "#3498db";
            targetButton.style.color = "#fff";
            targetButton.style.fontWeight = "bold";
        }

        // 指定されたコンテンツを表示
        const targetContent = document.querySelector(
            `.tab-content[data-tab-id="${targetTabId}"]`
        ) as HTMLElement | null;
        if (targetContent) {
            targetContent.style.display = "block";
        }
    }

    // 一覧画面を表示したときにイベント発火
    kintone.events.on("app.record.index.show", async function (event) {
        // レコード一覧の上段スペースを取得
        const headerSpace = kintone.app.getHeaderSpaceElement();
        if (!headerSpace) {
            Logger.warn("ヘッダースペースが見つかりません");
            return event;
        }

        // ヘッダーコンテナを作成して追加
        const headerContainer = HeaderContainer.create();
        headerSpace.appendChild(headerContainer);

        // 年選択セレクトボックスの変更イベント
        const yearSelect = document.getElementById("year-select") as HTMLSelectElement | null;
        if (yearSelect) {
            yearSelect.addEventListener("change", async function () {
                await debouncedHandleFilterChange(headerSpace);
            });
        }

        // 月選択セレクトボックスの変更イベント
        const monthSelect = document.getElementById("month-select") as HTMLSelectElement | null;
        if (monthSelect) {
            monthSelect.addEventListener("change", async function () {
                await debouncedHandleFilterChange(headerSpace);
            });
        }

        // 祝日データを取得（初回のみ）
        Logger.debug("祝日データ確認:", holidayData);
        if (!holidayData || holidayData.length === 0) {
            holidayData = await fetchHolidayData();
        }
        console.log("取得した祝日データ:", holidayData);

        // マスタ機種一覧データを取得（初回のみ）
        Logger.debug("マスタデータ確認:", masterModelData);
        if (!masterModelData) {
            masterModelData = await fetchMasterModelData();
        }

        // 初回表示時にフィルタリングを実行（現在の年月でデータ取得）
        await debouncedHandleFilterChange(headerSpace);

        return event;
    });
})();
