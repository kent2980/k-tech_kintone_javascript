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
import {
    FilterConfig,
    ProductHistoryData,
    RevenueAnalysis,
    TabContainerResult,
    TotalsByDate,
} from "./types";

import { DateUtil, Logger, MemoryLeakDetector, PerformanceUtil } from "./utils";

import { BusinessCalculationService, DataProcessor, KintoneApiService } from "./services";

import {
    PLDashboardGraphBuilder,
    PLDashboardTableManager,
    PLDomBuilder,
    PLHeaderContainer,
} from "./components";
import { ActiveFilterStore, HolidayStore, MasterModelStore } from "./store";
(function () {
    "use strict";

    // 型定義は types/index.ts から import済み

    // グローバル変数
    let dailyReportData: daily.SavedFields[] = [];
    let product_history_data: ProductHistoryData[] = [];
    let plMonthlyData: monthly.SavedFields | null = null;
    let filteredRecords: line_daily.SavedFields[] = [];
    let lastActiveTabId: string = "production-tab";

    // PLDashboardTableManager のインスタンスを作成
    const tableManager = new PLDashboardTableManager({
        stickyHeader: true,
        enableDataTables: true,
        holidayColoring: true,
    });

    // PLDashboardGraphBuilder のインスタンスを作成
    const graphBuilder = new PLDashboardGraphBuilder();

    // PLDomBuilder のインスタンスを作成
    const domBuilder = new PLDomBuilder();

    // KintoneApiService のインスタンスを作成
    const apiService = new KintoneApiService();

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
     * 読み込みオーバーレイを表示
     * @param parent - オーバーレイを追加する親要素（通常はヘッダースペース）
     */
    function showLoading(parent: HTMLElement): void {
        try {
            if (!parent) return;
            // 親要素を相対配置にしてオーバーレイを絶対配置で被せる
            const prevPosition = parent.style.position;
            if (!prevPosition || prevPosition === "") {
                parent.style.position = "relative";
            }

            if (document.getElementById("pl-dashboard-loading")) return;

            // keyframes スタイルが未登録なら追加
            if (!document.getElementById("pl-dashboard-loading-styles")) {
                const style = document.createElement("style");
                style.id = "pl-dashboard-loading-styles";
                style.textContent = `@keyframes pl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
                document.head.appendChild(style);
            }

            const overlay = document.createElement("div");
            overlay.id = "pl-dashboard-loading";
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
            label.textContent = "読み込み中...";
            label.style.color = "#333";
            label.style.fontSize = "14px";

            box.appendChild(spinner);
            box.appendChild(label);
            overlay.appendChild(box);

            parent.appendChild(overlay);
        } catch (e) {
            // ロード表示は非致命的なので失敗しても無視
        }
    }

    /**
     * 読み込みオーバーレイを非表示
     */
    function hideLoading(): void {
        try {
            const overlay = document.getElementById("pl-dashboard-loading");
            if (overlay && overlay.parentElement) {
                overlay.parentElement.removeChild(overlay);
            }
        } catch (e) {
            // 無視
        }
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
        return await apiService.fetchPLMonthlyData(year, month);
    }

    /**
     * PL日次データを取得する関数
     * @param year - 年
     * @param month - 月
     * @returns レコードの配列
     */
    async function fetchPLDailyData(year: string, month: string): Promise<daily.SavedFields[]> {
        return await apiService.fetchPLDailyData(year, month);
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
        return await apiService.fetchProductionReportData(filterConfig);
    }

    /**
     * マスタ機種一覧データを取得する関数
     * @returns レコードの配列
     */
    async function fetchMasterModelData(): Promise<model_master.SavedFields[]> {
        return await apiService.fetchMasterModelData();
    }

    /**
     * 祝日データを取得する関数
     * @returns レコードの配列
     */
    async function fetchHolidayData(): Promise<holiday.SavedFields[]> {
        return await apiService.fetchHolidayData();
    }

    /*
     * フィルター変更時の処理（デバウンス処理付き）
     */
    const debouncedHandleFilterChange = PerformanceUtil.debounce(
        async function handleFilterChange(headerSpace: unknown): Promise<void> {
            const headerElement = headerSpace as HTMLElement;
            const yearSelect = document.getElementById("year-select") as HTMLSelectElement | null;
            const monthSelect = document.getElementById("month-select") as HTMLSelectElement | null;

            const selectedYear = yearSelect?.value || null;
            const selectedMonth = monthSelect?.value || null;

            // フィルター情報をストアに保存
            ActiveFilterStore.getInstance().setFilter(Number(selectedYear), Number(selectedMonth));
            try {
                // フィルター変更時にデータをリセット
                let RevenueAnalysisList: RevenueAnalysis[] = [];
                product_history_data = [];

                // 読み込みオーバーレイを表示
                showLoading(headerElement);

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

                // 既存のタブコンテナがあれば再利用し、子要素のみクリアして再構築（画面チラつき回避）
                let tabContainer: HTMLElement;
                let tabButtonsContainer: HTMLElement;
                let tabContentsContainer: HTMLElement;
                const existingTabContainer = document.getElementById("tab-container");
                if (existingTabContainer) {
                    tabContainer = existingTabContainer as HTMLElement;
                    tabButtonsContainer = tabContainer.querySelector("#tab-buttons") as HTMLElement;
                    tabContentsContainer = tabContainer.querySelector(
                        "#tab-contents"
                    ) as HTMLElement;
                    if (tabButtonsContainer) tabButtonsContainer.innerHTML = "";
                    if (tabContentsContainer) tabContentsContainer.innerHTML = "";
                } else {
                    const created = createTabContainer();
                    tabContainer = created.tabContainer;
                    tabButtonsContainer = created.tabButtonsContainer;
                    tabContentsContainer = created.tabContentsContainer;
                }

                // テーブルを順番に非同期実行
                let tableContainer: HTMLElement;
                // production table: update data only if table exists
                const existingProductionContainer = document.getElementById(
                    "production-performance-table"
                );
                if (existingProductionContainer) {
                    // 再利用のため、product_history_dataを再構築
                    product_history_data = [];
                    // テーブルデータを再構築
                    const prodRows: unknown[] = [];

                    filteredRecords.forEach((record) => {
                        // 各種指標を計算
                        const metrics = BusinessCalculationService.calculateBusinessMetrics(
                            record,
                            plMonthlyData
                        );
                        // 日付をフォーマット
                        const dateObj = new Date(record.date?.value);
                        // YYYY/MM/DD(曜日)形式に変換
                        const formattedDate = `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(
                            dateObj.getDate()
                        ).padStart(2, "0")}(${DateUtil.getDayOfWeek(dateObj)})`;
                        // 行データを配列にまとめる
                        const row = [
                            formattedDate,
                            record.line_name?.value || "",
                            record.model_name?.value || "",
                            record.actual_number?.value || "0",
                            metrics.addedValue.addedValue,
                            record.inside_time?.value || "0",
                            metrics.cost.insideCost,
                            record.outside_time?.value || "0",
                            metrics.cost.outsideCost,
                            record.inside_overtime?.value || "0",
                            metrics.cost.insideOvertimeCost,
                            record.outside_overtime?.value || "0",
                            metrics.cost.outsideOvertimeCost,
                            metrics.cost.totalCost,
                            metrics.profit.grossProfit,
                            metrics.profit.profitRateString,
                        ];
                        // 行データをprodRowsに追加
                        prodRows.push(row);
                        // product_history_dataにも追加
                        const historyItem: ProductHistoryData = {
                            date: record.date?.value || "",
                            line_name: record.line_name?.value || "",
                            actual_number: record.actual_number?.value || "0",
                            addedValue: metrics.addedValue.addedValue,
                            totalCost: metrics.cost.totalCost,
                            grossProfit: metrics.profit.grossProfit,
                            profitRate: metrics.profit.profitRateString,
                            insideOvertime: record.inside_overtime?.value || "0",
                            outsideOvertime: record.outside_overtime?.value || "0",
                            insideRegularTime: record.inside_time?.value || "0",
                            outsideRegularTime: record.outside_time?.value || "0",
                        };
                        product_history_data.push(historyItem);
                    });

                    //
                    const productionTableElement = document.getElementById("production-table");
                    if (productionTableElement && (window as any).jQuery) {
                        tableManager.updateTableData("production-table", prodRows);
                        tableContainer = existingProductionContainer as HTMLElement;
                    } else {
                        tableContainer = await PerformanceUtil.createElementLazy(() =>
                            tableManager.createProductionPerformanceTable(
                                "production-table",
                                filteredRecords,
                                plMonthlyData,
                                product_history_data,
                                DateUtil.getDayOfWeek,
                                {
                                    holidayColoring: true,
                                }
                            )
                        );
                    }
                } else {
                    tableContainer = await PerformanceUtil.createElementLazy(() =>
                        tableManager.createProductionPerformanceTable(
                            "production-table",
                            filteredRecords,
                            plMonthlyData,
                            product_history_data,
                            DateUtil.getDayOfWeek,
                            {
                                holidayColoring: true,
                            }
                        )
                    );
                }
                const profitTableContainer = await PerformanceUtil.createElementLazy(() =>
                    tableManager.createProfitCalculationTable(
                        "calculation-table",
                        dailyReportData,
                        filteredRecords,
                        plMonthlyData,
                        getDateList,
                        getTotalsByDate,
                        getRecordsByDate,
                        DateUtil.getDayOfWeek,
                        RevenueAnalysisList
                    )
                );
                let summaryTableContainer: HTMLElement;
                const existingSummaryContainer = document.getElementById(
                    "revenue-analysis-summary-table"
                );
                if (existingSummaryContainer) {
                    // prepare summary rows from RevenueAnalysisList
                    const summaryRows: unknown[] = [];
                    RevenueAnalysisList.forEach((item) => {
                        summaryRows.push([
                            // formattedDate
                            `${String(new Date(item.date).getMonth() + 1).padStart(2, "0")}/${String(
                                new Date(item.date).getDate()
                            ).padStart(2, "0")}(${DateUtil.getDayOfWeek(new Date(item.date))})`,
                            item.addedValue,
                            item.expenses,
                            item.grossProfit,
                            item.profitRate,
                            item.CumulativeAddedValue,
                            item.CumulativeExpenses,
                            item.CumulativeGrossProfit,
                            item.CumulativeProfitRate,
                        ]);
                    });

                    const summaryTableElement = document.getElementById("revenue-summary-table");
                    if (summaryTableElement && (window as any).jQuery) {
                        tableManager.updateTableData("revenue-summary-table", summaryRows);
                        summaryTableContainer = existingSummaryContainer as HTMLElement;
                    } else {
                        summaryTableContainer = await PerformanceUtil.createElementLazy(() =>
                            tableManager.createRevenueAnalysisSummaryTable(
                                "revenue-summary-table",
                                RevenueAnalysisList
                            )
                        );
                    }
                } else {
                    summaryTableContainer = await PerformanceUtil.createElementLazy(() =>
                        tableManager.createRevenueAnalysisSummaryTable(
                            "revenue-summary-table",
                            RevenueAnalysisList
                        )
                    );
                }
                let mixedChartContainer: HTMLElement;
                const existingCanvas = document.getElementById("mixed-chart");
                if (existingCanvas) {
                    // update chart data only
                    graphBuilder.updateMixedChart("mixed-chart", RevenueAnalysisList);
                    mixedChartContainer = existingCanvas.parentElement as HTMLElement;
                } else {
                    mixedChartContainer = await PerformanceUtil.createElementLazy(() =>
                        graphBuilder.createMixedChartContainer("mixed-chart", RevenueAnalysisList)
                    );
                }

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

                // 前回アクティブだったタブを再度アクティブ化
                if (lastActiveTabId) {
                    switchTab(lastActiveTabId);
                }

                const filterTime = PerformanceUtil.endMeasure("filter-change");
                // 読み込みオーバーレイを非表示
                hideLoading();
                Logger.success(`フィルター処理完了: ${filterTime.toFixed(2)}ms`);
            } catch (error) {
                hideLoading();
                Logger.error("フィルタリング処理でエラー:", error);
                alert("データの取得に失敗しました。");
            }
        },
        100 // 500ms のデバウンス
    );

    /**
     * product_history_dataから指定した日付の合計値を取得する関数
     * DataProcessorの静的メソッドを使用
     * @param date - 指定する日付（YYYY-MM-DD形式）
     * @returns 合計値のオブジェクト
     */
    function getTotalsByDate(date: string): TotalsByDate {
        return DataProcessor.getTotalsByDate(product_history_data, date);
    }

    /**
     * 完全な日付リストを取得する関数（欠損日を0値で補完）
     * DataProcessorの静的メソッドを使用
     * @return 日付リスト
     */
    function getDateList(): string[] {
        // 現在選択されている年月を取得
        const yearSelect = document.getElementById("year-select") as HTMLSelectElement | null;
        const monthSelect = document.getElementById("month-select") as HTMLSelectElement | null;

        const selectedYear = yearSelect?.value;
        const selectedMonth = monthSelect?.value;

        // DataProcessorの静的メソッドを使用（年月が指定されている場合は完全な日付リストを生成）
        return DataProcessor.getDateList(
            product_history_data,
            selectedYear || undefined,
            selectedMonth || undefined
        );
    }

    /**
     * dailyReportDataから指定した日付のレコードを取得する関数
     * DataProcessorの静的メソッドを使用
     * @param date - 指定する日付（YYYY-MM-DD形式）
     * @returns レコードの配列
     */
    function getRecordsByDate(date: string): daily.SavedFields[] {
        return DataProcessor.getRecordsByDate(dailyReportData, date);
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

        // タブボタンエリア
        const tabButtonsContainer = document.createElement("div");
        tabButtonsContainer.id = "tab-buttons";

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
        button.className = "tab-button" + (isActive ? " active" : "");
        button.dataset.tabId = tabId;
        button.textContent = tabLabel;
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
        contentDiv.className = "tab-content" + (isActive ? " active" : "");
        contentDiv.dataset.tabId = tabId;
        contentDiv.appendChild(content);
        return contentDiv;
    }

    /**
     * タブを切り替える関数
     * @param targetTabId - 切り替え先のタブID
     */
    function switchTab(targetTabId: string): void {
        lastActiveTabId = targetTabId;
        // すべてのタブボタンを非アクティブ化
        const allTabButtons = document.querySelectorAll(".tab-button");
        allTabButtons.forEach((button) => {
            button.classList.remove("active");
        });

        // すべてのタブコンテンツを非表示
        const allTabContents = document.querySelectorAll(".tab-content");
        allTabContents.forEach((content) => {
            content.classList.remove("active");
        });

        // 指定されたタブをアクティブ化
        const targetButton = document.querySelector(`.tab-button[data-tab-id="${targetTabId}"]`);
        if (targetButton) {
            targetButton.classList.add("active");
        }

        // 指定されたコンテンツを表示
        const targetContent = document.querySelector(`.tab-content[data-tab-id="${targetTabId}"]`);
        if (targetContent) {
            targetContent.classList.add("active");
        }
    }

    // ページアンロード時のクリーンアップ処理
    window.addEventListener("beforeunload", () => {
        Logger.debug("ページアンロード: リソースをクリーンアップします");
        tableManager.destroyAllTables();
        graphBuilder.destroyAllCharts();
        MemoryLeakDetector.disable();
    });

    // ページ非表示時のクリーンアップ処理（モバイル対応）
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            Logger.debug("ページ非表示: リソースをクリーンアップします");
            // 必要に応じてクリーンアップ処理を実行
        }
    });

    // 一覧画面を表示したときにイベント発火
    kintone.events.on("app.record.index.show", async function (event) {
        // レコード一覧の上段スペースを取得
        const headerSpace = kintone.app.getHeaderSpaceElement();
        if (!headerSpace) {
            Logger.warn("ヘッダースペースが見つかりません");
            return event;
        }

        // 既存のコンテンツをクリーンアップ（ページ再読み込み時のメモリリーク防止）
        const existingContent = headerSpace.querySelector(".pl-dashboard-content");
        if (existingContent) {
            Logger.debug("既存のコンテンツをクリーンアップします");
            // 既存のテーブルとグラフを破棄
            tableManager.destroyAllTables();
            graphBuilder.destroyAllCharts();
            existingContent.remove();
        }

        // ヘッダーコンテナを作成して追加
        const headerContainerInstance = new PLHeaderContainer(domBuilder);
        const headerContainer = headerContainerInstance.create();
        headerSpace.appendChild(headerContainer);

        // 開発環境でメモリリーク検出を有効化
        if (process.env.NODE_ENV === "development") {
            MemoryLeakDetector.enable(60000); // 60秒ごとにチェック
        }

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
        const holidayStore = HolidayStore.getInstance();
        let holidayData = holidayStore.getHolidayData();
        if (!holidayData || holidayData.length === 0) {
            holidayData = await fetchHolidayData();
            // 祝日データをストアにセット
            HolidayStore.getInstance().setHolidayData(holidayData);
        }

        // マスタ機種一覧データを取得（初回のみ）
        const masterModelStore = MasterModelStore.getInstance();
        let masterModelData = masterModelStore.getMasterData();
        Logger.debug("マスタデータ確認:", masterModelData);
        if (!masterModelData) {
            masterModelData = await fetchMasterModelData();
        }

        // 初回表示時にフィルタリングを実行（現在の年月でデータ取得）
        await debouncedHandleFilterChange(headerSpace);

        return event;
    });
})();
