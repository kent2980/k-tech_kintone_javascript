/// <reference path="../../../../kintone.d.ts" />
/// <reference path="../../../../globals.d.ts" />

import { RevenueAnalysis } from "../types";

/**
 * 累積データを管理するクラス
 */
class CumulativeData {
    private _cumulativeAddedValue: number = 0;
    private _cumulativeExpenses: number = 0;
    private _cumulativeGrossProfit: number = 0;
    private _yesterdayGrossProfit: number = 0;

    /**
     * 累積付加価値を取得
     */
    get cumulativeAddedValue(): number {
        return this._cumulativeAddedValue;
    }

    /**
     * 累積経費を取得
     */
    get cumulativeExpenses(): number {
        return this._cumulativeExpenses;
    }

    /**
     * 累積粗利益を取得
     */
    get cumulativeGrossProfit(): number {
        return this._cumulativeGrossProfit;
    }

    /**
     * 累積利益率を計算
     */
    get cumulativeProfitRate(): number {
        return this._cumulativeAddedValue > 0
            ? ((this._cumulativeAddedValue - this._cumulativeExpenses) /
                  this._cumulativeAddedValue) *
                  100
            : 0;
    }

    /**
     * 日次データを累積データに追加
     * @param addedValue - 付加価値
     * @param expenses - 経費
     * @returns 更新後の累積データ
     */
    addDailyData(
        addedValue: number,
        expenses: number
    ): {
        cumulativeAddedValue: number;
        cumulativeExpenses: number;
        cumulativeGrossProfit: number;
        cumulativeProfitRate: number;
    } {
        this._cumulativeAddedValue += addedValue;
        this._cumulativeExpenses += expenses;

        // 当日の粗利益
        const dailyGrossProfit = addedValue - expenses;

        // 累積粗利益 = 当日粗利益 + 前日までの累積粗利益
        this._cumulativeGrossProfit = dailyGrossProfit + this._yesterdayGrossProfit;

        // 次回のために当日の粗利益を保存
        this._yesterdayGrossProfit = dailyGrossProfit;

        return {
            cumulativeAddedValue: this._cumulativeAddedValue,
            cumulativeExpenses: this._cumulativeExpenses,
            cumulativeGrossProfit: this._cumulativeGrossProfit,
            cumulativeProfitRate: this.cumulativeProfitRate,
        };
    }

    /**
     * 累積データをリセット
     */
    reset(): void {
        this._cumulativeAddedValue = 0;
        this._cumulativeExpenses = 0;
        this._cumulativeGrossProfit = 0;
        this._yesterdayGrossProfit = 0;
    }
}

/**
 * 収益分析計算サービス
 * 日次データから収益分析データを作成し、累積計算を管理する
 */
export class RevenueAnalysisCalculationService {
    /**
     * 粗利益を計算
     * @param addedValue - 付加価値
     * @param expenses - 経費
     * @returns 粗利益
     */
    static calculateGrossProfit(addedValue: number, expenses: number): number {
        return addedValue - expenses;
    }

    /**
     * 利益率を計算
     * @param addedValue - 付加価値
     * @param expenses - 経費
     * @returns 利益率（%）
     */
    static calculateProfitRate(addedValue: number, expenses: number): number {
        const grossProfit = this.calculateGrossProfit(addedValue, expenses);
        return addedValue > 0 ? (grossProfit / addedValue) * 100 : 0;
    }

    /**
     * 収益分析アイテムを作成
     * @param date - 日付
     * @param addedValue - 付加価値
     * @param expenses - 経費
     * @param cumulativeData - 累積データ管理オブジェクト
     * @returns 収益分析アイテム
     */
    static createRevenueAnalysisItem(
        date: string,
        addedValue: number,
        expenses: number,
        cumulativeData: CumulativeData
    ): RevenueAnalysis {
        // 日次の粗利益と利益率を計算
        const grossProfit = this.calculateGrossProfit(addedValue, expenses);
        const profitRate = this.calculateProfitRate(addedValue, expenses);

        // 累積データを更新
        const cumulative = cumulativeData.addDailyData(addedValue, expenses);

        return {
            date, // 日付(YYYY-MM-DD形式)
            addedValue, // 付加価値売上高
            expenses, // 経費
            grossProfit, // 粗利益
            profitRate, // 利益率
            CumulativeAddedValue: cumulative.cumulativeAddedValue, // 累積付加価値
            CumulativeExpenses: cumulative.cumulativeExpenses, // 累積経費
            CumulativeGrossProfit: cumulative.cumulativeGrossProfit, // 累積粗利益
            CumulativeProfitRate: cumulative.cumulativeProfitRate, // 累積利益率
        };
    }

    /**
     * 累積データ管理オブジェクトを作成
     * @returns 累積データ管理オブジェクト
     */
    static createCumulativeDataManager(): CumulativeData {
        return new CumulativeData();
    }
}
