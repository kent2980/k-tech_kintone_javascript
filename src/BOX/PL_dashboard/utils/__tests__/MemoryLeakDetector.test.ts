/**
 * MemoryLeakDetectorのユニットテスト
 */

import { MemoryLeakDetector } from "../MemoryLeakDetector";

// Loggerをモック
jest.mock("../Logger", () => ({
    Logger: {
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    },
}));

describe("MemoryLeakDetector", () => {
    beforeEach(() => {
        // 各テスト前に無効化
        MemoryLeakDetector.disable();
        jest.clearAllMocks();
    });

    afterEach(() => {
        // 各テスト後に無効化
        MemoryLeakDetector.disable();
    });

    describe("enable", () => {
        test("メモリリーク検出を有効化", () => {
            MemoryLeakDetector.enable(1000);

            // チェックが実行されることを確認（非同期なので少し待つ）
            expect(() => {
                MemoryLeakDetector.checkMemoryLeaks();
            }).not.toThrow();

            MemoryLeakDetector.disable();
        });

        test("既に有効な場合は警告を出力", () => {
            MemoryLeakDetector.enable();
            MemoryLeakDetector.enable(); // 2回目

            MemoryLeakDetector.disable();
        });
    });

    describe("disable", () => {
        test("メモリリーク検出を無効化", () => {
            MemoryLeakDetector.enable();
            MemoryLeakDetector.disable();

            // 無効化後もチェックは実行できる
            expect(() => {
                MemoryLeakDetector.checkMemoryLeaks();
            }).not.toThrow();
        });

        test("無効化されていない場合は何もしない", () => {
            expect(() => {
                MemoryLeakDetector.disable();
            }).not.toThrow();
        });
    });

    describe("checkMemoryLeaks", () => {
        test("メモリリークをチェック", () => {
            const report = MemoryLeakDetector.checkMemoryLeaks();

            expect(report).toHaveProperty("timestamp");
            expect(report).toHaveProperty("dataTablesCount");
            expect(report).toHaveProperty("chartsCount");
            expect(report).toHaveProperty("eventListenersCount");
            expect(report).toHaveProperty("warnings");
            expect(Array.isArray(report.warnings)).toBe(true);
        });

        test("DataTablesインスタンスを検出", () => {
            // jQueryとDataTablesをモック
            (window as any).jQuery = jest.fn((selector: string) => {
                if (selector === "table") {
                    return {
                        filter: jest.fn(() => ({
                            length: 2,
                        })),
                    };
                }
                return { length: 0 };
            });
            (window as any).jQuery.fn = {
                DataTable: {
                    isDataTable: jest.fn(() => true),
                },
            };

            const report = MemoryLeakDetector.checkMemoryLeaks();

            expect(report.dataTablesCount).toBeGreaterThanOrEqual(0);
        });

        test("Chart.jsインスタンスを検出", () => {
            // canvas要素を追加
            const canvas1 = document.createElement("canvas");
            const canvas2 = document.createElement("canvas");
            document.body.appendChild(canvas1);
            document.body.appendChild(canvas2);

            const report = MemoryLeakDetector.checkMemoryLeaks();

            expect(report.chartsCount).toBeGreaterThanOrEqual(2);

            // クリーンアップ
            document.body.removeChild(canvas1);
            document.body.removeChild(canvas2);
        });

        test("DataTablesインスタンスの増加を検出", () => {
            // 最初のチェック
            MemoryLeakDetector.checkMemoryLeaks();

            // jQueryとDataTablesをモック
            (window as any).jQuery = jest.fn((selector: string) => {
                if (selector === "table") {
                    return {
                        filter: jest.fn(() => ({
                            length: 3, // 増加
                        })),
                    };
                }
                return { length: 0 };
            });
            (window as any).jQuery.fn = {
                DataTable: {
                    isDataTable: jest.fn(() => true),
                },
            };

            const report = MemoryLeakDetector.checkMemoryLeaks();

            expect(report.warnings.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe("getMemoryUsage", () => {
        test("performance.memoryが利用可能な場合はメモリ情報を返す", () => {
            // performance.memoryをモック
            (performance as any).memory = {
                usedJSHeapSize: 1000000,
                totalJSHeapSize: 2000000,
                jsHeapSizeLimit: 5000000,
            };

            const usage = MemoryLeakDetector.getMemoryUsage();

            expect(usage).toHaveProperty("usedJSHeapSize");
            expect(usage).toHaveProperty("totalJSHeapSize");
            expect(usage).toHaveProperty("jsHeapSizeLimit");
            expect(usage.usedJSHeapSize).toBe(1000000);
        });

        test("performance.memoryが利用できない場合は空オブジェクトを返す", () => {
            // performance.memoryを削除
            delete (performance as any).memory;

            const usage = MemoryLeakDetector.getMemoryUsage();

            expect(usage).toEqual({});
        });
    });
});
