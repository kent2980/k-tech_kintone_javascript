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

        test("平日の場合はnullを返す", () => {
            const holidayData: any[] = [];

            const color = (tableManager as any).getDateBackgroundColor("2024-01-02", holidayData);

            expect(color).toBeNull();
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
});

