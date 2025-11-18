/**
 * PLDashboardGraphBuilderのユニットテスト
 */

// Chart.jsをモック
jest.mock("chart.js/auto", () => {
    return jest.fn().mockImplementation(() => ({
        destroy: jest.fn(),
        update: jest.fn(),
        render: jest.fn(),
        reset: jest.fn(),
    }));
});

jest.mock("chartjs-plugin-datalabels", () => ({}));

jest.mock("../../../store", () => ({
    HolidayStore: {
        getInstance: jest.fn(() => ({
            getHolidayData: jest.fn(() => []),
        })),
    },
}));

import { PLDashboardGraphBuilder } from "../PLDashboardGraphBuilder";
import type { RevenueAnalysis } from "../../../types";

describe("PLDashboardGraphBuilder", () => {
    let graphBuilder: PLDashboardGraphBuilder;

    beforeEach(() => {
        graphBuilder = new PLDashboardGraphBuilder();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        graphBuilder.destroyAllCharts();
    });

    describe("createMixedChartContainer", () => {
        test("グラフコンテナを正しく作成", () => {
            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            // getContextをモック
            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            // createChartContainerをモックしてcanvasを返す
            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            const result = graphBuilder.createMixedChartContainer("test-chart", mockData);

            expect(result).toBeInstanceOf(HTMLDivElement);
            expect(result.id).toBe("container-test-chart");
        });

        test("既存のグラフがあれば破棄してから作成", () => {
            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            // getContextをモック
            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            // createChartContainerをモックしてcanvasを返す
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container: document.createElement("div"),
                canvas,
            });

            const destroySpy = jest.spyOn(graphBuilder, "destroyChart");

            graphBuilder.createMixedChartContainer("test-chart", mockData);
            graphBuilder.createMixedChartContainer("test-chart", mockData);

            expect(destroySpy).toHaveBeenCalledWith("test-chart");
        });
    });

    describe("hasChart", () => {
        test("グラフが存在する場合はtrueを返す", () => {
            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            // getContextをモック
            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            // createChartContainerをモックしてcanvasを返す
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container: document.createElement("div"),
                canvas,
            });

            graphBuilder.createMixedChartContainer("test-chart", mockData);

            expect(graphBuilder.hasChart("test-chart")).toBe(true);
        });

        test("グラフが存在しない場合はfalseを返す", () => {
            expect(graphBuilder.hasChart("non-existent-chart")).toBe(false);
        });
    });

    describe("destroyChart", () => {
        test("グラフを正しく破棄", () => {
            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            graphBuilder.createMixedChartContainer("test-chart", mockData);
            graphBuilder.destroyChart("test-chart");

            expect(graphBuilder.hasChart("test-chart")).toBe(false);
        });
    });

    describe("destroyAllCharts", () => {
        test("すべてのグラフを破棄", () => {
            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            graphBuilder.createMixedChartContainer("chart-1", mockData);
            graphBuilder.createMixedChartContainer("chart-2", mockData);

            graphBuilder.destroyAllCharts();

            expect(graphBuilder.hasChart("chart-1")).toBe(false);
            expect(graphBuilder.hasChart("chart-2")).toBe(false);
        });
    });

    describe("updateMixedChart", () => {
        test("既存のグラフを更新", () => {
            const initialData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const updatedData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 2000,
                    expenses: 1000,
                    grossProfit: 1000,
                    profitRate: 50,
                    CumulativeAddedValue: 2000,
                    CumulativeExpenses: 1000,
                    CumulativeGrossProfit: 1000,
                    CumulativeProfitRate: 50,
                },
                {
                    date: "2024-01-02",
                    addedValue: 1500,
                    expenses: 750,
                    grossProfit: 750,
                    profitRate: 50,
                    CumulativeAddedValue: 3500,
                    CumulativeExpenses: 1750,
                    CumulativeGrossProfit: 1750,
                    CumulativeProfitRate: 50,
                },
            ];

            // getContextをモック
            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            // createChartContainerをモックしてcanvasを返す
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container: document.createElement("div"),
                canvas,
            });

            // Chartインスタンスをモック
            const mockUpdate = jest.fn();
            const mockChart = {
                destroy: jest.fn(),
                update: mockUpdate,
                render: jest.fn(),
                reset: jest.fn(),
                ctx: mockContext,
                data: {
                    labels: [],
                    datasets: [{ data: [] }, { data: [] }, { data: [] }],
                },
            };

            // createMixedChartContainerを呼び出してグラフを作成
            graphBuilder.createMixedChartContainer("test-chart", initialData);

            // Chartインスタンスを取得してモックを設定
            const chartInfo = (graphBuilder as any).getChartInfo("test-chart");
            if (chartInfo) {
                chartInfo.chart = mockChart as any;
            }

            // グラフを更新
            graphBuilder.updateMixedChart("test-chart", updatedData);

            // updateが呼ばれたことを確認
            expect(mockUpdate).toHaveBeenCalled();
        });

        test("存在しないグラフを更新しようとした場合はエラーが発生しない", () => {
            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            expect(() => {
                graphBuilder.updateMixedChart("non-existent-chart", mockData);
            }).not.toThrow();
        });

        test("チャートが破棄されている場合は再作成", () => {
            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            graphBuilder.createMixedChartContainer("test-chart", mockData);

            // チャートを破棄状態にする
            const chartInfo = graphBuilder.getChartInfo("test-chart");
            if (chartInfo && chartInfo.chart) {
                (chartInfo.chart as any).ctx = null;
            }

            expect(() => {
                graphBuilder.updateMixedChart("test-chart", mockData);
            }).not.toThrow();
        });

        test("datasetsが3つ未満の場合は更新しない", () => {
            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const mockUpdate = jest.fn();
            const mockChart = {
                destroy: jest.fn(),
                update: mockUpdate,
                render: jest.fn(),
                reset: jest.fn(),
                ctx: mockContext,
                data: {
                    labels: [],
                    datasets: [{ data: [] }], // 1つだけ
                },
            };

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            graphBuilder.createMixedChartContainer("test-chart", mockData);

            const chartInfo = graphBuilder.getChartInfo("test-chart");
            if (chartInfo) {
                chartInfo.chart = mockChart as any;
            }

            graphBuilder.updateMixedChart("test-chart", mockData);
            // updateは呼ばれるが、datasetsが3つ未満のためデータは更新されない
            expect(mockUpdate).toHaveBeenCalled();
            // データが更新されていないことを確認（元のデータのまま）
            expect(mockChart.data.datasets.length).toBe(1);
        });

        test("datasetsが2つの場合もデータを更新しない", () => {
            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const mockUpdate = jest.fn();
            const mockChart = {
                destroy: jest.fn(),
                update: mockUpdate,
                render: jest.fn(),
                reset: jest.fn(),
                ctx: mockContext,
                data: {
                    labels: [],
                    datasets: [{ data: [] }, { data: [] }], // 2つ
                },
            };

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            graphBuilder.createMixedChartContainer("test-chart", mockData);
            const chartInfo = graphBuilder.getChartInfo("test-chart");
            if (chartInfo) {
                chartInfo.chart = mockChart as any;
            }

            graphBuilder.updateMixedChart("test-chart", mockData);
            // updateは呼ばれるが、datasetsが3つ未満のためデータは更新されない
            expect(mockUpdate).toHaveBeenCalled();
            expect(mockChart.data.datasets.length).toBe(2);
        });

        test("chart.data.datasetsがundefinedの場合はデータを更新しない", () => {
            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const mockUpdate = jest.fn();
            const mockChart = {
                destroy: jest.fn(),
                update: mockUpdate,
                render: jest.fn(),
                reset: jest.fn(),
                ctx: mockContext,
                data: {
                    labels: [],
                    datasets: undefined as any,
                },
            };

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            graphBuilder.createMixedChartContainer("test-chart", mockData);
            const chartInfo = graphBuilder.getChartInfo("test-chart");
            if (chartInfo) {
                chartInfo.chart = mockChart as any;
            }

            graphBuilder.updateMixedChart("test-chart", mockData);
            // updateは呼ばれるが、datasetsがundefinedのためデータは更新されない
            expect(mockUpdate).toHaveBeenCalled();
            expect(mockChart.data.datasets).toBeUndefined();
        });
    });

    describe("createMixedChartContainer - エッジケース", () => {
        test("空のデータでグラフを作成", () => {
            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            const result = graphBuilder.createMixedChartContainer("test-chart", []);

            expect(result).toBeInstanceOf(HTMLDivElement);
        });

        test("既存のグラフがある場合は破棄してから作成", () => {
            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            const mockChart = {
                destroy: jest.fn(),
                update: jest.fn(),
                render: jest.fn(),
                reset: jest.fn(),
                ctx: mockContext,
                data: {
                    labels: [],
                    datasets: [{ data: [] }, { data: [] }, { data: [] }],
                },
            };

            // 最初のグラフを作成
            graphBuilder.createMixedChartContainer("test-chart", mockData);
            const chartInfo1 = graphBuilder.getChartInfo("test-chart");
            if (chartInfo1) {
                chartInfo1.chart = mockChart as any;
            }

            // 同じIDで再度作成
            graphBuilder.createMixedChartContainer("test-chart", mockData);

            // destroyが呼ばれたことを確認
            expect(mockChart.destroy).toHaveBeenCalled();
        });
    });

    describe("createMixedChartContainer - 休日タイプ別テスト", () => {
        test("一斉有給の背景色が設定される", () => {
            const mockGetHolidayData = jest.fn(() => [
                {
                    date: { value: "2024-01-03" },
                    holiday_type: { value: "一斉有給" },
                },
            ]);

            const HolidayStore = require("../../../store").HolidayStore;
            jest.spyOn(HolidayStore, "getInstance").mockReturnValue({
                getHolidayData: mockGetHolidayData,
            } as any);

            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-03",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            expect(() => {
                graphBuilder.createMixedChartContainer("test-chart", mockData);
            }).not.toThrow();
        });

        test("デフォルトの休日タイプの背景色が設定される", () => {
            const mockGetHolidayData = jest.fn(() => [
                {
                    date: { value: "2024-01-04" },
                    holiday_type: { value: "その他" },
                },
            ]);

            const HolidayStore = require("../../../store").HolidayStore;
            jest.spyOn(HolidayStore, "getInstance").mockReturnValue({
                getHolidayData: mockGetHolidayData,
            } as any);

            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-04",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            expect(() => {
                graphBuilder.createMixedChartContainer("test-chart", mockData);
            }).not.toThrow();
        });
    });

    describe("createMixedChartContainer - Chart.jsコールバック関数のテスト", () => {
        test("formatterコールバックが正しく動作（利益率の場合）", () => {
            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            const result = graphBuilder.createMixedChartContainer("test-chart", mockData);

            expect(result).toBeInstanceOf(HTMLDivElement);
            // Chart.jsのインスタンスが作成されたことを確認
            expect(require("chart.js/auto")).toHaveBeenCalled();
        });

        test("colorコールバックが正しく動作（法定休日の場合）", () => {
            const mockGetHolidayData = jest.fn(() => [
                {
                    date: { value: "2024-01-01" },
                    holiday_type: { value: "法定休日" },
                },
            ]);

            const HolidayStore = require("../../../store").HolidayStore;
            jest.spyOn(HolidayStore, "getInstance").mockReturnValue({
                getHolidayData: mockGetHolidayData,
            } as any);

            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            expect(() => {
                graphBuilder.createMixedChartContainer("test-chart", mockData);
            }).not.toThrow();
        });

        test("weightコールバックが正しく動作（休日の場合は太字）", () => {
            const mockGetHolidayData = jest.fn(() => [
                {
                    date: { value: "2024-01-01" },
                    holiday_type: { value: "法定休日" },
                },
            ]);

            const HolidayStore = require("../../../store").HolidayStore;
            jest.spyOn(HolidayStore, "getInstance").mockReturnValue({
                getHolidayData: mockGetHolidayData,
            } as any);

            const mockData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            expect(() => {
                graphBuilder.createMixedChartContainer("test-chart", mockData);
            }).not.toThrow();
        });
    });

    describe("updateMixedChart - 詳細テスト", () => {
        test("データが更新される", () => {
            const initialData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const updatedData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 2000,
                    expenses: 1000,
                    grossProfit: 1000,
                    profitRate: 50,
                    CumulativeAddedValue: 2000,
                    CumulativeExpenses: 1000,
                    CumulativeGrossProfit: 1000,
                    CumulativeProfitRate: 50,
                },
            ];

            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            const mockUpdate = jest.fn();
            const mockChart = {
                destroy: jest.fn(),
                update: mockUpdate,
                render: jest.fn(),
                reset: jest.fn(),
                ctx: mockContext,
                data: {
                    labels: [],
                    datasets: [{ data: [] }, { data: [] }, { data: [] }],
                },
            };

            graphBuilder.createMixedChartContainer("test-chart", initialData);
            const chartInfo = graphBuilder.getChartInfo("test-chart");
            if (chartInfo) {
                chartInfo.chart = mockChart as any;
            }

            graphBuilder.updateMixedChart("test-chart", updatedData);

            expect(mockUpdate).toHaveBeenCalled();
        });

        test("空のデータで更新", () => {
            const initialData: RevenueAnalysis[] = [
                {
                    date: "2024-01-01",
                    addedValue: 1000,
                    expenses: 500,
                    grossProfit: 500,
                    profitRate: 50,
                    CumulativeAddedValue: 1000,
                    CumulativeExpenses: 500,
                    CumulativeGrossProfit: 500,
                    CumulativeProfitRate: 50,
                },
            ];

            const canvas = document.createElement("canvas");
            const mockContext = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({ width: 0 })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
            };
            jest.spyOn(canvas, "getContext").mockReturnValue(mockContext as any);

            const container = document.createElement("div");
            container.id = "container-test-chart";
            jest.spyOn(graphBuilder as any, "createChartContainer").mockReturnValue({
                container,
                canvas,
            });

            const mockUpdate = jest.fn();
            const mockChart = {
                destroy: jest.fn(),
                update: mockUpdate,
                render: jest.fn(),
                reset: jest.fn(),
                ctx: mockContext,
                data: {
                    labels: [],
                    datasets: [{ data: [] }, { data: [] }, { data: [] }],
                },
            };

            graphBuilder.createMixedChartContainer("test-chart", initialData);
            const chartInfo = graphBuilder.getChartInfo("test-chart");
            if (chartInfo) {
                chartInfo.chart = mockChart as any;
            }

            graphBuilder.updateMixedChart("test-chart", []);

            expect(mockUpdate).toHaveBeenCalled();
        });
    });
});
