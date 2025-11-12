import { DataProcessor } from "../DataProcessor";

// モックデータ
const mockProductHistoryData = [
    {
        date: "2024-01-01",
        line_name: "Line A",
        actual_number: "10",
        addedValue: 1000,
        totalCost: 800,
        grossProfit: 200,
        profitRate: "20.00%",
        insideOvertime: "2",
        outsideOvertime: "1",
        insideRegularTime: "8",
        outsideRegularTime: "4",
    },
    {
        date: "2024-01-01",
        line_name: "Line B",
        actual_number: "5",
        addedValue: 500,
        totalCost: 400,
        grossProfit: 100,
        profitRate: "20.00%",
        insideOvertime: "1",
        outsideOvertime: "0",
        insideRegularTime: "8",
        outsideRegularTime: "4",
    },
    {
        date: "2024-01-02",
        line_name: "Line A",
        actual_number: "8",
        addedValue: 800,
        totalCost: 600,
        grossProfit: 200,
        profitRate: "25.00%",
        insideOvertime: "1.5",
        outsideOvertime: "0.5",
        insideRegularTime: "8",
        outsideRegularTime: "4",
    },
];

const mockDailyReportData: daily.SavedFields[] = [
    {
        $id: { type: "ID", value: "1" },
        $revision: { type: "REVISION", value: "1" },
        date: { type: "DATE", value: "2024-01-01" },
        direct_personnel: { type: "NUMBER", value: "10" },
        temporary_employees: { type: "NUMBER", value: "5" },
    } as daily.SavedFields,
    {
        $id: { type: "ID", value: "2" },
        $revision: { type: "REVISION", value: "1" },
        date: { type: "DATE", value: "2024-01-02" },
        direct_personnel: { type: "NUMBER", value: "12" },
        temporary_employees: { type: "NUMBER", value: "3" },
    } as daily.SavedFields,
];

const mockMasterModelData: model_master.SavedFields[] = [
    {
        $id: { type: "ID", value: "1" },
        $revision: { type: "REVISION", value: "1" },
        line_name: { type: "SINGLE_LINE_TEXT", value: "Line A" },
        model_name: { type: "SINGLE_LINE_TEXT", value: "Model X" },
        model_code: { type: "SINGLE_LINE_TEXT", value: "MX001" },
        added_value: { type: "NUMBER", value: "100" },
    } as model_master.SavedFields,
    {
        $id: { type: "ID", value: "2" },
        $revision: { type: "REVISION", value: "1" },
        line_name: { type: "SINGLE_LINE_TEXT", value: "Line B" },
        model_name: { type: "SINGLE_LINE_TEXT", value: "Model Y" },
        model_code: { type: "SINGLE_LINE_TEXT", value: "MY001" },
        added_value: { type: "NUMBER", value: "150" },
    } as model_master.SavedFields,
];

const mockProductionRecord: line_daily.SavedFields = {
    $id: { type: "ID", value: "1" },
    $revision: { type: "REVISION", value: "1" },
    date: { type: "DATE", value: "2024-01-01" },
    line_name: { type: "SINGLE_LINE_TEXT", value: "Line A" },
    model_name: { type: "SINGLE_LINE_TEXT", value: "Model X" },
    model_code: { type: "SINGLE_LINE_TEXT", value: "MX001" },
    actual_number: { type: "NUMBER", value: "10" },
    added_value: { type: "NUMBER", value: "" },
    inside_time: { type: "NUMBER", value: "8" },
    outside_time: { type: "NUMBER", value: "4" },
    inside_overtime: { type: "NUMBER", value: "2" },
    outside_overtime: { type: "NUMBER", value: "1" },
} as line_daily.SavedFields;

describe("DataProcessor", () => {
    describe("getTotalsByDate", () => {
        it("should calculate correct totals for a specific date", () => {
            const result = DataProcessor.getTotalsByDate(mockProductHistoryData, "2024-01-01");

            expect(result.date).toBe("2024-01-01");
            expect(result.totalActualNumber).toBe(15); // 10 + 5
            expect(result.totalAddedValue).toBe(1.5); // (1000 + 500) / 1000
            expect(result.totalCost).toBe(1.2); // (800 + 400) / 1000
            expect(result.totalGrossProfit).toBe(0.3); // (200 + 100) / 1000
            expect(result.totalInsideOvertime).toBe(3); // 2 + 1
            expect(result.totalOutsideOvertime).toBe(1); // 1 + 0
        });

        it("should return zeros for non-existent date", () => {
            const result = DataProcessor.getTotalsByDate(mockProductHistoryData, "2024-12-31");

            expect(result.date).toBe("2024-12-31");
            expect(result.totalActualNumber).toBe(0);
            expect(result.totalAddedValue).toBe(0);
            expect(result.totalCost).toBe(0);
            expect(result.totalGrossProfit).toBe(0);
            expect(result.totalInsideOvertime).toBe(0);
            expect(result.totalOutsideOvertime).toBe(0);
        });

        it("should handle empty product history data", () => {
            const result = DataProcessor.getTotalsByDate([], "2024-01-01");

            expect(result.totalActualNumber).toBe(0);
            expect(result.totalAddedValue).toBe(0);
        });
    });

    describe("getDateList", () => {
        it("should return unique sorted dates", () => {
            const result = DataProcessor.getDateList(mockProductHistoryData);

            expect(result).toEqual(["2024-01-01", "2024-01-02"]);
        });

        it("should handle empty data", () => {
            const result = DataProcessor.getDateList([]);

            expect(result).toEqual([]);
        });

        it("should remove duplicate dates", () => {
            const dataWithDuplicates = [
                ...mockProductHistoryData,
                {
                    date: "2024-01-01",
                    line_name: "Line C",
                    actual_number: "3",
                    addedValue: 300,
                    totalCost: 250,
                    grossProfit: 50,
                    profitRate: "16.67%",
                    insideOvertime: "0",
                    outsideOvertime: "0",
                    insideRegularTime: "8",
                    outsideRegularTime: "4",
                },
            ];

            const result = DataProcessor.getDateList(dataWithDuplicates);

            expect(result).toEqual(["2024-01-01", "2024-01-02"]);
        });
    });

    describe("getRecordsByDate", () => {
        it("should return records for specific date", () => {
            const result = DataProcessor.getRecordsByDate(mockDailyReportData, "2024-01-01");

            expect(result).toHaveLength(1);
            expect(result[0].date.value).toBe("2024-01-01");
            expect(result[0].direct_personnel.value).toBe("10");
        });

        it("should return empty array for non-existent date", () => {
            const result = DataProcessor.getRecordsByDate(mockDailyReportData, "2024-12-31");

            expect(result).toEqual([]);
        });

        it("should handle null/undefined daily report data", () => {
            const result = DataProcessor.getRecordsByDate(undefined as any, "2024-01-01");

            expect(result).toEqual([]);
        });
    });

    describe("calculateAddedValue", () => {
        it("should use direct added value when available", () => {
            const recordWithDirectValue = {
                ...mockProductionRecord,
                added_value: { type: "NUMBER", value: "500" },
            } as line_daily.SavedFields;

            const result = DataProcessor.calculateAddedValue(
                recordWithDirectValue,
                mockMasterModelData
            );

            expect(result).toBe(500);
        });

        it("should calculate from master data when direct value is empty", () => {
            const result = DataProcessor.calculateAddedValue(
                mockProductionRecord,
                mockMasterModelData
            );

            // Model X has added_value of 100, actual_number is 10
            expect(result).toBe(1000); // 100 * 10
        });

        it("should match by model name and code", () => {
            const recordWithCode = {
                ...mockProductionRecord,
                model_name: { type: "SINGLE_LINE_TEXT", value: "Model Y" },
                model_code: { type: "SINGLE_LINE_TEXT", value: "MY001" },
                actual_number: { type: "NUMBER", value: "5" },
            } as line_daily.SavedFields;

            const result = DataProcessor.calculateAddedValue(recordWithCode, mockMasterModelData);

            // Model Y has added_value of 150, actual_number is 5
            expect(result).toBe(750); // 150 * 5
        });

        it("should match by model name only when code is empty", () => {
            const recordNoCode = {
                ...mockProductionRecord,
                model_code: { type: "SINGLE_LINE_TEXT", value: "" },
                actual_number: { type: "NUMBER", value: "3" },
            } as line_daily.SavedFields;

            const result = DataProcessor.calculateAddedValue(recordNoCode, mockMasterModelData);

            expect(result).toBe(300); // 100 * 3
        });

        it("should return 0 when no match found", () => {
            const recordNoMatch = {
                ...mockProductionRecord,
                model_name: { type: "SINGLE_LINE_TEXT", value: "Unknown Model" },
                model_code: { type: "SINGLE_LINE_TEXT", value: "UNK001" },
            } as line_daily.SavedFields;

            const result = DataProcessor.calculateAddedValue(recordNoMatch, mockMasterModelData);

            expect(result).toBe(0);
        });

        it("should handle empty master data", () => {
            const result = DataProcessor.calculateAddedValue(mockProductionRecord, []);

            expect(result).toBe(0);
        });
    });

    describe("calculateCosts", () => {
        const insideUnit = 2000;
        const outsideUnit = 1500;

        it("should calculate all cost components correctly", () => {
            const result = DataProcessor.calculateCosts(
                mockProductionRecord,
                insideUnit,
                outsideUnit
            );

            expect(result.insideCost).toBe(16000); // 8 * 2000
            expect(result.outsideCost).toBe(6000); // 4 * 1500
            expect(result.insideOvertimeCost).toBe(5000); // 2 * 2000 * 1.25
            expect(result.outsideOvertimeCost).toBe(1875); // 1 * 1500 * 1.25
            expect(result.totalCost).toBe(28875); // sum of all costs
        });

        it("should handle zero values", () => {
            const recordZeros = {
                ...mockProductionRecord,
                inside_time: { type: "NUMBER", value: "0" },
                outside_time: { type: "NUMBER", value: "0" },
                inside_overtime: { type: "NUMBER", value: "0" },
                outside_overtime: { type: "NUMBER", value: "0" },
            } as line_daily.SavedFields;

            const result = DataProcessor.calculateCosts(recordZeros, insideUnit, outsideUnit);

            expect(result.insideCost).toBe(0);
            expect(result.outsideCost).toBe(0);
            expect(result.insideOvertimeCost).toBe(0);
            expect(result.outsideOvertimeCost).toBe(0);
            expect(result.totalCost).toBe(0);
        });

        it("should handle empty field values", () => {
            const recordEmpty = {
                ...mockProductionRecord,
                inside_time: { type: "NUMBER", value: "" },
                outside_time: { type: "NUMBER", value: "" },
                inside_overtime: { type: "NUMBER", value: "" },
                outside_overtime: { type: "NUMBER", value: "" },
            } as line_daily.SavedFields;

            const result = DataProcessor.calculateCosts(recordEmpty, insideUnit, outsideUnit);

            expect(result.totalCost).toBe(0);
        });
    });

    describe("createProductHistoryData", () => {
        it("should create product history data with calculated values", () => {
            const records = [mockProductionRecord];
            const insideUnit = 2000;
            const outsideUnit = 1500;

            const result = DataProcessor.createProductHistoryData(
                records,
                mockMasterModelData,
                insideUnit,
                outsideUnit
            );

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                date: "2024-01-01",
                line_name: "Line A",
                actual_number: "10",
                addedValue: 1000,
                totalCost: 28875,
                grossProfit: -27875,
                profitRate: expect.stringMatching(/^-\d+\.\d+%$/),
                insideOvertime: "2",
                outsideOvertime: "1",
            });
        });

        it("should handle multiple records", () => {
            const multipleRecords = [
                mockProductionRecord,
                {
                    ...mockProductionRecord,
                    $id: { type: "ID", value: "2" },
                    model_name: { type: "SINGLE_LINE_TEXT", value: "Model Y" },
                    model_code: { type: "SINGLE_LINE_TEXT", value: "MY001" },
                    actual_number: { type: "NUMBER", value: "5" },
                } as line_daily.SavedFields,
            ];

            const result = DataProcessor.createProductHistoryData(
                multipleRecords,
                mockMasterModelData,
                2000,
                1500
            );

            expect(result).toHaveLength(2);
            expect(result[1].addedValue).toBe(750); // Model Y: 150 * 5
        });
    });

    describe("getFieldValue", () => {
        it("should return numeric value from field", () => {
            const field = { value: "123.45" };
            const result = DataProcessor.getFieldValue(field);

            expect(result).toBe(123.45);
        });

        it("should return 0 for undefined field", () => {
            const result = DataProcessor.getFieldValue(undefined);

            expect(result).toBe(0);
        });

        it("should handle numeric field values", () => {
            const field = { value: 456 };
            const result = DataProcessor.getFieldValue(field);

            expect(result).toBe(456);
        });
    });

    describe("getFieldText", () => {
        it("should return text value from field", () => {
            const field = { value: "Test Text" };
            const result = DataProcessor.getFieldText(field);

            expect(result).toBe("Test Text");
        });

        it("should return empty string for undefined field", () => {
            const result = DataProcessor.getFieldText(undefined);

            expect(result).toBe("");
        });

        it("should handle empty field values", () => {
            const field = { value: "" };
            const result = DataProcessor.getFieldText(field);

            expect(result).toBe("");
        });
    });
});
