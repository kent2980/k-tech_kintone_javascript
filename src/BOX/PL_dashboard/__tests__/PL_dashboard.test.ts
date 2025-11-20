/**
 * PL_dashboard.tsのユニットテスト
 */

// kintoneのモック
(global as any).kintone = {
    events: {
        on: jest.fn(),
    },
    app: {
        getId: jest.fn(() => 1),
        getHeaderSpaceElement: jest.fn(() => document.createElement("div")),
    },
};

// モジュールのモック
jest.mock("../services/KintoneApiService", () => ({
    KintoneApiService: jest.fn().mockImplementation(() => ({
        fetchPLMonthlyData: jest.fn().mockResolvedValue(null),
        fetchPLDailyData: jest.fn().mockResolvedValue([]),
        fetchProductionReportData: jest.fn().mockResolvedValue([]),
        fetchMasterModelData: jest.fn().mockResolvedValue([]),
        fetchHolidayData: jest.fn().mockResolvedValue([]),
    })),
}));

jest.mock("../components", () => ({
    PLDashboardTableManager: jest.fn().mockImplementation(() => ({
        createProductionPerformanceTable: jest.fn(),
        createProfitCalculationTable: jest.fn(),
        createRevenueAnalysisSummaryTable: jest.fn(),
        updateTableData: jest.fn(),
        destroyAllTables: jest.fn(),
    })),
    PLDashboardGraphBuilder: jest.fn().mockImplementation(() => ({
        createMixedChartContainer: jest.fn(),
        updateMixedChart: jest.fn(),
        destroyAllCharts: jest.fn(),
    })),
    PLDomBuilder: jest.fn().mockImplementation(() => ({
        createFilterContainer: jest.fn(),
        createTabContainer: jest.fn(),
    })),
    PLHeaderContainer: jest.fn().mockImplementation(() => ({
        create: jest.fn(() => document.createElement("div")),
    })),
}));

jest.mock("../store", () => ({
    ActiveFilterStore: {
        getInstance: jest.fn(() => ({
            setFilter: jest.fn(),
            getFilter: jest.fn(() => ({ year: "2024", month: "1" })),
        })),
    },
    HolidayStore: {
        getInstance: jest.fn(() => ({
            setHolidayData: jest.fn(),
            getHolidayData: jest.fn(() => []),
        })),
    },
    MasterModelStore: {
        getInstance: jest.fn(() => ({
            setMasterData: jest.fn(),
            getMasterData: jest.fn(() => []),
            clearMasterData: jest.fn(),
        })),
    },
}));

jest.mock("../utils/PerformanceUtil", () => ({
    PerformanceUtil: {
        debounce: jest.fn((fn) => fn),
        startMeasure: jest.fn(),
        endMeasure: jest.fn(() => 0),
        clearCache: jest.fn(),
        createElementLazy: jest.fn((fn) => Promise.resolve(fn())),
    },
}));

jest.mock("../utils/Logger", () => ({
    Logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock("../utils/MemoryLeakDetector", () => ({
    MemoryLeakDetector: {
        enable: jest.fn(),
        disable: jest.fn(),
    },
}));

jest.mock("../services/BusinessCalculationService", () => ({
    BusinessCalculationService: {
        calculateBusinessMetrics: jest.fn(() => ({
            addedValue: 1000,
            costs: 500,
            grossProfit: 500,
            profitRate: 50,
        })),
    },
}));

jest.mock("../services/DataProcessor", () => ({
    DataProcessor: {
        getTotalsByDate: jest.fn(() => ({
            date: "2024-01-01",
            totalActualNumber: 100,
            totalAddedValue: 1000,
            totalCost: 500,
            totalGrossProfit: 500,
            profitRate: 50,
        })),
        createRevenueAnalysisData: jest.fn(() => []),
        getDateList: jest.fn(() => ["2024-01-01"]),
        getRecordsByDate: jest.fn(() => []),
    },
}));

// CSSファイルのインポートをモック
jest.mock("../styles/components/filter.css", () => ({}));
jest.mock("../styles/components/table.css", () => ({}));
jest.mock("../styles/components/tabs.css", () => ({}));
jest.mock("../styles/desktop.css", () => ({}));

describe("PL_dashboard", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        jest.clearAllMocks();
        jest.resetModules();
        // kintoneのモックを再設定
        (global as any).kintone = {
            events: {
                on: jest.fn(),
            },
            app: {
                getId: jest.fn(() => 1),
                getHeaderSpaceElement: jest.fn(() => document.createElement("div")),
            },
        };
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    test("モジュールが正常に読み込まれる", () => {
        expect(() => {
            require("../PL_dashboard");
        }).not.toThrow();
    });

    test("kintone.events.onが呼ばれる", () => {
        require("../PL_dashboard");
        expect((global as any).kintone.events.on).toHaveBeenCalled();
    });

    test("イベントハンドラーが正しく設定される", () => {
        require("../PL_dashboard");
        const calls = ((global as any).kintone.events.on as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        // app.record.index.showイベントが設定されていることを確認
        const indexShowCall = calls.find((call: any[]) => call[0] === "app.record.index.show");
        expect(indexShowCall).toBeDefined();
    });

    test("イベントハンドラーが実行される", async () => {
        const headerSpace = document.createElement("div");
        headerSpace.id = "header-space";
        document.body.appendChild(headerSpace);
        (global as any).kintone.app.getHeaderSpaceElement = jest.fn(() => headerSpace);

        require("../PL_dashboard");
        const calls = ((global as any).kintone.events.on as jest.Mock).mock.calls;
        const indexShowCall = calls.find((call: any[]) => call[0] === "app.record.index.show");

        expect(indexShowCall).toBeDefined();
        expect(indexShowCall?.[1]).toBeDefined();
        if (indexShowCall && indexShowCall[1]) {
            const eventHandler = indexShowCall[1];
            const mockEvent = {
                record: {},
                recordId: 1,
            };

            await expect(eventHandler(mockEvent)).resolves.toBeDefined();
        }
    });

    test("ヘッダースペースが存在する場合に処理が実行される", async () => {
        const headerSpace = document.createElement("div");
        headerSpace.id = "header-space";
        document.body.appendChild(headerSpace);
        (global as any).kintone.app.getHeaderSpaceElement = jest.fn(() => headerSpace);

        require("../PL_dashboard");
        const calls = ((global as any).kintone.events.on as jest.Mock).mock.calls;
        const indexShowCall = calls.find((call: any[]) => call[0] === "app.record.index.show");

        expect(indexShowCall).toBeDefined();
        expect(indexShowCall?.[1]).toBeDefined();
        if (indexShowCall && indexShowCall[1]) {
            const eventHandler = indexShowCall[1];
            const mockEvent = {
                record: {},
                recordId: 1,
            };

            const result = await eventHandler(mockEvent);
            expect(result).toBeDefined();
        }
    });

    test("ヘッダースペースが存在しない場合は処理がスキップされる", async () => {
        (global as any).kintone.app.getHeaderSpaceElement = jest.fn(() => null);

        require("../PL_dashboard");
        const calls = ((global as any).kintone.events.on as jest.Mock).mock.calls;
        const indexShowCall = calls.find((call: any[]) => call[0] === "app.record.index.show");

        expect(indexShowCall).toBeDefined();
        expect(indexShowCall?.[1]).toBeDefined();
        if (indexShowCall && indexShowCall[1]) {
            const eventHandler = indexShowCall[1];
            const mockEvent = {
                record: {},
                recordId: 1,
            };

            const result = await eventHandler(mockEvent);
            expect(result).toBeDefined();
        }
    });
});
