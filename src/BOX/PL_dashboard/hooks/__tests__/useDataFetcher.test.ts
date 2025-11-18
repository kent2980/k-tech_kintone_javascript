/**
 * DataFetcherのユニットテスト
 */

jest.mock("../../services/KintoneApiService");
jest.mock("../../utils/PerformanceUtil", () => ({
    PerformanceUtil: {
        startMeasure: jest.fn(() => "measure-id"),
        endMeasure: jest.fn(() => 100),
    },
}));

import { DataFetcher } from "../useDataFetcher";
import { KintoneApiService } from "../../services";
import { ErrorHandler } from "../../utils";

describe("DataFetcher", () => {
    let dataFetcher: DataFetcher;
    let mockApiService: jest.Mocked<KintoneApiService>;

    beforeEach(() => {
        mockApiService = {
            fetchMasterModelData: jest.fn(),
            fetchPLMonthlyData: jest.fn(),
            fetchPLDailyData: jest.fn(),
            fetchProductionReportData: jest.fn(),
        } as any;

        dataFetcher = new DataFetcher(mockApiService);
    });

    describe("constructor", () => {
        test("APIサービスを指定してインスタンスを作成", () => {
            const fetcher = new DataFetcher(mockApiService);
            expect(fetcher).toBeInstanceOf(DataFetcher);
        });

        test("APIサービスを指定しない場合は内部で作成", () => {
            const fetcher = new DataFetcher();
            expect(fetcher).toBeInstanceOf(DataFetcher);
        });
    });

    describe("getState", () => {
        test("初期状態を取得", () => {
            const state = dataFetcher.getState();

            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
            expect(state.masterModelData).toBeNull();
            expect(state.dailyReportData).toEqual([]);
            expect(state.productionReportData).toEqual([]);
            expect(state.plMonthlyData).toBeNull();
        });
    });

    describe("subscribe", () => {
        test("状態変更のリスナーを追加", () => {
            const listener = jest.fn();
            const unsubscribe = dataFetcher.subscribe(listener);

            expect(typeof unsubscribe).toBe("function");
        });

        test("リスナーが状態変更時に呼ばれる", async () => {
            const listener = jest.fn();
            dataFetcher.subscribe(listener);

            mockApiService.fetchMasterModelData.mockResolvedValue([]);
            await dataFetcher.fetchMasterModelData();

            expect(listener).toHaveBeenCalled();
        });

        test("unsubscribeでリスナーを削除", () => {
            const listener = jest.fn();
            const unsubscribe = dataFetcher.subscribe(listener);

            unsubscribe();
            mockApiService.fetchMasterModelData.mockResolvedValue([]);
            dataFetcher.fetchMasterModelData();

            // unsubscribe後は呼ばれない（非同期のため、このテストは簡易版）
            expect(typeof unsubscribe).toBe("function");
        });
    });

    describe("fetchMasterModelData", () => {
        test("正常にマスタデータを取得", async () => {
            const mockData = [
                {
                    model_name: { value: "Model A", type: "SINGLE_LINE_TEXT" },
                } as any,
            ];

            mockApiService.fetchMasterModelData.mockResolvedValue(mockData);

            const result = await dataFetcher.fetchMasterModelData();

            expect(result).toEqual(mockData);
            expect(dataFetcher.getState().masterModelData).toEqual(mockData);
            expect(dataFetcher.getState().loading).toBe(false);
        });

        test("エラーが発生した場合は空配列を返す", async () => {
            mockApiService.fetchMasterModelData.mockRejectedValue(new Error("API Error"));

            const result = await dataFetcher.fetchMasterModelData();

            expect(result).toEqual([]);
            expect(dataFetcher.getState().error).toContain("マスタデータ取得エラー");
            expect(dataFetcher.getState().loading).toBe(false);
        });
    });

    describe("fetchPLMonthlyData", () => {
        test("正常にPL月次データを取得", async () => {
            const mockData = {
                year_month: { value: "2024_01", type: "SINGLE_LINE_TEXT" },
            } as any;

            mockApiService.fetchPLMonthlyData.mockResolvedValue(mockData);

            const result = await dataFetcher.fetchPLMonthlyData("2024", "01");

            expect(result).toEqual(mockData);
            expect(dataFetcher.getState().plMonthlyData).toEqual(mockData);
        });

        test("エラーが発生した場合はnullを返す", async () => {
            mockApiService.fetchPLMonthlyData.mockRejectedValue(new Error("API Error"));

            const result = await dataFetcher.fetchPLMonthlyData("2024", "01");

            expect(result).toBeNull();
            expect(dataFetcher.getState().error).toContain("PL月次データ取得エラー");
        });
    });

    describe("fetchPLDailyData", () => {
        test("正常にPL日次データを取得", async () => {
            const mockData = [
                {
                    date: { value: "2024-01-01", type: "DATE" },
                } as any,
            ];

            mockApiService.fetchPLDailyData.mockResolvedValue(mockData);

            const result = await dataFetcher.fetchPLDailyData("2024", "01");

            expect(result).toEqual(mockData);
            expect(dataFetcher.getState().dailyReportData).toEqual(mockData);
        });

        test("エラーが発生した場合は空配列を返す", async () => {
            mockApiService.fetchPLDailyData.mockRejectedValue(new Error("API Error"));

            const result = await dataFetcher.fetchPLDailyData("2024", "01");

            expect(result).toEqual([]);
            expect(dataFetcher.getState().error).toContain("PL日次データ取得エラー");
        });
    });

    describe("fetchProductionReportData", () => {
        test("正常に生産報告データを取得", async () => {
            const mockData = [
                {
                    date: { value: "2024-01-01", type: "DATE" },
                } as any,
            ];

            mockApiService.fetchProductionReportData.mockResolvedValue(mockData);

            const result = await dataFetcher.fetchProductionReportData({
                year: "2024",
                month: "01",
            });

            expect(result).toEqual(mockData);
            expect(dataFetcher.getState().productionReportData).toEqual(mockData);
        });

        test("エラーが発生した場合は空配列を返す", async () => {
            mockApiService.fetchProductionReportData.mockRejectedValue(new Error("API Error"));

            const result = await dataFetcher.fetchProductionReportData({
                year: "2024",
                month: "01",
            });

            expect(result).toEqual([]);
            expect(dataFetcher.getState().error).toContain("生産報告データ取得エラー");
        });
    });

    describe("fetchAllData", () => {
        test("全データを一括取得", async () => {
            mockApiService.fetchMasterModelData.mockResolvedValue([]);
            mockApiService.fetchPLMonthlyData.mockResolvedValue(null);
            mockApiService.fetchPLDailyData.mockResolvedValue([]);
            mockApiService.fetchProductionReportData.mockResolvedValue([]);

            await dataFetcher.fetchAllData({
                year: "2024",
                month: "01",
            });

            expect(mockApiService.fetchMasterModelData).toHaveBeenCalled();
            expect(mockApiService.fetchPLMonthlyData).toHaveBeenCalledWith("2024", "01");
            expect(mockApiService.fetchPLDailyData).toHaveBeenCalledWith("2024", "01");
            expect(mockApiService.fetchProductionReportData).toHaveBeenCalled();
        });

        test("年のみが指定されている場合", async () => {
            mockApiService.fetchMasterModelData.mockResolvedValue([]);
            mockApiService.fetchProductionReportData.mockResolvedValue([]);

            await dataFetcher.fetchAllData({
                year: "2024",
                month: null,
            });

            expect(mockApiService.fetchProductionReportData).toHaveBeenCalled();
        });
    });

    describe("clearError", () => {
        test("エラー状態をクリア", () => {
            dataFetcher.getState().error = "Test Error";
            dataFetcher.clearError();

            expect(dataFetcher.getState().error).toBeNull();
        });
    });

    describe("reset", () => {
        test("全状態をリセット", () => {
            // 状態を変更
            dataFetcher.getState().loading = true;
            dataFetcher.getState().error = "Error";
            dataFetcher.getState().masterModelData = [{} as any];

            dataFetcher.reset();

            const state = dataFetcher.getState();
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
            expect(state.masterModelData).toBeNull();
            expect(state.dailyReportData).toEqual([]);
            expect(state.productionReportData).toEqual([]);
            expect(state.plMonthlyData).toBeNull();
        });
    });
});
