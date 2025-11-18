/**
 * BusinessCalculationHelperServiceのユニットテスト
 */

// Loggerをモック
jest.mock("../../utils/Logger", () => ({
    Logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

import { BusinessCalculationHelperService } from "../BusinessCalculationHelperService";
import type { BusinessMetrics } from "../BusinessCalculationService";

describe("BusinessCalculationHelperService", () => {
    const createMockMetrics = (overrides?: Partial<BusinessMetrics>): BusinessMetrics => ({
        addedValue: {
            addedValue: 1000,
            calculationMethod: "direct",
        },
        cost: {
            insideTime: 8,
            outsideTime: 8,
            insideOvertime: 0,
            outsideOvertime: 0,
            insideCost: 500,
            outsideCost: 500,
            insideOvertimeCost: 0,
            outsideOvertimeCost: 0,
            totalCost: 1000,
        },
        profit: {
            grossProfit: 0,
            profitRate: 0,
            profitRateString: "0.00%",
        },
        ...overrides,
    });

    describe("validateBusinessMetrics", () => {
        test("正常な指標の場合は検証成功", () => {
            const metrics = createMockMetrics();
            const result = BusinessCalculationHelperService.validateBusinessMetrics(metrics);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test("付加価値がマイナスの場合はエラー", () => {
            const metrics = createMockMetrics({
                addedValue: {
                    addedValue: -100,
                    calculationMethod: "direct",
                },
            });
            const result = BusinessCalculationHelperService.validateBusinessMetrics(metrics);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("付加価値がマイナス値です");
        });

        test("総コストがマイナスの場合はエラー", () => {
            const metrics = createMockMetrics({
                cost: {
                    insideTime: 8,
                    outsideTime: 8,
                    insideOvertime: 0,
                    outsideOvertime: 0,
                    insideCost: 500,
                    outsideCost: 500,
                    insideOvertimeCost: 0,
                    outsideOvertimeCost: 0,
                    totalCost: -100,
                },
            });
            const result = BusinessCalculationHelperService.validateBusinessMetrics(metrics);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("総コストがマイナス値です");
        });

        test("基本工数コストがマイナスの場合は警告", () => {
            const metrics = createMockMetrics({
                cost: {
                    insideTime: 8,
                    outsideTime: 8,
                    insideOvertime: 0,
                    outsideOvertime: 0,
                    insideCost: -100,
                    outsideCost: 500,
                    insideOvertimeCost: 0,
                    outsideOvertimeCost: 0,
                    totalCost: 400,
                },
            });
            const result = BusinessCalculationHelperService.validateBusinessMetrics(metrics);

            expect(result.warnings).toContain("基本工数コストにマイナス値があります");
        });

        test("残業工数コストがマイナスの場合は警告", () => {
            const metrics = createMockMetrics({
                cost: {
                    insideTime: 8,
                    outsideTime: 8,
                    insideOvertime: 2,
                    outsideOvertime: 0,
                    insideCost: 500,
                    outsideCost: 500,
                    insideOvertimeCost: -50,
                    outsideOvertimeCost: 0,
                    totalCost: 950,
                },
            });
            const result = BusinessCalculationHelperService.validateBusinessMetrics(metrics);

            expect(result.warnings).toContain("残業工数コストにマイナス値があります");
        });

        test("粗利益がマイナスの場合は警告", () => {
            const metrics = createMockMetrics({
                addedValue: {
                    addedValue: 500,
                    calculationMethod: "direct",
                },
                cost: {
                    insideTime: 8,
                    outsideTime: 8,
                    insideOvertime: 0,
                    outsideOvertime: 0,
                    insideCost: 500,
                    outsideCost: 500,
                    insideOvertimeCost: 0,
                    outsideOvertimeCost: 0,
                    totalCost: 1000,
                },
                profit: {
                    grossProfit: -500,
                    profitRate: -50,
                    profitRateString: "-50.00%",
                },
            });
            const result = BusinessCalculationHelperService.validateBusinessMetrics(metrics);

            expect(result.warnings).toContain("粗利益がマイナス値（赤字）です");
        });

        test("利益率が異常に高い場合は警告", () => {
            const metrics = createMockMetrics({
                profit: {
                    grossProfit: 10000,
                    profitRate: 1500,
                    profitRateString: "1500.00%",
                },
            });
            const result = BusinessCalculationHelperService.validateBusinessMetrics(metrics);

            expect(result.warnings).toContain("利益率が異常に高い値です（1000%超）");
        });

        test("粗利益の計算に不整合がある場合はエラー", () => {
            const metrics = createMockMetrics({
                addedValue: {
                    addedValue: 1000,
                    calculationMethod: "direct",
                },
                cost: {
                    insideTime: 8,
                    outsideTime: 8,
                    insideOvertime: 0,
                    outsideOvertime: 0,
                    insideCost: 500,
                    outsideCost: 500,
                    insideOvertimeCost: 0,
                    outsideOvertimeCost: 0,
                    totalCost: 1000,
                },
                profit: {
                    grossProfit: 100, // 実際は0になるべき
                    profitRate: 10,
                    profitRateString: "10.00%",
                },
            });
            const result = BusinessCalculationHelperService.validateBusinessMetrics(metrics);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("粗利益の計算に不整合があります");
        });

        test("レコード日付を指定してログ出力", () => {
            const metrics = createMockMetrics();
            const result = BusinessCalculationHelperService.validateBusinessMetrics(
                metrics,
                "2024-01-01"
            );

            expect(result.isValid).toBe(true);
        });
    });

    describe("detectAnomalies", () => {
        test("正常な指標の場合は異常値なし", () => {
            const metrics = createMockMetrics();
            const anomalies = BusinessCalculationHelperService.detectAnomalies(metrics);

            expect(anomalies).toHaveLength(0);
        });

        test("付加価値が異常に高い場合は異常値を検出", () => {
            const metrics = createMockMetrics({
                addedValue: {
                    addedValue: 15000000, // 1千5百万円
                    calculationMethod: "direct",
                },
            });
            const anomalies = BusinessCalculationHelperService.detectAnomalies(metrics);

            expect(anomalies.length).toBeGreaterThan(0);
            expect(anomalies.some((a) => a.includes("付加価値が異常に高額"))).toBe(true);
        });

        test("総コストが異常に高い場合は異常値を検出", () => {
            const metrics = createMockMetrics({
                cost: {
                    insideTime: 8,
                    outsideTime: 8,
                    insideOvertime: 0,
                    outsideOvertime: 0,
                    insideCost: 3000000,
                    outsideCost: 3000000,
                    insideOvertimeCost: 0,
                    outsideOvertimeCost: 0,
                    totalCost: 6000000, // 600万円
                },
            });
            const anomalies = BusinessCalculationHelperService.detectAnomalies(metrics);

            expect(anomalies.length).toBeGreaterThan(0);
            expect(anomalies.some((a) => a.includes("総コストが異常に高額"))).toBe(true);
        });

        test("利益率が異常に低い場合は異常値を検出", () => {
            const metrics = createMockMetrics({
                profit: {
                    grossProfit: -1000,
                    profitRate: -150,
                    profitRateString: "-150.00%",
                },
            });
            const anomalies = BusinessCalculationHelperService.detectAnomalies(metrics);

            expect(anomalies.length).toBeGreaterThan(0);
            expect(anomalies.some((a) => a.includes("利益率が異常に低い"))).toBe(true);
        });

        test("利益率が異常に高い場合は異常値を検出", () => {
            const metrics = createMockMetrics({
                profit: {
                    grossProfit: 10000,
                    profitRate: 600,
                    profitRateString: "600.00%",
                },
            });
            const anomalies = BusinessCalculationHelperService.detectAnomalies(metrics);

            expect(anomalies.length).toBeGreaterThan(0);
            expect(anomalies.some((a) => a.includes("利益率が異常に高い"))).toBe(true);
        });

        test("カスタムしきい値で異常値を検出", () => {
            const metrics = createMockMetrics({
                addedValue: {
                    addedValue: 5000000, // 500万円
                    calculationMethod: "direct",
                },
            });
            const anomalies = BusinessCalculationHelperService.detectAnomalies(metrics, {
                maxAddedValue: 3000000, // 300万円
                maxTotalCost: 5000000,
                minProfitRate: -100,
                maxProfitRate: 500,
            });

            expect(anomalies.length).toBeGreaterThan(0);
        });
    });
});
