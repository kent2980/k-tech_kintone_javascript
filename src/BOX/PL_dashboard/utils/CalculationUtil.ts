import { OVERTIME_MULTIPLIER } from "../config";

/**
 * 計算関連のユーティリティ関数
 */
export class CalculationUtil {
    /**
     * 残業コストを計算する（1.25倍）
     */
    static calculateOvertimeCost(hours: number, unitCost: number): number {
        return hours * unitCost * OVERTIME_MULTIPLIER;
    }

    /**
     * 利益率を計算する
     */
    static calculateProfitRate(profit: number, revenue: number): string {
        if (revenue <= 0) return "0%";
        return ((profit / revenue) * 100).toFixed(2) + "%";
    }

    /**
     * 数値を安全に変換する
     */
    static safeNumber(value: string | number | undefined | null, defaultValue: number = 0): number {
        if (value === undefined || value === null || value === "") {
            return defaultValue;
        }
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    }

    /**
     * 数値を千単位で除算する
     */
    static divideByThousand(value: number): number {
        return value / 1000;
    }

    /**
     * 数値を四捨五入する
     * 小数点以下の桁数を指定可能（デフォルト：0）
     */
    static roundNumber(value: number, decimals: number = 0): number {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /**
     * パーセンテージを数値に変換する
     */
    static parsePercentage(percentageString: string): number {
        const cleaned = percentageString.replace("%", "");
        return this.safeNumber(cleaned);
    }

    /**
     * 数値をパーセンテージ文字列に変換する
     * 小数点以下の桁数を指定可能
     */
    static toPercentageString(value: number, decimals: number = 2): string {
        return value.toFixed(decimals) + "%";
    }

    /**
     * 配列の合計を計算する
     */
    static sum(values: number[]): number {
        return values.reduce((sum, value) => sum + value, 0);
    }

    /**
     * 配列の平均を計算する
     */
    static average(values: number[]): number {
        if (values.length === 0) return 0;
        return this.sum(values) / values.length;
    }
}
