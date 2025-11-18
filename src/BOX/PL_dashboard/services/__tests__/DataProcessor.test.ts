/**
 * DataProcessorのユニットテスト
 */

import { DataProcessor } from "../DataProcessor";
import { ProductHistoryData, TotalsByDate } from "../../types";
import { HolidayStore } from "../../store";

// HolidayStoreをモック
jest.mock("../../store", () => ({
    HolidayStore: {
        getInstance: jest.fn(() => ({
            getHolidayData: jest.fn(() => [
                { date: { value: "2024-01-01" }, holiday_type: { value: "法定休日" } },
                { date: { value: "2024-01-07" }, holiday_type: { value: "所定休日" } },
            ]),
        })),
    },
}));

describe("DataProcessor", () => {
    const mockProductHistoryData: ProductHistoryData[] = [
        {
            date: "2024-01-01",
            line_name: "Line A",
            actual_number: "10",
            addedValue: 100000,
            totalCost: 60000,
            grossProfit: 40000,
            profitRate: "66.7",
            insideOvertime: "2",
            outsideOvertime: "1",
            insideRegularTime: "8",
            outsideRegularTime: "4",
        },
        {
            date: "2024-01-01",
            line_name: "Line B",
            actual_number: "5",
            addedValue: 50000,
            totalCost: 30000,
            grossProfit: 20000,
            profitRate: "66.7",
            insideOvertime: "1",
            outsideOvertime: "0.5",
            insideRegularTime: "4",
            outsideRegularTime: "2",
        },
        {
            date: "2024-01-02",
            line_name: "Line A",
            actual_number: "8",
            addedValue: 80000,
            totalCost: 50000,
            grossProfit: 30000,
            profitRate: "60.0",
            insideOvertime: "0",
            outsideOvertime: "0",
            insideRegularTime: "8",
            outsideRegularTime: "4",
        },
    ];

    describe("getTotalsByDate", () => {
        test("指定日付の合計値を正しく計算", () => {
            const result = DataProcessor.getTotalsByDate(mockProductHistoryData, "2024-01-01");

            expect(result.date).toBe("2024-01-01");
            expect(result.totalActualNumber).toBe(15); // 10 + 5
            expect(result.totalAddedValue).toBe(150); // (100000 + 50000) / 1000
            expect(result.totalCost).toBe(90); // (60000 + 30000) / 1000
            expect(result.totalGrossProfit).toBe(60); // (40000 + 20000) / 1000
        });

        test("法定休日の場合は休日残業時間を分類", () => {
            const result = DataProcessor.getTotalsByDate(mockProductHistoryData, "2024-01-01");

            // 法定休日なので、通常残業時間は0、休日残業時間に集計される
            expect(result.totalInsideOvertime).toBe(0);
            expect(result.totalOutsideOvertime).toBe(0);
            expect(result.totalInsideHolidayOvertime).toBeGreaterThan(0);
            expect(result.totalOutsideHolidayOvertime).toBeGreaterThan(0);
        });

        test("平日の場合は通常残業時間を分類", () => {
            const result = DataProcessor.getTotalsByDate(mockProductHistoryData, "2024-01-02");

            // 平日なので、通常残業時間に集計される
            expect(result.totalInsideOvertime).toBe(0);
            expect(result.totalOutsideOvertime).toBe(0);
            expect(result.totalInsideHolidayOvertime).toBe(0);
            expect(result.totalOutsideHolidayOvertime).toBe(0);
        });

        test("データが存在しない日付の場合は0を返す", () => {
            const result = DataProcessor.getTotalsByDate(mockProductHistoryData, "2024-01-31");

            expect(result.totalActualNumber).toBe(0);
            expect(result.totalAddedValue).toBe(0);
            expect(result.totalCost).toBe(0);
            expect(result.totalGrossProfit).toBe(0);
        });

        test("空の配列の場合は0を返す", () => {
            const result = DataProcessor.getTotalsByDate([], "2024-01-01");

            expect(result.totalActualNumber).toBe(0);
            expect(result.totalAddedValue).toBe(0);
            expect(result.totalCost).toBe(0);
        });
    });

    describe("getDateList", () => {
        test("年月が指定されている場合は完全な日付リストを生成", () => {
            const result = DataProcessor.getDateList(mockProductHistoryData, "2024", "01");

            expect(result.length).toBe(31); // 2024年1月は31日
            expect(result[0]).toBe("2024-01-01");
            expect(result[30]).toBe("2024-01-31");
        });

        test("年月が指定されていない場合はデータから一意な日付を取得", () => {
            const result = DataProcessor.getDateList(mockProductHistoryData);

            expect(result.length).toBe(2); // 2024-01-01, 2024-01-02
            expect(result).toContain("2024-01-01");
            expect(result).toContain("2024-01-02");
        });

        test("空の配列の場合は空配列を返す", () => {
            const result = DataProcessor.getDateList([]);

            expect(result.length).toBe(0);
        });
    });

    describe("getRecordsByDate", () => {
        const mockDailyReportData: daily.SavedFields[] = [
            {
                date: { value: "2024-01-01" },
            } as daily.SavedFields,
            {
                date: { value: "2024-01-01" },
            } as daily.SavedFields,
            {
                date: { value: "2024-01-02" },
            } as daily.SavedFields,
        ];

        test("指定日付のレコードを正しく取得", () => {
            const result = DataProcessor.getRecordsByDate(mockDailyReportData, "2024-01-01");

            expect(result.length).toBe(2);
            expect(result.every((r) => r.date?.value === "2024-01-01")).toBe(true);
        });

        test("データが存在しない日付の場合は空配列を返す", () => {
            const result = DataProcessor.getRecordsByDate(mockDailyReportData, "2024-01-31");

            expect(result.length).toBe(0);
        });
    });

    describe("createProductHistoryData", () => {
        const mockRecords: line_daily.SavedFields[] = [
            {
                date: { value: "2024-01-01" },
                line_name: { value: "Line A" },
                actual_number: { value: "10" },
                added_value: { value: "10000" },
                model_name: { value: "Model A" },
            } as line_daily.SavedFields,
        ];

        const mockMasterModelData: model_master.SavedFields[] = [
            {
                model_name: { value: "Model A" },
                added_value: { value: "1000" },
            } as model_master.SavedFields,
        ];

        test("製品履歴データを正しく作成", () => {
            const result = DataProcessor.createProductHistoryData(
                mockRecords,
                mockMasterModelData,
                3000,
                2500
            );

            expect(result.length).toBe(1);
            expect(result[0].date).toBe("2024-01-01");
            expect(result[0].line_name).toBe("Line A");
            expect(result[0].actual_number).toBe("10");
        });
    });

    describe("calculateAddedValue", () => {
        test("直接付加価値が設定されている場合はその値を使用", () => {
            const record: any = {
                added_value: { value: "5000" },
                model_name: { value: "Model A" },
            };

            const result = DataProcessor.calculateAddedValue(record, []);

            expect(result).toBe(5000);
        });

        test("マスタデータから付加価値を取得", () => {
            const record: any = {
                added_value: { value: "" },
                model_name: { value: "Model A" },
                model_code: { value: "" },
                actual_number: { value: "10" },
            };

            const masterModelData: any[] = [
                {
                    model_name: { value: "Model A" },
                    added_value: { value: "1000" },
                },
            ];

            const result = DataProcessor.calculateAddedValue(record, masterModelData);

            expect(result).toBe(10000); // 1000 * 10
        });

        test("マスタデータが見つからない場合は0を返す", () => {
            const record: any = {
                added_value: { value: "" },
                model_name: { value: "Model B" },
                model_code: { value: "" },
            };

            const masterModelData: any[] = [
                {
                    model_name: { value: "Model A" },
                    added_value: { value: "1000" },
                },
            ];

            const result = DataProcessor.calculateAddedValue(record, masterModelData);

            expect(result).toBe(0);
        });
    });

    describe("calculateCosts", () => {
        test("経費を正しく計算", () => {
            const record: any = {
                inside_time: { value: "8" },
                outside_time: { value: "4" },
                inside_overtime: { value: "2" },
                outside_overtime: { value: "1" },
            };

            const result = DataProcessor.calculateCosts(record, 3000, 2500);

            expect(result.insideCost).toBe(24000); // 8 * 3000
            expect(result.outsideCost).toBe(10000); // 4 * 2500
            expect(result.insideOvertimeCost).toBe(7500); // 2 * 3000 * 1.25
            expect(result.outsideOvertimeCost).toBe(3125); // 1 * 2500 * 1.25
            expect(result.totalCost).toBe(44625); // 24000 + 10000 + 7500 + 3125
        });
    });

    describe("getFieldValue", () => {
        test("フィールドの値を数値として取得", () => {
            expect(DataProcessor.getFieldValue({ value: "123" })).toBe(123);
            expect(DataProcessor.getFieldValue({ value: 456 })).toBe(456);
        });

        test("フィールドがundefinedの場合は0を返す", () => {
            expect(DataProcessor.getFieldValue(undefined)).toBe(0);
        });
    });

    describe("getFieldText", () => {
        test("フィールドの値を文字列として取得", () => {
            expect(DataProcessor.getFieldText({ value: "test" })).toBe("test");
        });

        test("フィールドがundefinedの場合は空文字を返す", () => {
            expect(DataProcessor.getFieldText(undefined)).toBe("");
        });
    });
});
