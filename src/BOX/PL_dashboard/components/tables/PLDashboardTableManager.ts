/// <reference path="../../../../../kintone.d.ts" />
/// <reference path="../../../../../globals.d.ts" />
/// <reference path="../../fields/daily_fields.d.ts" />
/// <reference path="../../fields/line_daily_fields.d.ts" />
/// <reference path="../../fields/month_fields.d.ts" />
/// <reference path="../../fields/model_master_fields.d.ts" />

import { TABLE_COLUMNS } from "../../config";
import {
    BusinessCalculationHelperService,
    BusinessCalculationService,
    ProfitCalculationService,
    RevenueAnalysisCalculationService,
} from "../../services";
import { ActiveFilterStore, HolidayStore } from "../../store";
import {
    DataTablesApi,
    DataTablesOptions,
    ProductHistoryData,
    RevenueAnalysis,
    TableBuilderConfig,
    TotalsByDate,
} from "../../types";
import { TableRowData } from "../../types/table";
import { DateUtil, Logger } from "../../utils";
import { batchAppendCells, batchAppendRows } from "../../utils/DomBatchUpdater";
import { BaseTableManager } from "./BaseTableManager";

/**
 * PLダッシュボード用のテーブル管理クラス
 * BaseTableManagerを継承し、PL管理に特化したテーブル機能を提供
 */
export class PLDashboardTableManager extends BaseTableManager {
    /**
     * コンストラクタ
     */
    constructor(defaultConfig?: Partial<TableBuilderConfig>) {
        super(defaultConfig);
    }

    /**
     * テーブル情報を登録（PL固有の型指定）
     */
    protected registerTable(
        tableId: string,
        tableType: "production" | "profit" | "revenue" | "unknown",
        config: Partial<TableBuilderConfig>,
        columns: string[]
    ): void {
        super.registerTable(tableId, tableType, config, columns);
    }

    /**
     * 生産実績テーブルのデータ変換専用メソッド
     * テーブル表示用のデータ配列を返す
     */
    private transformProductionData(
        records: line_daily.SavedFields[],
        plMonthlyData: monthly.SavedFields | null,
        product_history_data: ProductHistoryData[],
        getDayOfWeek: (date: Date) => string
    ): TableRowData[] {
        const tableData: TableRowData[] = [];

        records.forEach((record) => {
            // 経営指標を計算（新しいBusinessCalculationServiceを使用）
            const metrics = BusinessCalculationService.calculateBusinessMetrics(
                record,
                plMonthlyData
            );

            // 計算結果の検証とログ出力（開発環境）
            const recordInfo = `${record.date?.value} - ${record.line_name?.value} - ${record.model_name?.value}`;
            const validation = BusinessCalculationHelperService.validateBusinessMetrics(
                metrics,
                record.date?.value
            );

            if (!validation.isValid) {
                Logger.debug(`計算エラー検出 [${recordInfo}]: ${validation.errors.join(", ")}`);
            }

            // 異常値検出
            const anomalies = BusinessCalculationHelperService.detectAnomalies(metrics);
            if (anomalies.length > 0) {
                Logger.debug(`異常値検出 [${recordInfo}]: ${anomalies.join(", ")}`);
            }

            // 日付を短い形式(mm/dd(曜日))に変換※月と日付は０埋めして２桁に
            const dateObj = new Date(record.date?.value);
            const formattedDate = `${String(dateObj.getMonth() + 1).padStart(
                2,
                "0"
            )}/${String(dateObj.getDate()).padStart(2, "0")}(${getDayOfWeek(dateObj)})`;

            // 各列のデータを追加
            const cells = [
                formattedDate, // 日付
                record.line_name?.value || "", // ライン
                record.model_name?.value || "", // 機種名
                record.actual_number?.value || "0", // 台数
                metrics.addedValue.addedValue, // 付加価値
                record.inside_time?.value || "0", // 社員工数(h)
                metrics.cost.insideCost, // 社員工数(円)
                record.outside_time?.value || "0", // 派遣工数(h)
                metrics.cost.outsideCost, // 派遣工数(円)
                record.inside_overtime?.value || "0", // 社員残業工数(h)
                metrics.cost.insideOvertimeCost, // 社員残業工数(円)
                record.outside_overtime?.value || "0", // 派遣残業工数(h)
                metrics.cost.outsideOvertimeCost, // 派遣残業工数(円)
                metrics.cost.totalCost, // 経費合計
                metrics.profit.grossProfit, // 粗利益
                metrics.profit.profitRateString, // 利益率
            ];

            // テーブルデータを格納するリストにも追加
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
            tableData.push(cells);
        });

        return tableData;
    }

    /**
     * 生産実績テーブルのレンダリング専用メソッド
     */
    private renderProductionTable(
        tableId: string,
        tableData: TableRowData[],
        records: line_daily.SavedFields[]
    ): { table: HTMLTableElement; container: HTMLDivElement } {
        // コンテナ要素を作成
        const container = document.createElement("div");
        container.id = `production-performance-table-${tableId}`;
        container.className = "pl-table-container";

        // テーブルカラム
        const columns = [...TABLE_COLUMNS.PRODUCTION];

        // テーブル要素の作成
        const table = this.createTable(tableId);

        // ヘッダー行の作成
        const thead = this.createStickyTableHeader(columns);
        table.appendChild(thead);

        // データ行の作成
        const tbody = this.createTableBody();

        // 会社休日マスタデータを取得
        const holidayStore = HolidayStore.getInstance();
        const holidayData = holidayStore.getHolidayData();

        // DocumentFragmentを使用してバッチ追加（パフォーマンス最適化）
        const rows: HTMLTableRowElement[] = [];
        tableData.forEach((cells, index) => {
            const record = records[index];
            const row = document.createElement("tr");
            row.className = "recordlist-row-gaia recordlist-row-gaia-hover-highlight";

            const tableCells: HTMLTableCellElement[] = [];
            cells.forEach((cellValue) => {
                tableCells.push(this.createTableCell(cellValue ?? ""));
            });

            // セルを一括追加
            batchAppendCells(row, tableCells);

            // 休日色分けを適用
            const backgroundColor = this.getDateBackgroundColor(
                record.date?.value || "",
                holidayData
            );
            if (backgroundColor) {
                row.style.backgroundColor = backgroundColor;
            }

            rows.push(row);
        });

        // 行を一括追加
        batchAppendRows(tbody, rows);

        table.appendChild(tbody);
        container.appendChild(table);

        return { table, container };
    }

    /**
     * 生産実績テーブルのDataTables統合専用メソッド
     */
    private integrateDataTablesForProduction(tableId: string): void {
        setTimeout(() => {
            this.enhanceProductionTable(tableId);
        }, 100);
    }

    /**
     * 生産実績テーブルを作成
     */
    public createProductionPerformanceTable(
        tableId: string,
        records: line_daily.SavedFields[],
        plMonthlyData: monthly.SavedFields | null,
        product_history_data: ProductHistoryData[],
        getDayOfWeek: (date: Date) => string,
        config?: Partial<TableBuilderConfig>
    ): HTMLDivElement {
        // 既存のテーブルがあれば破棄
        if (this.hasTable(tableId)) {
            this.destroyTable(tableId);
        }

        // テーブル情報を登録
        this.registerTable(tableId, "production", config || {}, [...TABLE_COLUMNS.PRODUCTION]);

        // データが存在しない場合の処理
        if (!records || records.length === 0) {
            const container = document.createElement("div");
            container.id = `production-performance-table-${tableId}`;
            container.className = "pl-table-container";
            const noDataMessage = document.createElement("div");
            noDataMessage.textContent = "該当するPL日次データが存在しません。";
            container.appendChild(noDataMessage);
            return container;
        }

        // データ変換
        const tableData = this.transformProductionData(
            records,
            plMonthlyData,
            product_history_data,
            getDayOfWeek
        );

        // レンダリング
        const { table, container } = this.renderProductionTable(tableId, tableData, records);

        // テーブル情報を更新
        const tableInfo = this.getTableInfo(tableId);
        if (tableInfo) {
            tableInfo.tableElement = table;
            tableInfo.containerElement = container;
            tableInfo.data = tableData;
            tableInfo.updatedAt = new Date();
        }

        // DataTables統合
        this.integrateDataTablesForProduction(tableId);

        return container;
    }

    /**
     * 損益計算テーブルのデータ変換専用メソッド
     */
    private transformProfitData(
        getDateList: () => string[],
        getTotalsByDate: (date: string) => TotalsByDate,
        getRecordsByDate: (date: string) => daily.SavedFields[],
        plMonthlyData: monthly.SavedFields | null,
        getDayOfWeek: (date: Date) => string,
        RevenueAnalysisList: RevenueAnalysis[]
    ): TableRowData[] {
        const tableData: TableRowData[] = [];
        // 累積データ管理オブジェクトを作成
        const cumulativeDataManager =
            RevenueAnalysisCalculationService.createCumulativeDataManager();

        // 日付リストを取得
        const dateList = getDateList();

        dateList.forEach((date) => {
            const totals = getTotalsByDate(date);
            const records = getRecordsByDate(date);
            const firstRecord: daily.SavedFields | null = records.length > 0 ? records[0] : null;

            // firstRecordがnullの場合（データが存在しない日）でも0値でレコードを作成
            if (!firstRecord) {
                Logger.debug(
                    `日付 ${date} のPL日次データが存在しません。0値でレコードを作成します。`
                );
            }

            // 日付を短い形式(mm/dd(曜日))に変換※月と日付は０埋めして２桁に
            const dateObj = new Date(totals.date);
            const formattedDate = `${String(dateObj.getMonth() + 1).padStart(
                2,
                "0"
            )}/${String(dateObj.getDate()).padStart(2, "0")}(${getDayOfWeek(dateObj)})`;

            // 損益計算サービスを使用して計算を実行
            const profitResult = ProfitCalculationService.calculateDailyProfit(
                firstRecord,
                plMonthlyData,
                totals
            );

            // 各値を変数として宣言（テーブル表示用）
            const directPersonnel = Number(firstRecord?.direct_personnel?.value || 0);
            const temporaryEmployees = Number(firstRecord?.temporary_employees?.value || 0);
            const indirectPersonnel = Number(firstRecord?.indirect_personnel?.value || 0);
            const laborCosts = Number(firstRecord?.labor_costs?.value || 0);
            const indirectMaterialCosts = Number(firstRecord?.indirect_material_costs?.value || 0);
            const nightShiftAllowance = Number(firstRecord?.night_shift_allowance?.value || 0);
            const totalSubCost = Number(firstRecord?.total_sub_cost?.value || 0);
            const insideOvertimeCost = Number(firstRecord?.inside_overtime_cost?.value || 0);
            const outsideOvertimeCostValue = Number(firstRecord?.outside_overtime_cost?.value || 0);
            const insideHolidayExpenses = Number(firstRecord?.inside_holiday_expenses?.value || 0);
            const outsideHolidayExpensesValue = Number(
                firstRecord?.outside_holiday_expenses?.value || 0
            );

            // 付加価値の小数点以下を四捨五入
            const roundedAddedValue = Math.round(totals.totalAddedValue);

            // 間接残業・休出時間を取得
            const indirectOvertimeHours = Number(firstRecord?.indirect_overtime?.value || 0);
            const indirectHolidayWorkHours = Number(firstRecord?.indirect_holiday_work?.value || 0);

            const cellValues = [
                formattedDate,
                roundedAddedValue, // 付加価値売上高
                directPersonnel, // 直行人員
                profitResult.directCost, // 直行経費
                temporaryEmployees, // 派遣社員
                profitResult.dispatchCost, // 派遣経費
                indirectPersonnel, // 間接人員
                profitResult.indirectCost, // 間接経費
                profitResult.totalInsideOvertime, // 直行残業(h)
                profitResult.totalInsideHolidayOvertime, // 直行休出(h)
                profitResult.directOvertimeAndHolidayCost, // 直行残業&休出経費
                profitResult.totalOutsideOvertime, // 派遣残業(h)
                profitResult.totalOutsideHolidayOvertime, // 派遣休出(h)
                profitResult.dispatchOvertimeAndHolidayCost, // 派遣残業&休出経費
                indirectOvertimeHours, // 間接残業(h)
                indirectHolidayWorkHours, // 間接休出(h)
                profitResult.indirectOvertimeAndHolidayCost, // 間接残業&休出経費
                laborCosts, // 直行/間接人件費(残業・休出含まない)
                indirectMaterialCosts, // 間接材料費
                profitResult.otherIndirectMaterialCosts, // 間接材料費,残業休出経費以外
                nightShiftAllowance, // 夜勤手当
                totalSubCost, // 工具器具消耗品、荷造運賃
                insideOvertimeCost, // 残業経費(社員)
                outsideOvertimeCostValue, // 残業経費(派遣)
                insideHolidayExpenses, // 休出経費(社員)
                outsideHolidayExpensesValue, // 休出経費(派遣)
                profitResult.dispatchExpenses, // 派遣人員経費(22名×21日)
                profitResult.totalPersonnelExpenses, // 総人員/製造経費 計
            ];

            // テーブルデータに追加
            tableData.push(cellValues);

            // 収益分析リストにもデータを追加
            const totalAddedValue =
                roundedAddedValue + Number(firstRecord?.other_added_value?.value || 0);

            // 収益分析アイテムを作成（累積計算を含む）
            const RevenueAnalysisItem = RevenueAnalysisCalculationService.createRevenueAnalysisItem(
                totals.date,
                totalAddedValue,
                profitResult.totalPersonnelExpenses,
                cumulativeDataManager
            );
            RevenueAnalysisList.push(RevenueAnalysisItem);
        });

        return tableData;
    }

    /**
     * 損益計算テーブルのレンダリング専用メソッド
     */
    private renderProfitTable(
        tableId: string,
        tableData: TableRowData[],
        getDateList: () => string[],
        getTotalsByDate: (date: string) => TotalsByDate
    ): { table: HTMLTableElement; container: HTMLDivElement } {
        // コンテナ要素の作成
        const container = document.createElement("div");
        container.id = `profit-calculation-table-${tableId}`;
        container.className = "pl-table-container-with-horizontal-scroll";

        const columns = [...TABLE_COLUMNS.PROFIT_CALCULATION];

        // テーブル要素の作成
        const table = this.createTable(tableId);

        // ヘッダー行の作成（固定列付きの特別なヘッダー）
        const thead = document.createElement("thead");
        thead.className = "pl-table-thead-sticky";
        const headerRow = document.createElement("tr");
        // DocumentFragmentを使用してバッチ追加（パフォーマンス最適化）
        const fragment = document.createDocumentFragment();
        columns.forEach((column, index) => {
            const th = document.createElement("th");
            th.textContent = column;

            // 最初の列(日付)を固定
            if (index === 0) {
                th.className =
                    "pl-table-th-compact pl-table-th-date-fixed sorting recordlist-header-cell-gaia label-13458061 recordlist-header-sortable-gaia";
            } else {
                th.className =
                    "pl-table-th-compact sorting recordlist-header-cell-gaia label-13458061 recordlist-header-sortable-gaia";
            }

            fragment.appendChild(th);
        });
        headerRow.appendChild(fragment);
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // データ行の作成
        const tbody = this.createTableBody();

        // 会社休日マスタデータを取得
        const holidayStore = HolidayStore.getInstance();
        const holidayData = holidayStore.getHolidayData();

        // 日付リストを取得
        const dateList = getDateList();

        // DocumentFragmentを使用してバッチ追加（パフォーマンス最適化）
        const rows: HTMLTableRowElement[] = [];
        tableData.forEach((cellValues, index) => {
            const date = dateList[index];
            const totals = getTotalsByDate(date);
            const row = document.createElement("tr");
            row.className = "recordlist-row-gaia recordlist-row-gaia-hover-highlight";

            const cells: HTMLTableCellElement[] = [];
            cellValues.forEach((cellValue, cellIndex) => {
                const td = document.createElement("td");
                td.textContent = String(cellValue);

                // 最初の列(日付)を固定
                if (cellIndex === 0) {
                    td.className = "pl-table-td-standard pl-table-td-date-fixed";
                } else {
                    td.className = "pl-table-td-standard";
                }

                // 会社休日または土曜日の場合は背景色を設定
                const backgroundColor = this.getDateBackgroundColor(totals.date, holidayData);
                if (backgroundColor) {
                    td.style.backgroundColor = backgroundColor;
                }

                cells.push(td);
            });

            // セルを一括追加
            batchAppendCells(row, cells);
            rows.push(row);
        });

        // 行を一括追加
        batchAppendRows(tbody, rows);

        table.appendChild(tbody);
        container.appendChild(table);

        return { table, container };
    }

    /**
     * 損益計算テーブルのDataTables統合専用メソッド
     */
    private integrateDataTablesForProfit(tableId: string): void {
        setTimeout(() => {
            this.enhanceProfitCalculationTable(tableId);
        }, 100);
    }

    /**
     * 損益計算テーブルを作成
     */
    public createProfitCalculationTable(
        tableId: string,
        dailyReportData: daily.SavedFields[],
        filteredRecords: line_daily.SavedFields[],
        plMonthlyData: monthly.SavedFields | null,
        getDateList: () => string[],
        getTotalsByDate: (date: string) => TotalsByDate,
        getRecordsByDate: (date: string) => daily.SavedFields[],
        getDayOfWeek: (date: Date) => string,
        RevenueAnalysisList: RevenueAnalysis[],
        config?: Partial<TableBuilderConfig>
    ): HTMLDivElement {
        // 既存のテーブルがあれば破棄
        if (this.hasTable(tableId)) {
            this.destroyTable(tableId);
        }

        const columns = [...TABLE_COLUMNS.PROFIT_CALCULATION];
        // 収益分析リストを毎回クリア（重複防止）
        if (RevenueAnalysisList && Array.isArray(RevenueAnalysisList)) {
            RevenueAnalysisList.length = 0;
        }

        // テーブル情報を登録
        this.registerTable(tableId, "profit", config || {}, columns);

        // データが存在しない場合の処理
        if (
            !dailyReportData ||
            dailyReportData.length === 0 ||
            !filteredRecords ||
            filteredRecords.length === 0
        ) {
            const container = document.createElement("div");
            container.id = `profit-calculation-table-${tableId}`;
            container.className = "pl-table-container-with-horizontal-scroll";
            const noDataMessage = document.createElement("div");
            noDataMessage.textContent = "該当するPL日次データが存在しません。";
            noDataMessage.className = "pl-no-data-message";
            container.appendChild(noDataMessage);
            return container;
        }

        // データ変換
        const tableData = this.transformProfitData(
            getDateList,
            getTotalsByDate,
            getRecordsByDate,
            plMonthlyData,
            getDayOfWeek,
            RevenueAnalysisList
        );

        // レンダリング
        const { table, container } = this.renderProfitTable(
            tableId,
            tableData,
            getDateList,
            getTotalsByDate
        );

        // テーブル情報を更新
        const tableInfo = this.getTableInfo(tableId);
        if (tableInfo) {
            tableInfo.tableElement = table;
            tableInfo.containerElement = container;
            tableInfo.data = tableData;
            tableInfo.updatedAt = new Date();
        }

        // DataTables統合
        this.integrateDataTablesForProfit(tableId);

        return container;
    }

    /**
     * 収益分析サマリテーブルのデータ変換専用メソッド
     */
    private transformRevenueData(RevenueAnalysisList: RevenueAnalysis[]): TableRowData[] {
        const tableData: TableRowData[] = [];

        RevenueAnalysisList.forEach((item) => {
            // 日付を短い形式(mm/dd(曜日))に変換※月と日付は０埋めして２桁に
            const dateObj = new Date(item.date);
            const formattedDate = `${String(dateObj.getMonth() + 1).padStart(
                2,
                "0"
            )}/${String(dateObj.getDate()).padStart(2, "0")}(${DateUtil.getDayOfWeek(dateObj)})`;

            // 各列のデータを追加
            const cells = [
                formattedDate, // 日付
                item.addedValue, // 付加価値
                item.expenses, // 経費
                item.grossProfit, // 粗利益
                item.profitRate, // 利益率
                item.CumulativeAddedValue, // 累積付加価値
                item.CumulativeExpenses, // 累積経費
                item.CumulativeGrossProfit, // 累積粗利益
                item.CumulativeProfitRate, // 累積利益率
            ];

            // テーブルデータに追加
            tableData.push(cells);
        });

        return tableData;
    }

    /**
     * 収益分析サマリテーブルのレンダリング専用メソッド
     */
    private renderRevenueTable(
        tableId: string,
        tableData: TableRowData[],
        RevenueAnalysisList: RevenueAnalysis[]
    ): { table: HTMLTableElement; container: HTMLDivElement } {
        // コンテナ要素を作成
        const container = document.createElement("div");
        container.id = `revenue-analysis-summary-table-${tableId}`;
        container.className = "pl-table-container";

        // カラムを設定
        const columns = [...TABLE_COLUMNS.REVENUE_ANALYSIS];

        // テーブル要素の作成
        const table = this.createTable(
            tableId,
            "pl-summary-table listView-control-gaia, recordlist-gaia"
        );

        // ヘッダー行の作成
        const thead = this.createStickyTableHeader(columns);
        table.appendChild(thead);

        // ボディ行の作成
        const tbody = this.createTableBody();

        // 会社休日マスタデータを取得
        const holidayStore = HolidayStore.getInstance();
        const holidayData = holidayStore.getHolidayData();

        // DocumentFragmentを使用してバッチ追加（パフォーマンス最適化）
        const rows: HTMLTableRowElement[] = [];
        tableData.forEach((cells, index) => {
            const item = RevenueAnalysisList[index];
            const row = document.createElement("tr");
            row.className = "recordlist-row-gaia recordlist-row-gaia-hover-highlight";

            // 日付に応じた背景色を取得
            const backgroundColor = this.getDateBackgroundColor(item.date, holidayData);

            const tableCells: HTMLTableCellElement[] = [];
            cells.forEach((cellValue, cellIndex) => {
                const td = document.createElement("td");
                // 利益率列のみパーセンテージ表示に変換
                if (cellIndex === 4 || cellIndex === 8) {
                    td.textContent = this.formatPercentage(cellValue as number);
                } else {
                    td.textContent = String(cellValue);
                }
                // 利益率列は右寄せ
                if (cellIndex === 4) {
                    td.className = "pl-table-td-standard dt-right";
                } else if (cellIndex > 0) {
                    td.className = "pl-table-td-standard dt-right";
                } else {
                    td.className = "pl-table-td-standard";
                }

                // 会社休日または土曜日の場合は背景色を設定
                if (backgroundColor) {
                    td.style.backgroundColor = backgroundColor;
                }

                tableCells.push(td);
            });

            // セルを一括追加
            batchAppendCells(row, tableCells);
            rows.push(row);
        });

        // 行を一括追加
        batchAppendRows(tbody, rows);

        table.appendChild(tbody);
        container.appendChild(table);

        return { table, container };
    }

    /**
     * 収益分析サマリテーブルのDataTables統合専用メソッド
     */
    private integrateDataTablesForRevenue(tableId: string): void {
        setTimeout(() => {
            this.enhanceRevenueSummaryTable(tableId);
        }, 100);
    }

    /**
     * 収益分析サマリテーブルを作成する
     */
    public createRevenueAnalysisSummaryTable(
        tableId: string,
        RevenueAnalysisList: RevenueAnalysis[],
        config?: Partial<TableBuilderConfig>
    ): HTMLDivElement {
        // 既存のテーブルがあれば破棄
        if (this.hasTable(tableId)) {
            this.destroyTable(tableId);
        }

        // カラムを設定
        const columns = [...TABLE_COLUMNS.REVENUE_ANALYSIS];

        // テーブル情報を登録
        this.registerTable(tableId, "revenue", config || {}, columns);

        // データ変換
        const tableData = this.transformRevenueData(RevenueAnalysisList);

        // レンダリング
        const { table, container } = this.renderRevenueTable(
            tableId,
            tableData,
            RevenueAnalysisList
        );

        // テーブル情報を更新
        const tableInfo = this.getTableInfo(tableId);
        if (tableInfo) {
            tableInfo.tableElement = table;
            tableInfo.containerElement = container;
            tableInfo.data = tableData;
            tableInfo.updatedAt = new Date();
        }

        // DataTables統合
        this.integrateDataTablesForRevenue(tableId);

        return container;
    }

    /**
     * DataTables初期化完了時のコールバック（PL固有の処理を追加）
     */
    protected onDataTableInitialized(tableId: string): void {
        // 色分けラベルを追加
        setTimeout(() => {
            this.addColorLegendToDataTable(tableId);
            this.addCompanyOperatingDaysLabel(tableId);
        }, 100);
    }

    /**
     * 生産実績テーブル専用のDataTables設定
     */
    private enhanceProductionTable(tableId: string): DataTablesApi | null {
        const productionTableOptions: Partial<DataTablesOptions> = {
            order: [[0, "desc"]] as [number, "asc" | "desc"][], // 日付の降順でソート
            columnDefs: [
                {
                    targets: [0], // 日付列
                    type: "date",
                },
                {
                    targets: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], // 数値列
                    className: "dt-right",
                },
                {
                    targets: [15], // 利益率列
                    className: "dt-right",
                },
            ],
            buttons: [
                {
                    extend: "csv",
                    text: "CSV出力",
                    className: "btn btn-secondary",
                    charset: "utf-8",
                    bom: true,
                    filename: function () {
                        const date = new Date();
                        const dateStr = date.toISOString().split("T")[0];
                        return `PLダッシュボード_${dateStr}`;
                    },
                },
                {
                    extend: "print",
                    text: "印刷",
                    className: "btn btn-secondary",
                },
            ],
        };

        return this.enhanceTableWithDataTables(tableId, productionTableOptions);
    }

    /**
     * 損益計算テーブル専用のDataTables設定
     */
    private enhanceProfitCalculationTable(tableId: string): DataTablesApi | null {
        const calculationTableOptions: Partial<DataTablesOptions> = {
            order: [[0, "asc"]] as [number, "asc" | "desc"][], // 日付の昇順でソート
            scrollX: false,
            columnDefs: [
                {
                    targets: [0], // 日付列
                    type: "date",
                },
                {
                    targets: [
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
                        22, 23, 24, 25, 26,
                    ], // 数値列
                    className: "dt-right",
                },
            ],
            buttons: [
                {
                    extend: "csv",
                    text: "CSV出力",
                    className: "btn btn-secondary",
                    charset: "utf-8",
                    bom: true,
                    filename: function () {
                        const date = new Date();
                        const dateStr = date.toISOString().split("T")[0];
                        return `PLダッシュボード_${dateStr}`;
                    },
                },
                {
                    extend: "print",
                    text: "印刷",
                    className: "btn btn-secondary",
                },
            ],
        };

        return this.enhanceTableWithDataTables(tableId, calculationTableOptions);
    }

    /**
     * 収益分析サマリテーブル専用のDataTables設定
     */
    private enhanceRevenueSummaryTable(tableId: string): DataTablesApi | null {
        const summaryTableOptions: DataTablesOptions = {
            paging: true, // ページングを有効化
            searching: true, // 検索を有効化
            ordering: true, // ソートを有効化
            info: false, // 情報表示を無効化
            dom: "<'dt-top-controls'Bf>rt<'row'<'col-sm-6'i><'col-sm-6'p>>", // dt-top-controlsでボタンとフィルターを横並び配置
            buttons: [
                {
                    extend: "csv",
                    text: "CSV出力",
                    className: "btn btn-secondary",
                    charset: "utf-8",
                    bom: true,
                    filename: function () {
                        const date = new Date();
                        const dateStr = date.toISOString().split("T")[0];
                        return `収益分析サマリ_${dateStr}`;
                    },
                },
                {
                    extend: "print",
                    text: "印刷",
                    className: "btn btn-secondary",
                },
            ],
            columnDefs: [
                {
                    targets: [0, 1, 2], // 数値列
                    className: "dt-right",
                },
                {
                    targets: [3], // 利益率列
                    className: "dt-right",
                },
            ],
        };

        return this.enhanceTableWithDataTables(tableId, summaryTableOptions);
    }

    /**
     * 日付に応じた背景色を取得する
     */
    private getDateBackgroundColor(
        date: string,
        holidayData: { date?: { value: string }; holiday_type?: { value: string } }[] = []
    ): string {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();

        // 会社休日マスタの日付と一致する場合はholiday_typeに応じた背景色を設定
        const holidayRecord = holidayData.find((holiday) => holiday.date?.value === date);
        if (holidayRecord) {
            const holidayType = holidayRecord.holiday_type?.value;
            switch (holidayType) {
                case "法定休日":
                    return "#e6f3ff"; // 薄い青
                case "所定休日":
                    return "#ffe6e6"; // 薄い赤
                case "一斉有給":
                    return "#fffacd"; // 薄い黄色
                default:
                    return "#ffe6e6"; // デフォルトは薄い赤
            }
        }

        // 通常日は背景色なし
        return "";
    }

    /**
     * 会社営業日数ラベルを作成する
     */
    private addCompanyOperatingDaysLabel(tableId: string): void {
        try {
            const targetElement = document.querySelector(`#${tableId}_wrapper .dt-top-controls`);

            if (targetElement) {
                // 既存の凡例があれば削除
                const existingLabel =
                    targetElement.querySelector(".company-operating-days-label") ||
                    document.querySelector(
                        `.company-operating-days-label[data-table="${tableId}"]`
                    );
                if (existingLabel) {
                    existingLabel.remove();
                }

                // 休日リストをストアから取得
                const yearMonth = ActiveFilterStore.getInstance().getFilter();
                const holidayList =
                    yearMonth.year && yearMonth.month
                        ? HolidayStore.getInstance().getSelectHolidayDates(
                              yearMonth.year,
                              yearMonth.month
                          )
                        : [];

                // 営業日数を計算
                const totalDaysInMonth =
                    yearMonth.year && yearMonth.month
                        ? new Date(yearMonth.year, yearMonth.month, 0).getDate()
                        : 0;
                const operatingDays = totalDaysInMonth - holidayList.length;

                // 新しい営業日数ラベルを作成
                const operatingDaysLabel = document.createElement("div");
                operatingDaysLabel.className = "company-operating-days-label color-legend";
                operatingDaysLabel.setAttribute("data-table", tableId);
                operatingDaysLabel.textContent = `稼働日数: ${operatingDays}日`; // ここで実際の営業日数を設定

                // dt-top-controlsに追加
                targetElement.appendChild(operatingDaysLabel);

                Logger.debug(`営業日数ラベルが ${tableId} に追加されました`);
            } else {
                Logger.debug(`${tableId} に適切な追加先が見つかりませんでした`);
            }
        } catch (error) {
            Logger.debug(`営業日数ラベル追加でエラーが発生しました: ${error}`);
        }
    }
}
