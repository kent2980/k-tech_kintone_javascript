/// <reference path="../../../../kintone.d.ts" />
/// <reference path="../../../../globals.d.ts" />
/// <reference path="../fields/daily_fields.d.ts" />
/// <reference path="../fields/line_daily_fields.d.ts" />
/// <reference path="../fields/month_fields.d.ts" />
/// <reference path="../fields/model_master_fields.d.ts" />

import { TABLE_COLUMNS } from "../config";
import {
    DataTablesApi,
    DataTablesOptions,
    ProductHistoryData,
    RevenueAnalysis,
    TableOptions,
    TableRowData,
    TotalsByDate,
} from "../types";
import { DateUtil, Logger } from "../utils";

// jQueryを最初にインポート（DataTablesが依存するため）
import $ from "jquery";

// jQueryをグローバルに設定
(window as unknown as { $: typeof $; jQuery: typeof $ }).$ = $;
(window as unknown as { $: typeof $; jQuery: typeof $ }).jQuery = $;

// DataTables関連のimport（jQueryの後に）
import "datatables.net";
import "datatables.net-buttons";
import "datatables.net-buttons-dt";
import "datatables.net-dt/css/dataTables.dataTables.min.css";

// ボタン機能に必要な追加ライブラリ
import "datatables.net-buttons/js/buttons.html5.min.js";
import "datatables.net-buttons/js/buttons.print.min.js";

// DataTables型定義
/// <reference types="datatables.net" />

/**
 * PLダッシュボード用のテーブル構築ユーティリティクラス
 */
export class PLDashboardTableBuilder {
    /**
     * テーブル要素を作成
     * @param id - テーブルのID
     * @param className - テーブルのクラス名
     * @returns テーブル要素
     */
    static createTable(
        id: string,
        className: string = "recordlist-gaia recordlist-consistent-column-width-gaia"
    ): HTMLTableElement {
        const table = document.createElement("table");
        table.id = id;
        table.className = `pl-table-base ${className}`;
        return table;
    }

    /**
     * 固定ヘッダーを持つテーブルヘッダーを作成
     * @param columns - カラム名の配列
     * @returns テーブルヘッダー要素
     */
    static createStickyTableHeader(columns: string[]): HTMLTableSectionElement {
        const thead = document.createElement("thead");
        thead.className = "pl-table-thead-sticky";

        const headerRow = document.createElement("tr");
        columns.forEach((column) => {
            const th = document.createElement("th");
            th.textContent = column;
            th.className =
                "pl-table-th-standard sorting recordlist-header-cell-gaia label-13458061 recordlist-header-sortable-gaia";
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        return thead;
    }

    /**
     * テーブルボディを作成
     * @param className - ボディのクラス名
     * @returns テーブルボディ要素
     */
    static createTableBody(className: string = "recordlist-body-gaia"): HTMLTableSectionElement {
        const tbody = document.createElement("tbody");
        tbody.className = className;
        return tbody;
    }

    /**
     * テーブルセルを作成
     * @param content - セルの内容
     * @param isNumeric - 数値セルかどうか（右寄せにする）
     * @returns テーブルセル要素
     */
    static createTableCell(
        content: string | number,
        isNumeric: boolean = false
    ): HTMLTableCellElement {
        const td = document.createElement("td");
        td.textContent = String(content);
        td.className = isNumeric
            ? "pl-table-td-numeric recordlist-cell-gaia"
            : "pl-table-td-standard recordlist-cell-gaia";
        return td;
    }

    /**
     * テーブル行を作成
     * @param cells - セルの配列
     * @param className - 行のクラス名
     * @returns テーブル行要素
     */
    static createTableRow(cells: HTMLTableCellElement[], className?: string): HTMLTableRowElement {
        const row = document.createElement("tr");
        if (className) {
            row.className = className;
        }

        cells.forEach((cell) => {
            row.appendChild(cell);
        });

        return row;
    }

    /**
     * 数値をフォーマットして表示用文字列に変換
     * @param value - 数値
     * @param decimals - 小数点以下の桁数（デフォルト: 0）
     * @returns フォーマットされた文字列
     */
    static formatNumber(value: number, decimals: number = 0): string {
        if (isNaN(value)) return "0";
        return value.toLocaleString("ja-JP", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

    /**
     * パーセンテージをフォーマット
     * @param value - パーセンテージ値（0-100）
     * @returns フォーマットされた文字列
     */
    static formatPercentage(value: number): string {
        if (isNaN(value)) return "0%";
        return `${value.toFixed(1)}%`;
    }

    /**
     * 損益計算用のヘルパーメソッド
     * @param addedValue - 付加価値
     * @param totalCost - 総コスト
     * @returns 利益情報オブジェクト
     */
    static calculateProfit(
        addedValue: number,
        totalCost: number
    ): {
        profit: number;
        profitRate: number;
    } {
        const profit = addedValue - totalCost;
        const profitRate = addedValue > 0 ? (profit / addedValue) * 100 : 0;

        return {
            profit,
            profitRate,
        };
    }

    /**
     * 完全なテーブルを作成するヘルパーメソッド
     * @param id - テーブルのID
     * @param columns - カラム名の配列
     * @param data - テーブルデータ
     * @param options - オプション設定
     * @returns 完全なテーブル要素
     */
    static createCompleteTable(
        id: string,
        columns: string[],
        data: TableRowData,
        options: TableOptions = {}
    ): HTMLTableElement {
        const {
            stickyHeader = true,
            className = "recordlist-gaia recordlist-consistent-column-width-gaia",
            bodyClassName = "recordlist-body-gaia",
        } = options;

        const table = this.createTable(id, className);

        // ヘッダーを追加
        if (stickyHeader) {
            const thead = this.createStickyTableHeader(columns);
            table.appendChild(thead);
        } else {
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");
            columns.forEach((column) => {
                const th = document.createElement("th");
                th.textContent = column;
                th.className = "pl-table-th-standard";
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
        }

        // ボディを追加
        const tbody = this.createTableBody(bodyClassName);
        table.appendChild(tbody);

        return table;
    }

    /**
     * 生産実績テーブルを作成
     * @param records - 日次データのレコード配列
     * @param plMonthlyData - 月次データ
     * @param masterModelData - マスタ機種データ
     * @param product_history_data - 製品履歴データ（参照渡し）
     * @param getDayOfWeek - 曜日取得関数
     * @returns 生産実績テーブルのコンテナ要素
     */
    static createProductionPerformanceTable(
        records: line_daily.SavedFields[],
        plMonthlyData: monthly.SavedFields | null,
        masterModelData: model_master.SavedFields[],
        product_history_data: ProductHistoryData[],
        getDayOfWeek: (date: Date) => string
    ): HTMLDivElement {
        // コンテナ要素を作成
        const container = document.createElement("div");
        container.id = "production-performance-table";
        container.className = "pl-table-container";

        if (!records || records.length === 0) {
            const noDataMessage = document.createElement("div");
            noDataMessage.textContent = "該当するPL日次データが存在しません。";
            // noDataMessage.className = "pl-no-data-message";
            container.appendChild(noDataMessage);
            return container;
        }

        // 月次データから社員単価と派遣単価を取得
        const inside_unit = plMonthlyData ? Number(plMonthlyData.inside_unit?.value || 0) : 0;
        const outside_unit = plMonthlyData ? Number(plMonthlyData.outside_unit?.value || 0) : 0;

        // テーブルカラム
        const columns = [...TABLE_COLUMNS.PRODUCTION];

        // テーブル要素の作成
        const table = this.createTable("production-table");

        // ヘッダー行の作成
        const thead = this.createStickyTableHeader(columns);
        table.appendChild(thead);

        // データ行の作成
        const tbody = this.createTableBody();
        records.forEach((record) => {
            // マスタ機種一覧データからmodel_nameに対応する付加価値情報を取得
            let addedValue = 0;
            if (record.added_value?.value !== "") {
                Logger.debug(`直接付加価値が設定されています: ${record.added_value.value}`);
                addedValue = Number(record.added_value.value);
            } else {
                const modelName = record.model_name?.value || "";
                const modelCode = record.model_code?.value || "";
                if (masterModelData && masterModelData.length > 0) {
                    const matchedModel = masterModelData.find((item) => {
                        if (modelCode !== "") {
                            return (
                                item.model_name.value === modelName &&
                                item.model_code.value === modelCode
                            );
                        } else {
                            return item.model_name.value === modelName;
                        }
                    });
                    if (matchedModel) {
                        addedValue = Number(matchedModel.added_value?.value || 0);
                    }
                }
                // 台数を取得
                const actualNumber = Number(record.actual_number?.value || 0);
                addedValue = addedValue * actualNumber; // 台数分を掛ける
                addedValue = Math.round(addedValue); // 四捨五入
            }
            // 社員工数を計算する
            const insideTime = Number(record.inside_time?.value || 0);
            const insideCost = insideTime * inside_unit;
            // 派遣工数を計算する
            const outsideTime = Number(record.outside_time?.value || 0);
            const outsideCost = outsideTime * outside_unit;
            // 社員残業工数を計算する
            const insideOvertime = Number(record.inside_overtime?.value || 0);
            const insideOvertimeCost = insideOvertime * inside_unit * 1.25; // 1.25倍で計算
            // 派遣残業工数を計算する
            const outsideOvertime = Number(record.outside_overtime?.value || 0);
            const outsideOvertimeCost = outsideOvertime * outside_unit * 1.25; // 1.25倍で計算
            // 経費合計を計算する
            const totalCost = insideCost + outsideCost + insideOvertimeCost + outsideOvertimeCost;
            // 粗利益を計算する
            const grossProfit = addedValue - totalCost;
            // 利益率を計算する
            const profitRate =
                addedValue > 0 ? ((grossProfit / addedValue) * 100).toFixed(2) + "%" : "0%";

            // 新しい行を作成
            const row = document.createElement("tr");
            row.className = "recordlist-row-gaia recordlist-row-gaia-hover-highlight";

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
                addedValue, // 付加価値
                record.inside_time?.value || "0", // 社員工数(h)
                insideCost, // 社員工数(円)
                record.outside_time?.value || "0", // 派遣工数(h)
                outsideCost, // 派遣工数(円)
                record.inside_overtime?.value || "0", // 社員残業工数(h)
                insideOvertimeCost, // 社員残業工数(円)
                record.outside_overtime?.value || "0", // 派遣残業工数(h)
                outsideOvertimeCost, // 派遣残業工数(円)
                totalCost, // 経費合計
                grossProfit, // 粗利益
                profitRate, // 利益率
            ];

            // テーブルデータを格納するリストにも追加
            const historyItem: ProductHistoryData = {
                date: record.date?.value || "",
                line_name: record.line_name?.value || "",
                actual_number: record.actual_number?.value || "0",
                addedValue: addedValue,
                totalCost: totalCost,
                grossProfit: grossProfit,
                profitRate: profitRate,
                insideOvertime: record.inside_overtime?.value || "0",
                outsideOvertime: record.outside_overtime?.value || "0",
                insideRegularTime: record.inside_time?.value || "0",
                outsideRegularTime: record.outside_time?.value || "0",
            };

            product_history_data.push(historyItem);

            cells.forEach((cellValue) => {
                const td = this.createTableCell(cellValue);
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        container.appendChild(table);

        // DataTables機能を非同期で適用
        setTimeout(() => {
            this.enhanceProductionTable("production-table");
        }, 100);
        product_history_data.forEach((item) => {
            console.log(`${item.date}`);
        });
        return container;
    }

    /**
     * 損益計算テーブルを作成
     * @param dailyReportData - 日報データ
     * @param filteredRecords - フィルタリングされたレコード
     * @param plMonthlyData - 月次データ
     * @param getDateList - 日付リスト取得関数
     * @param getTotalsByDate - 日付別集計取得関数
     * @param getRecordsByDate - 日付別レコード取得関数
     * @param getDayOfWeek - 曜日取得関数
     * @param RevenueAnalysisList - 収益分析リスト
     * @param holidayData - 会社休日マスタデータ
     * @returns 損益計算テーブルのコンテナ要素
     */
    static createProfitCalculationTable(
        dailyReportData: daily.SavedFields[],
        filteredRecords: line_daily.SavedFields[],
        plMonthlyData: monthly.SavedFields | null,
        getDateList: () => string[],
        getTotalsByDate: (date: string) => TotalsByDate,
        getRecordsByDate: (date: string) => daily.SavedFields[],
        getDayOfWeek: (date: Date) => string,
        RevenueAnalysisList: RevenueAnalysis[],
        holidayData: { date?: { value: string }; holiday_type?: { value: string } }[] = []
    ): HTMLDivElement {
        const columns = [...TABLE_COLUMNS.PROFIT_CALCULATION];

        // コンテナ要素の作成
        const container = document.createElement("div");
        container.id = "profit-calculation-table";
        container.className = "pl-table-container-with-horizontal-scroll";

        // データが存在しない場合の処理
        if (
            !dailyReportData ||
            dailyReportData.length === 0 ||
            !filteredRecords ||
            filteredRecords.length === 0
        ) {
            const noDataMessage = document.createElement("div");
            noDataMessage.textContent = "該当するPL日次データが存在しません。";
            noDataMessage.className = "pl-no-data-message";
            container.appendChild(noDataMessage);
            return container;
        }

        // 日付リストを取得
        const dateList = getDateList();

        // テーブル要素の作成
        const table = this.createTable("calculation-table");

        // ヘッダー行の作成（固定列付きの特別なヘッダー）
        const thead = document.createElement("thead");
        thead.className = "pl-table-thead-sticky";
        const headerRow = document.createElement("tr");
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

            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // データ行の作成
        const tbody = this.createTableBody();
        // 累積計算用の変数
        let CumulativeAddedValue = 0;
        let CumulativeExpenses = 0;
        let CumulativeGrossProfit = 0;
        let CumulativeProfitRate = 0;
        let YesterdayGrossProfit = 0;
        dateList.forEach((date) => {
            const totals = getTotalsByDate(date);
            const row = document.createElement("tr");
            row.className = "recordlist-row-gaia recordlist-row-gaia-hover-highlight";

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

            // 各値を変数として宣言
            const directPersonnel = Number(firstRecord?.direct_personnel?.value || 0);
            const temporaryEmployees = Number(firstRecord?.temporary_employees?.value || 0);
            const indirectPersonnel = Number(firstRecord?.indirect_personnel?.value || 0);
            const indirectOvertimeHours = Number(firstRecord?.indirect_overtime?.value || 0);
            const indirectHolidayWorkHours = Number(firstRecord?.indirect_holiday_work?.value || 0);
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
            // 間接材料費,残業休出経費以外を四捨五入
            const other_indirect_material_costs = firstRecord
                ? Math.round(Number(firstRecord.other_indirect_material_costs?.value || 0))
                : 0;

            // 直行経費を計算
            const direct = plMonthlyData?.direct?.value || "0";
            const direct_personnel = firstRecord?.direct_personnel?.value || "0";
            const direct_cost = Math.round(Number(direct) * Number(direct_personnel));
            // 派遣経費を計算
            const dispatch = plMonthlyData?.dispatch?.value || "0";
            const temporary_employees = firstRecord?.temporary_employees?.value || "0";
            const dispatch_cost = Math.round(Number(dispatch) * Number(temporary_employees));
            // 間接経費を計算
            const indirect = plMonthlyData?.indirect?.value || "0";
            const indirect_personnel = firstRecord?.indirect_personnel?.value || "0";
            const indirect_cost = Math.round(Number(indirect) * Number(indirect_personnel));
            // 直行残業(1.25)&休出経費(1.35)を計算
            let unit_price = plMonthlyData?.direct?.value
                ? Number(plMonthlyData?.direct?.value)
                : 0;
            let unit_overtime_cost = (unit_price * 1.25) / 1000;
            let unit_holiday_cost = (unit_price * 1.35) / 1000;
            const totalInsideOvertime = totals.totalInsideOvertime
                ? Math.round(totals.totalInsideOvertime * unit_overtime_cost)
                : 0;
            const totalInsideHolidayOvertime = totals.totalInsideHolidayOvertime
                ? Math.round(totals.totalInsideHolidayOvertime * unit_holiday_cost)
                : 0;
            const directOvertimeAndHolidayCost = totalInsideOvertime + totalInsideHolidayOvertime;
            // 派遣残業(1.25)&休出経費(1.35)を計算
            unit_price = plMonthlyData?.dispatch?.value
                ? Number(plMonthlyData?.dispatch?.value)
                : 0;
            unit_overtime_cost = (unit_price * 1.25) / 1000;
            unit_holiday_cost = (unit_price * 1.35) / 1000;
            const totalOutsideOvertime = totals.totalOutsideOvertime
                ? Math.round(totals.totalOutsideOvertime * unit_overtime_cost)
                : 0;
            const totalOutsideHolidayOvertime = totals.totalOutsideHolidayOvertime
                ? Math.round(totals.totalOutsideHolidayOvertime * unit_holiday_cost)
                : 0;
            const dispatchOvertimeAndHolidayCost =
                totalOutsideOvertime + totalOutsideHolidayOvertime;
            // 間接残業(1.25)&休出経費(1.35)を計算
            unit_price = plMonthlyData?.indirect?.value
                ? Number(plMonthlyData?.indirect?.value)
                : 0;
            unit_overtime_cost = (unit_price * 1.25) / 1000;
            unit_holiday_cost = (unit_price * 1.35) / 1000;
            const indirectOvertime = firstRecord
                ? Math.round(Number(firstRecord.indirect_overtime?.value) * unit_overtime_cost)
                : 0;
            const indirectHolidayWork = firstRecord
                ? Math.round(Number(firstRecord.indirect_holiday_work?.value) * unit_holiday_cost)
                : 0;
            const indirectOvertimeAndHolidayCost = indirectOvertime + indirectHolidayWork;
            console.log(firstRecord?.indirect_overtime?.value);

            // 派遣経費を計算する
            const outside_overtime_cost = firstRecord
                ? Number(firstRecord.outside_overtime_cost?.value || 0)
                : 0;
            const outside_holiday_expenses = firstRecord
                ? Number(firstRecord.outside_holiday_expenses?.value || 0)
                : 0;
            const dispatch_expenses = outside_overtime_cost + outside_holiday_expenses;
            // 総人員/製造経費 計
            const total_personnel_expenses =
                directOvertimeAndHolidayCost +
                indirectOvertimeAndHolidayCost +
                laborCosts +
                indirectMaterialCosts +
                other_indirect_material_costs +
                nightShiftAllowance +
                totalSubCost +
                insideOvertimeCost +
                outsideOvertimeCostValue;

            const cellValues = [
                formattedDate,
                roundedAddedValue, // 付加価値売上高
                directPersonnel, // 直行人員
                direct_cost, // 直行経費
                temporaryEmployees, // 派遣社員
                dispatch_cost, // 派遣経費
                indirectPersonnel, // 間接人員
                indirect_cost, // 間接経費
                totals.totalInsideOvertime, // 直行残業(h)
                totals.totalInsideHolidayOvertime, // 直行休出(h)
                directOvertimeAndHolidayCost, // 直行残業&休出経費
                totals.totalOutsideOvertime, // 派遣残業(h)
                totals.totalOutsideHolidayOvertime, // 派遣休出(h)
                dispatchOvertimeAndHolidayCost, // 派遣残業&休出経費
                indirectOvertimeHours, // 間接残業(h)
                indirectHolidayWorkHours, // 間接休出(h)
                indirectOvertimeAndHolidayCost, // 間接残業&休出経費
                laborCosts, // 直行/間接人件費(残業・休出含まない)
                indirectMaterialCosts, // 間接材料費
                other_indirect_material_costs, // 間接材料費,残業休出経費以外
                nightShiftAllowance, // 夜勤手当
                totalSubCost, // 工具器具消耗品、荷造運賃
                insideOvertimeCost, // 残業経費(社員)
                outsideOvertimeCostValue, // 残業経費(派遣)
                insideHolidayExpenses, // 休出経費(社員)
                outsideHolidayExpensesValue, // 休出経費(派遣)
                dispatch_expenses, // 派遣人員経費(22名×21日)
                total_personnel_expenses, // 総人員/製造経費 計
                // "", // 一人当/付加価値(打)
                // "", // 一人当/粗利益(打)
                // "", // 実績 粗利益率(打)
                // "", // EBITDA(打)
                // "", // EBITDA率
            ];

            cellValues.forEach((cellValue, index) => {
                const td = document.createElement("td");
                td.textContent = String(cellValue);

                // 最初の列(日付)を固定
                if (index === 0) {
                    td.className = "pl-table-td-standard pl-table-td-date-fixed";
                } else {
                    td.className = "pl-table-td-standard";
                }

                // 会社休日または土曜日の場合は背景色を設定
                const backgroundColor = this.getDateBackgroundColor(totals.date, holidayData);
                if (backgroundColor) {
                    td.style.backgroundColor = backgroundColor;
                }

                row.appendChild(td);
            });

            tbody.appendChild(row);

            // 収益分析リストにもデータを追加
            console.log(firstRecord);
            const totalAddedValue =
                roundedAddedValue + Number(firstRecord?.other_added_value?.value || 0);
            console.log(`日付: ${totals.date}, 付加価値売上高: ${totalAddedValue}`);
            CumulativeAddedValue += totalAddedValue;
            CumulativeExpenses += total_personnel_expenses;
            CumulativeGrossProfit =
                totalAddedValue - total_personnel_expenses + YesterdayGrossProfit;
            YesterdayGrossProfit = totalAddedValue - total_personnel_expenses;
            CumulativeProfitRate =
                ((CumulativeAddedValue - CumulativeExpenses) / CumulativeAddedValue) * 100 || 0;
            const RevenueAnalysisItem: RevenueAnalysis = {
                date: totals.date, // 日付(YYYY-MM-DD形式)
                addedValue: totalAddedValue, // 付加価値売上高
                expenses: total_personnel_expenses, // 経費
                grossProfit: totalAddedValue - total_personnel_expenses, // 粗利益
                profitRate:
                    ((totalAddedValue - total_personnel_expenses) / totalAddedValue) * 100 || 0, // 利益率
                CumulativeAddedValue: CumulativeAddedValue, // 累積付加価値
                CumulativeExpenses: CumulativeExpenses, // 累積経費
                CumulativeGrossProfit: CumulativeGrossProfit, // 累積粗利益
                CumulativeProfitRate: CumulativeProfitRate, // 累積利益率
            };
            RevenueAnalysisList.push(RevenueAnalysisItem);
        });
        table.appendChild(tbody);
        container.appendChild(table);

        // DataTables機能を非同期で適用
        setTimeout(() => {
            this.enhanceProfitCalculationTable("calculation-table");
        }, 100);

        return container;
    }

    /**
     * 収益分析サマリテーブルを作成する
     * @param RevenueAnalysisList - 収益分析データ
     * @param holidayData - 会社休日マスタデータ
     * @returns 収益分析サマリテーブルのコンテナ要素
     */
    static createRevenueAnalysisSummaryTable(
        RevenueAnalysisList: RevenueAnalysis[],
        holidayData: { date?: { value: string }; holiday_type?: { value: string } }[] = []
    ): HTMLDivElement {
        // カラムを設定
        const columns = [...TABLE_COLUMNS.REVENUE_ANALYSIS];
        // コンテナ要素を作成
        const container = document.createElement("div");
        container.id = "revenue-analysis-summary-table";
        container.className = "pl-table-container";
        // テーブル要素の作成
        const table = this.createTable(
            "revenue-summary-table",
            "pl-summary-table listView-control-gaia, recordlist-gaia"
        );
        // ヘッダー行の作成
        const thead = this.createStickyTableHeader(columns);
        table.appendChild(thead);
        // ボディ行の作成
        const tbody = this.createTableBody();
        RevenueAnalysisList.forEach((item) => {
            const row = document.createElement("tr");
            row.className = "recordlist-row-gaia recordlist-row-gaia-hover-highlight";

            // 日付を短い形式(mm/dd(曜日))に変換※月と日付は０埋めして２桁に
            const dateObj = new Date(item.date);
            const formattedDate = `${String(dateObj.getMonth() + 1).padStart(
                2,
                "0"
            )}/${String(dateObj.getDate()).padStart(2, "0")}(${DateUtil.getDayOfWeek(dateObj)})`;

            // 日付に応じた背景色を取得
            const backgroundColor = this.getDateBackgroundColor(item.date, holidayData);

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
            cells.forEach((cellValue, index) => {
                const td = document.createElement("td");
                // 利益率列のみパーセンテージ表示に変換
                if (index === 4 || index === 8) {
                    td.textContent = this.formatPercentage(cellValue as number);
                } else {
                    td.textContent = String(cellValue);
                }
                // 利益率列は右寄せ
                if (index === 4) {
                    td.className = "pl-table-td-standard dt-right";
                } else if (index > 0) {
                    td.className = "pl-table-td-standard dt-right";
                } else {
                    td.className = "pl-table-td-standard";
                }

                // 会社休日または土曜日の場合は背景色を設定
                if (backgroundColor) {
                    td.style.backgroundColor = backgroundColor;
                }

                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        container.appendChild(table);

        // DataTables機能を非同期で適用
        setTimeout(() => {
            this.enhanceRevenueSummaryTable("revenue-summary-table");
        }, 100);

        return container;
    }
    /**
     * 収益分析サマリテーブル専用のDataTables設定
     * @param tableId - テーブルのID
     * @returns DataTables APIインスタンス
     */
    static enhanceRevenueSummaryTable(tableId: string): DataTablesApi | null {
        const summaryTableOptions: DataTablesOptions = {
            paging: true, // ページングを有効化
            searching: true, // 検索を有効化
            ordering: true, // ソートを有効化
            info: false, // 情報表示を無効化
            dom: "Bt", // ボタンのみ表示
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
     * テーブルにDataTables機能を適用
     * @param tableId - テーブルのID
     * @param options - DataTablesのオプション
     * @returns DataTables APIインスタンス（利用可能な場合）
     */
    static enhanceTableWithDataTables(
        tableId: string,
        options: Partial<DataTablesOptions> = {}
    ): DataTablesApi | null {
        try {
            // DataTablesが利用可能かチェック
            if (!this.isDataTablesAvailable()) {
                return null;
            }

            // デフォルトオプション
            const defaultOptions: DataTablesOptions = {
                paging: true,
                pageLength: 50,
                searching: true,
                ordering: true,
                info: true,
                responsive: true,
                scrollX: false,
                fixedHeader: false,
                language: {
                    url: "//cdn.datatables.net/plug-ins/1.13.7/i18n/ja.json",
                },
                lengthMenu: [
                    [25, 50, 100, -1],
                    [25, 50, 100, "全て"],
                ],
                dom: '<"dt-top-controls"<"dt-length"l><"dt-buttons"B><"dt-search"f>>rtip',
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
                columnDefs: [
                    // 数値列の右寄せ設定
                    {
                        targets: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], // 数値列のインデックス
                        className: "dt-right",
                    },
                ],
            };

            // オプションをマージ
            const finalOptions = { ...defaultOptions, ...options };

            // DataTablesを適用
            const dataTable = $(`#${tableId}`).DataTable(finalOptions);

            // カスタムスタイルを適用
            this.applyCustomTableStyles(tableId);

            // 色分けラベルを追加（少し遅延させてDOM構築完了を待つ）
            setTimeout(() => {
                this.addColorLegendToDataTable(tableId);
            }, 100);

            Logger.debug(`DataTables が ${tableId} に適用されました`);
            return dataTable;
        } catch (error) {
            Logger.debug(`DataTables の適用でエラーが発生しました: ${error}`);
            return null;
        }
    }

    /**
     * 生産実績テーブル専用のDataTables設定
     * @param tableId - テーブルのID
     * @returns DataTables APIインスタンス
     */
    static enhanceProductionTable(tableId: string): DataTablesApi | null {
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
        };

        return this.enhanceTableWithDataTables(tableId, productionTableOptions);
    }

    /**
     * 損益計算テーブル専用のDataTables設定
     * @param tableId - テーブルのID
     * @returns DataTables APIインスタンス
     */
    static enhanceProfitCalculationTable(tableId: string): DataTablesApi | null {
        const calculationTableOptions: Partial<DataTablesOptions> = {
            order: [[0, "asc"]] as [number, "asc" | "desc"][], // 日付の昇順でソート
            scrollX: false,
            // fixedColumns: {
            //   leftColumns: 1, // 日付列を固定
            // },
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
        };

        return this.enhanceTableWithDataTables(tableId, calculationTableOptions);
    }

    /**
     * DataTablesの破棄
     * @param tableId - テーブルのID
     */
    static destroyDataTable(tableId: string): void {
        try {
            if (this.isDataTablesAvailable()) {
                const table = $(`#${tableId}`);
                if (table.length && $.fn.DataTable.isDataTable(table)) {
                    table.DataTable().destroy();
                    Logger.debug(`DataTable ${tableId} を破棄しました`);
                }
            }
        } catch (error) {
            Logger.debug(`DataTable破棄でエラーが発生しました: ${error}`);
        }
    }

    /**
     * テーブルデータの動的更新
     * @param tableId - テーブルのID
     * @param newData - 新しいデータ
     */
    static updateTableData(tableId: string, newData: unknown[]): void {
        try {
            if (this.isDataTablesAvailable()) {
                const table = $(`#${tableId}`);
                if (table.length && $.fn.DataTable.isDataTable(table)) {
                    const dataTable = table.DataTable();
                    dataTable.clear();
                    dataTable.rows.add(newData);
                    dataTable.draw();
                    Logger.debug(`テーブル ${tableId} のデータを更新しました`);
                }
            }
        } catch (error) {
            Logger.debug(`テーブルデータ更新でエラーが発生しました: ${error}`);
        }
    }

    /**
     * DataTablesライブラリの利用可能チェック
     * @returns boolean - 利用可能かどうか
     */
    static isDataTablesAvailable(): boolean {
        try {
            // jQueryとDataTablesの確認
            if (typeof $ === "undefined") {
                Logger.debug("jQuery が利用できません");
                return false;
            }

            if (!$.fn || !$.fn.DataTable) {
                Logger.debug("DataTables が利用できません");
                return false;
            }

            Logger.debug("DataTables は利用可能です");
            return true;
        } catch (error) {
            Logger.debug(`DataTables 利用可能チェックでエラー: ${error}`);
            return false;
        }
    }

    /**
     * カスタムテーブルスタイルを適用
     * DataTablesのテーブルラッパーに必要なCSSクラスを追加
     * @param tableId - テーブルのID
     */
    static applyCustomTableStyles(tableId: string): void {
        try {
            // DataTablesのwrapperにカスタムクラスを追加
            const wrapper = document.querySelector(`#${tableId}_wrapper`);
            if (wrapper) {
                wrapper.classList.add("dataTables_wrapper");
                Logger.debug(`カスタムスタイルクラスが ${tableId}_wrapper に適用されました`);
            } else {
                Logger.debug(`${tableId}_wrapper が見つからないため、スタイル適用をスキップします`);
            }
        } catch (error) {
            Logger.debug(`カスタムスタイル適用でエラーが発生しました: ${error}`);
        }
    }

    /**
     * 日付に応じた背景色を取得する
     * @param date - 日付文字列（YYYY-MM-DD形式）
     * @param holidayData - 会社休日マスタデータ
     * @returns 背景色の文字列、通常日の場合は空文字
     */
    static getDateBackgroundColor(
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

        // 土曜日の場合は薄いグレー（会社休日より優先度低め）
        if (dayOfWeek === 6) {
            return "#f5f5f5"; // 薄いグレー
        }

        // 通常日は背景色なし
        return "";
    }

    /**
     * 色分けラベルを作成する
     * @returns 色分けラベルのHTML要素
     */
    static createColorLegend(): HTMLDivElement {
        const legend = document.createElement("div");
        legend.className = "color-legend";

        // 各色分けアイテムを作成
        const legendItems = [
            { className: "legal-holiday", label: "法定休日" },
            { className: "company-holiday", label: "所定休日" },
            { className: "collective-leave", label: "一斉有給" },
            { className: "saturday", label: "土曜日" },
        ];

        legendItems.forEach((item) => {
            const legendItem = document.createElement("div");
            legendItem.className = "color-legend-item";

            const colorBox = document.createElement("div");
            colorBox.className = `color-legend-box ${item.className}`;

            const label = document.createElement("span");
            label.textContent = item.label;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            legend.appendChild(legendItem);
        });

        return legend;
    }

    /**
     * DataTablesの検索バーの右に色分けラベルを追加する
     * @param tableId - テーブルのID
     */
    static addColorLegendToDataTable(tableId: string): void {
        try {
            // DataTablesのfilter要素を取得
            const filterElement = document.querySelector(`#${tableId}_filter`);
            if (filterElement) {
                // 既存の凡例があれば削除
                const existingLegend = filterElement.querySelector(".color-legend");
                if (existingLegend) {
                    existingLegend.remove();
                }

                // 新しい色分けラベルを作成して追加
                const colorLegend = this.createColorLegend();
                filterElement.appendChild(colorLegend);

                Logger.debug(`色分けラベルが ${tableId} に追加されました`);
            } else {
                Logger.debug(
                    `${tableId}_filter が見つからないため、色分けラベル追加をスキップします`
                );
            }
        } catch (error) {
            Logger.debug(`色分けラベル追加でエラーが発生しました: ${error}`);
        }
    }

    /**
     * デバッグ用のログ出力
     * @param message - ログメッセージ
     * @param data - ログデータ
     */
    static debugLog(message: string, data?: unknown): void {
        Logger.debug(`[TableBuilder] ${message}`, data);
    }
}
