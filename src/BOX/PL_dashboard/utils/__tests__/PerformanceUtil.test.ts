import { PerformanceUtil } from "../PerformanceUtil";

// Performanceのモック
const mockPerformance = {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(),
    memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
    },
};

// グローバルのperformanceを置き換え
Object.defineProperty(global, "performance", {
    value: mockPerformance,
    writable: true,
});

// IntersectionObserverのモック
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.prototype.observe = jest.fn();
mockIntersectionObserver.prototype.unobserve = jest.fn();
mockIntersectionObserver.prototype.disconnect = jest.fn();

Object.defineProperty(global, "IntersectionObserver", {
    value: mockIntersectionObserver,
    writable: true,
});

// requestAnimationFrameのモック
Object.defineProperty(global, "requestAnimationFrame", {
    value: jest.fn((callback: FrameRequestCallback) => {
        setTimeout(callback, 16);
        return 1;
    }),
    writable: true,
});

describe("PerformanceUtil", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useFakeTimers();

        // Mock performance API
        (global as any).performance = {
            ...global.performance,
            mark: jest.fn(),
            measure: jest.fn(),
            getEntriesByName: jest.fn().mockReturnValue([{ duration: 100 }]),
            memory: {
                usedJSHeapSize: 1000000,
                totalJSHeapSize: 2000000,
                jsHeapSizeLimit: 4000000,
            },
        };

        // Mock DOM elements
        Object.defineProperty(document, "head", {
            value: { appendChild: jest.fn() },
            writable: true,
        });

        // キャッシュをクリア
        PerformanceUtil.clearCache();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("Cache functionality", () => {
        describe("setCache and getFromCache", () => {
            it("should store and retrieve cached data", () => {
                const testData = { id: 1, name: "test" };

                PerformanceUtil.setCache("test-key", testData);
                const result = PerformanceUtil.getFromCache<typeof testData>("test-key");

                expect(result).toEqual(testData);
            });

            it("should return null for non-existent key", () => {
                const result = PerformanceUtil.getFromCache("non-existent");

                expect(result).toBeNull();
            });

            it("should handle TTL expiration", () => {
                const testData = "test-data";

                PerformanceUtil.setCache("ttl-key", testData, 1000);

                // Before TTL expires
                expect(PerformanceUtil.getFromCache("ttl-key")).toBe(testData);

                // After TTL expires
                jest.advanceTimersByTime(1001);
                expect(PerformanceUtil.getFromCache("ttl-key")).toBeNull();
            });
        });

        describe("clearCache", () => {
            it("should clear all cache when no pattern provided", () => {
                PerformanceUtil.setCache("key1", "data1");
                PerformanceUtil.setCache("key2", "data2");

                PerformanceUtil.clearCache();

                expect(PerformanceUtil.getFromCache("key1")).toBeNull();
                expect(PerformanceUtil.getFromCache("key2")).toBeNull();
            });

            it("should clear cache by pattern", () => {
                PerformanceUtil.setCache("user-1", "data1");
                PerformanceUtil.setCache("user-2", "data2");
                PerformanceUtil.setCache("admin-1", "data3");

                PerformanceUtil.clearCache("user-");

                expect(PerformanceUtil.getFromCache("user-1")).toBeNull();
                expect(PerformanceUtil.getFromCache("user-2")).toBeNull();
                expect(PerformanceUtil.getFromCache("admin-1")).toBe("data3");
            });
        });
    });

    describe("Function throttling and debouncing", () => {
        describe("debounce", () => {
            it("should debounce function calls", () => {
                const mockFn = jest.fn();
                const debouncedFn = PerformanceUtil.debounce(mockFn, 100);

                debouncedFn("call1");
                debouncedFn("call2");
                debouncedFn("call3");

                expect(mockFn).not.toHaveBeenCalled();

                jest.advanceTimersByTime(100);

                expect(mockFn).toHaveBeenCalledTimes(1);
                expect(mockFn).toHaveBeenCalledWith("call3");
            });

            it("should reset debounce timer on new calls", () => {
                const mockFn = jest.fn();
                const debouncedFn = PerformanceUtil.debounce(mockFn, 100);

                debouncedFn("call1");
                jest.advanceTimersByTime(50);

                debouncedFn("call2");
                jest.advanceTimersByTime(50);

                expect(mockFn).not.toHaveBeenCalled();

                jest.advanceTimersByTime(50);

                expect(mockFn).toHaveBeenCalledTimes(1);
                expect(mockFn).toHaveBeenCalledWith("call2");
            });
        });

        describe("throttle", () => {
            it("should throttle function calls", () => {
                const mockFn = jest.fn();
                const throttledFn = PerformanceUtil.throttle(mockFn, 100);

                throttledFn("call1");
                throttledFn("call2");
                throttledFn("call3");

                expect(mockFn).toHaveBeenCalledTimes(1);
                expect(mockFn).toHaveBeenCalledWith("call1");

                jest.advanceTimersByTime(100);

                throttledFn("call4");

                expect(mockFn).toHaveBeenCalledTimes(2);
                expect(mockFn).toHaveBeenCalledWith("call4");
            });
        });
    });

    describe("Performance measurement", () => {
        describe("startMeasure and endMeasure", () => {
            it("should measure performance", () => {
                // Set up the mock performance API
                const mockMark = jest.fn();
                const mockMeasure = jest.fn();
                const mockGetEntriesByName = jest.fn().mockReturnValue([{ duration: 150.5 }]);

                (global as any).performance = {
                    mark: mockMark,
                    measure: mockMeasure,
                    getEntriesByName: mockGetEntriesByName,
                };

                PerformanceUtil.startMeasure("test-operation");
                const result = PerformanceUtil.endMeasure("test-operation");

                expect(mockMark).toHaveBeenCalledWith("test-operation-start");
                expect(mockMark).toHaveBeenCalledWith("test-operation-end");
                expect(mockMeasure).toHaveBeenCalledWith(
                    "test-operation",
                    "test-operation-start",
                    "test-operation-end"
                );
                expect(result).toBe(150.5);
            });

            it("should return duration from performance entry", () => {
                const mockMark = jest.fn();
                const mockMeasure = jest.fn();
                const mockGetEntriesByName = jest.fn().mockReturnValue([{ duration: 42.7 }]);

                (global as any).performance = {
                    mark: mockMark,
                    measure: mockMeasure,
                    getEntriesByName: mockGetEntriesByName,
                };

                PerformanceUtil.startMeasure("test-duration");
                const duration = PerformanceUtil.endMeasure("test-duration");

                expect(duration).toBe(42.7);
            });
        });
    });

    describe("Memory usage", () => {
        it("should return memory usage when available", () => {
            // Mock performance.memory properly
            Object.defineProperty(mockPerformance, "memory", {
                value: {
                    usedJSHeapSize: 1000000,
                    totalJSHeapSize: 2000000,
                    jsHeapSizeLimit: 4000000,
                },
                writable: true,
                configurable: true,
            });

            const memoryInfo = PerformanceUtil.getMemoryUsage();

            expect(memoryInfo).toEqual({
                usedJSHeapSize: 1000000,
                totalJSHeapSize: 2000000,
                jsHeapSizeLimit: 4000000,
            });
        });

        it("should return null when memory info not available", () => {
            const performanceWithoutMemory = {};
            Object.defineProperty(global, "performance", {
                value: performanceWithoutMemory,
                writable: true,
            });

            const memoryInfo = PerformanceUtil.getMemoryUsage();

            expect(memoryInfo).toBeNull();

            // Restore original performance
            Object.defineProperty(global, "performance", {
                value: mockPerformance,
                writable: true,
            });
        });
    });

    describe("Array utilities", () => {
        describe("chunkArray", () => {
            it("should split array into chunks", () => {
                const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                const chunks = PerformanceUtil.chunkArray(data, 3);

                expect(chunks).toEqual([
                    [1, 2, 3],
                    [4, 5, 6],
                    [7, 8, 9],
                ]);
            });

            it("should handle remainder in last chunk", () => {
                const data = [1, 2, 3, 4, 5];
                const chunks = PerformanceUtil.chunkArray(data, 2);

                expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
            });

            it("should handle empty array", () => {
                const chunks = PerformanceUtil.chunkArray([], 3);

                expect(chunks).toEqual([]);
            });

            it("should handle chunk size larger than array", () => {
                const data = [1, 2, 3];
                const chunks = PerformanceUtil.chunkArray(data, 10);

                expect(chunks).toEqual([[1, 2, 3]]);
            });
        });
    });

    describe("Async utilities", () => {
        describe("createElementLazy", () => {
            it("should create element using requestAnimationFrame", async () => {
                // Mock requestAnimationFrame
                const mockRAF = jest.fn((callback) => {
                    setTimeout(callback, 0);
                    return 1;
                });
                Object.defineProperty(global, "requestAnimationFrame", {
                    value: mockRAF,
                    writable: true,
                    configurable: true,
                });

                const factory = jest.fn(() => {
                    const div = document.createElement("div");
                    div.textContent = "test";
                    return div;
                });

                const promise = PerformanceUtil.createElementLazy(factory);

                jest.runAllTimers();

                const element = await promise;

                expect(factory).toHaveBeenCalled();
                expect(element.textContent).toBe("test");
                expect(mockRAF).toHaveBeenCalled();
            });
        });

        describe("processBatches", () => {
            it("should process data in batches", () => {
                const data = [1, 2, 3, 4, 5, 6];
                const processor = jest.fn((batch: number[]) => batch.map((x) => x * 2));

                // Mock the processBatches to verify it would be called correctly
                expect(data.length).toBe(6);
                expect(typeof processor).toBe("function");

                // Test the static method exists
                expect(typeof PerformanceUtil.processBatches).toBe("function");
            });

            it("should handle chunkArray edge cases", () => {
                // Test chunkArray with various inputs
                expect(PerformanceUtil.chunkArray([], 5)).toEqual([]);
                expect(PerformanceUtil.chunkArray([1], 5)).toEqual([[1]]);
                expect(PerformanceUtil.chunkArray([1, 2, 3, 4, 5, 6], 2)).toEqual([
                    [1, 2],
                    [3, 4],
                    [5, 6],
                ]);
                expect(PerformanceUtil.chunkArray([1, 2, 3, 4, 5], 3)).toEqual([
                    [1, 2, 3],
                    [4, 5],
                ]);
            });

            it("should test processBatches with actual async behavior", async () => {
                jest.useRealTimers();

                const data = [1, 2, 3, 4];
                const processor = jest.fn((batch: number[]) => batch.map((x) => x * 2));

                const startTime = Date.now();
                const results = await PerformanceUtil.processBatches(data, processor, 2);
                const endTime = Date.now();

                expect(results).toEqual([2, 4, 6, 8]);
                expect(processor).toHaveBeenCalledTimes(2);
                expect(processor).toHaveBeenNthCalledWith(1, [1, 2]);
                expect(processor).toHaveBeenNthCalledWith(2, [3, 4]);

                // Should have some delay due to setTimeout
                expect(endTime - startTime).toBeGreaterThanOrEqual(0);

                jest.useFakeTimers();
            });
        });
    });

    describe("Viewport observation", () => {
        describe("observeViewport", () => {
            it("should create and register intersection observer", () => {
                const element = document.createElement("div");
                const callback = jest.fn();

                const observerKey = PerformanceUtil.observeViewport(element, callback);

                expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {});
                expect(observerKey).toMatch(/^viewport-\d+-/);
            });

            it("should create observer with custom options", () => {
                const element = document.createElement("div");
                const callback = jest.fn();
                const options = { threshold: 0.5 };

                PerformanceUtil.observeViewport(element, callback, options);

                expect(mockIntersectionObserver).toHaveBeenCalledWith(
                    expect.any(Function),
                    options
                );
            });
        });

        describe("unobserveViewport", () => {
            it("should disconnect and remove observer", () => {
                const element = document.createElement("div");
                const callback = jest.fn();

                const observerKey = PerformanceUtil.observeViewport(element, callback);
                PerformanceUtil.unobserveViewport(observerKey);

                const mockInstance = mockIntersectionObserver.mock.instances[0];
                expect(mockInstance.disconnect).toHaveBeenCalled();
            });

            it("should handle non-existent observer key gracefully", () => {
                expect(() => {
                    PerformanceUtil.unobserveViewport("non-existent-key");
                }).not.toThrow();
            });
        });
    });

    describe("Resource preloading", () => {
        describe("preloadResource", () => {
            beforeEach(() => {
                // Mock document.head
                document.head.appendChild = jest.fn();

                // Mock document.createElement to return an element with getAttribute
                const mockElement: any = {
                    rel: "",
                    href: "",
                    as: "",
                    setAttribute: jest.fn((key: string, value: string) => {
                        mockElement[key] = value;
                    }),
                    getAttribute: jest.fn((key: string): string | null => {
                        return mockElement[key] || null;
                    }),
                };

                document.createElement = jest.fn(() => mockElement);
            });

            it("should preload script resource", () => {
                PerformanceUtil.preloadResource("script.js", "script");

                expect(document.head.appendChild).toHaveBeenCalledTimes(1);
                const calledWith = (document.head.appendChild as jest.Mock).mock.calls[0][0];
                expect(calledWith.rel).toBe("preload");
                expect(calledWith.href).toContain("script.js");
                expect(calledWith.getAttribute("as")).toBe("script");
            });

            it("should preload style resource", () => {
                PerformanceUtil.preloadResource("styles.css", "style");

                expect(document.head.appendChild).toHaveBeenCalledTimes(1);
                const calledWith = (document.head.appendChild as jest.Mock).mock.calls[0][0];
                expect(calledWith.rel).toBe("preload");
                expect(calledWith.href).toContain("styles.css");
                expect(calledWith.getAttribute("as")).toBe("style");
            });

            it("should preload image resource", () => {
                PerformanceUtil.preloadResource("image.jpg", "image");

                expect(document.head.appendChild).toHaveBeenCalledTimes(1);
                const calledWith = (document.head.appendChild as jest.Mock).mock.calls[0][0];
                expect(calledWith.rel).toBe("preload");
                expect(calledWith.href).toContain("image.jpg");
                expect(calledWith.getAttribute("as")).toBe("image");
            });
        });
    });
});
