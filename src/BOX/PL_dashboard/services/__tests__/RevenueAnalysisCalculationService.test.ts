/**
 * RevenueAnalysisCalculationServiceのユニットテスト
 */

import {
    RevenueAnalysisCalculationService,
    CumulativeData,
} from "../RevenueAnalysisCalculationService";

describe("RevenueAnalysisCalculationService", () => {
    describe("calculateGrossProfit", () => {
        test("粗利益を計算", () => {
            const result = RevenueAnalysisCalculationService.calculateGrossProfit(100000, 60000);

            expect(result).toBe(40000);
        });

        test("経費が付加価値を超える場合は負の値を返す", () => {
            const result = RevenueAnalysisCalculationService.calculateGrossProfit(50000, 80000);

            expect(result).toBe(-30000);
        });
    });

    describe("calculateProfitRate", () => {
        test("利益率を計算", () => {
            const result = RevenueAnalysisCalculationService.calculateProfitRate(100000, 60000);

            expect(result).toBe(40); // (40000 / 100000) * 100
        });

        test("付加価値が0の場合は0を返す", () => {
            const result = RevenueAnalysisCalculationService.calculateProfitRate(0, 60000);

            expect(result).toBe(0);
        });

        test("赤字の場合も正しく計算", () => {
            const result = RevenueAnalysisCalculationService.calculateProfitRate(50000, 80000);

            expect(result).toBe(-60); // (-30000 / 50000) * 100
        });
    });

    describe("createRevenueAnalysisItem", () => {
        test("収益分析アイテムを作成", () => {
            const cumulativeData = RevenueAnalysisCalculationService.createCumulativeDataManager();

            const result = RevenueAnalysisCalculationService.createRevenueAnalysisItem(
                "2024-01-01",
                100000,
                60000,
                cumulativeData
            );

            expect(result.date).toBe("2024-01-01");
            expect(result.addedValue).toBe(100000);
            expect(result.expenses).toBe(60000);
            expect(result.grossProfit).toBe(40000);
            expect(result.profitRate).toBe(40);
            expect(result.CumulativeAddedValue).toBe(100000);
            expect(result.CumulativeExpenses).toBe(60000);
        });

        test("複数の日次データを累積", () => {
            const cumulativeData = RevenueAnalysisCalculationService.createCumulativeDataManager();

            const result1 = RevenueAnalysisCalculationService.createRevenueAnalysisItem(
                "2024-01-01",
                100000,
                60000,
                cumulativeData
            );

            const result2 = RevenueAnalysisCalculationService.createRevenueAnalysisItem(
                "2024-01-02",
                50000,
                30000,
                cumulativeData
            );

            expect(result2.CumulativeAddedValue).toBe(150000); // 100000 + 50000
            expect(result2.CumulativeExpenses).toBe(90000); // 60000 + 30000
        });
    });

    describe("createCumulativeDataManager", () => {
        test("累積データ管理オブジェクトを作成", () => {
            const manager = RevenueAnalysisCalculationService.createCumulativeDataManager();

            expect(manager).toBeInstanceOf(CumulativeData);
            expect(manager.cumulativeAddedValue).toBe(0);
            expect(manager.cumulativeExpenses).toBe(0);
        });
    });
});

describe("CumulativeData", () => {
    let cumulativeData: CumulativeData;

    beforeEach(() => {
        cumulativeData = new CumulativeData();
    });

    describe("getters", () => {
        test("累積付加価値を取得", () => {
            expect(cumulativeData.cumulativeAddedValue).toBe(0);
        });

        test("累積経費を取得", () => {
            expect(cumulativeData.cumulativeExpenses).toBe(0);
        });

        test("累積粗利益を取得", () => {
            expect(cumulativeData.cumulativeGrossProfit).toBe(0);
        });

        test("累積利益率を計算", () => {
            expect(cumulativeData.cumulativeProfitRate).toBe(0);
        });
    });

    describe("addDailyData", () => {
        test("日次データを累積データに追加", () => {
            const result = cumulativeData.addDailyData(100000, 60000);

            expect(result.cumulativeAddedValue).toBe(100000);
            expect(result.cumulativeExpenses).toBe(60000);
            expect(result.cumulativeGrossProfit).toBe(40000);
            expect(result.cumulativeProfitRate).toBe(40);
        });

        test("複数の日次データを累積", () => {
            cumulativeData.addDailyData(100000, 60000);
            const result = cumulativeData.addDailyData(50000, 30000);

            expect(result.cumulativeAddedValue).toBe(150000);
            expect(result.cumulativeExpenses).toBe(90000);
        });

        test("累積利益率を正しく計算", () => {
            cumulativeData.addDailyData(100000, 60000);
            const result = cumulativeData.addDailyData(50000, 30000);

            // (150000 - 90000) / 150000 * 100 = 40
            expect(result.cumulativeProfitRate).toBe(40);
        });
    });

    describe("reset", () => {
        test("累積データをリセット", () => {
            cumulativeData.addDailyData(100000, 60000);
            cumulativeData.reset();

            expect(cumulativeData.cumulativeAddedValue).toBe(0);
            expect(cumulativeData.cumulativeExpenses).toBe(0);
            expect(cumulativeData.cumulativeGrossProfit).toBe(0);
        });
    });
});
