/// <reference path="../../../../kintone.d.ts" />
/// <reference path="../../../../globals.d.ts" />
/// <reference path="../fields/daily_fields.d.ts" />
/// <reference path="../fields/line_daily_fields.d.ts" />
/// <reference path="../fields/month_fields.d.ts" />
/// <reference path="../fields/model_master_fields.d.ts" />

import { ProductHistoryData, TotalsByDate } from "../types";
import { Logger } from "../utils";

// jQueryを最初にインポート（DataTablesが依存するため）
import $ from "jquery";

// jQueryをグローバルに設定
(window as any).$ = $;
(window as any).jQuery = $;

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
        data: any[],
        options: {
            stickyHeader?: boolean;
            className?: string;
            bodyClassName?: string;
        } = {}
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
            noDataMessage.className = "pl-no-data-message";
            container.appendChild(noDataMessage);
            return container;
        }

        // 月次データから社員単価と派遣単価を取得
        const inside_unit = plMonthlyData ? Number(plMonthlyData.inside_unit?.value || 0) : 0;
        const outside_unit = plMonthlyData ? Number(plMonthlyData.outside_unit?.value || 0) : 0;

        // テーブルカラム
        const columns = [
            "日付",
            "ライン",
            "機種名",
            "台数",
            "付加価値",
            "社員工数(h)",
            "社員工数(円)",
            "派遣工数(h)",
            "派遣工数(円)",
            "【社】残業工数(h)",
            "【社】残業工数(円)",
            "派残業工数(h)",
            "派残業工数(円)",
            "経費合計",
            "粗利益",
            "利益率",
        ];

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
     * @returns 損益計算テーブルのコンテナ要素
     */
    static createProfitCalculationTable(
        dailyReportData: daily.SavedFields[],
        filteredRecords: line_daily.SavedFields[],
        plMonthlyData: monthly.SavedFields | null,
        getDateList: () => string[],
        getTotalsByDate: (date: string) => TotalsByDate,
        getRecordsByDate: (date: string) => daily.SavedFields[],
        getDayOfWeek: (date: Date) => string
    ): HTMLDivElement {
        const columns = [
            "日付",
            "付加価値売上高",
            "直行人員",
            "直行経費",
            "派遣社員",
            "派遣経費",
            "間接人員",
            "間接経費",
            "直行残業(h)",
            "直行休出(h)",
            "直行経費",
            "派遣残業(h)",
            "派遣休出(h)",
            "派遣経費",
            "間接残業(h)",
            "間接休出(h)",
            "間接経費",
            "直行/間接人件費(残業・休出含まない）",
            "間接材料費",
            "間接材料費,残業休出経費以外",
            "夜勤手当",
            "工具器具消耗品、荷造運賃",
            "残業経費（社員）",
            "残業経費（派遣）",
            "休出経費（社員）",
            "休出経費（派遣）",
            "派遣人員経費",
            "総人員/製造経費 計",
            "一人当/付加価値（打）",
            "一人当/粗利益（打）",
            "実績 粗利益率（打）",
            "EBITDA（打）",
            "EBITDA率",
        ];

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
        dateList.forEach((date) => {
            const totals = getTotalsByDate(date);
            const row = document.createElement("tr");
            row.className = "recordlist-row-gaia recordlist-row-gaia-hover-highlight";

            const records = getRecordsByDate(date);
            const firstRecord: daily.SavedFields | null = records.length > 0 ? records[0] : null;

            // firstRecordがnullの場合は処理を終了
            if (!firstRecord) {
                Logger.warn(`日付 ${date} のPL日次データが存在しません。`);
                return;
            }

            // 派遣経費を計算する
            const outside_overtime_cost = firstRecord
                ? Number(firstRecord.outside_overtime_cost?.value || 0)
                : 0;
            const outside_holiday_expenses = firstRecord
                ? Number(firstRecord.outside_holiday_expenses?.value || 0)
                : 0;
            const dispatch_expenses = outside_overtime_cost + outside_holiday_expenses;

            // 日付を短い形式(mm/dd(曜日))に変換※月と日付は０埋めして２桁に
            const dateObj = new Date(totals.date);
            const formattedDate = `${String(dateObj.getMonth() + 1).padStart(
                2,
                "0"
            )}/${String(dateObj.getDate()).padStart(2, "0")}(${getDayOfWeek(dateObj)})`;

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
            const unit_price = plMonthlyData?.direct?.value
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
            unit_overtime_cost = plMonthlyData?.dispatch?.value
                ? (Number(plMonthlyData?.dispatch?.value) * 1.25) / 1000
                : 0;
            unit_holiday_cost = plMonthlyData?.dispatch?.value
                ? (Number(plMonthlyData?.dispatch?.value) * 1.35) / 1000
                : 0;
            const totalOutsideOvertime = totals.totalOutsideOvertime
                ? Math.round(totals.totalOutsideOvertime * unit_overtime_cost)
                : 0;
            const totalOutsideHolidayOvertime = totals.totalOutsideHolidayOvertime
                ? Math.round(totals.totalOutsideHolidayOvertime * unit_holiday_cost)
                : 0;
            const dispatchOvertimeAndHolidayCost =
                totalOutsideOvertime + totalOutsideHolidayOvertime;
            // 間接残業(1.25)&休出経費(1.35)を計算
            unit_overtime_cost = plMonthlyData?.indirect?.value
                ? (Number(plMonthlyData?.indirect?.value) * 1.25) / 1000
                : 0;
            unit_holiday_cost = plMonthlyData?.indirect?.value
                ? (Number(plMonthlyData?.indirect?.value) * 1.35) / 1000
                : 0;
            const indirectOvertime = firstRecord
                ? Math.round(Number(firstRecord.indirect_overtime?.value) * unit_overtime_cost)
                : 0;
            const indirectHolidayWork = firstRecord
                ? Math.round(Number(firstRecord.indirect_holiday_work?.value) * unit_holiday_cost)
                : 0;
            const indirectOvertimeAndHolidayCost = indirectOvertime + indirectHolidayWork;
            console.log(firstRecord?.indirect_overtime?.value);
            // 各列のデータを明示的に指定
            const cellValues = [
                formattedDate,
                roundedAddedValue, // 付加価値売上高
                firstRecord?.direct_personnel?.value || "0", // 直行人員
                direct_cost, // 直行経費
                firstRecord?.temporary_employees?.value || "0", // 派遣社員
                dispatch_cost, // 派遣経費
                firstRecord?.indirect_personnel?.value || "0", // 間接人員
                indirect_cost, // 間接経費
                totals.totalInsideOvertime, // 直行残業(h)
                totals.totalInsideHolidayOvertime, // 直行休出(h)
                directOvertimeAndHolidayCost, // 直行残業&休出経費
                totals.totalOutsideOvertime, // 派遣残業(h)
                totals.totalOutsideHolidayOvertime, // 派遣休出(h)
                dispatchOvertimeAndHolidayCost, // 派遣残業&休出経費
                firstRecord?.indirect_overtime?.value || 0, // 間接残業(h)
                firstRecord?.indirect_holiday_work?.value || 0, // 間接休出(h)
                indirectOvertimeAndHolidayCost, // 間接残業&休出経費
                firstRecord ? firstRecord.labor_costs?.value || 0 : 0, // 直行/間接人件費(残業・休出含まない）
                firstRecord ? firstRecord.indirect_material_costs?.value || 0 : 0, // 間接材料費
                other_indirect_material_costs, // 間接材料費,残業休出経費以外
                firstRecord ? firstRecord.night_shift_allowance?.value || 0 : 0, // 夜勤手当
                firstRecord ? firstRecord.total_sub_cost?.value || 0 : 0, // 工具器具消耗品、荷造運賃
                firstRecord ? firstRecord.inside_overtime_cost?.value || 0 : 0, // 残業経費（社員）
                firstRecord ? firstRecord.outside_overtime_cost?.value || 0 : 0, // 残業経費（派遣）
                firstRecord ? firstRecord.inside_holiday_expenses?.value || 0 : 0, // 休出経費（社員）
                firstRecord ? firstRecord.outside_holiday_expenses?.value || 0 : 0, // 休出経費（派遣）
                dispatch_expenses, // 休出経費（派遣）
                "", // 総人員/製造経費 計
                "", // 一人当/付加価値（打）
                "", // 一人当/粗利益（打）
                "", // 実績 粗利益率（打）
                "", // EBITDA（打）
                "", // EBITDA率
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

                row.appendChild(td);
            });

            tbody.appendChild(row);
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
     * @returns 収益分析サマリテーブルのコンテナ要素
     */
    static createRevenueAnalysisSummaryTable(): HTMLDivElement {
        // カラムを設定
        const columns = ["日付", "付加価値", "経費", "粗利益", "利益率"];
        // コンテナ要素を作成
        const container = document.createElement("div");
        container.id = "revenue-analysis-summary-table";
        container.className = "pl-table-container";
        // テーブル要素の作成
        const table = this.createTable("revenue-summary-table", "pl-summary-table");
        // ヘッダー行の作成
        const thead = this.createStickyTableHeader(columns);
        table.appendChild(thead);
        // ボディ行の作成
        const tbody = this.createTableBody();
        const row = this.createTableRow(columns.map(() => this.createTableCell("0", true)));
        tbody.appendChild(row);
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
    static enhanceRevenueSummaryTable(tableId: string): any | null {
        const summaryTableOptions: any = {
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
                    className: "dt-right profit-rate-column",
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
    static enhanceTableWithDataTables(tableId: string, options: any = {}): any | null {
        try {
            // DataTablesが利用可能かチェック
            if (!this.isDataTablesAvailable()) {
                return null;
            }

            // デフォルトオプション
            const defaultOptions: any = {
                paging: true,
                pageLength: 25,
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
    static enhanceProductionTable(tableId: string): any | null {
        const productionTableOptions: any = {
            order: [[0, "desc"]], // 日付の降順でソート
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
                    className: "dt-right profit-rate-column",
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
    static enhanceProfitCalculationTable(tableId: string): any | null {
        const calculationTableOptions: any = {
            order: [[0, "asc"]], // 日付の昇順でソート
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
    static updateTableData(tableId: string, newData: any[]): void {
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
     * デバッグ用のログ出力
     * @param message - ログメッセージ
     * @param data - ログデータ
     */
    static debugLog(message: string, data?: any): void {
        Logger.debug(`[TableBuilder] ${message}`, data);
    }
}
