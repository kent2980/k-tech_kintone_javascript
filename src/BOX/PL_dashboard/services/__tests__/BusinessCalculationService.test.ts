/**
 * BusinessCalculationServiceのユニットテスト
 */

import { BusinessCalculationService } from "../BusinessCalculationService";

/// <reference path="../../../../../../kintone.d.ts" />
/// <reference path="../../../../../../globals.d.ts" />
/// <reference path="../../fields/line_daily_fields.d.ts" />
/// <reference path="../../fields/model_master_fields.d.ts" />
/// <reference path="../../fields/month_fields.d.ts" />

describe("BusinessCalculationService", () => {
    describe("calculateAddedValue", () => {
        const mockMasterModelData: model_master.SavedFields[] = [
            {
                model_name: { value: "Model A", type: "SINGLE_LINE_TEXT" },
                model_code: { value: "A001", type: "SINGLE_LINE_TEXT" },
                added_value: { value: "1000", type: "NUMBER" },
                $id: { value: "1", type: "ID" },
                $revision: { value: "1", type: "REVISION" },
                更新者: { value: { code: "user1", name: "User 1" }, type: "MODIFIER" },
                作成者: { value: { code: "user1", name: "User 1" }, type: "CREATOR" },
                レコード番号: { value: "1", type: "RECORD_NUMBER" },
                更新日時: { value: "2024-01-01T00:00:00Z", type: "UPDATED_TIME" },
                作成日時: { value: "2024-01-01T00:00:00Z", type: "CREATED_TIME" },
            } as model_master.SavedFields,
            {
                model_name: { value: "Model B", type: "SINGLE_LINE_TEXT" },
                model_code: { value: "", type: "SINGLE_LINE_TEXT" },
                added_value: { value: "2000", type: "NUMBER" },
                $id: { value: "2", type: "ID" },
                $revision: { value: "1", type: "REVISION" },
                更新者: { value: { code: "user1", name: "User 1" }, type: "MODIFIER" },
                作成者: { value: { code: "user1", name: "User 1" }, type: "CREATOR" },
                レコード番号: { value: "2", type: "RECORD_NUMBER" },
                更新日時: { value: "2024-01-01T00:00:00Z", type: "UPDATED_TIME" },
                作成日時: { value: "2024-01-01T00:00:00Z", type: "CREATED_TIME" },
            } as model_master.SavedFields,
        ];

        test("直接付加価値が設定されている場合はその値を使用", () => {
            const record: line_daily.SavedFields = {
                added_value: { value: "5000", type: "NUMBER" },
                model_name: { value: "Model A", type: "SINGLE_LINE_TEXT" },
                model_code: { value: "A001", type: "SINGLE_LINE_TEXT" },
            } as line_daily.SavedFields;

            const result = BusinessCalculationService.calculateAddedValue(
                record,
                mockMasterModelData
            );

            expect(result.calculationMethod).toBe("direct");
            expect(result.addedValue).toBe(5000);
            expect(result.matchedModel).toBeUndefined();
        });

        test("マスタデータから機種名と機種コードでマッチング", () => {
            const record: line_daily.SavedFields = {
                added_value: { value: "", type: "NUMBER" },
                model_name: { value: "Model A", type: "SINGLE_LINE_TEXT" },
                model_code: { value: "A001", type: "SINGLE_LINE_TEXT" },
                actual_number: { value: "5", type: "NUMBER" },
            } as line_daily.SavedFields;

            const result = BusinessCalculationService.calculateAddedValue(
                record,
                mockMasterModelData
            );

            expect(result.calculationMethod).toBe("calculated");
            expect(result.addedValue).toBe(5000); // 1000 * 5
            expect(result.matchedModel).toBeDefined();
            expect(result.matchedModel?.model_name.value).toBe("Model A");
        });

        test("機種コードが空の場合は機種名のみでマッチング", () => {
            const record: line_daily.SavedFields = {
                added_value: { value: "", type: "NUMBER" },
                model_name: { value: "Model B", type: "SINGLE_LINE_TEXT" },
                model_code: { value: "", type: "SINGLE_LINE_TEXT" },
                actual_number: { value: "3", type: "NUMBER" },
            } as line_daily.SavedFields;

            const result = BusinessCalculationService.calculateAddedValue(
                record,
                mockMasterModelData
            );

            expect(result.calculationMethod).toBe("calculated");
            expect(result.addedValue).toBe(6000); // 2000 * 3
            expect(result.matchedModel).toBeDefined();
        });

        test("マッチする機種が見つからない場合は0を返す", () => {
            const record: line_daily.SavedFields = {
                added_value: { value: "", type: "NUMBER" },
                model_name: { value: "Unknown Model", type: "SINGLE_LINE_TEXT" },
                model_code: { value: "", type: "SINGLE_LINE_TEXT" },
                actual_number: { value: "1", type: "NUMBER" },
            } as line_daily.SavedFields;

            const result = BusinessCalculationService.calculateAddedValue(
                record,
                mockMasterModelData
            );

            expect(result.calculationMethod).toBe("calculated");
            expect(result.addedValue).toBe(0);
            expect(result.matchedModel).toBeUndefined();
        });

        test("マスタデータが空の場合は0を返す", () => {
            const record: line_daily.SavedFields = {
                added_value: { value: "", type: "NUMBER" },
                model_name: { value: "Model A", type: "SINGLE_LINE_TEXT" },
                model_code: { value: "A001", type: "SINGLE_LINE_TEXT" },
            } as line_daily.SavedFields;

            const result = BusinessCalculationService.calculateAddedValue(record, []);

            expect(result.calculationMethod).toBe("calculated");
            expect(result.addedValue).toBe(0);
        });
    });

    describe("calculateCosts", () => {
        test("基本工数と残業工数からコストを計算", () => {
            const record: line_daily.SavedFields = {
                inside_time: { value: "8", type: "NUMBER" },
                outside_time: { value: "4", type: "NUMBER" },
                inside_overtime: { value: "2", type: "NUMBER" },
                outside_overtime: { value: "1", type: "NUMBER" },
            } as line_daily.SavedFields;

            const result = BusinessCalculationService.calculateCosts(record, 3000, 2500);

            expect(result.insideTime).toBe(8);
            expect(result.outsideTime).toBe(4);
            expect(result.insideOvertime).toBe(2);
            expect(result.outsideOvertime).toBe(1);

            // 基本工数コスト
            expect(result.insideCost).toBe(24000); // 8 * 3000
            expect(result.outsideCost).toBe(10000); // 4 * 2500

            // 残業工数コスト（1.25倍）
            expect(result.insideOvertimeCost).toBe(7500); // 2 * 3000 * 1.25
            expect(result.outsideOvertimeCost).toBe(3125); // 1 * 2500 * 1.25

            // 経費合計
            expect(result.totalCost).toBe(44625); // 24000 + 10000 + 7500 + 3125
        });

        test("工数が0の場合も正しく計算", () => {
            const record: line_daily.SavedFields = {
                inside_time: { value: "0", type: "NUMBER" },
                outside_time: { value: "0", type: "NUMBER" },
                inside_overtime: { value: "0", type: "NUMBER" },
                outside_overtime: { value: "0", type: "NUMBER" },
            } as line_daily.SavedFields;

            const result = BusinessCalculationService.calculateCosts(record, 3000, 2500);

            expect(result.totalCost).toBe(0);
        });
    });

    describe("calculateProfit", () => {
        test("利益と利益率を正しく計算", () => {
            const result = BusinessCalculationService.calculateProfit(100000, 60000);

            expect(result.grossProfit).toBe(40000); // 100000 - 60000
            expect(result.profitRate).toBe(40); // (40000 / 100000) * 100
            expect(result.profitRateString).toBe("40.00%");
        });

        test("付加価値が0の場合は利益率0を返す", () => {
            const result = BusinessCalculationService.calculateProfit(0, 0);

            expect(result.grossProfit).toBe(0);
            expect(result.profitRate).toBe(0);
            expect(result.profitRateString).toBe("0%");
        });

        test("赤字の場合も正しく計算", () => {
            const result = BusinessCalculationService.calculateProfit(50000, 80000);

            expect(result.grossProfit).toBe(-30000);
            expect(result.profitRate).toBe(-60);
            expect(result.profitRateString).toBe("-60.00%");
        });
    });

    describe("calculateBusinessMetrics", () => {
        const mockRecord: line_daily.SavedFields = {
            added_value: { value: "10000", type: "NUMBER" },
            model_name: { value: "Model A", type: "SINGLE_LINE_TEXT" },
            model_code: { value: "A001", type: "SINGLE_LINE_TEXT" },
            inside_time: { value: "8", type: "NUMBER" },
            outside_time: { value: "4", type: "NUMBER" },
            inside_overtime: { value: "2", type: "NUMBER" },
            outside_overtime: { value: "1", type: "NUMBER" },
            actual_number: { value: "1", type: "NUMBER" },
        } as line_daily.SavedFields;

        const mockMasterModelData: model_master.SavedFields[] = [
            {
                model_name: { value: "Model A", type: "SINGLE_LINE_TEXT" },
                model_code: { value: "A001", type: "SINGLE_LINE_TEXT" },
                added_value: { value: "10000", type: "NUMBER" },
                $id: { value: "1", type: "ID" },
                $revision: { value: "1", type: "REVISION" },
                更新者: { value: { code: "user1", name: "User 1" }, type: "MODIFIER" },
                作成者: { value: { code: "user1", name: "User 1" }, type: "CREATOR" },
                レコード番号: { value: "1", type: "RECORD_NUMBER" },
                更新日時: { value: "2024-01-01T00:00:00Z", type: "UPDATED_TIME" },
                作成日時: { value: "2024-01-01T00:00:00Z", type: "CREATED_TIME" },
            } as model_master.SavedFields,
        ];

        test("経営指標を統合計算", () => {
            const mockMonthlyData: monthly.SavedFields = {
                inside_unit: { value: "3000", type: "NUMBER" },
                outside_unit: { value: "2500", type: "NUMBER" },
                $id: { value: "1", type: "ID" },
                $revision: { value: "1", type: "REVISION" },
                更新者: { value: { code: "user1", name: "User 1" }, type: "MODIFIER" },
                作成者: { value: { code: "user1", name: "User 1" }, type: "CREATOR" },
                レコード番号: { value: "1", type: "RECORD_NUMBER" },
                更新日時: { value: "2024-01-01T00:00:00Z", type: "UPDATED_TIME" },
                作成日時: { value: "2024-01-01T00:00:00Z", type: "CREATED_TIME" },
            } as monthly.SavedFields;

            const result = BusinessCalculationService.calculateBusinessMetrics(
                mockRecord,
                mockMonthlyData
            );

            expect(result).toHaveProperty("addedValue");
            expect(result).toHaveProperty("cost");
            expect(result).toHaveProperty("profit");

            expect(result.addedValue.addedValue).toBe(10000);
            expect(result.cost.totalCost).toBe(44625);
            expect(result.profit.grossProfit).toBe(-34625); // 10000 - 44625
        });

        test("マスタデータがない場合でも計算可能", () => {
            const mockMonthlyData: monthly.SavedFields = {
                inside_unit: { value: "3000", type: "NUMBER" },
                outside_unit: { value: "2500", type: "NUMBER" },
                $id: { value: "1", type: "ID" },
                $revision: { value: "1", type: "REVISION" },
                更新者: { value: { code: "user1", name: "User 1" }, type: "MODIFIER" },
                作成者: { value: { code: "user1", name: "User 1" }, type: "CREATOR" },
                レコード番号: { value: "1", type: "RECORD_NUMBER" },
                更新日時: { value: "2024-01-01T00:00:00Z", type: "UPDATED_TIME" },
                作成日時: { value: "2024-01-01T00:00:00Z", type: "CREATED_TIME" },
            } as monthly.SavedFields;

            const result = BusinessCalculationService.calculateBusinessMetrics(
                mockRecord,
                mockMonthlyData
            );

            expect(result.addedValue.addedValue).toBe(10000); // 直接設定された値
            expect(result.cost.totalCost).toBe(44625);
        });
    });

    describe("calculateCumulativeRevenue", () => {
        test("累積収益分析を計算", () => {
            const result = BusinessCalculationService.calculateCumulativeRevenue(
                100000,
                60000,
                500000,
                300000
            );

            expect(result.cumulativeAddedValue).toBe(600000); // 500000 + 100000
            expect(result.cumulativeExpenses).toBe(360000); // 300000 + 60000
            expect(result.cumulativeGrossProfit).toBe(240000); // 600000 - 360000
            expect(result.cumulativeProfitRate).toBe(40); // (240000 / 600000) * 100
        });

        test("前日累積がない場合", () => {
            const result = BusinessCalculationService.calculateCumulativeRevenue(100000, 60000);

            expect(result.cumulativeAddedValue).toBe(100000);
            expect(result.cumulativeExpenses).toBe(60000);
            expect(result.cumulativeGrossProfit).toBe(40000);
            expect(result.cumulativeProfitRate).toBe(40);
        });

        test("累積付加価値が0の場合は利益率0を返す", () => {
            const result = BusinessCalculationService.calculateCumulativeRevenue(0, 0, 0, 0);

            expect(result.cumulativeProfitRate).toBe(0);
        });
    });

    describe("formatProfitRate", () => {
        test("利益率をフォーマット", () => {
            const result = BusinessCalculationService.formatProfitRate(40.123);

            expect(result).toBe("40.12%");
        });

        test("負の利益率をフォーマット", () => {
            const result = BusinessCalculationService.formatProfitRate(-50.5);

            expect(result).toBe("-50.50%");
        });
    });

    describe("formatAmount", () => {
        test("金額をフォーマット", () => {
            const result = BusinessCalculationService.formatAmount(1234567);

            expect(result).toBe("1,234,567");
        });

        test("負の金額をフォーマット", () => {
            const result = BusinessCalculationService.formatAmount(-1234567);

            expect(result).toBe("-1,234,567");
        });

        test("0をフォーマット", () => {
            const result = BusinessCalculationService.formatAmount(0);

            expect(result).toBe("0");
        });
    });
});
