/**
 * TableFiltersのユニットテスト
 */

jest.mock("../../utils/DateUtil", () => ({
    DateUtil: {
        getCurrentYear: jest.fn(() => 2024),
        getCurrentMonth: jest.fn(() => 1),
    },
}));

import { TableFilters } from "../useTableFilters";

describe("TableFilters", () => {
    let tableFilters: TableFilters;

    beforeEach(() => {
        tableFilters = new TableFilters();
    });

    describe("constructor", () => {
        test("初期状態でインスタンスを作成", () => {
            const filters = new TableFilters();
            const state = filters.getState();

            expect(state.filterConfig.year).toBeNull();
            expect(state.filterConfig.month).toBeNull();
            expect(state.availableYears).toEqual([]);
            expect(state.availableMonths).toEqual([]);
            expect(state.isFiltering).toBe(false);
        });
    });

    describe("getState", () => {
        test("現在の状態を取得", () => {
            const state = tableFilters.getState();

            expect(state).toHaveProperty("filterConfig");
            expect(state).toHaveProperty("availableYears");
            expect(state).toHaveProperty("availableMonths");
            expect(state).toHaveProperty("isFiltering");
        });
    });

    describe("getFilterConfig", () => {
        test("現在のフィルター設定を取得", () => {
            const config = tableFilters.getFilterConfig();

            expect(config).toHaveProperty("year");
            expect(config).toHaveProperty("month");
        });
    });

    describe("subscribe", () => {
        test("状態変更のリスナーを追加", () => {
            const listener = jest.fn();
            const unsubscribe = tableFilters.subscribe(listener);

            expect(typeof unsubscribe).toBe("function");
        });

        test("リスナーが状態変更時に呼ばれる", () => {
            const listener = jest.fn();
            tableFilters.subscribe(listener);

            tableFilters.setYear("2024");

            expect(listener).toHaveBeenCalled();
        });
    });

    describe("onFilterChange", () => {
        test("フィルター変更のリスナーを追加", () => {
            const listener = jest.fn();
            const unsubscribe = tableFilters.onFilterChange(listener);

            expect(typeof unsubscribe).toBe("function");
        });

        test("リスナーがフィルター変更時に呼ばれる", (done) => {
            const listener = jest.fn((config) => {
                expect(config.year).toBe("2024");
                done();
            });

            tableFilters.onFilterChange(listener);
            tableFilters.setYear("2024");
        });
    });

    describe("initialize", () => {
        test("利用可能な年月を設定", () => {
            tableFilters.initialize(10);

            const state = tableFilters.getState();
            expect(state.availableYears.length).toBe(10);
            expect(state.availableMonths.length).toBe(12);
            expect(state.filterConfig.year).toBe("2024");
            expect(state.filterConfig.month).toBe("1");
        });

        test("デフォルトの年範囲で初期化", () => {
            tableFilters.initialize();

            const state = tableFilters.getState();
            expect(state.availableYears.length).toBe(10);
        });
    });

    describe("setYear", () => {
        test("年フィルターを設定", () => {
            tableFilters.setYear("2024");

            const state = tableFilters.getState();
            expect(state.filterConfig.year).toBe("2024");
            expect(state.isFiltering).toBe(true);
        });

        test("年フィルターをnullに設定", () => {
            tableFilters.setYear(null);

            const state = tableFilters.getState();
            expect(state.filterConfig.year).toBeNull();
        });
    });

    describe("setMonth", () => {
        test("月フィルターを設定", () => {
            tableFilters.setMonth("12");

            const state = tableFilters.getState();
            expect(state.filterConfig.month).toBe("12");
            expect(state.isFiltering).toBe(true);
        });

        test("月フィルターをnullに設定", () => {
            tableFilters.setMonth(null);

            const state = tableFilters.getState();
            expect(state.filterConfig.month).toBeNull();
        });
    });

    describe("setFilterConfig", () => {
        test("フィルター設定を一括更新", () => {
            tableFilters.setFilterConfig({
                year: "2024",
                month: "12",
            });

            const state = tableFilters.getState();
            expect(state.filterConfig.year).toBe("2024");
            expect(state.filterConfig.month).toBe("12");
            expect(state.isFiltering).toBe(true);
        });
    });

    describe("reset", () => {
        test("フィルターをリセット", () => {
            tableFilters.setYear("2024");
            tableFilters.setMonth("12");
            tableFilters.reset();

            const state = tableFilters.getState();
            expect(state.filterConfig.year).toBeNull();
            expect(state.filterConfig.month).toBeNull();
            expect(state.isFiltering).toBe(false);
        });
    });

    describe("setFilteringComplete", () => {
        test("フィルター処理完了を通知", () => {
            tableFilters.setYear("2024");
            tableFilters.setFilteringComplete();

            const state = tableFilters.getState();
            expect(state.isFiltering).toBe(false);
        });
    });

    describe("getCurrentYear", () => {
        test("現在の年を取得", () => {
            const year = tableFilters.getCurrentYear();

            expect(year).toBe("2024");
        });
    });

    describe("getCurrentMonth", () => {
        test("現在の月を取得", () => {
            const month = tableFilters.getCurrentMonth();

            expect(month).toBe("1");
        });
    });

    describe("hasActiveFilters", () => {
        test("フィルターが有効な場合", () => {
            tableFilters.setYear("2024");

            expect(tableFilters.hasActiveFilters()).toBe(true);
        });

        test("フィルターが無効な場合", () => {
            tableFilters.reset();

            expect(tableFilters.hasActiveFilters()).toBe(false);
        });
    });

    describe("hasCompleteFilters", () => {
        test("完全なフィルターが設定されている場合", () => {
            tableFilters.setFilterConfig({
                year: "2024",
                month: "12",
            });

            expect(tableFilters.hasCompleteFilters()).toBe(true);
        });

        test("完全なフィルターが設定されていない場合", () => {
            tableFilters.setYear("2024");

            expect(tableFilters.hasCompleteFilters()).toBe(false);
        });
    });

    describe("debug", () => {
        test("デバッグ情報を出力", () => {
            expect(() => {
                tableFilters.debug();
            }).not.toThrow();
        });
    });
});
