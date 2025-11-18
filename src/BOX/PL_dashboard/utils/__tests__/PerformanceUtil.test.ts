/**
 * PerformanceUtilのユニットテスト
 */

import { PerformanceUtil } from "../PerformanceUtil";

describe("PerformanceUtil", () => {
    beforeEach(() => {
        // キャッシュをクリア
        PerformanceUtil.clearCache();
    });

    describe("getFromCache", () => {
        test("キャッシュにデータが存在する場合はデータを返す", () => {
            PerformanceUtil.setCache("test-key", { value: "test-data" });
            const result = PerformanceUtil.getFromCache<{ value: string }>("test-key");

            expect(result).toEqual({ value: "test-data" });
        });

        test("キャッシュにデータが存在しない場合はnullを返す", () => {
            const result = PerformanceUtil.getFromCache("non-existent-key");

            expect(result).toBeNull();
        });
    });

    describe("setCache", () => {
        test("データをキャッシュに保存", () => {
            PerformanceUtil.setCache("test-key", { value: "test-data" });
            const result = PerformanceUtil.getFromCache<{ value: string }>("test-key");

            expect(result).toEqual({ value: "test-data" });
        });

        test("TTLを指定した場合は期限後に削除される", (done) => {
            PerformanceUtil.setCache("test-key-ttl", { value: "test-data" }, 100);

            setTimeout(() => {
                const result = PerformanceUtil.getFromCache("test-key-ttl");
                expect(result).toBeNull();
                done();
            }, 150);
        });
    });

    describe("clearCache", () => {
        test("パターンを指定しない場合はすべてのキャッシュをクリア", () => {
            PerformanceUtil.setCache("key1", "value1");
            PerformanceUtil.setCache("key2", "value2");
            PerformanceUtil.clearCache();

            expect(PerformanceUtil.getFromCache("key1")).toBeNull();
            expect(PerformanceUtil.getFromCache("key2")).toBeNull();
        });

        test("パターンを指定した場合は該当するキャッシュのみをクリア", () => {
            PerformanceUtil.setCache("test-key1", "value1");
            PerformanceUtil.setCache("test-key2", "value2");
            PerformanceUtil.setCache("other-key", "value3");
            PerformanceUtil.clearCache("test-.*");

            expect(PerformanceUtil.getFromCache("test-key1")).toBeNull();
            expect(PerformanceUtil.getFromCache("test-key2")).toBeNull();
            expect(PerformanceUtil.getFromCache("other-key")).toBe("value3");
        });
    });

    describe("debounce", () => {
        test("デバウンスされた関数は指定時間後に実行される", (done) => {
            const mockFn = jest.fn();
            const debouncedFn = PerformanceUtil.debounce(mockFn, 100);

            debouncedFn();
            expect(mockFn).not.toHaveBeenCalled();

            setTimeout(() => {
                expect(mockFn).toHaveBeenCalledTimes(1);
                done();
            }, 150);
        });

        test("連続呼び出し時は最後の呼び出しのみが実行される", (done) => {
            const mockFn = jest.fn();
            const debouncedFn = PerformanceUtil.debounce(mockFn, 100);

            debouncedFn();
            debouncedFn();
            debouncedFn();

            setTimeout(() => {
                expect(mockFn).toHaveBeenCalledTimes(1);
                done();
            }, 150);
        });
    });

    describe("throttle", () => {
        test("スロットリングされた関数は一定間隔で実行される", (done) => {
            const mockFn = jest.fn();
            const throttledFn = PerformanceUtil.throttle(mockFn, 100);

            throttledFn();
            expect(mockFn).toHaveBeenCalledTimes(1);

            throttledFn();
            expect(mockFn).toHaveBeenCalledTimes(1); // まだ実行されない

            setTimeout(() => {
                throttledFn();
                expect(mockFn).toHaveBeenCalledTimes(2);
                done();
            }, 150);
        });
    });

    describe("chunkArray", () => {
        test("配列を指定サイズのチャンクに分割", () => {
            const data = [1, 2, 3, 4, 5, 6, 7];
            const chunks = PerformanceUtil.chunkArray(data, 3);

            expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
        });

        test("空の配列の場合は空の配列を返す", () => {
            const chunks = PerformanceUtil.chunkArray([], 3);

            expect(chunks).toEqual([]);
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

            const result = PerformanceUtil.getMemoryUsage();

            expect(result).toEqual({
                usedJSHeapSize: 1000000,
                totalJSHeapSize: 2000000,
                jsHeapSizeLimit: 5000000,
            });
        });

        test("performance.memoryが利用できない場合はnullを返す", () => {
            // performance.memoryを削除
            delete (performance as any).memory;

            const result = PerformanceUtil.getMemoryUsage();

            expect(result).toBeNull();
        });
    });

    describe("createElementLazy", () => {
        test("要素を遅延作成する", async () => {
            const factory = jest.fn(() => document.createElement("div"));
            const element = await PerformanceUtil.createElementLazy(factory);

            expect(element).toBeInstanceOf(HTMLDivElement);
            expect(factory).toHaveBeenCalled();
        });
    });

    describe("processBatches", () => {
        test("大量データをバッチ処理する", async () => {
            const data = Array.from({ length: 250 }, (_, i) => i);
            const processor = jest.fn((batch: number[]) => batch.map((n) => n * 2));

            const results = await PerformanceUtil.processBatches(data, processor, 100);

            expect(results).toHaveLength(250);
            expect(processor).toHaveBeenCalledTimes(3); // 100, 100, 50
            expect(results[0]).toBe(0);
            expect(results[249]).toBe(498);
        });
    });

    describe("startMeasure", () => {
        test("パフォーマンス測定を開始する", () => {
            const mockMark = jest.fn();
            (performance as any).mark = mockMark;

            PerformanceUtil.startMeasure("test-measure");

            expect(mockMark).toHaveBeenCalledWith("test-measure-start");
        });
    });

    describe("endMeasure", () => {
        test("パフォーマンス測定を終了して時間を返す", () => {
            const mockMark = jest.fn();
            const mockMeasure = jest.fn();
            const mockGetEntriesByName = jest.fn(() => [{ duration: 123.45 }]);

            (performance as any).mark = mockMark;
            (performance as any).measure = mockMeasure;
            (performance as any).getEntriesByName = mockGetEntriesByName;

            const duration = PerformanceUtil.endMeasure("test-measure");

            expect(mockMark).toHaveBeenCalledWith("test-measure-end");
            expect(mockMeasure).toHaveBeenCalledWith(
                "test-measure",
                "test-measure-start",
                "test-measure-end"
            );
            expect(duration).toBe(123.45);
        });
    });

    describe("preloadResource", () => {
        beforeEach(() => {
            // 各テスト前にheadをクリーンアップ
            document.head.innerHTML = "";
        });

        test("スクリプトリソースをプリロード", () => {
            PerformanceUtil.preloadResource("test.js", "script");

            const link = document.head.querySelector("link[rel='preload']") as HTMLLinkElement;
            expect(link).toBeTruthy();
            expect(link.rel).toBe("preload");
            expect(link.href).toContain("test.js");
            expect(link.as).toBe("script");
        });

        test("スタイルリソースをプリロード", () => {
            PerformanceUtil.preloadResource("test.css", "style");

            const link = document.head.querySelector("link[rel='preload']") as HTMLLinkElement;
            expect(link).toBeTruthy();
            expect(link.as).toBe("style");
        });

        test("画像リソースをプリロード", () => {
            PerformanceUtil.preloadResource("test.png", "image");

            const link = document.head.querySelector("link[rel='preload']") as HTMLLinkElement;
            expect(link).toBeTruthy();
            expect(link.as).toBe("image");
        });
    });

    describe("observeViewport", () => {
        test("Intersection Observerを設定", () => {
            // IntersectionObserverをモック
            global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
                observe: jest.fn(),
                disconnect: jest.fn(),
            })) as any;

            const element = document.createElement("div");
            const callback = jest.fn();
            const key = PerformanceUtil.observeViewport(element, callback);

            expect(key).toBeTruthy();
            expect(typeof key).toBe("string");
            expect(global.IntersectionObserver).toHaveBeenCalled();
        });
    });

    describe("unobserveViewport", () => {
        test("Intersection Observerを停止", () => {
            // IntersectionObserverをモック
            const mockDisconnect = jest.fn();
            global.IntersectionObserver = jest.fn().mockImplementation(() => ({
                observe: jest.fn(),
                disconnect: mockDisconnect,
            })) as any;

            const element = document.createElement("div");
            const callback = jest.fn();
            const key = PerformanceUtil.observeViewport(element, callback);

            PerformanceUtil.unobserveViewport(key);

            expect(mockDisconnect).toHaveBeenCalled();

            // 再度停止してもエラーが発生しないことを確認
            expect(() => PerformanceUtil.unobserveViewport(key)).not.toThrow();
        });
    });
});
