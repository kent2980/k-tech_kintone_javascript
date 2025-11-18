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

            const container = graphBuilder.createMixedChartContainer("test-chart", mockData);

            expect(container).toBeInstanceOf(HTMLDivElement);
            expect(container.id).toBe("test-chart-container");
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
});

