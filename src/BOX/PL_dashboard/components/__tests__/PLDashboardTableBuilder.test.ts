// 事前に重い依存をモックしてからクラスを読み込みます
jest.mock("jquery", () => {
    const fn: any = jest.fn(() => ({ length: 0 }));
    fn.fn = {};
    fn.fn.DataTable = jest.fn(() => ({
        clear: jest.fn(),
        rows: { add: jest.fn() },
        draw: jest.fn(),
    }));
    return fn;
});

// datatables 系はテストでは実際に利用しないため空モジュールとして扱う
jest.mock("datatables.net", () => ({}));
jest.mock("datatables.net-buttons", () => ({}));
jest.mock("datatables.net-buttons-dt", () => ({}));
jest.mock("datatables.net-dt/css/dataTables.dataTables.min.css", () => ({}));
jest.mock("datatables.net-buttons/js/buttons.html5.min.js", () => ({}));
jest.mock("datatables.net-buttons/js/buttons.print.min.js", () => ({}));

import { PLDashboardTableBuilder } from "../PLDashboardTableBuilder";

describe("PLDashboardTableBuilder (軽量ユニットテスト)", () => {
    test("createTable uses instance tableId when id omitted", () => {
        const builder = new PLDashboardTableBuilder("test-table-id");
        // private メソッドを any キャストで呼び出す（ユニットテスト用）
        const table = (builder as any).createTable();
        expect(table).toBeDefined();
        expect(table.id).toBe("test-table-id");
        expect(table.className).toMatch(/pl-table-base/);
    });

    test("static getDateBackgroundColor returns correct color for holiday types", () => {
        const date = "2025-01-01";
        const holidays = [{ date: { value: date }, holiday_type: { value: "法定休日" } }];
        const color = PLDashboardTableBuilder.getDateBackgroundColor(date, holidays as any);
        expect(color).toBe("#e6f3ff");

        const holidays2 = [{ date: { value: date }, holiday_type: { value: "所定休日" } }];
        expect(PLDashboardTableBuilder.getDateBackgroundColor(date, holidays2 as any)).toBe(
            "#ffe6e6"
        );

        const holidays3 = [{ date: { value: date }, holiday_type: { value: "一斉有給" } }];
        expect(PLDashboardTableBuilder.getDateBackgroundColor(date, holidays3 as any)).toBe(
            "#fffacd"
        );
    });

    test("createColorLegend returns legend element with expected items", () => {
        const builder = new PLDashboardTableBuilder("legend-table");
        const legend = (builder as any).createColorLegend();
        expect(legend).toBeInstanceOf(HTMLElement);
        const items = legend.querySelectorAll(".color-legend-item");
        expect(items.length).toBeGreaterThanOrEqual(3);
        expect(legend.textContent).toMatch(/法定休日/);
        expect(legend.textContent).toMatch(/所定休日/);
        expect(legend.textContent).toMatch(/一斉有給/);
    });
});
