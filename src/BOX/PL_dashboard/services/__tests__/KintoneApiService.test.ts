import { PerformanceUtil } from "../../utils/PerformanceUtil";
import { KintoneApiService } from "../KintoneApiService";

// kintone APIのモック
const mockKintoneApi = jest.fn();
const mockKintoneApiUrl = jest.fn(() => "/k/v1/records.json");

// グローバルのkintoneオブジェクトを設定
(global as any).kintone = {
    api: mockKintoneApi,
    app: {
        getId: () => 1,
    },
};

// kintone.api.urlを設定
Object.defineProperty((global as any).kintone.api, "url", {
    value: mockKintoneApiUrl,
});

// PerformanceUtilのキャッシュ機能をモック
jest.mock("../../utils/PerformanceUtil");
const mockPerformanceUtil = PerformanceUtil as jest.Mocked<typeof PerformanceUtil>;

describe("KintoneApiService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPerformanceUtil.getFromCache.mockReturnValue(null);
        mockPerformanceUtil.startMeasure.mockImplementation();
        mockPerformanceUtil.endMeasure.mockReturnValue(100);
        mockPerformanceUtil.setCache.mockImplementation();
    });

    describe("fetchPLMonthlyData", () => {
        const mockMonthlyData = {
            inside_unit: { type: "NUMBER", value: "2000" },
            outside_unit: { type: "NUMBER", value: "1500" },
            direct: { type: "NUMBER", value: "1800" },
            dispatch: { type: "NUMBER", value: "1200" },
            indirect: { type: "NUMBER", value: "2200" },
        };

        it("should fetch PL monthly data successfully", async () => {
            mockKintoneApi.mockResolvedValue({
                records: [mockMonthlyData],
            });

            const result = await KintoneApiService.fetchPLMonthlyData("2024", "01");

            expect(mockKintoneApi).toHaveBeenCalledWith("/k/v1/records.json", "GET", {
                app: 39,
                query: 'year_month = "2024_01"',
                fields: ["inside_unit", "outside_unit", "direct", "dispatch", "indirect"],
            });
            expect(result).toEqual(mockMonthlyData);
        });

        it("should return cached data when available", async () => {
            mockPerformanceUtil.getFromCache.mockReturnValue(mockMonthlyData);

            const result = await KintoneApiService.fetchPLMonthlyData("2024", "01");

            expect(mockKintoneApi).not.toHaveBeenCalled();
            expect(result).toEqual(mockMonthlyData);
        });

        it("should return null when no data found", async () => {
            mockKintoneApi.mockResolvedValue({
                records: [],
            });

            const result = await KintoneApiService.fetchPLMonthlyData("2024", "01");

            expect(result).toBeNull();
        });

        it("should handle API errors", async () => {
            const error = new Error("API Error");
            mockKintoneApi.mockRejectedValue(error);

            const result = await KintoneApiService.fetchPLMonthlyData("2024", "01");

            expect(result).toBeNull();
        });

        it("should cache successful results", async () => {
            mockKintoneApi.mockResolvedValue({
                records: [mockMonthlyData],
            });

            await KintoneApiService.fetchPLMonthlyData("2024", "01");

            expect(mockPerformanceUtil.setCache).toHaveBeenCalledWith(
                "pl-monthly-2024-01",
                mockMonthlyData,
                300000 // 5 minutes
            );
        });
    });

    describe("fetchPLDailyData", () => {
        const mockDailyData = [
            {
                date: { type: "DATE", value: "2024-01-01" },
                direct_personnel: { type: "NUMBER", value: "10" },
                temporary_employees: { type: "NUMBER", value: "5" },
            },
            {
                date: { type: "DATE", value: "2024-01-02" },
                direct_personnel: { type: "NUMBER", value: "12" },
                temporary_employees: { type: "NUMBER", value: "3" },
            },
        ];

        it("should fetch PL daily data successfully", async () => {
            mockKintoneApi.mockResolvedValue({
                records: mockDailyData,
            });

            const result = await KintoneApiService.fetchPLDailyData("2024", "01");

            expect(mockKintoneApi).toHaveBeenCalledWith("/k/v1/records.json", "GET", {
                app: 32,
                fields: expect.arrayContaining([
                    "date",
                    "direct_personnel",
                    "temporary_employees",
                    "indirect_personnel",
                ]),
                query: expect.stringMatching(
                    /date >= "2024-01-01" and date <= "2024-01-31".*order by date asc/
                ),
            });
            expect(result).toEqual(mockDailyData);
        });

        it("should handle date range correctly", async () => {
            mockKintoneApi.mockResolvedValue({ records: [] });

            await KintoneApiService.fetchPLDailyData("2024", "12");

            expect(mockKintoneApi).toHaveBeenCalledWith(
                "/k/v1/records.json",
                "GET",
                expect.objectContaining({
                    query: expect.stringContaining('date >= "2024-12-01" and date <= "2024-12-31"'),
                })
            );
        });

        it("should handle API errors", async () => {
            const error = new Error("Network Error");
            mockKintoneApi.mockRejectedValue(error);

            const result = await KintoneApiService.fetchPLDailyData("2024", "01");

            expect(result).toEqual([]);
        });
    });

    describe("fetchProductionReportData", () => {
        const mockProductionData = [
            {
                date: { type: "DATE", value: "2024-01-01" },
                line_name: { type: "SINGLE_LINE_TEXT", value: "Line A" },
                model_name: { type: "SINGLE_LINE_TEXT", value: "Model X" },
                actual_number: { type: "NUMBER", value: "10" },
            },
        ];

        it("should fetch production report data with year and month", async () => {
            mockKintoneApi.mockResolvedValue({
                records: mockProductionData,
            });

            const filterConfig = { year: "2024", month: "01" };
            const result = await KintoneApiService.fetchProductionReportData(filterConfig);

            expect(mockKintoneApi).toHaveBeenCalledWith("/k/v1/records.json", "GET", {
                app: 22,
                fields: expect.arrayContaining([
                    "date",
                    "line_name",
                    "model_name",
                    "actual_number",
                ]),
                query: expect.stringMatching(
                    /date >= "2024-01-01" and date <= "2024-01-31".*order by date asc/
                ),
            });
            expect(result).toEqual(mockProductionData);
        });

        it("should fetch data with year only", async () => {
            mockKintoneApi.mockResolvedValue({
                records: mockProductionData,
            });

            const filterConfig = { year: "2024", month: null };
            await KintoneApiService.fetchProductionReportData(filterConfig);

            expect(mockKintoneApi).toHaveBeenCalledWith(
                "/k/v1/records.json",
                "GET",
                expect.objectContaining({
                    query: expect.stringMatching(/date >= "2024-01-01" and date <= "2024-12-31"/),
                })
            );
        });

        it("should fetch all data when no filter provided", async () => {
            mockKintoneApi.mockResolvedValue({
                records: mockProductionData,
            });

            const filterConfig = { year: null, month: null };
            await KintoneApiService.fetchProductionReportData(filterConfig);

            expect(mockKintoneApi).toHaveBeenCalledWith(
                "/k/v1/records.json",
                "GET",
                expect.objectContaining({
                    query: expect.stringMatching(/date <= "\d{4}-\d{2}-\d{2}"/),
                })
            );
        });

        it("should handle API errors", async () => {
            const error = new Error("Fetch Error");
            mockKintoneApi.mockRejectedValue(error);

            const filterConfig = { year: "2024", month: "01" };
            const result = await KintoneApiService.fetchProductionReportData(filterConfig);

            expect(result).toEqual([]);
        });
    });

    describe("fetchMasterModelData", () => {
        const mockMasterData = [
            {
                line_name: { type: "SINGLE_LINE_TEXT", value: "Line A" },
                model_code: { type: "SINGLE_LINE_TEXT", value: "MX001" },
                model_name: { type: "SINGLE_LINE_TEXT", value: "Model X" },
                added_value: { type: "NUMBER", value: "100" },
            },
            {
                line_name: { type: "SINGLE_LINE_TEXT", value: "Line B" },
                model_code: { type: "SINGLE_LINE_TEXT", value: "MY001" },
                model_name: { type: "SINGLE_LINE_TEXT", value: "Model Y" },
                added_value: { type: "NUMBER", value: "150" },
            },
        ];

        it("should fetch master model data successfully", async () => {
            mockKintoneApi.mockResolvedValue({
                records: mockMasterData,
            });

            const result = await KintoneApiService.fetchMasterModelData();

            expect(mockKintoneApi).toHaveBeenCalledWith("/k/v1/records.json", "GET", {
                app: 25,
                fields: expect.arrayContaining([
                    "line_name",
                    "model_code",
                    "model_name",
                    "added_value",
                ]),
                query: "order by line_name asc, model_name asc limit 500 offset 0",
            });
            expect(result).toEqual(mockMasterData);
        });

        it("should return cached data when available", async () => {
            mockPerformanceUtil.getFromCache.mockReturnValue(mockMasterData);

            const result = await KintoneApiService.fetchMasterModelData();

            expect(mockKintoneApi).not.toHaveBeenCalled();
            expect(result).toEqual(mockMasterData);
        });

        it("should cache successful results", async () => {
            mockKintoneApi.mockResolvedValue({
                records: mockMasterData,
            });

            await KintoneApiService.fetchMasterModelData();

            expect(mockPerformanceUtil.setCache).toHaveBeenCalledWith(
                "master-model-data",
                mockMasterData,
                1800000 // 30 minutes
            );
        });

        it("should handle API errors", async () => {
            const error = new Error("Master Data Error");
            mockKintoneApi.mockRejectedValue(error);

            const result = await KintoneApiService.fetchMasterModelData();

            expect(result).toEqual([]);
        });
    });

    describe("fetchAllRecords (private method via public methods)", () => {
        it("should handle pagination correctly", async () => {
            // First call returns 500 records (full page)
            const firstPageData = Array(500)
                .fill(0)
                .map((_, i) => ({
                    id: { type: "ID", value: String(i + 1) },
                }));

            // Second call returns 100 records (partial page, indicating end)
            const secondPageData = Array(100)
                .fill(0)
                .map((_, i) => ({
                    id: { type: "ID", value: String(i + 501) },
                }));

            mockKintoneApi
                .mockResolvedValueOnce({ records: firstPageData })
                .mockResolvedValueOnce({ records: secondPageData });

            const result = await KintoneApiService.fetchMasterModelData();

            expect(mockKintoneApi).toHaveBeenCalledTimes(2);
            expect(mockKintoneApi).toHaveBeenNthCalledWith(
                1,
                "/k/v1/records.json",
                "GET",
                expect.objectContaining({
                    query: expect.stringContaining("limit 500 offset 0"),
                })
            );
            expect(mockKintoneApi).toHaveBeenNthCalledWith(
                2,
                "/k/v1/records.json",
                "GET",
                expect.objectContaining({
                    query: expect.stringContaining("limit 500 offset 500"),
                })
            );
            expect(result).toHaveLength(600);
        });
    });

    describe("withRetry", () => {
        it("should retry failed operations", async () => {
            const mockFunction = jest
                .fn()
                .mockRejectedValueOnce(new Error("First attempt failed"))
                .mockRejectedValueOnce(new Error("Second attempt failed"))
                .mockResolvedValueOnce("Success on third attempt");

            const result = await KintoneApiService.withRetry(mockFunction, 3);

            expect(mockFunction).toHaveBeenCalledTimes(3);
            expect(result).toBe("Success on third attempt");
        });

        it("should throw error after max retries exceeded", async () => {
            const error = new Error("Persistent error");
            const mockFunction = jest.fn().mockRejectedValue(error);

            await expect(KintoneApiService.withRetry(mockFunction, 2)).rejects.toThrow(
                "Persistent error"
            );

            expect(mockFunction).toHaveBeenCalledTimes(2);
        });

        it("should return immediately on first success", async () => {
            const mockFunction = jest.fn().mockResolvedValue("Immediate success");

            const result = await KintoneApiService.withRetry(mockFunction, 3);

            expect(mockFunction).toHaveBeenCalledTimes(1);
            expect(result).toBe("Immediate success");
        });
    });
});
