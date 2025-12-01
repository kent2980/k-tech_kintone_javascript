/**
 * 経営計算ヘルパーサービス
 * BusinessCalculationServiceを補完し、計算結果の検証やログ出力などのユーティリティ機能を提供
 */

import { Logger } from "../utils/Logger";
import type { BusinessMetrics } from "./BusinessCalculationService";

/**
 * 計算結果の検証結果
 *
 * @category Services
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
 *
 * @category Services
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
 * BusinessCalculationServiceを補完し、計算結果の検証やログ出力などのユーティリティ機能を提供
 * 静的メソッドのみで構成されたユーティリティクラス
 */
export class BusinessCalculationHelperService {
    /**
     * 経営指標の計算結果を検証する
     *      * metrics: 計算結果
     *      * recordDate: レコード日付
     * *  検証結果
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
     * 異常値を検出する
     *      * metrics: 経営指標
     *      * thresholds: しきい値設定
     * *  異常値検出結果
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
}
