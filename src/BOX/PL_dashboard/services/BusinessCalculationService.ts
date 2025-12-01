/**
 * 経営計算サービス
 * テーブル生成時の各種経営情報計算ロジックを管理する専用クラス
 */

/// <reference path="../fields/line_daily_fields.d.ts" />
/// <reference path="../fields/model_master_fields.d.ts" />
/// <reference path="../fields/month_fields.d.ts" />
import { MasterModelStore } from "../store";
import { Logger } from "../utils/Logger";

/**
 * 付加価値計算結果
 *
 * @category Services
 */
export interface AddedValueResult {
    /** 付加価値 */
    addedValue: number;
    /** 計算方法（direct: 直接設定, calculated: マスタから計算） */
    calculationMethod: "direct" | "calculated";
    /** マッチしたマスタデータ（calculatedの場合のみ） */
    matchedModel?: model_master.SavedFields;
}

/**
 * 工数・コスト計算結果
 *
 * @category Services
 */
export interface CostCalculationResult {
    /** 社員工数 */
    insideTime: number;
    /** 社員工数コスト */
    insideCost: number;
    /** 派遣工数 */
    outsideTime: number;
    /** 派遣工数コスト */
    outsideCost: number;
    /** 社員残業工数 */
    insideOvertime: number;
    /** 社員残業工数コスト */
    insideOvertimeCost: number;
    /** 派遣残業工数 */
    outsideOvertime: number;
    /** 派遣残業工数コスト */
    outsideOvertimeCost: number;
    /** 経費合計 */
    totalCost: number;
}

/**
 * 利益計算結果
 *
 * @category Services
 */
export interface ProfitCalculationResult {
    /** 粗利益 */
    grossProfit: number;
    /** 利益率（%） */
    profitRate: number;
    /** 利益率（文字列形式） */
    profitRateString: string;
}

/**
 * 完全な経営指標計算結果
 *
 * @category Services
 */
export interface BusinessMetrics {
    /** 付加価値計算結果 */
    addedValue: AddedValueResult;
    /** コスト計算結果 */
    cost: CostCalculationResult;
    /** 利益計算結果 */
    profit: ProfitCalculationResult;
}

/**
 * 経営計算サービスクラス
 *
 * @remarks
 * このクラスは経営指標の計算を担当し、以下の機能を提供します：
 * - 付加価値の計算（calculateAddedValue）
 * - 工数・コストの計算（calculateCosts）
 * - 利益の計算（calculateProfit）
 * - 経営指標の統合計算（calculateBusinessMetrics）
 *
 * @example
 * ```typescript
 * const metrics = BusinessCalculationService.calculateBusinessMetrics(
 *   record,
 *   masterModelData,
 *   insideUnit,
 *   outsideUnit
 * );
 * console.log(metrics.profit.grossProfit);
 * ```
 *
 * @category Services
 */
export class BusinessCalculationService {
    /** 残業時間の割増率 */
    private static readonly OVERTIME_RATE = 1.25;

    /**
     * 付加価値を計算する
     *
     *      * record: 日次レコード
     *      * masterModelData: マスタ機種データの配列
     * *  付加価値計算結果（AddedValueResult）
     *
     * @remarks
     * - レコードに直接付加価値が設定されている場合は、その値を使用します
     * - 直接付加価値が設定されていない場合は、マスタデータから機種を検索して計算します
     * - 機種名と機種コードでマッチングを行います（機種コードが空の場合は機種名のみでマッチング）
     * - マッチする機種が見つからない場合は、付加価値0を返します
     *
     * @example
     * ```typescript
     * const result = BusinessCalculationService.calculateAddedValue(record, masterModelData);
     * if (result.calculationMethod === "direct") {
     *   console.log("直接設定された付加価値:", result.addedValue);
     * } else {
     *   console.log("マスタから計算された付加価値:", result.addedValue);
     *   console.log("マッチした機種:", result.matchedModel);
     * }
     * ```
     */
    static calculateAddedValue(
        record: line_daily.SavedFields,
        masterModelData: model_master.SavedFields[]
    ): AddedValueResult {
        // 直接付加価値が設定されている場合
        if (record.added_value?.value !== "" && record.added_value?.value) {
            Logger.debug(`直接付加価値が設定されています: ${record.added_value.value}`);
            return {
                addedValue: Number(record.added_value.value),
                calculationMethod: "direct",
            };
        }

        // マスタデータから付加価値を計算
        const modelName = record.model_name?.value || "";
        const modelCode = record.model_code?.value || "";

        if (!masterModelData || masterModelData.length === 0) {
            Logger.debug("マスタ機種データが存在しません");
            return {
                addedValue: 0,
                calculationMethod: "calculated",
            };
        }

        // マスタデータから対応する機種を検索
        const matchedModel = masterModelData.find((item) => {
            if (modelCode !== "") {
                return item.model_name.value === modelName && item.model_code.value === modelCode;
            } else {
                return item.model_name.value === modelName;
            }
        });

        if (!matchedModel) {
            Logger.debug(`マッチする機種が見つかりません: ${modelName} (${modelCode})`);
            return {
                addedValue: 0,
                calculationMethod: "calculated",
            };
        }

        // 台数を取得して付加価値を計算
        const actualNumber = Number(record.actual_number?.value || 0);
        const unitAddedValue = Number(matchedModel.added_value?.value || 0);
        const totalAddedValue = Math.round(unitAddedValue * actualNumber);

        Logger.debug(
            `付加価値計算: ${modelName} 単価${unitAddedValue} × 台数${actualNumber} = ${totalAddedValue}`
        );

        return {
            addedValue: totalAddedValue,
            calculationMethod: "calculated",
            matchedModel,
        };
    }

    /**
     * 工数・コストを計算する
     *
     *      * record: 日次レコード
     *      * insideUnit: 社員単価
     *      * outsideUnit: 派遣単価
     * *  コスト計算結果（CostCalculationResult）
     *
     * @remarks
     * - 基本工数（社員・派遣）と残業工数を取得し、それぞれのコストを計算します
     * - 残業工数には1.25倍の割増率が適用されます
     * - 経費合計は全てのコストの合計値です
     *
     * @example
     * ```typescript
     * const costResult = BusinessCalculationService.calculateCosts(
     *   record,
     *   3000, // 社員単価
     *   2500  // 派遣単価
     * );
     * console.log("総コスト:", costResult.totalCost);
     * console.log("社員コスト:", costResult.insideCost);
     * console.log("派遣コスト:", costResult.outsideCost);
     * ```
     */
    static calculateCosts(
        record: line_daily.SavedFields,
        insideUnit: number,
        outsideUnit: number
    ): CostCalculationResult {
        // 基本工数を取得
        const insideTime = Number(record.inside_time?.value || 0);
        const outsideTime = Number(record.outside_time?.value || 0);
        const insideOvertime = Number(record.inside_overtime?.value || 0);
        const outsideOvertime = Number(record.outside_overtime?.value || 0);

        // コストを計算
        const insideCost = insideTime * insideUnit;
        const outsideCost = outsideTime * outsideUnit;
        const insideOvertimeCost = insideOvertime * insideUnit * this.OVERTIME_RATE;
        const outsideOvertimeCost = outsideOvertime * outsideUnit * this.OVERTIME_RATE;

        // 経費合計を計算
        const totalCost = insideCost + outsideCost + insideOvertimeCost + outsideOvertimeCost;

        return {
            insideTime,
            insideCost,
            outsideTime,
            outsideCost,
            insideOvertime,
            insideOvertimeCost,
            outsideOvertime,
            outsideOvertimeCost,
            totalCost,
        };
    }

    /**
     * 利益を計算する
     *      * addedValue: 付加価値
     *      * totalCost: 総コスト
     * *  利益計算結果
     */
    static calculateProfit(addedValue: number, totalCost: number): ProfitCalculationResult {
        const grossProfit = addedValue - totalCost;
        const profitRate = addedValue > 0 ? (grossProfit / addedValue) * 100 : 0;
        const profitRateString = addedValue > 0 ? `${profitRate.toFixed(2)}%` : "0%";

        return {
            grossProfit,
            profitRate,
            profitRateString,
        };
    }

    /**
     * 完全な経営指標を計算する（オールインワンメソッド）
     *      * record: 日次レコード
     *      * plMonthlyData: 月次データ
     * *  完全な経営指標計算結果
     */
    static calculateBusinessMetrics(
        record: line_daily.SavedFields,
        plMonthlyData: monthly.SavedFields | null
    ): BusinessMetrics {
        // マスタ機種データを取得
        const masterModelData = MasterModelStore.getInstance().getMasterData();

        // 単価情報を取得
        const insideUnit = plMonthlyData ? Number(plMonthlyData.inside_unit?.value || 0) : 0;
        const outsideUnit = plMonthlyData ? Number(plMonthlyData.outside_unit?.value || 0) : 0;

        // 各計算を実行
        const addedValue = this.calculateAddedValue(record, masterModelData);
        const cost = this.calculateCosts(record, insideUnit, outsideUnit);
        const profit = this.calculateProfit(addedValue.addedValue, cost.totalCost);

        return {
            addedValue,
            cost,
            profit,
        };
    }

    /**
     * 累積収益分析データを計算する
     *      * currentAddedValue: 当日付加価値
     *      * currentExpenses: 当日経費
     *      * previousCumulativeAddedValue: 前日累積付加価値
     *      * previousCumulativeExpenses: 前日累積経費
     * *  累積収益分析結果
     */
    static calculateCumulativeRevenue(
        currentAddedValue: number,
        currentExpenses: number,
        previousCumulativeAddedValue: number = 0,
        previousCumulativeExpenses: number = 0
    ) {
        const cumulativeAddedValue = previousCumulativeAddedValue + currentAddedValue;
        const cumulativeExpenses = previousCumulativeExpenses + currentExpenses;
        const cumulativeGrossProfit = cumulativeAddedValue - cumulativeExpenses;
        const cumulativeProfitRate =
            cumulativeAddedValue > 0 ? (cumulativeGrossProfit / cumulativeAddedValue) * 100 : 0;

        return {
            cumulativeAddedValue,
            cumulativeExpenses,
            cumulativeGrossProfit,
            cumulativeProfitRate,
        };
    }

    /**
     * 利益率のフォーマット
     *      * profitRate: 利益率
     * *  フォーマットされた利益率文字列
     */
    static formatProfitRate(profitRate: number): string {
        return `${profitRate.toFixed(2)}%`;
    }

    /**
     * 金額のフォーマット（カンマ区切り）
     *      * amount: 金額
     * *  フォーマットされた金額文字列
     */
    static formatAmount(amount: number): string {
        return amount.toLocaleString();
    }
}
