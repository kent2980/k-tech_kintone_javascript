/**
 * KintoneApiServiceのユニットテスト
 */

import { KintoneApiService } from "../KintoneApiService";

// kintone APIをモック
const mockKintoneApiGet = jest.fn();
const mockKintoneApiUrl = jest.fn((path: string) => `https://example.cybozu.com${path}`);

// グローバルkintoneをモック
(global as any).kintone = {
    api: (url: string, method: string, params: unknown) => {
        if (method === "GET") {
            return mockKintoneApiGet(url, method, params);
        }
        return Promise.resolve({ records: [] });
    },
};
(global as any).kintone.api.url = mockKintoneApiUrl;

describe("KintoneApiService", () => {
    let apiService: KintoneApiService;

    beforeEach(() => {
        apiService = new KintoneApiService();
        jest.clearAllMocks();
    });

    describe("fetchPLMonthlyData", () => {
        test("正常にデータを取得", async () => {
            const mockResponse = {
                records: [
                    {
                        year_month: { value: "2024_01" },
                        inside_unit: { value: "3000" },
                        outside_unit: { value: "2500" },
                    },
                ],
            };

            mockKintoneApiGet.mockResolvedValue(mockResponse);

            const result = await apiService.fetchPLMonthlyData("2024", "01");

            expect(result).toBeDefined();
            expect(mockKintoneApiGet).toHaveBeenCalled();
        });

        test("データが存在しない場合はnullを返す", async () => {
            const mockResponse = {
                records: [],
            };

            mockKintoneApiGet.mockResolvedValue(mockResponse);

            const result = await apiService.fetchPLMonthlyData("2024", "01");

            expect(result).toBeNull();
        });

        test("エラーが発生した場合はnullを返す", async () => {
            mockKintoneApiGet.mockRejectedValue(new Error("API Error"));

            const result = await apiService.fetchPLMonthlyData("2024", "01");

            expect(result).toBeNull();
        });
    });

    describe("fetchPLDailyData", () => {
        test("正常にデータを取得", async () => {
            const mockResponse = {
                records: [
                    {
                        date: { value: "2024-01-01" },
                    },
                    {
                        date: { value: "2024-01-02" },
                    },
                ],
            };

            mockKintoneApiGet.mockResolvedValue(mockResponse);

            const result = await apiService.fetchPLDailyData("2024", "01");

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        test("エラーが発生した場合は空配列を返す", async () => {
            mockKintoneApiGet.mockRejectedValue(new Error("API Error"));

            const result = await apiService.fetchPLDailyData("2024", "01");

            expect(result).toEqual([]);
        });
    });

    describe("fetchProductionReportData", () => {
        test("正常にデータを取得", async () => {
            const mockResponse = {
                records: [
                    {
                        date: { value: "2024-01-01" },
                        line_name: { value: "Line A" },
                    },
                ],
            };

            mockKintoneApiGet.mockResolvedValue(mockResponse);

            const result = await apiService.fetchProductionReportData({
                year: "2024",
                month: "01",
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        test("フィルター設定なしでも取得可能", async () => {
            const mockResponse = {
                records: [],
            };

            mockKintoneApiGet.mockResolvedValue(mockResponse);

            const result = await apiService.fetchProductionReportData({
                year: "2024",
                month: "01",
            });

            expect(result).toEqual([]);
        });
    });
});
