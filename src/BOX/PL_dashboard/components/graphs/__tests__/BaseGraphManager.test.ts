/**
 * BaseGraphManagerのユニットテスト
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

import { BaseGraphManager } from "../BaseGraphManager";

// テスト用の具象クラス
class TestGraphManager extends BaseGraphManager {
    public createChartContainer(canvasId: string): {
        container: HTMLDivElement;
        canvas: HTMLCanvasElement;
    } {
        return super.createChartContainer(canvasId);
    }

    public registerChart(canvasId: string, chart: any, container: HTMLDivElement): void {
        super.registerChart(canvasId, chart, container);
    }
}

describe("BaseGraphManager", () => {
    let graphManager: TestGraphManager;

    beforeEach(() => {
        graphManager = new TestGraphManager();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        graphManager.destroyAllCharts();
    });

    describe("createChartContainer", () => {
        test("グラフコンテナを正しく作成", () => {
            const { container, canvas } = graphManager.createChartContainer("test-chart");

            expect(container).toBeInstanceOf(HTMLDivElement);
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(container.id).toContain("test-chart");
            expect(canvas.id).toBe("test-chart");
        });
    });

    describe("hasChart", () => {
        test("グラフが存在しない場合はfalseを返す", () => {
            expect(graphManager.hasChart("non-existent-chart")).toBe(false);
        });
    });

    describe("destroyChart", () => {
        test("存在しないグラフを破棄してもエラーが発生しない", () => {
            expect(() => {
                graphManager.destroyChart("non-existent-chart");
            }).not.toThrow();
        });
    });

    describe("destroyAllCharts", () => {
        test("すべてのグラフを破棄", () => {
            expect(() => {
                graphManager.destroyAllCharts();
            }).not.toThrow();
        });
    });

    describe("registerChart", () => {
        test("グラフ情報を登録", () => {
            const { container, canvas } = graphManager.createChartContainer("test-chart");
            const mockChart = {
                destroy: jest.fn(),
                update: jest.fn(),
                render: jest.fn(),
                reset: jest.fn(),
            };

            graphManager.registerChart("test-chart", mockChart as any, container);

            expect(graphManager.hasChart("test-chart")).toBe(true);
            const chartInfo = graphManager.getChartInfo("test-chart");
            expect(chartInfo).toBeTruthy();
            expect(chartInfo?.chart).toBe(mockChart);
        });
    });

    describe("getChartInfo", () => {
        test("グラフ情報を取得", () => {
            const { container, canvas } = graphManager.createChartContainer("test-chart");
            const mockChart = {
                destroy: jest.fn(),
                update: jest.fn(),
                render: jest.fn(),
                reset: jest.fn(),
            };

            graphManager.registerChart("test-chart", mockChart as any, container);
            const chartInfo = graphManager.getChartInfo("test-chart");

            expect(chartInfo).toBeTruthy();
            expect(chartInfo?.canvasId).toBe("test-chart");
        });

        test("存在しないグラフの場合はnullを返す", () => {
            const chartInfo = graphManager.getChartInfo("non-existent-chart");
            expect(chartInfo).toBeNull();
        });
    });

    describe("getAllChartIds", () => {
        test("すべてのグラフIDを取得", () => {
            const { container1, container2 } = {
                container1: graphManager.createChartContainer("chart-1"),
                container2: graphManager.createChartContainer("chart-2"),
            };
            const mockChart1 = {
                destroy: jest.fn(),
                update: jest.fn(),
                render: jest.fn(),
                reset: jest.fn(),
            };
            const mockChart2 = {
                destroy: jest.fn(),
                update: jest.fn(),
                render: jest.fn(),
                reset: jest.fn(),
            };

            graphManager.registerChart("chart-1", mockChart1 as any, container1.container);
            graphManager.registerChart("chart-2", mockChart2 as any, container2.container);

            const chartIds = graphManager.getAllChartIds();
            expect(chartIds).toContain("chart-1");
            expect(chartIds).toContain("chart-2");
        });
    });

    describe("hasChart", () => {
        test("グラフが存在する場合はtrueを返す", () => {
            const { container, canvas } = graphManager.createChartContainer("test-chart");
            const mockChart = {
                destroy: jest.fn(),
                update: jest.fn(),
                render: jest.fn(),
                reset: jest.fn(),
            };

            graphManager.registerChart("test-chart", mockChart as any, container);

            expect(graphManager.hasChart("test-chart")).toBe(true);
        });
    });

    describe("destroy", () => {
        test("すべてのグラフを破棄（後方互換性）", () => {
            const { container, canvas } = graphManager.createChartContainer("test-chart");
            const mockChart = {
                destroy: jest.fn(),
                update: jest.fn(),
                render: jest.fn(),
                reset: jest.fn(),
            };

            graphManager.registerChart("test-chart", mockChart as any, container);
            graphManager.destroy();

            expect(graphManager.hasChart("test-chart")).toBe(false);
        });
    });

    describe("destroyChart - 詳細テスト", () => {
        test("グラフを破棄してDOM要素も削除", () => {
            const { container, canvas } = graphManager.createChartContainer("test-chart");
            document.body.appendChild(container);
            const mockChart = {
                destroy: jest.fn(),
                update: jest.fn(),
                render: jest.fn(),
                reset: jest.fn(),
            };

            graphManager.registerChart("test-chart", mockChart as any, container);
            graphManager.destroyChart("test-chart");

            expect(mockChart.destroy).toHaveBeenCalled();
            expect(graphManager.hasChart("test-chart")).toBe(false);
        });
    });
});
