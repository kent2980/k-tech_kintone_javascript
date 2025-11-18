/// <reference path="../../../kintone.d.ts" />
/// <reference path="../../../globals.d.ts" />
/// <reference path="./fields/daily_fields.d.ts" />
/// <reference path="./fields/line_daily_fields.d.ts" />
/// <reference path="./fields/month_fields.d.ts" />
/// <reference path="./fields/model_master_fields.d.ts" />

// Import styles
import "./styles/components/filter.css";
import "./styles/components/table.css";
import "./styles/components/tabs.css";
import "./styles/mobile.css";

// Import modular components
import { FilterConfig, ProductHistoryData } from "./types";

import { DateUtil, Logger, PerformanceUtil } from "./utils";

import { KintoneApiService } from "./services";

import { PLDomBuilder } from "./components";

(function () {
    "use strict";

    // モバイル検知関数（削除 - kintoneマニフェスト設定で自動選択）
    // function isMobileDevice(): boolean {
    //   return (
    //     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    //     window.innerWidth <= 768
    //   );
    // }

    // グローバル変数
    let masterModelData: model_master.SavedFields[] | null = null;
    let dailyReportData: daily.SavedFields[] = [];
    const product_history_data: ProductHistoryData[] = [];
    let plMonthlyData: monthly.SavedFields | null = null;
    let filteredRecords: line_daily.SavedFields[] = [];

    // PLDomBuilder のインスタンスを作成
    const domBuilder = new PLDomBuilder();

    // パッシブイベントリスナーのサポート検出
    let supportsPassive = false;
    try {
        const opts = Object.defineProperty({}, "passive", {
            get: function () {
                supportsPassive = true;
                return false;
            },
        });
        window.addEventListener("test", null as any, opts);
        window.removeEventListener("test", null as any, opts);
    } catch (e) {
        supportsPassive = false;
    }

    /**
     * パッシブオプション付きでイベントリスナーを追加する
     * @param element - 対象要素
     * @param event - イベント名
     * @param handler - ハンドラー関数
     * @param passive - パッシブモードを使用するか
     */
    function addEventListenerWithPassive(
        element: Element,
        event: string,
        handler: EventListener,
        passive: boolean = false
    ) {
        const options = supportsPassive ? { passive } : false;
        element.addEventListener(event, handler, options);
    }

    /**
     * 曜日を取得する
     * @param dateObj - 日付オブジェクト
     * @returns 曜日
     */
    function getDayOfWeek(dateObj: Date): string {
        return DateUtil.getDayOfWeek(dateObj);
    }

    /**
     * ラベル要素を作成する（モバイル最適化）
     * @param text - ラベルのテキスト
     * @param forId - for属性の値
     * @param marginBottom - 下マージン（モバイル用）
     * @returns ラベル要素
     */
    function createMobileLabel(
        text: string,
        forId: string,
        marginBottom: string = "5px"
    ): HTMLLabelElement {
        const label = document.createElement("label");
        label.textContent = text;
        label.setAttribute("for", forId);
        label.style.display = "block";
        label.style.marginBottom = marginBottom;
        label.style.fontSize = "14px";
        label.style.fontWeight = "bold";
        label.style.color = "#333";
        return label;
    }

    /**
     * モバイル用フィルターコンテナを作成する
     * @returns フィルターコンテナ
     */
    function createMobileFilterContainer(): HTMLDivElement {
        const container = document.createElement("div");
        container.className = "mobile-filter-container mobile-filter-compact";
        container.style.padding = "10px";
        container.style.backgroundColor = "#f8f9fa";
        container.style.borderRadius = "6px";
        container.style.margin = "8px";
        container.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";

        // テーブル選択グループ
        const tableGroup = document.createElement("div");
        tableGroup.className = "mobile-filter-group";
        tableGroup.style.marginBottom = "10px";

        const tableLabel = createMobileLabel("表示テーブル", "table-select", "3px");
        tableLabel.style.fontSize = "12px";
        tableGroup.appendChild(tableLabel);

        const tableSelect = document.createElement("select");
        tableSelect.id = "table-select";
        tableSelect.className = "mobile-filter-select";
        tableSelect.style.width = "100%";
        tableSelect.style.padding = "6px";
        tableSelect.style.fontSize = "14px";
        tableSelect.style.border = "1px solid #ddd";
        tableSelect.style.borderRadius = "4px";

        // テーブル選択オプション
        const options = [
            { value: "production", text: "📊 生産実績テーブル" },
            { value: "profit", text: "💰 損益計算テーブル" },
        ];

        options.forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            tableSelect.appendChild(optionElement);
        });

        tableGroup.appendChild(tableSelect);

        // 年月選択を横並びにするコンテナ
        const dateRow = document.createElement("div");
        dateRow.className = "mobile-filter-row";
        dateRow.style.display = "flex";
        dateRow.style.gap = "8px";

        // 年フィルターグループ
        const yearGroup = document.createElement("div");
        yearGroup.className = "mobile-filter-group";
        yearGroup.style.flex = "1";

        const yearLabel = createMobileLabel("年", "year-select", "3px");
        yearLabel.style.fontSize = "12px";
        yearGroup.appendChild(yearLabel);

        const yearSelect = domBuilder.createYearSelect(10);
        yearSelect.className = "mobile-filter-select";
        yearSelect.style.width = "100%";
        yearSelect.style.padding = "6px";
        yearSelect.style.fontSize = "14px";
        yearSelect.style.border = "1px solid #ddd";
        yearSelect.style.borderRadius = "4px";
        yearGroup.appendChild(yearSelect);

        // 月フィルターグループ
        const monthGroup = document.createElement("div");
        monthGroup.className = "mobile-filter-group";
        monthGroup.style.flex = "1";

        const monthLabel = createMobileLabel("月", "month-select", "3px");
        monthLabel.style.fontSize = "12px";
        monthGroup.appendChild(monthLabel);

        const monthSelect = domBuilder.createMonthSelect();
        monthSelect.className = "mobile-filter-select";
        monthSelect.style.width = "100%";
        monthSelect.style.padding = "6px";
        monthSelect.style.fontSize = "14px";
        monthSelect.style.border = "1px solid #ddd";
        monthSelect.style.borderRadius = "4px";
        monthGroup.appendChild(monthSelect);

        dateRow.appendChild(yearGroup);
        dateRow.appendChild(monthGroup);

        container.appendChild(tableGroup);
        container.appendChild(dateRow);

        return container;
    }

    /**
     * モバイル用カード表示を作成する
     * @param records - レコードデータ
     * @returns カードコンテナ
     */
    function createMobileCardView(records: line_daily.SavedFields[]): HTMLDivElement {
        const container = document.createElement("div");
        container.className = "mobile-card-container";
        container.style.padding = "10px";

        if (!records || records.length === 0) {
            const noDataMessage = document.createElement("div");
            noDataMessage.textContent = "該当するデータが存在しません。";
            noDataMessage.style.textAlign = "center";
            noDataMessage.style.padding = "20px";
            noDataMessage.style.color = "#666";
            noDataMessage.style.fontSize = "14px";
            container.appendChild(noDataMessage);
            return container;
        }

        records.forEach((record, index) => {
            const card = document.createElement("div");
            card.className = "mobile-card";
            card.style.backgroundColor = "#fff";
            card.style.border = "1px solid #e0e0e0";
            card.style.borderRadius = "8px";
            card.style.margin = "10px 0";
            card.style.padding = "15px";
            card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

            // カードヘッダー（日付とライン）
            const cardHeader = document.createElement("div");
            cardHeader.style.borderBottom = "1px solid #eee";
            cardHeader.style.paddingBottom = "10px";
            cardHeader.style.marginBottom = "10px";

            const dateDisplay = document.createElement("div");
            const dateObj = new Date(record.date?.value || "");
            const formattedDate = `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(dateObj.getDate()).padStart(2, "0")}(${getDayOfWeek(dateObj)})`;
            dateDisplay.textContent = formattedDate;
            dateDisplay.style.fontSize = "16px";
            dateDisplay.style.fontWeight = "bold";
            dateDisplay.style.color = "#2c3e50";

            const lineDisplay = document.createElement("div");
            lineDisplay.textContent = `ライン: ${record.line_name?.value || "未設定"}`;
            lineDisplay.style.fontSize = "14px";
            lineDisplay.style.color = "#7f8c8d";
            lineDisplay.style.marginTop = "5px";

            cardHeader.appendChild(dateDisplay);
            cardHeader.appendChild(lineDisplay);

            // カードボディ（詳細情報）
            const cardBody = document.createElement("div");

            const details = [
                { label: "機種名", value: record.model_name?.value || "未設定" },
                { label: "台数", value: record.actual_number?.value || "0" },
                { label: "社員工数", value: `${record.inside_time?.value || "0"}h` },
                { label: "派遣工数", value: `${record.outside_time?.value || "0"}h` },
                { label: "社員残業", value: `${record.inside_overtime?.value || "0"}h` },
                { label: "派遣残業", value: `${record.outside_overtime?.value || "0"}h` },
            ];

            details.forEach((detail) => {
                const row = document.createElement("div");
                row.style.display = "flex";
                row.style.justifyContent = "space-between";
                row.style.alignItems = "center";
                row.style.padding = "5px 0";
                row.style.borderBottom = "1px solid #f8f9fa";

                const label = document.createElement("span");
                label.textContent = detail.label;
                label.style.fontSize = "14px";
                label.style.color = "#555";
                label.style.fontWeight = "500";

                const value = document.createElement("span");
                value.textContent = detail.value;
                value.style.fontSize = "14px";
                value.style.color = "#2c3e50";
                value.style.fontWeight = "bold";

                row.appendChild(label);
                row.appendChild(value);
                cardBody.appendChild(row);
            });

            card.appendChild(cardHeader);
            card.appendChild(cardBody);
            container.appendChild(card);
        });

        return container;
    }

    /**
     * モバイル用生産実績カードビューを作成する
     * @param records - 生産実績データ（ライン日次データ）
     * @param plMonthlyData - 月次データ
     * @param masterModelData - マスタ機種データ
     * @returns 生産実績カードコンテナ
     */
    function createMobileProductionCards(
        records: line_daily.SavedFields[],
        plMonthlyData: monthly.SavedFields | null,
        masterModelData: model_master.SavedFields[]
    ): HTMLDivElement {
        const container = document.createElement("div");
        container.className = "mobile-card-container";
        container.style.padding = "10px";

        if (!records || records.length === 0) {
            const noDataMessage = document.createElement("div");
            noDataMessage.textContent = "該当する生産実績データが存在しません。";
            noDataMessage.style.textAlign = "center";
            noDataMessage.style.padding = "20px";
            noDataMessage.style.color = "#666";
            noDataMessage.style.fontSize = "14px";
            container.appendChild(noDataMessage);
            return container;
        }

        // 月次データから単価を取得
        const inside_unit = plMonthlyData ? Number(plMonthlyData.inside_unit?.value || 0) : 0;
        const outside_unit = plMonthlyData ? Number(plMonthlyData.outside_unit?.value || 0) : 0;

        // デバッグ用ログ
        Logger.info(`[生産実績カード] 月次データ存在: ${plMonthlyData ? "あり" : "なし"}`);
        if (plMonthlyData) {
            Logger.info(`[生産実績カード] 社員単価: ${inside_unit}, 派遣単価: ${outside_unit}`);
        }

        records.forEach((record, index) => {
            const card = document.createElement("div");
            card.className = "mobile-card production-card";
            card.style.backgroundColor = "#fff";
            card.style.border = "1px solid #e0e0e0";
            card.style.borderLeft = "4px solid #3498db";
            card.style.borderRadius = "8px";
            card.style.margin = "10px 0";
            card.style.padding = "15px";
            card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

            // カードヘッダー（日付とライン）
            const cardHeader = document.createElement("div");
            cardHeader.style.borderBottom = "1px solid #eee";
            cardHeader.style.paddingBottom = "10px";
            cardHeader.style.marginBottom = "15px";

            const dateDisplay = document.createElement("div");
            const dateObj = new Date(record.date?.value || "");
            const formattedDate = `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(dateObj.getDate()).padStart(2, "0")}(${getDayOfWeek(dateObj)})`;
            dateDisplay.textContent = formattedDate;
            dateDisplay.style.fontSize = "16px";
            dateDisplay.style.fontWeight = "bold";
            dateDisplay.style.color = "#2c3e50";

            const lineDisplay = document.createElement("div");
            lineDisplay.textContent = `ライン: ${record.line_name?.value || "未設定"}`;
            lineDisplay.style.fontSize = "14px";
            lineDisplay.style.color = "#7f8c8d";
            lineDisplay.style.marginTop = "5px";

            cardHeader.appendChild(dateDisplay);
            cardHeader.appendChild(lineDisplay);

            // 基本データの計算
            const actualNumber = Number(record.actual_number?.value || 0);
            const modelName = record.model_name?.value || "";
            let addedValue = 0;

            // デバッグ用ログ - 台数取得の詳細
            Logger.info(`[生産実績カード] 機種名: ${modelName}, 実績台数: ${actualNumber}`);
            Logger.info(
                `[生産実績カード] 実績台数フィールドの生データ: ${JSON.stringify(record.actual_number)}`
            );
            Logger.info(
                `[生産実績カード] 予定台数フィールドの生データ: ${JSON.stringify(record.production_number)}`
            );
            Logger.info(
                `[生産実績カード] レコード全体（一部）: ${JSON.stringify({
                    date: record.date,
                    model_name: record.model_name,
                    actual_number: record.actual_number,
                    production_number: record.production_number,
                    line_name: record.line_name,
                })}`
            );
            Logger.info(`[生産実績カード] マスタデータ件数: ${masterModelData.length}`);

            // マスタデータから付加価値を取得
            const matchedModel = masterModelData.find(
                (item) => item.model_name.value === modelName
            );
            if (matchedModel) {
                const unitAddedValue = Number(matchedModel.added_value?.value || 0);
                addedValue = unitAddedValue * actualNumber;
                Logger.info(
                    `[生産実績カード] マッチした機種の単価付加価値: ${unitAddedValue}, 計算後付加価値: ${addedValue}`
                );
            } else {
                Logger.warn(
                    `[生産実績カード] 機種名「${modelName}」がマスタデータに見つかりません`
                );
                // マスタデータの全機種名を表示
                const allModelNames = masterModelData
                    .map((item) => item.model_name.value)
                    .join(", ");
                Logger.info(`[生産実績カード] 利用可能な機種名: ${allModelNames}`);
            }

            // 工数と経費の計算
            const insideTime = Number(record.inside_time?.value || 0);
            const outsideTime = Number(record.outside_time?.value || 0);
            const insideOvertime = Number(record.inside_overtime?.value || 0);
            const outsideOvertime = Number(record.outside_overtime?.value || 0);

            const insideCost = insideTime * inside_unit;
            const outsideCost = outsideTime * outside_unit;
            const insideOvertimeCost = insideOvertime * inside_unit * 1.25;
            const outsideOvertimeCost = outsideOvertime * outside_unit * 1.25;

            const totalCost = insideCost + outsideCost + insideOvertimeCost + outsideOvertimeCost;
            const grossProfit = addedValue - totalCost;
            const profitRate = addedValue > 0 ? (grossProfit / addedValue) * 100 : 0;

            // デバッグ用ログ
            Logger.info(
                `[生産実績カード] 工数 - 社員: ${insideTime}h, 派遣: ${outsideTime}h, 社員残業: ${insideOvertime}h, 派遣残業: ${outsideOvertime}h`
            );
            Logger.info(
                `[生産実績カード] 経費 - 社員: ¥${insideCost}, 派遣: ¥${outsideCost}, 社員残業: ¥${insideOvertimeCost}, 派遣残業: ¥${outsideOvertimeCost}`
            );
            Logger.info(
                `[生産実績カード] 計算結果 - 付加価値: ¥${addedValue}, 総経費: ¥${totalCost}, 粗利益: ¥${grossProfit}, 利益率: ${profitRate.toFixed(2)}%`
            );

            // カードボディ（詳細情報）
            const cardBody = document.createElement("div");

            const details = [
                { label: "機種名", value: modelName || "未設定", important: true },
                { label: "台数", value: `${actualNumber}台`, important: true },
                { label: "付加価値", value: `¥${addedValue.toLocaleString()}`, important: true },
                { label: "社員工数", value: `${insideTime}h (¥${insideCost.toLocaleString()})` },
                { label: "派遣工数", value: `${outsideTime}h (¥${outsideCost.toLocaleString()})` },
                {
                    label: "社員残業",
                    value: `${insideOvertime}h (¥${insideOvertimeCost.toLocaleString()})`,
                },
                {
                    label: "派遣残業",
                    value: `${outsideOvertime}h (¥${outsideOvertimeCost.toLocaleString()})`,
                },
                { label: "経費合計", value: `¥${totalCost.toLocaleString()}`, important: true },
                {
                    label: "粗利益",
                    value: `¥${grossProfit.toLocaleString()}`,
                    important: true,
                    profit: grossProfit >= 0,
                },
                {
                    label: "利益率",
                    value: `${profitRate.toFixed(1)}%`,
                    important: true,
                    profit: profitRate >= 0,
                },
            ];

            details.forEach((detail) => {
                const row = document.createElement("div");
                row.style.display = "flex";
                row.style.justifyContent = "space-between";
                row.style.alignItems = "center";
                row.style.padding = "6px 0";
                row.style.borderBottom = "1px solid #f8f9fa";

                if (detail.important) {
                    row.style.backgroundColor = "#f8f9fa";
                    row.style.margin = "0 -5px";
                    row.style.padding = "8px 5px";
                    row.style.borderRadius = "4px";
                }

                const label = document.createElement("span");
                label.textContent = detail.label;
                label.style.fontSize = "14px";
                label.style.color = detail.important ? "#2c3e50" : "#555";
                label.style.fontWeight = detail.important ? "600" : "500";

                const value = document.createElement("span");
                value.textContent = detail.value;
                value.style.fontSize = detail.important ? "15px" : "14px";
                value.style.fontWeight = "bold";

                if (Object.prototype.hasOwnProperty.call(detail, "profit")) {
                    value.style.color = detail.profit ? "#27ae60" : "#e74c3c";
                } else {
                    value.style.color = detail.important ? "#2c3e50" : "#34495e";
                }

                row.appendChild(label);
                row.appendChild(value);
                cardBody.appendChild(row);
            });

            card.appendChild(cardHeader);
            card.appendChild(cardBody);
            container.appendChild(card);
        });

        return container;
    }

    /**
     * モバイル用損益計算カードビューを作成する
     * @param dailyReportData - 日次データ
     * @param filteredRecords - フィルター済みレコード
     * @param plMonthlyData - 月次データ
     * @param masterModelData - マスタ機種データ
     * @returns 損益計算カードコンテナ
     */
    function createMobileProfitCards(
        dailyReportData: daily.SavedFields[],
        filteredRecords: line_daily.SavedFields[],
        plMonthlyData: monthly.SavedFields | null,
        masterModelData: model_master.SavedFields[]
    ): HTMLDivElement {
        const container = document.createElement("div");
        container.className = "mobile-card-container";
        container.style.padding = "10px";

        if (!dailyReportData || dailyReportData.length === 0) {
            const noDataMessage = document.createElement("div");
            noDataMessage.textContent = "該当する損益計算データが存在しません。";
            noDataMessage.style.textAlign = "center";
            noDataMessage.style.padding = "20px";
            noDataMessage.style.color = "#666";
            noDataMessage.style.fontSize = "14px";
            container.appendChild(noDataMessage);
            return container;
        }

        // 日付ごとにデータをグループ化
        const dateGroups: {
            [key: string]: { dailyData: daily.SavedFields; lineRecords: line_daily.SavedFields[] };
        } = {};

        dailyReportData.forEach((dailyRecord) => {
            const date = dailyRecord.date?.value || "";
            const lineRecordsForDate = filteredRecords.filter(
                (record) => record.date?.value === date
            );
            dateGroups[date] = { dailyData: dailyRecord, lineRecords: lineRecordsForDate };
        });

        Object.keys(dateGroups)
            .sort()
            .forEach((date) => {
                const { dailyData, lineRecords } = dateGroups[date];

                const card = document.createElement("div");
                card.className = "mobile-card profit-card";
                card.style.backgroundColor = "#fff";
                card.style.border = "1px solid #e0e0e0";
                card.style.borderLeft = "4px solid #f39c12";
                card.style.borderRadius = "8px";
                card.style.margin = "10px 0";
                card.style.padding = "15px";
                card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

                // カードヘッダー（日付）
                const cardHeader = document.createElement("div");
                cardHeader.style.borderBottom = "1px solid #eee";
                cardHeader.style.paddingBottom = "10px";
                cardHeader.style.marginBottom = "15px";

                const dateObj = new Date(date);
                const formattedDate = `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(dateObj.getDate()).padStart(2, "0")}(${getDayOfWeek(dateObj)})`;

                const dateDisplay = document.createElement("div");
                dateDisplay.textContent = formattedDate;
                dateDisplay.style.fontSize = "16px";
                dateDisplay.style.fontWeight = "bold";
                dateDisplay.style.color = "#2c3e50";

                cardHeader.appendChild(dateDisplay);

                // 損益計算データ（実際のフィールド名を使用）
                const directPersonnel = Number(dailyData.direct_personnel?.value || 0);
                const temporaryEmployees = Number(dailyData.temporary_employees?.value || 0);
                const indirectPersonnel = Number(dailyData.indirect_personnel?.value || 0);

                // 月次データから単価を取得してコストを計算
                const directCost = plMonthlyData
                    ? directPersonnel * Number(plMonthlyData.direct?.value || 0)
                    : 0;
                const dispatchCost = plMonthlyData
                    ? temporaryEmployees * Number(plMonthlyData.dispatch?.value || 0)
                    : 0;
                const indirectCost = plMonthlyData
                    ? indirectPersonnel * Number(plMonthlyData.indirect?.value || 0)
                    : 0;

                // 付加価値売上高を計算（ライン日次データから）
                let addedValueSales = 0;
                Logger.info(`[損益計算] ${date}の計算開始 - ライン数: ${lineRecords.length}`);

                lineRecords.forEach((lineRecord, index) => {
                    const actualProduction = Number(lineRecord.actual_number?.value || 0);
                    const plannedProduction = Number(lineRecord.production_number?.value || 0);
                    const modelName = lineRecord.model_name?.value || "";
                    const matchedModel = masterModelData?.find(
                        (item) => item.model_name.value === modelName
                    );

                    Logger.info(
                        `[損益計算] ライン${index + 1}: 機種=${modelName}, 実績=${actualProduction}, 予定=${plannedProduction}`
                    );

                    if (matchedModel) {
                        const unitAddedValue = Number(matchedModel.added_value?.value || 0);
                        const lineAddedValue = unitAddedValue * actualProduction;
                        addedValueSales += lineAddedValue;
                        Logger.info(
                            `[損益計算] マスタ単価=${unitAddedValue}, ライン付加価値=${lineAddedValue}`
                        );
                    } else {
                        Logger.warn(`[損益計算] マスタデータ未見つけ: ${modelName}`);
                    }
                });

                Logger.info(`[損益計算] ${date}の付加価値売上高合計: ${addedValueSales}`);

                const totalExpense = directCost + dispatchCost + indirectCost;
                const grossProfit = addedValueSales - totalExpense;
                const profitRate = addedValueSales > 0 ? (grossProfit / addedValueSales) * 100 : 0;

                // カードボディ
                const cardBody = document.createElement("div");

                const profitDetails = [
                    {
                        label: "付加価値売上高",
                        value: `¥${addedValueSales.toLocaleString()}`,
                        important: true,
                    },
                    { label: "直行人員", value: `${directPersonnel}人` },
                    { label: "直行経費", value: `¥${directCost.toLocaleString()}` },
                    { label: "派遣社員", value: `${temporaryEmployees}人` },
                    { label: "派遣経費", value: `¥${dispatchCost.toLocaleString()}` },
                    { label: "間接人員", value: `${indirectPersonnel}人` },
                    { label: "間接経費", value: `¥${indirectCost.toLocaleString()}` },
                    {
                        label: "総経費",
                        value: `¥${totalExpense.toLocaleString()}`,
                        important: true,
                    },
                    {
                        label: "粗利益",
                        value: `¥${grossProfit.toLocaleString()}`,
                        important: true,
                        profit: grossProfit >= 0,
                    },
                    {
                        label: "利益率",
                        value: `${profitRate.toFixed(1)}%`,
                        important: true,
                        profit: profitRate >= 0,
                    },
                ];

                profitDetails.forEach((detail) => {
                    const row = document.createElement("div");
                    row.style.display = "flex";
                    row.style.justifyContent = "space-between";
                    row.style.alignItems = "center";
                    row.style.padding = "6px 0";
                    row.style.borderBottom = "1px solid #f8f9fa";

                    if (detail.important) {
                        row.style.backgroundColor = "#f8f9fa";
                        row.style.margin = "0 -5px";
                        row.style.padding = "8px 5px";
                        row.style.borderRadius = "4px";
                    }

                    const label = document.createElement("span");
                    label.textContent = detail.label;
                    label.style.fontSize = "14px";
                    label.style.color = detail.important ? "#2c3e50" : "#555";
                    label.style.fontWeight = detail.important ? "600" : "500";

                    const value = document.createElement("span");
                    value.textContent = detail.value;
                    value.style.fontSize = detail.important ? "15px" : "14px";
                    value.style.fontWeight = "bold";

                    if (Object.prototype.hasOwnProperty.call(detail, "profit")) {
                        value.style.color = detail.profit ? "#27ae60" : "#e74c3c";
                    } else {
                        value.style.color = detail.important ? "#2c3e50" : "#34495e";
                    }

                    row.appendChild(label);
                    row.appendChild(value);
                    cardBody.appendChild(row);
                });

                card.appendChild(cardHeader);
                card.appendChild(cardBody);
                container.appendChild(card);
            });

        return container;
    }

    /**
     * モバイル用サマリーカードを作成する
     * @param summaryData - サマリーデータ
     * @returns サマリーカード
     */
    function createMobileSummaryCard(summaryData: any): HTMLDivElement {
        const card = document.createElement("div");
        card.className = "mobile-summary-card";
        card.style.backgroundColor = "#3498db";
        card.style.color = "#fff";
        card.style.borderRadius = "8px";
        card.style.padding = "15px";
        card.style.margin = "10px";
        card.style.boxShadow = "0 2px 8px rgba(52,152,219,0.3)";

        const title = document.createElement("h3");
        title.textContent = "期間サマリー";
        title.style.margin = "0 0 15px 0";
        title.style.fontSize = "16px";
        title.style.fontWeight = "bold";

        const summaryGrid = document.createElement("div");
        summaryGrid.style.display = "grid";
        summaryGrid.style.gridTemplateColumns = "1fr 1fr";
        summaryGrid.style.gap = "10px";

        const summaryItems = [
            { label: "総台数", value: summaryData.totalQuantity || 0 },
            { label: "総工数", value: `${summaryData.totalHours || 0}h` },
            { label: "総付加価値", value: `${(summaryData.totalValue || 0).toLocaleString()}千円` },
            { label: "データ件数", value: `${summaryData.recordCount || 0}件` },
        ];

        summaryItems.forEach((item) => {
            const itemDiv = document.createElement("div");
            itemDiv.style.textAlign = "center";

            const valueDiv = document.createElement("div");
            valueDiv.textContent = String(item.value);
            valueDiv.style.fontSize = "18px";
            valueDiv.style.fontWeight = "bold";
            valueDiv.style.marginBottom = "5px";

            const labelDiv = document.createElement("div");
            labelDiv.textContent = item.label;
            labelDiv.style.fontSize = "12px";
            labelDiv.style.opacity = "0.9";

            itemDiv.appendChild(valueDiv);
            itemDiv.appendChild(labelDiv);
            summaryGrid.appendChild(itemDiv);
        });

        card.appendChild(title);
        card.appendChild(summaryGrid);

        return card;
    }

    /**
     * データのサマリーを計算する
     * @param records - レコードデータ
     * @returns サマリーデータ
     */
    function calculateSummary(records: line_daily.SavedFields[]): any {
        let totalQuantity = 0;
        let totalHours = 0;
        let totalValue = 0;

        records.forEach((record) => {
            totalQuantity += Number(record.actual_number?.value || 0);
            totalHours +=
                Number(record.inside_time?.value || 0) + Number(record.outside_time?.value || 0);

            // 簡易的な付加価値計算（実際の計算ロジックに応じて調整）
            const quantity = Number(record.actual_number?.value || 0);
            if (masterModelData) {
                const modelName = record.model_name?.value || "";
                const matchedModel = masterModelData.find(
                    (item) => item.model_name.value === modelName
                );
                if (matchedModel) {
                    const addedValue = Number(matchedModel.added_value?.value || 0);
                    totalValue += (addedValue * quantity) / 1000; // 千円単位
                }
            }
        });

        return {
            totalQuantity,
            totalHours,
            totalValue: Math.round(totalValue),
            recordCount: records.length,
        };
    }

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
        Logger.info(`fetchPLMonthlyData開始: ${year}年${month}月`);
        const result = await KintoneApiService.fetchPLMonthlyData(year, month);
        Logger.info(`fetchPLMonthlyData完了: ${result ? "データあり" : "データなし"}`);
        if (result) {
            Logger.info(
                `月次データ内容 - inside_unit: ${result.inside_unit?.value}, outside_unit: ${result.outside_unit?.value}`
            );
        }
        return result;
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

    /**
     * 生産日報報告書データを取得する関数
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
     * フィルター変更時の処理（モバイル最適化・デバウンス処理付き）
     */
    const debouncedHandleFilterChange = PerformanceUtil.debounce(
        async function handleFilterChange(headerSpace: unknown): Promise<void> {
            const headerElement = headerSpace as HTMLElement;
            const yearSelect = document.getElementById("year-select") as HTMLSelectElement | null;
            const monthSelect = document.getElementById("month-select") as HTMLSelectElement | null;

            const selectedYear = yearSelect?.value || null;
            const selectedMonth = monthSelect?.value || null;

            try {
                PerformanceUtil.startMeasure("mobile-filter-change");

                // ローディング表示
                const existingContent = document.getElementById("mobile-content");
                if (existingContent) {
                    headerElement.removeChild(existingContent);
                }

                const loadingDiv = document.createElement("div");
                loadingDiv.id = "mobile-loading";
                loadingDiv.textContent = "データを読み込み中...";
                loadingDiv.style.textAlign = "center";
                loadingDiv.style.padding = "20px";
                loadingDiv.style.fontSize = "14px";
                loadingDiv.style.color = "#666";
                headerElement.appendChild(loadingDiv);

                // 既存のキャッシュをクリア
                PerformanceUtil.clearCache("mobile-data-");

                // データを取得
                if (selectedYear && selectedMonth) {
                    Logger.info(`月次データを取得中: ${selectedYear}年${selectedMonth}月`);
                    plMonthlyData = await fetchPLMonthlyData(selectedYear, selectedMonth);
                    Logger.info(
                        `月次データ取得結果: ${plMonthlyData ? "成功" : "取得されませんでした"}`
                    );
                    if (plMonthlyData) {
                        Logger.info(
                            `月次データ詳細 - 社員単価: ${plMonthlyData.inside_unit?.value}, 派遣単価: ${plMonthlyData.outside_unit?.value}`
                        );
                    }
                    dailyReportData = await fetchPLDailyData(selectedYear, selectedMonth);
                    Logger.info(`日次データ取得完了: ${dailyReportData?.length}件`);
                }
                filteredRecords = await fetchProductionReportData(selectedYear, selectedMonth);
                Logger.info(`生産レポートデータ取得完了: ${filteredRecords?.length}件`);

                // 生産データの内容を詳しく確認
                if (filteredRecords && filteredRecords.length > 0) {
                    Logger.info(`生産データサンプル（最初の3件）:`);
                    filteredRecords.slice(0, 3).forEach((record, index) => {
                        Logger.info(
                            `  [${index + 1}] 機種: ${record.model_name?.value}, 実績台数: ${record.actual_number?.value}, 予定台数: ${record.production_number?.value}, 日付: ${record.date?.value}`
                        );
                        Logger.info(
                            `    実績台数フィールド詳細: ${JSON.stringify(record.actual_number)}`
                        );
                    });
                }

                // ローディングを削除
                if (loadingDiv.parentNode) {
                    headerElement.removeChild(loadingDiv);
                }

                // メインコンテンツコンテナを作成
                const contentContainer = document.createElement("div");
                contentContainer.id = "mobile-content";
                contentContainer.style.padding = "0";

                // 選択されたテーブルタイプに基づいてカードビューを作成
                const tableSelect = document.getElementById(
                    "table-select"
                ) as HTMLSelectElement | null;
                const selectedTable = tableSelect?.value || "production";

                if (selectedTable === "production") {
                    // 生産実績カードを作成
                    const productionCards = createMobileProductionCards(
                        filteredRecords,
                        plMonthlyData,
                        masterModelData || []
                    );
                    contentContainer.appendChild(productionCards);
                } else if (selectedTable === "profit") {
                    // 損益計算カードを作成
                    const profitCards = createMobileProfitCards(
                        dailyReportData,
                        filteredRecords,
                        plMonthlyData,
                        masterModelData || []
                    );
                    contentContainer.appendChild(profitCards);
                }

                // コンテンツを追加
                headerElement.appendChild(contentContainer);

                const filterTime = PerformanceUtil.endMeasure("mobile-filter-change");
                Logger.success(`モバイルフィルター処理完了: ${filterTime.toFixed(2)}ms`);
            } catch (error) {
                Logger.error("モバイルフィルタリング処理でエラー:", error);

                // エラーメッセージを表示
                const errorDiv = document.createElement("div");
                errorDiv.textContent =
                    "データの取得に失敗しました。ネットワーク接続を確認してください。";
                errorDiv.style.backgroundColor = "#f8d7da";
                errorDiv.style.color = "#721c24";
                errorDiv.style.padding = "15px";
                errorDiv.style.margin = "10px";
                errorDiv.style.borderRadius = "8px";
                errorDiv.style.border = "1px solid #f5c6cb";
                errorDiv.style.fontSize = "14px";

                const existingContent =
                    document.getElementById("mobile-content") ||
                    document.getElementById("mobile-loading");
                if (existingContent && existingContent.parentNode) {
                    headerElement.removeChild(existingContent);
                }
                headerElement.appendChild(errorDiv);
            }
        },
        800 // モバイルでは少し長めのデバウンス
    );

    /**
     * モバイル専用モーダルコンテナを作成する
     * @returns モーダルコンテナ
     */
    function createMobileHeaderSpaceContainer(): HTMLDivElement {
        const headerContainer = document.createElement("div");
        headerContainer.id = "pl-mobile-header-space";
        headerContainer.style.cssText = `
      width: 100%;
      background-color: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    `;

        const contentArea = document.createElement("div");
        contentArea.style.cssText = `
      width: 100%;
      background-color: white;
      overflow: hidden;
    `;

        headerContainer.appendChild(contentArea);

        // ヘッダースペースに追加
        const headerSpaceElement = (kintone as any).mobile.app.getHeaderSpaceElement();
        if (headerSpaceElement) {
            headerSpaceElement.appendChild(headerContainer);
            Logger.info("コンテナがヘッダースペースに追加されました");
        } else {
            Logger.error("ヘッダースペース要素が取得できませんでした");
        }

        return contentArea; // 実際のコンテンツエリアを返す
    }

    /**
     * モバイル用ヘッダーコンテナを作成する
     * @returns ヘッダーコンテナ
     */
    function createMobileHeaderContainer(): HTMLDivElement {
        const headerContainer = document.createElement("div");
        headerContainer.style.backgroundColor = "#fff";
        headerContainer.style.borderBottom = "1px solid #e0e0e0";
        headerContainer.style.marginBottom = "10px";

        // タイトル
        const title = document.createElement("h2");
        title.textContent = "📊 PLダッシュボード";
        title.style.margin = "0";
        title.style.padding = "15px";
        title.style.fontSize = "18px";
        title.style.fontWeight = "bold";
        title.style.color = "#2c3e50";
        title.style.backgroundColor = "#f8f9fa";
        title.style.borderBottom = "1px solid #e0e0e0";

        headerContainer.appendChild(title);
        return headerContainer;
    }

    // モバイル表示専用イベント（app.record.index.show）
    kintone.events.on("mobile.app.record.index.show", async function (event) {
        // kintoneが自動的にモバイル環境でこのファイルを読み込むため、
        // デバイス検出は不要（マニフェストファイルの設定に依存）
        console.log("モバイル版PLダッシュボードスクリプトが実行されました");
        // モバイル版では getHeaderSpaceElement() が利用できないため、
        // ページ全体にオーバーレイとして表示する
        const displayArea: HTMLElement | null = null;

        Logger.info("モバイル版PLダッシュボード初期化開始");
        Logger.info("現在のURL:", window.location.href);
        Logger.info("User Agent:", navigator.userAgent);

        try {
            // モバイル用スタイルを追加
            const style = document.createElement("style");
            style.textContent = `
        #pl-mobile-header-space {
          position: relative;
        }

        .mobile-card-container {
          max-height: 60vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .mobile-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .mobile-card:active {
          transform: scale(0.98);
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .mobile-summary-card {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        }

        /* モバイル用セレクトボックススタイル */
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3E%3Cpath fill='%23666' d='m2 0l-2 2h4zm0 5l2-2h-4z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 12px;
        }
      `;
            document.head.appendChild(style);

            // ページ読み込み時に自動的にヘッダースペースにダッシュボードを表示
            Logger.info("ページ読み込み時にダッシュボードを自動表示します");
            await openMobileDashboard();

            // モバイルダッシュボードをヘッダースペースに表示する関数
            async function openMobileDashboard() {
                try {
                    Logger.info("モバイルダッシュボードをヘッダースペースに表示しています...");

                    // 既に開いているヘッダースペースコンテナがあれば削除
                    const existingContainer = document.getElementById("pl-mobile-header-space");
                    if (existingContainer) {
                        Logger.info("既存のヘッダースペースコンテナを削除しています");
                        existingContainer.remove();
                    }

                    // モバイル専用のヘッダースペースコンテナを作成
                    Logger.info("ヘッダースペースコンテナを作成中...");
                    const mobileContainer = createMobileHeaderSpaceContainer();
                    Logger.info("ヘッダースペースコンテナが作成されました");

                    // モバイルヘッダーコンテナを作成
                    const mobileHeader = createMobileHeaderContainer();
                    mobileContainer.appendChild(mobileHeader);

                    // フィルターコンテナを作成
                    const filterContainer = createMobileFilterContainer();
                    mobileContainer.appendChild(filterContainer);

                    // マスタ機種一覧データを取得（初回のみ）
                    if (!masterModelData) {
                        Logger.info("マスタデータを取得中...");
                        masterModelData = await fetchMasterModelData();
                        Logger.info(
                            `モバイル版：マスタデータ取得完了 ${masterModelData?.length}件`
                        );
                        // マスタデータの詳細をログ出力
                        if (masterModelData && masterModelData.length > 0) {
                            Logger.info("マスタデータのサンプル:");
                            masterModelData.slice(0, 3).forEach((item, index) => {
                                Logger.info(
                                    `  ${index + 1}. 機種名: ${item.model_name?.value}, 付加価値: ${item.added_value?.value}`
                                );
                            });
                        }
                    } else {
                        Logger.info(`既存のマスタデータを使用 ${masterModelData?.length}件`);
                    }

                    // 初回表示時にフィルタリングを実行
                    Logger.info("初回フィルタリングを実行中...");
                    await debouncedHandleFilterChange(mobileContainer);
                    Logger.info("初回フィルタリング完了");

                    // スクロール可能な要素にパッシブリスナーを追加
                    const cardContainer = mobileContainer.querySelector(".mobile-card-container");
                    if (cardContainer && "ontouchstart" in window) {
                        addEventListenerWithPassive(
                            cardContainer as Element,
                            "touchstart",
                            () => {
                                // パッシブタッチハンドリング
                            },
                            true
                        );
                        addEventListenerWithPassive(
                            cardContainer as Element,
                            "touchmove",
                            () => {
                                // パッシブタッチ移動ハンドリング
                            },
                            true
                        );
                    }

                    // イベントリスナーを設定
                    setTimeout(() => {
                        const tableSelect = document.getElementById(
                            "table-select"
                        ) as HTMLSelectElement | null;
                        const yearSelect = document.getElementById(
                            "year-select"
                        ) as HTMLSelectElement | null;
                        const monthSelect = document.getElementById(
                            "month-select"
                        ) as HTMLSelectElement | null;

                        if (tableSelect) {
                            tableSelect.addEventListener("change", async function () {
                                await debouncedHandleFilterChange(mobileContainer);
                            });
                        }

                        if (yearSelect) {
                            yearSelect.addEventListener("change", async function () {
                                await debouncedHandleFilterChange(mobileContainer);
                            });
                        }

                        if (monthSelect) {
                            monthSelect.addEventListener("change", async function () {
                                await debouncedHandleFilterChange(mobileContainer);
                            });
                        }
                    }, 100);

                    Logger.info("PLダッシュボード（モバイル版）モーダル表示完了");
                } catch (error) {
                    Logger.error("モバイル版モーダル表示エラー:", error);
                }
            }

            Logger.info("PLダッシュボード（モバイル版）初期化完了");
        } catch (error) {
            Logger.error("モバイル版初期化エラー:", error);
        }

        return event;
    });
})();
