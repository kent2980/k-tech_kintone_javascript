/**
 * PLDashboardTableManagerのユニットテスト
 */

// 依存関係をモック
jest.mock("jquery", () => {
    const fn: any = jest.fn(() => ({ length: 0 }));
    fn.fn = {};
    fn.fn.DataTable = jest.fn(() => ({
        clear: jest.fn().mockReturnThis(),
        rows: { add: jest.fn().mockReturnThis() },
        draw: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        buttons: jest.fn(() => ({
            destroy: jest.fn(),
        })),
    }));
    fn.fn.DataTable.isDataTable = jest.fn().mockReturnValue(false);
    return fn;
});

jest.mock("datatables.net", () => ({}));
jest.mock("datatables.net-buttons", () => ({}));
jest.mock("datatables.net-buttons-dt", () => ({}));
jest.mock("datatables.net-dt/css/dataTables.dataTables.min.css", () => ({}));
jest.mock("datatables.net-buttons/js/buttons.html5.min.js", () => ({}));
jest.mock("datatables.net-buttons/js/buttons.print.min.js", () => ({}));

jest.mock("../../../store", () => ({
    HolidayStore: {
        getInstance: jest.fn(() => ({
            getHolidayData: jest.fn(() => []),
            getSelectHolidayDates: jest.fn(() => []),
        })),
    },
    MasterModelStore: {
        getInstance: jest.fn(() => ({
            getMasterData: jest.fn(() => []),
        })),
    },
    ActiveFilterStore: {
        getInstance: jest.fn(() => ({
            getFilter: jest.fn(() => ({ year: "2024", month: "1" })),
        })),
    },
}));

import { PLDashboardTableManager } from "../PLDashboardTableManager";

describe("PLDashboardTableManager", () => {
    let tableManager: PLDashboardTableManager;

    beforeEach(() => {
        tableManager = new PLDashboardTableManager();
        // DOMをクリーンアップ
        document.body.innerHTML = "";
    });

    afterEach(() => {
        // テーブルを破棄
        tableManager.destroyAllTables();
    });

    describe("createTable", () => {
        test("テーブル要素を正しく作成", () => {
            const table = (tableManager as any).createTable("test-table");

            expect(table).toBeInstanceOf(HTMLTableElement);
            expect(table.id).toBe("test-table");
        });
    });

    describe("createTableCell", () => {
        test("テーブルセルを正しく作成", () => {
            const cell = (tableManager as any).createTableCell("Test Content");

            expect(cell).toBeInstanceOf(HTMLTableCellElement);
            expect(cell.textContent).toBe("Test Content");
        });

        test("数値セルの場合は右寄せクラスを設定", () => {
            const cell = (tableManager as any).createTableCell(123, true);

            expect(cell.className).toContain("pl-table-td-numeric");
        });
    });

    describe("getDateBackgroundColor", () => {
        test("法定休日の場合は正しい色を返す", () => {
            const holidayData = [
                { date: { value: "2024-01-01" }, holiday_type: { value: "法定休日" } },
            ];

            const color = (tableManager as any).getDateBackgroundColor("2024-01-01", holidayData);

            expect(color).toBe("#e6f3ff");
        });

        test("所定休日の場合は正しい色を返す", () => {
            const holidayData = [
                { date: { value: "2024-01-07" }, holiday_type: { value: "所定休日" } },
            ];

            const color = (tableManager as any).getDateBackgroundColor("2024-01-07", holidayData);

            expect(color).toBe("#ffe6e6");
        });

        test("平日の場合は空文字列を返す", () => {
            const holidayData: any[] = [];

            const color = (tableManager as any).getDateBackgroundColor("2024-01-02", holidayData);

            expect(color).toBe("");
        });
    });

    describe("hasTable", () => {
        test("テーブルが存在する場合はtrueを返す", () => {
            const container = document.createElement("div");
            container.id = "test-container";
            document.body.appendChild(container);

            // テーブルを作成（簡易版）
            const table = document.createElement("table");
            table.id = "test-table";
            container.appendChild(table);

            // テーブル情報を登録（内部メソッドを呼び出し）
            (tableManager as any).registerTable("test-table", "test", {}, []);

            expect(tableManager.hasTable("test-table")).toBe(true);
        });

        test("テーブルが存在しない場合はfalseを返す", () => {
            expect(tableManager.hasTable("non-existent-table")).toBe(false);
        });
    });

    describe("destroyTable", () => {
        test("テーブルを正しく破棄", () => {
            const container = document.createElement("div");
            container.id = "test-container";
            document.body.appendChild(container);

            const table = document.createElement("table");
            table.id = "test-table";
            container.appendChild(table);

            (tableManager as any).registerTable("test-table", "test", {}, []);

            tableManager.destroyTable("test-table");

            expect(tableManager.hasTable("test-table")).toBe(false);
        });
    });

    describe("createProductionPerformanceTable", () => {
        test("データが存在しない場合はメッセージを表示", () => {
            const getDayOfWeek = jest.fn((date: Date) => "月");
            const container = tableManager.createProductionPerformanceTable(
                "test-table",
                [],
                null,
                [],
                getDayOfWeek
            );

            expect(container).toBeInstanceOf(HTMLDivElement);
            expect(container.textContent).toContain("該当するPL日次データが存在しません");
        });

        test("recordsがnullの場合はメッセージを表示", () => {
            const getDayOfWeek = jest.fn((date: Date) => "月");
            const container = tableManager.createProductionPerformanceTable(
                "test-table",
                null as any,
                null,
                [],
                getDayOfWeek
            );

            expect(container).toBeInstanceOf(HTMLDivElement);
            expect(container.textContent).toContain("該当するPL日次データが存在しません");
        });

        test("データが存在する場合はテーブルを作成", () => {
            const mockRecords: any[] = [
                {
                    date: { value: "2024-01-01" },
                    line_name: { value: "ライン1" },
                    model_name: { value: "モデル1" },
                    inside_unit: { value: "100" },
                    outside_unit: { value: "200" },
                },
            ];

            const mockMonthlyData: any = {
                inside_unit: { value: "3000" },
                outside_unit: { value: "2500" },
            };

            const getDayOfWeek = jest.fn((date: Date) => "月");

            const container = tableManager.createProductionPerformanceTable(
                "test-production",
                mockRecords,
                mockMonthlyData,
                [],
                getDayOfWeek
            );

            expect(container).toBeInstanceOf(HTMLDivElement);
            expect(container.id).toBe("production-performance-table-test-production");
            expect(tableManager.hasTable("test-production")).toBe(true);
        });
    });

    describe("createProfitCalculationTable", () => {
        test("データが存在しない場合はメッセージを表示", () => {
            const getDateList = jest.fn(() => []);
            const getTotalsByDate = jest.fn(() => ({}) as any);
            const getRecordsByDate = jest.fn(() => []);
            const getDayOfWeek = jest.fn((date: Date) => "月");
            const revenueAnalysisList: any[] = [];

            const container = tableManager.createProfitCalculationTable(
                "test-profit",
                [],
                [],
                null,
                getDateList,
                getTotalsByDate,
                getRecordsByDate,
                getDayOfWeek,
                revenueAnalysisList
            );

            expect(container).toBeInstanceOf(HTMLDivElement);
            expect(container.id).toBe("profit-calculation-table-test-profit");
            expect(container.textContent).toContain("該当するPL日次データが存在しません。");
        });

        test("データが存在する場合はテーブルを作成", () => {
            const mockDailyData: any[] = [
                {
                    date: { value: "2024-01-01" },
                    inside_unit: { value: "100" },
                    outside_unit: { value: "200" },
                },
            ];

            const mockFilteredRecords: any[] = [
                {
                    date: { value: "2024-01-01" },
                    line_name: { value: "ライン1" },
                    model_name: { value: "モデル1" },
                },
            ];

            const getDateList = jest.fn(() => ["2024-01-01"]);
            const getTotalsByDate = jest.fn(() => ({
                date: "2024-01-01",
                totalActualNumber: 100,
                totalAddedValue: 1000,
                totalCost: 500,
                totalGrossProfit: 500,
                profitRate: 50,
                totalInsideOvertime: 10,
                totalOutsideOvertime: 20,
                totalInsideHolidayOvertime: 0,
                totalOutsideHolidayOvertime: 0,
            }));
            const getRecordsByDate = jest.fn(() => mockDailyData);
            const getDayOfWeek = jest.fn((date: Date) => "月");
            const revenueAnalysisList: any[] = [];

            const container = tableManager.createProfitCalculationTable(
                "test-profit",
                mockDailyData,
                mockFilteredRecords,
                null,
                getDateList,
                getTotalsByDate,
                getRecordsByDate,
                getDayOfWeek,
                revenueAnalysisList
            );

            expect(container).toBeInstanceOf(HTMLDivElement);
            expect(container.id).toBe("profit-calculation-table-test-profit");
            expect(tableManager.hasTable("test-profit")).toBe(true);
        });
    });

    describe("createRevenueAnalysisSummaryTable", () => {
        test("収益分析テーブルを作成", () => {
            const revenueAnalysisList: any[] = [
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

            const container = tableManager.createRevenueAnalysisSummaryTable(
                "test-revenue",
                revenueAnalysisList
            );

            expect(container).toBeInstanceOf(HTMLDivElement);
            expect(container.id).toBe("revenue-analysis-summary-table-test-revenue");
            expect(tableManager.hasTable("test-revenue")).toBe(true);
        });

        test("空のデータでもテーブルを作成", () => {
            const container = tableManager.createRevenueAnalysisSummaryTable(
                "test-revenue-empty",
                []
            );

            expect(container).toBeInstanceOf(HTMLDivElement);
            expect(container.id).toBe("revenue-analysis-summary-table-test-revenue-empty");
            expect(tableManager.hasTable("test-revenue-empty")).toBe(true);
        });
    });

    describe("transformProductionData", () => {
        test("生産データを正しく変換", () => {
            const mockRecords: any[] = [
                {
                    date: { value: "2024-01-01" },
                    line_name: { value: "Line A" },
                    model_name: { value: "Model A" },
                    actual_number: { value: "10" },
                    inside_time: { value: "8" },
                    outside_time: { value: "4" },
                    inside_overtime: { value: "2" },
                    outside_overtime: { value: "1" },
                },
            ];

            const mockMonthlyData: any = {
                inside_unit: { value: "3000" },
                outside_unit: { value: "2500" },
            };

            const productHistoryData: any[] = [];
            const getDayOfWeek = jest.fn((date: Date) => "月");

            const result = (tableManager as any).transformProductionData(
                mockRecords,
                mockMonthlyData,
                productHistoryData,
                getDayOfWeek
            );

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe("renderProductionTable", () => {
        test("生産テーブルを正しくレンダリング", () => {
            const tableData: any[] = [
                [
                    "01/01(月)",
                    "Line A",
                    "Model A",
                    "10",
                    "1000",
                    "8",
                    "24000",
                    "4",
                    "10000",
                    "2",
                    "6000",
                    "1",
                    "2500",
                    "42500",
                    "57500",
                    "57.5%",
                ],
            ];

            const mockRecords: any[] = [
                {
                    date: { value: "2024-01-01" },
                    line_name: { value: "Line A" },
                    model_name: { value: "Model A" },
                },
            ];

            const result = (tableManager as any).renderProductionTable(
                "test-table",
                tableData,
                mockRecords
            );

            expect(result.table).toBeInstanceOf(HTMLTableElement);
            expect(result.container).toBeInstanceOf(HTMLDivElement);
        });
    });

    describe("enhanceProductionTable", () => {
        test("生産テーブルをDataTablesで拡張", (done) => {
            const container = document.createElement("div");
            container.id = "test-container";
            document.body.appendChild(container);

            const table = document.createElement("table");
            table.id = "test-table";
            container.appendChild(table);

            (tableManager as any).registerTable("test-table", "production", {}, []);

            // enhanceProductionTableはsetTimeoutを使用しているため、少し待つ
            (tableManager as any).enhanceProductionTable("test-table");

            setTimeout(() => {
                expect(() => {
                    (tableManager as any).enhanceProductionTable("test-table");
                }).not.toThrow();
                done();
            }, 150);
        });
    });

    describe("transformProfitData", () => {
        test("損益データを正しく変換", () => {
            const getDateList = jest.fn(() => ["2024-01-01"]);
            const getTotalsByDate = jest.fn(() => ({
                date: "2024-01-01",
                totalActualNumber: 100,
                totalAddedValue: 1000,
                totalCost: 500,
                totalGrossProfit: 500,
                profitRate: 50,
                totalInsideOvertime: 10,
                totalOutsideOvertime: 20,
                totalInsideHolidayOvertime: 0,
                totalOutsideHolidayOvertime: 0,
            }));
            const getRecordsByDate = jest.fn(() => [
                {
                    date: { value: "2024-01-01" },
                    direct_personnel: { value: "10" },
                } as any,
            ]);
            const getDayOfWeek = jest.fn((date: Date) => "月");
            const revenueAnalysisList: any[] = [];

            const mockMonthlyData: any = {
                inside_unit: { value: "3000" },
                outside_unit: { value: "2500" },
            };

            const result = (tableManager as any).transformProfitData(
                getDateList,
                getTotalsByDate,
                getRecordsByDate,
                mockMonthlyData,
                getDayOfWeek,
                revenueAnalysisList
            );

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe("renderProfitTable", () => {
        test("損益テーブルを正しくレンダリング", () => {
            const tableData: any[] = [["01/01(月)", 1000, 10, 500, 5, 250, 3, 150]];
            const getDateList = jest.fn(() => ["2024-01-01"]);
            const getTotalsByDate = jest.fn(() => ({
                date: "2024-01-01",
                totalActualNumber: 100,
                totalAddedValue: 1000,
                totalCost: 500,
                totalGrossProfit: 500,
                profitRate: 50,
                totalInsideOvertime: 10,
                totalOutsideOvertime: 20,
                totalInsideHolidayOvertime: 0,
                totalOutsideHolidayOvertime: 0,
            }));

            const result = (tableManager as any).renderProfitTable(
                "test-table",
                tableData,
                getDateList,
                getTotalsByDate
            );

            expect(result.table).toBeInstanceOf(HTMLTableElement);
            expect(result.container).toBeInstanceOf(HTMLDivElement);
        });
    });

    describe("enhanceProfitCalculationTable", () => {
        test("損益計算テーブルをDataTablesで拡張", (done) => {
            const container = document.createElement("div");
            container.id = "test-container";
            document.body.appendChild(container);

            const table = document.createElement("table");
            table.id = "test-table";
            container.appendChild(table);

            (tableManager as any).registerTable("test-table", "profit", {}, []);

            // enhanceProfitCalculationTableはsetTimeoutを使用しているため、少し待つ
            (tableManager as any).enhanceProfitCalculationTable("test-table");

            setTimeout(() => {
                expect(() => {
                    (tableManager as any).enhanceProfitCalculationTable("test-table");
                }).not.toThrow();
                done();
            }, 150);
        });
    });

    describe("transformRevenueData", () => {
        test("収益分析データを正しく変換", () => {
            const revenueAnalysisList: any[] = [
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

            const result = (tableManager as any).transformRevenueData(revenueAnalysisList);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe("renderRevenueTable", () => {
        test("収益分析テーブルを正しくレンダリング", () => {
            const tableData: any[] = [
                ["01/01(月)", 1000, 500, 500, "50.00%", 1000, 500, 500, "50.00%"],
            ];
            const revenueAnalysisList: any[] = [
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

            const result = (tableManager as any).renderRevenueTable(
                "test-table",
                tableData,
                revenueAnalysisList
            );

            expect(result.table).toBeInstanceOf(HTMLTableElement);
            expect(result.container).toBeInstanceOf(HTMLDivElement);
        });
    });

    describe("enhanceRevenueSummaryTable", () => {
        test("収益分析テーブルをDataTablesで拡張", (done) => {
            const container = document.createElement("div");
            container.id = "test-container";
            document.body.appendChild(container);

            const table = document.createElement("table");
            table.id = "test-table";
            container.appendChild(table);

            (tableManager as any).registerTable("test-table", "revenue", {}, []);

            // enhanceRevenueSummaryTableはsetTimeoutを使用しているため、少し待つ
            (tableManager as any).enhanceRevenueSummaryTable("test-table");

            setTimeout(() => {
                expect(() => {
                    (tableManager as any).enhanceRevenueSummaryTable("test-table");
                }).not.toThrow();
                done();
            }, 150);
        });
    });

    describe("onDataTableInitialized", () => {
        test("DataTables初期化完了時に色分けラベルを追加", (done) => {
            const container = document.createElement("div");
            container.id = "test-container";
            document.body.appendChild(container);

            const table = document.createElement("table");
            table.id = "test-table";
            container.appendChild(table);

            (tableManager as any).registerTable("test-table", "production", {}, []);

            // onDataTableInitializedはsetTimeoutを使用しているため、少し待つ
            (tableManager as any).onDataTableInitialized("test-table");

            setTimeout(() => {
                expect(() => {
                    (tableManager as any).onDataTableInitialized("test-table");
                }).not.toThrow();
                done();
            }, 150);
        });
    });

    describe("addCompanyOperatingDaysLabel", () => {
        test("会社営業日ラベルを追加", () => {
            const wrapper = document.createElement("div");
            wrapper.id = "test-table_wrapper";
            const topControls = document.createElement("div");
            topControls.className = "dt-top-controls";
            wrapper.appendChild(topControls);
            document.body.appendChild(wrapper);

            (tableManager as any).registerTable("test-table", "production", {}, []);

            (tableManager as any).addCompanyOperatingDaysLabel("test-table");

            const label = topControls.querySelector(".company-operating-days-label");
            expect(label).toBeTruthy();
        });
    });
});
