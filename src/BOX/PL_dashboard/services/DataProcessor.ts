import { HolidayStore } from "../store";
import { ProductHistoryData, TotalsByDate } from "../types";
import { CalculationUtil, DateUtil, Logger } from "../utils";

/// <reference path="../fields/daily_fields.d.ts" />
/// <reference path="../fields/line_daily_fields.d.ts" />
/// <reference path="../fields/model_master_fields.d.ts" />
/// <reference path="../fields/holiday_fields.d.ts" />

/**
 * データ処理・計算を担当するサービスクラス
 *
 * @remarks
 * このクラスはデータの集計・変換を担当し、以下の機能を提供します：
 * - 日付別合計値の計算（getTotalsByDate）
 * - 日付リストの生成（getDateList）
 * - 製品履歴データの処理
 *
 * @example
 * ```typescript
 * const totals = DataProcessor.getTotalsByDate(productHistoryData, "2024-01-01");
 * const dateList = DataProcessor.getDateList(productHistoryData, "2024", "01");
 * ```
 *
 * @category Services
 */
export class DataProcessor {
    /**
     * 休日タイプコードを取得する
     *      * date: 対象日付
     * *  休日タイプコード（0: 平日, -1: 法定休日, -2: 所定休日）
     */
    private static getHolidayTypeCode(date: string): number {
        const holidayStore = HolidayStore.getInstance();
        const holidayData = holidayStore.getHolidayData();
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
     * 製品履歴データから日付別の合計値を計算する（休日タイプ処理を含む）
     *      * productHistoryData: 製品履歴データ
     *      * date: 対象日付
     * *  日付別合計値
     */
    static getTotalsByDate(productHistoryData: ProductHistoryData[], date: string): TotalsByDate {
        let totalActualNumber = 0;
        let totalAddedValue = 0;
        let totalCost = 0;
        let totalGrossProfit = 0;
        let totalInsideOvertime = 0;
        let totalOutsideOvertime = 0;
        let totalInsideHolidayOvertime = 0;
        let totalOutsideHolidayOvertime = 0;

        const holidayTypeCode = this.getHolidayTypeCode(date);

        productHistoryData?.forEach((item) => {
            if (item.date === date) {
                // 各種合計値を加算
                totalActualNumber += CalculationUtil.safeNumber(item.actual_number);
                totalAddedValue += CalculationUtil.safeNumber(item.addedValue);
                totalCost += CalculationUtil.safeNumber(item.totalCost);
                totalGrossProfit += CalculationUtil.safeNumber(item.grossProfit);

                // 休日タイプに応じて残業時間を分類
                if (holidayTypeCode === 0) {
                    // 平日の場合
                    totalInsideOvertime += CalculationUtil.safeNumber(item.insideOvertime);
                    totalOutsideOvertime += CalculationUtil.safeNumber(item.outsideOvertime);
                } else if (holidayTypeCode === -1 || holidayTypeCode === -2) {
                    // 法定休日または所定休日の場合
                    totalInsideHolidayOvertime += CalculationUtil.safeNumber(
                        item.insideRegularTime
                    );
                    totalInsideHolidayOvertime += CalculationUtil.safeNumber(item.insideOvertime);
                    totalOutsideHolidayOvertime += CalculationUtil.safeNumber(item.outsideOvertime);
                    totalOutsideHolidayOvertime += CalculationUtil.safeNumber(
                        item.outsideRegularTime
                    );
                }
            }
        });

        // 利益とコストを1000で除算
        totalAddedValue = CalculationUtil.divideByThousand(totalAddedValue);
        totalCost = CalculationUtil.divideByThousand(totalCost);
        totalGrossProfit = CalculationUtil.divideByThousand(totalGrossProfit);

        // 利益率を計算（totalCost > 0の場合）
        const profitRate =
            totalCost > 0
                ? Number(((totalGrossProfit / totalCost) * 100).toFixed(2))
                : CalculationUtil.calculateProfitRate(totalGrossProfit, totalCost);

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
     * 製品履歴データから日付リストを取得する
     *      * productHistoryData: 製品履歴データ
     *      * year: 年
     *      * month: 月
     * *  一意な日付のリスト
     */
    static getDateList(
        productHistoryData: ProductHistoryData[],
        year?: string,
        month?: string
    ): string[] {
        // 年月が指定されている場合は完全な日付リストを生成
        if (year && month) {
            return DateUtil.generateMonthlyDateList(year, month);
        }

        // フォールバック: 元データから日付を取得
        const dateSet = new Set<string>();
        productHistoryData?.forEach((item) => {
            dateSet.add(item.date);
        });
        return Array.from(dateSet).sort();
    }

    /**
     * 日次データから指定した日付のレコードを取得する
     *      * dailyReportData: 日次データ
     *      * date: 対象日付
     * *  該当する日次レコード
     */
    static getRecordsByDate(
        dailyReportData: daily.SavedFields[],
        date: string
    ): daily.SavedFields[] {
        if (!dailyReportData) {
            return [];
        }

        return dailyReportData.filter((item) => {
            const itemDate = item.date?.value || "";
            return itemDate === date;
        });
    }

    /**
     * 生産レコードから付加価値を計算する
     *      * record: 生産レコード
     *      * masterModelData: マスタ機種データ
     * *  計算された付加価値
     */
    static calculateAddedValue(
        record: line_daily.SavedFields,
        masterModelData: model_master.SavedFields[]
    ): number {
        // 直接付加価値が設定されている場合
        if (record.added_value.value !== "") {
            Logger.debug(`直接付加価値が設定されています: ${record.added_value.value}`);
            return CalculationUtil.safeNumber(record.added_value.value);
        }

        // マスタデータから付加価値を取得
        const modelName = record.model_name?.value || "";
        const modelCode = record.model_code?.value || "";

        if (masterModelData && masterModelData.length > 0) {
            const matchedModel = masterModelData.find((item) => {
                if (modelCode !== "") {
                    return (
                        item.model_name.value === modelName && item.model_code.value === modelCode
                    );
                } else {
                    return item.model_name.value === modelName;
                }
            });

            if (matchedModel) {
                const unitAddedValue = CalculationUtil.safeNumber(matchedModel.added_value?.value);
                const actualNumber = CalculationUtil.safeNumber(record.actual_number?.value);
                return CalculationUtil.roundNumber(unitAddedValue * actualNumber);
            }
        }

        return 0;
    }

    /**
     * 経費データを計算する
     *      * record: 生産レコード
     *      * insideUnit: 社員単価
     *      * outsideUnit: 派遣単価
     * *  経費計算結果
     */
    static calculateCosts(
        record: line_daily.SavedFields,
        insideUnit: number,
        outsideUnit: number
    ): {
        insideCost: number;
        outsideCost: number;
        insideOvertimeCost: number;
        outsideOvertimeCost: number;
        totalCost: number;
    } {
        const insideTime = CalculationUtil.safeNumber(record.inside_time?.value);
        const outsideTime = CalculationUtil.safeNumber(record.outside_time?.value);
        const insideOvertime = CalculationUtil.safeNumber(record.inside_overtime?.value);
        const outsideOvertime = CalculationUtil.safeNumber(record.outside_overtime?.value);

        const insideCost = insideTime * insideUnit;
        const outsideCost = outsideTime * outsideUnit;
        const insideOvertimeCost = CalculationUtil.calculateOvertimeCost(
            insideOvertime,
            insideUnit
        );
        const outsideOvertimeCost = CalculationUtil.calculateOvertimeCost(
            outsideOvertime,
            outsideUnit
        );

        const totalCost = insideCost + outsideCost + insideOvertimeCost + outsideOvertimeCost;

        return {
            insideCost,
            outsideCost,
            insideOvertimeCost,
            outsideOvertimeCost,
            totalCost,
        };
    }

    /**
     * 製品履歴データを生成する
     *      * records: 生産レコード
     *      * masterModelData: マスタ機種データ
     *      * insideUnit: 社員単価
     *      * outsideUnit: 派遣単価
     * *  製品履歴データ
     */
    static createProductHistoryData(
        records: line_daily.SavedFields[],
        masterModelData: model_master.SavedFields[],
        insideUnit: number,
        outsideUnit: number
    ): ProductHistoryData[] {
        return records.map((record) => {
            const addedValue = this.calculateAddedValue(record, masterModelData);
            const costs = this.calculateCosts(record, insideUnit, outsideUnit);
            const grossProfit = addedValue - costs.totalCost;
            const profitRate = CalculationUtil.calculateProfitRate(grossProfit, addedValue);

            return {
                date: record.date?.value || "",
                line_name: record.line_name?.value || "",
                actual_number: record.actual_number?.value || "0",
                addedValue,
                totalCost: costs.totalCost,
                grossProfit,
                profitRate,
                insideOvertime: record.inside_overtime?.value || "0",
                outsideOvertime: record.outside_overtime?.value || "0",
                insideRegularTime: record.inside_time?.value || "0",
                outsideRegularTime: record.outside_time?.value || "0",
            };
        });
    }

    /**
     * 数値データを安全に取得する
     *      * field: kintoneフィールド
     * *  数値（取得できない場合は0）
     */
    static getFieldValue(field: { value: string | number } | undefined): number {
        return CalculationUtil.safeNumber(field?.value);
    }

    /**
     * テキストデータを安全に取得する
     *      * field: kintoneフィールド
     * *  文字列（取得できない場合は空文字）
     */
    static getFieldText(field: { value: string } | undefined): string {
        return field?.value || "";
    }
}
