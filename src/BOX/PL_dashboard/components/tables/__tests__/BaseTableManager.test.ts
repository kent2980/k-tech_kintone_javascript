/**
 * BaseTableManagerのユニットテスト
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

import { BaseTableManager } from "../BaseTableManager";
import type { TableRowData } from "../../../types/table";

// テスト用の具象クラス
class TestTableManager extends BaseTableManager {
    public createTable(tableId: string): HTMLTableElement {
        return super.createTable(tableId);
    }

    public createTableCell(content: string | number, isNumeric: boolean = false): HTMLTableCellElement {
        return super.createTableCell(content, isNumeric);
    }
}

describe("BaseTableManager", () => {
    let tableManager: TestTableManager;

    beforeEach(() => {
        tableManager = new TestTableManager();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        tableManager.destroyAllTables();
    });

    describe("createTable", () => {
        test("テーブル要素を正しく作成", () => {
            const table = tableManager.createTable("test-table");

            expect(table).toBeInstanceOf(HTMLTableElement);
            expect(table.id).toBe("test-table");
        });
    });

    describe("createTableCell", () => {
        test("テーブルセルを正しく作成", () => {
            const cell = tableManager.createTableCell("Test Content");

            expect(cell).toBeInstanceOf(HTMLTableCellElement);
            expect(cell.textContent).toBe("Test Content");
        });

        test("数値セルの場合は右寄せクラスを設定", () => {
            const cell = tableManager.createTableCell(123, true);

            expect(cell.className).toContain("pl-table-td-numeric");
        });
    });

    describe("hasTable", () => {
        test("テーブルが存在しない場合はfalseを返す", () => {
            expect(tableManager.hasTable("non-existent-table")).toBe(false);
        });
    });

    describe("destroyTable", () => {
        test("存在しないテーブルを破棄してもエラーが発生しない", () => {
            expect(() => {
                tableManager.destroyTable("non-existent-table");
            }).not.toThrow();
        });
    });

    describe("destroyAllTables", () => {
        test("すべてのテーブルを破棄", () => {
            expect(() => {
                tableManager.destroyAllTables();
            }).not.toThrow();
        });
    });
});

