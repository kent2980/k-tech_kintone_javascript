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
    public createChartContainer(canvasId: string): { container: HTMLDivElement; canvas: HTMLCanvasElement } {
        return super.createChartContainer(canvasId);
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
});

