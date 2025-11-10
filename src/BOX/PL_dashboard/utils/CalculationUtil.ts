import { OVERTIME_MULTIPLIER } from "../constants";

/**
 * 計算関連のユーティリティ関数
 */
export class CalculationUtil {
    /**
     * 残業コストを計算する（1.25倍）
     * @param hours - 残業時間
     * @param unitCost - 単価
     * @returns 残業コスト
     */
    static calculateOvertimeCost(hours: number, unitCost: number): number {
        return hours * unitCost * OVERTIME_MULTIPLIER;
    }

    /**
     * 利益率を計算する
     * @param profit - 利益
     * @param revenue - 売上
     * @returns 利益率（％表示）
     */
    static calculateProfitRate(profit: number, revenue: number): string {
        if (revenue <= 0) return "0%";
        return ((profit / revenue) * 100).toFixed(2) + "%";
    }

    /**
     * 数値を安全に変換する
     * @param value - 変換する値
     * @param defaultValue - デフォルト値
     * @returns 数値
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
     * @param value - 対象の値
     * @returns 千単位で除算された値
     */
    static divideByThousand(value: number): number {
        return value / 1000;
    }

    /**
     * 数値を四捨五入する
     * @param value - 対象の値
     * @param decimals - 小数点以下の桁数（デフォルト：0）
     * @returns 四捨五入された値
     */
    static roundNumber(value: number, decimals: number = 0): number {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /**
     * パーセンテージを数値に変換する
     * @param percentageString - "XX%"形式の文字列
     * @returns 数値（例：50% → 50）
     */
    static parsePercentage(percentageString: string): number {
        const cleaned = percentageString.replace("%", "");
        return this.safeNumber(cleaned);
    }

    /**
     * 数値をパーセンテージ文字列に変換する
     * @param value - 数値
     * @param decimals - 小数点以下の桁数
     * @returns パーセンテージ文字列
     */
    static toPercentageString(value: number, decimals: number = 2): string {
        return value.toFixed(decimals) + "%";
    }

    /**
     * 配列の合計を計算する
     * @param values - 数値の配列
     * @returns 合計値
     */
    static sum(values: number[]): number {
        return values.reduce((sum, value) => sum + value, 0);
    }

    /**
     * 配列の平均を計算する
     * @param values - 数値の配列
     * @returns 平均値
     */
    static average(values: number[]): number {
        if (values.length === 0) return 0;
        return this.sum(values) / values.length;
    }
}
