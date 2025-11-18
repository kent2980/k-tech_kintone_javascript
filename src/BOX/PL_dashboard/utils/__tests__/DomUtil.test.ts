/**
 * DomUtilのユニットテスト
 */

import { DomUtil } from "../DomUtil";

describe("DomUtil", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    describe("createElement", () => {
        test("要素を作成", () => {
            const div = DomUtil.createElement("div");

            expect(div).toBeInstanceOf(HTMLDivElement);
        });

        test("クラス名を指定して要素を作成", () => {
            const div = DomUtil.createElement("div", "test-class");

            expect(div.className).toBe("test-class");
        });

        test("異なるタグ名で要素を作成", () => {
            const span = DomUtil.createElement("span");
            const button = DomUtil.createElement("button");

            expect(span).toBeInstanceOf(HTMLSpanElement);
            expect(button).toBeInstanceOf(HTMLButtonElement);
        });
    });

    describe("addOption", () => {
        test("セレクトボックスにオプションを追加", () => {
            const select = document.createElement("select");
            DomUtil.addOption(select, "value1", "Option 1");

            expect(select.options.length).toBe(1);
            expect(select.options[0].value).toBe("value1");
            expect(select.options[0].textContent).toBe("Option 1");
        });

        test("数値の値をオプションに追加", () => {
            const select = document.createElement("select");
            DomUtil.addOption(select, 123, "Number Option");

            expect(select.options[0].value).toBe("123");
        });
    });

    describe("createLabel", () => {
        test("ラベル要素を作成", () => {
            const label = DomUtil.createLabel("Test Label", "test-id");

            expect(label).toBeInstanceOf(HTMLLabelElement);
            expect(label.textContent).toBe("Test Label");
            expect(label.getAttribute("for")).toBe("test-id");
        });

        test("マージンを指定してラベルを作成", () => {
            const label = DomUtil.createLabel("Test Label", "test-id", "20px");

            expect(label.style.marginLeft).toBe("20px");
            expect(label.className).toContain("with-margin");
        });

        test("マージンなしでラベルを作成", () => {
            const label = DomUtil.createLabel("Test Label", "test-id", null);

            expect(label.style.marginLeft).toBe("");
        });
    });

    describe("createTableCell", () => {
        test("デフォルトでtdセルを作成", () => {
            const cell = DomUtil.createTableCell("Test Content");

            expect(cell).toBeInstanceOf(HTMLTableCellElement);
            expect(cell.tagName).toBe("TD");
            expect(cell.textContent).toBe("Test Content");
        });

        test("thセルを作成", () => {
            const cell = DomUtil.createTableCell("Header", { tag: "th" });

            expect(cell.tagName).toBe("TH");
        });

        test("クラス名を指定してセルを作成", () => {
            const cell = DomUtil.createTableCell("Test", { className: "test-class" });

            expect(cell.className).toBe("test-class");
        });

        test("スタイルを指定してセルを作成", () => {
            const cell = DomUtil.createTableCell("Test", { styles: { color: "red" } });

            expect(cell.style.color).toBe("red");
        });

        test("Stickyセルを作成", () => {
            const cell = DomUtil.createTableCell("Test", { isSticky: true, stickyLeft: "10px" });

            expect(cell.style.position).toBe("sticky");
            expect(cell.style.left).toBe("10px");
        });

        test("数値のコンテンツでセルを作成", () => {
            const cell = DomUtil.createTableCell(123);

            expect(cell.textContent).toBe("123");
        });
    });

    describe("createTableRow", () => {
        test("テーブル行を作成", () => {
            const row = DomUtil.createTableRow();

            expect(row).toBeInstanceOf(HTMLTableRowElement);
        });

        test("クラス名を指定してテーブル行を作成", () => {
            const row = DomUtil.createTableRow("test-class");

            expect(row.className).toBe("test-class");
        });
    });

    describe("applyStyles", () => {
        test("要素にスタイルを適用", () => {
            const div = document.createElement("div");
            DomUtil.applyStyles(div, { color: "red", fontSize: "16px" });

            expect(div.style.color).toBe("red");
            expect(div.style.fontSize).toBe("16px");
        });
    });

    describe("safeRemove", () => {
        test("要素を安全に削除", () => {
            const div = document.createElement("div");
            document.body.appendChild(div);

            DomUtil.safeRemove(div);

            expect(document.body.contains(div)).toBe(false);
        });

        test("nullの場合は何もしない", () => {
            expect(() => {
                DomUtil.safeRemove(null);
            }).not.toThrow();
        });

        test("親要素がない場合は何もしない", () => {
            const div = document.createElement("div");

            expect(() => {
                DomUtil.safeRemove(div);
            }).not.toThrow();
        });
    });

    describe("getElementById", () => {
        test("要素を取得", () => {
            const div = document.createElement("div");
            div.id = "test-element";
            document.body.appendChild(div);

            const element = DomUtil.getElementById("test-element");

            expect(element).toBeInstanceOf(HTMLDivElement);
            expect(element?.id).toBe("test-element");

            document.body.removeChild(div);
        });

        test("存在しない要素の場合はnullを返す", () => {
            const element = DomUtil.getElementById("non-existent");

            expect(element).toBeNull();
        });

        test("型を指定して要素を取得", () => {
            const div = document.createElement("div");
            div.id = "test-div";
            document.body.appendChild(div);

            const element = DomUtil.getElementById("test-div", HTMLDivElement);

            expect(element).toBeInstanceOf(HTMLDivElement);

            document.body.removeChild(div);
        });

        test("型が一致しない場合はnullを返す", () => {
            const div = document.createElement("div");
            div.id = "test-div";
            document.body.appendChild(div);

            const element = DomUtil.getElementById("test-div", HTMLButtonElement);

            expect(element).toBeNull();

            document.body.removeChild(div);
        });
    });
});
