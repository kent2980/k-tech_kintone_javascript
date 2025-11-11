/**
 * 経営計算ヘルパーサービス
 * BusinessCalculationServiceを補完し、計算結果の検証やログ出力などのユーティリティ機能を提供
 */

import { Logger } from "../utils/Logger";
import type { BusinessMetrics } from "./BusinessCalculationService";

/**
 * 計算結果の検証結果
 */
export interface ValidationResult {
    /** 検証が成功したか */
    isValid: boolean;
    /** エラーメッセージ（検証失敗時） */
    errors: string[];
    /** 警告メッセージ */
    warnings: string[];
}

/**
 * 経営指標のサマリー情報
 */
export interface BusinessMetricsSummary {
    /** 総件数 */
    totalRecords: number;
    /** 総付加価値 */
    totalAddedValue: number;
    /** 総経費 */
    totalCosts: number;
    /** 総粗利益 */
    totalGrossProfit: number;
    /** 平均利益率 */
    averageProfitRate: number;
    /** 最高利益率 */
    maxProfitRate: number;
    /** 最低利益率 */
    minProfitRate: number;
    /** 赤字件数 */
    lossRecords: number;
}

/**
 * 経営計算ヘルパーサービスクラス
 */
export class BusinessCalculationHelperService {
    /**
     * 経営指標の計算結果を検証する
     * @param metrics - 計算結果
     * @param recordDate - レコード日付（ログ用）
     * @returns 検証結果
     */
    static validateBusinessMetrics(
        metrics: BusinessMetrics,
        recordDate?: string
    ): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 付加価値の検証
        if (metrics.addedValue.addedValue < 0) {
            errors.push("付加価値がマイナス値です");
        }

        // コストの検証
        if (metrics.cost.totalCost < 0) {
            errors.push("総コストがマイナス値です");
        }

        if (metrics.cost.insideCost < 0 || metrics.cost.outsideCost < 0) {
            warnings.push("基本工数コストにマイナス値があります");
        }

        if (metrics.cost.insideOvertimeCost < 0 || metrics.cost.outsideOvertimeCost < 0) {
            warnings.push("残業工数コストにマイナス値があります");
        }

        // 利益の検証
        if (metrics.profit.grossProfit < 0) {
            warnings.push("粗利益がマイナス値（赤字）です");
        }

        if (Math.abs(metrics.profit.profitRate) > 1000) {
            warnings.push("利益率が異常に高い値です（1000%超）");
        }

        // 計算整合性の検証
        const calculatedGrossProfit = metrics.addedValue.addedValue - metrics.cost.totalCost;
        if (Math.abs(calculatedGrossProfit - metrics.profit.grossProfit) > 0.01) {
            errors.push("粗利益の計算に不整合があります");
        }

        // 結果をログ出力
        const dateStr = recordDate || "不明";
        if (errors.length > 0) {
            Logger.debug(`[${dateStr}] 経営指標計算エラー: ${errors.join(", ")}`);
        }
        if (warnings.length > 0) {
            Logger.debug(`[${dateStr}] 経営指標計算警告: ${warnings.join(", ")}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * 複数の経営指標からサマリー情報を計算する
     * @param metricsList - 経営指標のリスト
     * @returns サマリー情報
     */
    static calculateSummary(metricsList: BusinessMetrics[]): BusinessMetricsSummary {
        if (metricsList.length === 0) {
            return {
                totalRecords: 0,
                totalAddedValue: 0,
                totalCosts: 0,
                totalGrossProfit: 0,
                averageProfitRate: 0,
                maxProfitRate: 0,
                minProfitRate: 0,
                lossRecords: 0,
            };
        }

        let totalAddedValue = 0;
        let totalCosts = 0;
        let totalGrossProfit = 0;
        let maxProfitRate = Number.NEGATIVE_INFINITY;
        let minProfitRate = Number.POSITIVE_INFINITY;
        let lossRecords = 0;

        metricsList.forEach((metrics) => {
            totalAddedValue += metrics.addedValue.addedValue;
            totalCosts += metrics.cost.totalCost;
            totalGrossProfit += metrics.profit.grossProfit;

            const profitRate = metrics.profit.profitRate;
            maxProfitRate = Math.max(maxProfitRate, profitRate);
            minProfitRate = Math.min(minProfitRate, profitRate);

            if (metrics.profit.grossProfit < 0) {
                lossRecords++;
            }
        });

        const averageProfitRate =
            totalAddedValue > 0 ? (totalGrossProfit / totalAddedValue) * 100 : 0;

        return {
            totalRecords: metricsList.length,
            totalAddedValue,
            totalCosts,
            totalGrossProfit,
            averageProfitRate,
            maxProfitRate: maxProfitRate === Number.NEGATIVE_INFINITY ? 0 : maxProfitRate,
            minProfitRate: minProfitRate === Number.POSITIVE_INFINITY ? 0 : minProfitRate,
            lossRecords,
        };
    }

    /**
     * 経営指標を詳細ログとして出力する
     * @param metrics - 経営指標
     * @param recordInfo - レコード識別情報（日付、ライン名など）
     */
    static logBusinessMetricsDetails(metrics: BusinessMetrics, recordInfo?: string): void {
        const info = recordInfo || "不明";

        Logger.debug(`=== 経営指標詳細 [${info}] ===`);
        Logger.debug(
            `付加価値: ${metrics.addedValue.addedValue.toLocaleString()}円 (計算方法: ${metrics.addedValue.calculationMethod})`
        );

        Logger.debug(`工数コスト詳細:`);
        Logger.debug(
            `  社員工数: ${metrics.cost.insideTime}h → ${metrics.cost.insideCost.toLocaleString()}円`
        );
        Logger.debug(
            `  派遣工数: ${metrics.cost.outsideTime}h → ${metrics.cost.outsideCost.toLocaleString()}円`
        );
        Logger.debug(
            `  社員残業: ${metrics.cost.insideOvertime}h → ${metrics.cost.insideOvertimeCost.toLocaleString()}円`
        );
        Logger.debug(
            `  派遣残業: ${metrics.cost.outsideOvertime}h → ${metrics.cost.outsideOvertimeCost.toLocaleString()}円`
        );
        Logger.debug(`  総経費: ${metrics.cost.totalCost.toLocaleString()}円`);

        Logger.debug(`利益分析:`);
        Logger.debug(`  粗利益: ${metrics.profit.grossProfit.toLocaleString()}円`);
        Logger.debug(`  利益率: ${metrics.profit.profitRateString}`);
        Logger.debug(`==============================`);
    }

    /**
     * 異常値を検出する
     * @param metrics - 経営指標
     * @param thresholds - しきい値設定
     * @returns 異常値検出結果
     */
    static detectAnomalies(
        metrics: BusinessMetrics,
        thresholds = {
            maxAddedValue: 10000000, // 1千万円
            maxTotalCost: 5000000, // 500万円
            minProfitRate: -100, // -100%
            maxProfitRate: 500, // 500%
        }
    ): string[] {
        const anomalies: string[] = [];

        if (metrics.addedValue.addedValue > thresholds.maxAddedValue) {
            anomalies.push(
                `付加価値が異常に高額: ${metrics.addedValue.addedValue.toLocaleString()}円`
            );
        }

        if (metrics.cost.totalCost > thresholds.maxTotalCost) {
            anomalies.push(`総コストが異常に高額: ${metrics.cost.totalCost.toLocaleString()}円`);
        }

        if (metrics.profit.profitRate < thresholds.minProfitRate) {
            anomalies.push(`利益率が異常に低い: ${metrics.profit.profitRateString}`);
        }

        if (metrics.profit.profitRate > thresholds.maxProfitRate) {
            anomalies.push(`利益率が異常に高い: ${metrics.profit.profitRateString}`);
        }

        return anomalies;
    }

    /**
     * 経営指標を比較する
     * @param metrics1 - 比較対象1
     * @param metrics2 - 比較対象2
     * @returns 比較結果の分析
     */
    static compareMetrics(
        metrics1: BusinessMetrics,
        metrics2: BusinessMetrics
    ): {
        addedValueDiff: number;
        costDiff: number;
        profitDiff: number;
        profitRateDiff: number;
        betterPerformance: "metrics1" | "metrics2" | "equal";
    } {
        const addedValueDiff = metrics2.addedValue.addedValue - metrics1.addedValue.addedValue;
        const costDiff = metrics2.cost.totalCost - metrics1.cost.totalCost;
        const profitDiff = metrics2.profit.grossProfit - metrics1.profit.grossProfit;
        const profitRateDiff = metrics2.profit.profitRate - metrics1.profit.profitRate;

        let betterPerformance: "metrics1" | "metrics2" | "equal";
        if (profitRateDiff > 0.01) {
            betterPerformance = "metrics2";
        } else if (profitRateDiff < -0.01) {
            betterPerformance = "metrics1";
        } else {
            betterPerformance = "equal";
        }

        return {
            addedValueDiff,
            costDiff,
            profitDiff,
            profitRateDiff,
            betterPerformance,
        };
    }
}
