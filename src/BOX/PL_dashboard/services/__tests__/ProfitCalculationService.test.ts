/**
 * ProfitCalculationServiceのユニットテスト
 */

import { ProfitCalculationService } from "../ProfitCalculationService";

describe("ProfitCalculationService", () => {
    describe("calculateDirectCost", () => {
        test("直行経費を計算", () => {
            const result = ProfitCalculationService.calculateDirectCost(3000, 10);

            // (3000 * 8) / 1000 * 10 = 240
            expect(result).toBe(240);
        });

        test("単価が0の場合は0を返す", () => {
            const result = ProfitCalculationService.calculateDirectCost(0, 10);

            expect(result).toBe(0);
        });

        test("人員が0の場合は0を返す", () => {
            const result = ProfitCalculationService.calculateDirectCost(3000, 0);

            expect(result).toBe(0);
        });
    });

    describe("calculateDispatchCost", () => {
        test("派遣経費を計算", () => {
            const result = ProfitCalculationService.calculateDispatchCost(2500, 5);

            // (2500 * 8) / 1000 * 5 = 100
            expect(result).toBe(100);
        });
    });

    describe("calculateIndirectCost", () => {
        test("間接経費を計算", () => {
            const result = ProfitCalculationService.calculateIndirectCost(2000, 3);

            // (2000 * 8) / 1000 * 3 = 48
            expect(result).toBe(48);
        });
    });

    describe("calculateOvertimeAndHolidayCost", () => {
        test("残業&休出経費を計算", () => {
            const result = ProfitCalculationService.calculateOvertimeAndHolidayCost(3000, 2, 1);

            // 残業: 2 * (3000 * 1.25) / 1000 = 7.5 → 8
            // 休出: 1 * (3000 * 1.35) / 1000 = 4.05 → 4
            // 合計: 12
            expect(result.overtimeCost).toBeGreaterThan(0);
            expect(result.holidayCost).toBeGreaterThan(0);
            expect(result.totalCost).toBe(result.overtimeCost + result.holidayCost);
        });

        test("残業時間が0の場合", () => {
            const result = ProfitCalculationService.calculateOvertimeAndHolidayCost(3000, 0, 1);

            expect(result.overtimeCost).toBe(0);
            expect(result.holidayCost).toBeGreaterThan(0);
        });

        test("休出時間が0の場合", () => {
            const result = ProfitCalculationService.calculateOvertimeAndHolidayCost(3000, 2, 0);

            expect(result.overtimeCost).toBeGreaterThan(0);
            expect(result.holidayCost).toBe(0);
        });
    });

    describe("calculateDailyProfit", () => {
        test("日次データから損益計算を実行", () => {
            const mockDailyRecord: daily.SavedFields = {
                date: { value: "2024-01-01", type: "DATE" },
                direct_personnel: { value: "10", type: "NUMBER" },
                temporary_employees: { value: "5", type: "NUMBER" },
                indirect_personnel: { value: "3", type: "NUMBER" },
                indirect_overtime: { value: "1", type: "NUMBER" },
                indirect_holiday_work: { value: "0", type: "NUMBER" },
                labor_costs: { value: "1000", type: "NUMBER" },
                indirect_material_costs: { value: "500", type: "NUMBER" },
                other_indirect_material_costs: { value: "200", type: "SINGLE_LINE_TEXT" },
                night_shift_allowance: { value: "0", type: "NUMBER" },
                total_sub_cost: { value: "0", type: "NUMBER" },
                inside_overtime_cost: { value: "0", type: "NUMBER" },
                outside_overtime_cost: { value: "0", type: "NUMBER" },
                outside_holiday_expenses: { value: "0", type: "NUMBER" },
                other_added_value: { value: "0", type: "NUMBER" },
                inside_holiday_expenses: { value: "0", type: "NUMBER" },
                $id: { value: "1", type: "ID" },
                $revision: { value: "1", type: "REVISION" },
                更新者: { value: { code: "user1", name: "User 1" }, type: "MODIFIER" },
                作成者: { value: { code: "user1", name: "User 1" }, type: "CREATOR" },
                レコード番号: { value: "1", type: "RECORD_NUMBER" },
                更新日時: { value: "2024-01-01T00:00:00Z", type: "UPDATED_TIME" },
                作成日時: { value: "2024-01-01T00:00:00Z", type: "CREATED_TIME" },
            };

            const mockMonthlyData: monthly.SavedFields = {
                year_month: { value: "2024_01", type: "SINGLE_LINE_TEXT" },
                direct: { value: "3000", type: "NUMBER" },
                dispatch: { value: "2500", type: "NUMBER" },
                indirect: { value: "2000", type: "NUMBER" },
                dispatch_number: { value: "0", type: "NUMBER" },
                year: { value: "2024", type: "NUMBER" },
                inside_unit: { value: "0", type: "NUMBER" },
                month: { value: "1", type: "DROP_DOWN" },
                indirect_number: { value: "0", type: "NUMBER" },
                outside_unit: { value: "0", type: "NUMBER" },
                direct_number: { value: "0", type: "NUMBER" },
                $id: { value: "1", type: "ID" },
                $revision: { value: "1", type: "REVISION" },
                更新者: { value: { code: "user1", name: "User 1" }, type: "MODIFIER" },
                作成者: { value: { code: "user1", name: "User 1" }, type: "CREATOR" },
                レコード番号: { value: "1", type: "RECORD_NUMBER" },
                更新日時: { value: "2024-01-01T00:00:00Z", type: "UPDATED_TIME" },
                作成日時: { value: "2024-01-01T00:00:00Z", type: "CREATED_TIME" },
            };

            const totals = {
                totalInsideOvertime: 2,
                totalInsideHolidayOvertime: 1,
                totalOutsideOvertime: 1,
                totalOutsideHolidayOvertime: 0,
            };

            const result = ProfitCalculationService.calculateDailyProfit(
                mockDailyRecord,
                mockMonthlyData,
                totals
            );

            expect(result).toHaveProperty("directCost");
            expect(result).toHaveProperty("dispatchCost");
            expect(result).toHaveProperty("indirectCost");
            expect(result).toHaveProperty("totalPersonnelExpenses");
        });

        test("月次データがnullの場合でも計算可能", () => {
            const mockDailyRecord: daily.SavedFields = {
                date: { value: "2024-01-01", type: "DATE" },
                direct_personnel: { value: "10", type: "NUMBER" },
                temporary_employees: { value: "0", type: "NUMBER" },
                indirect_personnel: { value: "0", type: "NUMBER" },
                indirect_overtime: { value: "0", type: "NUMBER" },
                indirect_holiday_work: { value: "0", type: "NUMBER" },
                labor_costs: { value: "0", type: "NUMBER" },
                indirect_material_costs: { value: "0", type: "NUMBER" },
                other_indirect_material_costs: { value: "0", type: "SINGLE_LINE_TEXT" },
                night_shift_allowance: { value: "0", type: "NUMBER" },
                total_sub_cost: { value: "0", type: "NUMBER" },
                inside_overtime_cost: { value: "0", type: "NUMBER" },
                outside_overtime_cost: { value: "0", type: "NUMBER" },
                outside_holiday_expenses: { value: "0", type: "NUMBER" },
                other_added_value: { value: "0", type: "NUMBER" },
                inside_holiday_expenses: { value: "0", type: "NUMBER" },
                $id: { value: "1", type: "ID" },
                $revision: { value: "1", type: "REVISION" },
                更新者: { value: { code: "user1", name: "User 1" }, type: "MODIFIER" },
                作成者: { value: { code: "user1", name: "User 1" }, type: "CREATOR" },
                レコード番号: { value: "1", type: "RECORD_NUMBER" },
                更新日時: { value: "2024-01-01T00:00:00Z", type: "UPDATED_TIME" },
                作成日時: { value: "2024-01-01T00:00:00Z", type: "CREATED_TIME" },
            };

            const totals = {
                totalInsideOvertime: 0,
                totalInsideHolidayOvertime: 0,
                totalOutsideOvertime: 0,
                totalOutsideHolidayOvertime: 0,
            };

            const result = ProfitCalculationService.calculateDailyProfit(
                mockDailyRecord,
                null,
                totals
            );

            expect(result.directCost).toBe(0);
            expect(result.dispatchCost).toBe(0);
        });

        test("日次データがnullの場合でも計算可能", () => {
            const mockMonthlyData: monthly.SavedFields = {
                year_month: { value: "2024_01", type: "SINGLE_LINE_TEXT" },
                direct: { value: "3000", type: "NUMBER" },
                dispatch: { value: "0", type: "NUMBER" },
                indirect: { value: "0", type: "NUMBER" },
                dispatch_number: { value: "0", type: "NUMBER" },
                year: { value: "2024", type: "NUMBER" },
                inside_unit: { value: "0", type: "NUMBER" },
                month: { value: "1", type: "DROP_DOWN" },
                indirect_number: { value: "0", type: "NUMBER" },
                outside_unit: { value: "0", type: "NUMBER" },
                direct_number: { value: "0", type: "NUMBER" },
                $id: { value: "1", type: "ID" },
                $revision: { value: "1", type: "REVISION" },
                更新者: { value: { code: "user1", name: "User 1" }, type: "MODIFIER" },
                作成者: { value: { code: "user1", name: "User 1" }, type: "CREATOR" },
                レコード番号: { value: "1", type: "RECORD_NUMBER" },
                更新日時: { value: "2024-01-01T00:00:00Z", type: "UPDATED_TIME" },
                作成日時: { value: "2024-01-01T00:00:00Z", type: "CREATED_TIME" },
            };

            const totals = {
                totalInsideOvertime: 0,
                totalInsideHolidayOvertime: 0,
                totalOutsideOvertime: 0,
                totalOutsideHolidayOvertime: 0,
            };

            const result = ProfitCalculationService.calculateDailyProfit(
                null,
                mockMonthlyData,
                totals
            );

            expect(result).toBeDefined();
        });
    });

    describe("createRevenueAnalysisData", () => {
        test("収益分析データを作成", () => {
            const result = ProfitCalculationService.createRevenueAnalysisData(100000, 60000, {
                cumulativeAddedValue: 500000,
                cumulativeExpenses: 300000,
                cumulativeGrossProfit: 200000,
            });

            expect(result.grossProfit).toBe(40000); // 100000 - 60000
            expect(result.profitRate).toBe(40); // (40000 / 100000) * 100
            expect(result.cumulativeProfitRate).toBe(40); // ((500000 - 300000) / 500000) * 100
        });

        test("付加価値が0の場合は利益率0を返す", () => {
            const result = ProfitCalculationService.createRevenueAnalysisData(0, 0, {
                cumulativeAddedValue: 0,
                cumulativeExpenses: 0,
                cumulativeGrossProfit: 0,
            });

            expect(result.profitRate).toBe(0);
            expect(result.cumulativeProfitRate).toBe(0);
        });

        test("累積付加価値が0の場合は累積利益率0を返す", () => {
            const result = ProfitCalculationService.createRevenueAnalysisData(100000, 60000, {
                cumulativeAddedValue: 0,
                cumulativeExpenses: 0,
                cumulativeGrossProfit: 0,
            });

            expect(result.cumulativeProfitRate).toBe(0);
        });
    });
});
