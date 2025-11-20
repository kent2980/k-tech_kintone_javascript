/**
 * BaseDomBuilderのユニットテスト
 */

// テスト用の具象クラス
import { BaseDomBuilder } from "../BaseDomBuilder";

class TestDomBuilder extends BaseDomBuilder {
    public registerElement(id: string, element: HTMLElement): void {
        super.registerElement(id, element);
    }
}

describe("BaseDomBuilder", () => {
    let domBuilder: TestDomBuilder;

    beforeEach(() => {
        domBuilder = new TestDomBuilder();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        domBuilder.removeAllElements();
    });

    describe("registerElement", () => {
        test("要素を登録", () => {
            const div = document.createElement("div");
            div.id = "test-element";
            domBuilder.registerElement("test-element", div);

            expect(domBuilder.hasElement("test-element")).toBe(true);
        });
    });

    describe("getElementInfo", () => {
        test("登録された要素情報を取得", () => {
            const div = document.createElement("div");
            div.id = "test-element";
            domBuilder.registerElement("test-element", div);

            const info = domBuilder.getElementInfo("test-element");

            expect(info).toBeTruthy();
            expect(info?.id).toBe("test-element");
            expect(info?.element).toBe(div);
        });

        test("存在しない要素の場合はnullを返す", () => {
            const info = domBuilder.getElementInfo("non-existent");

            expect(info).toBeNull();
        });
    });

    describe("getElement", () => {
        test("登録された要素を取得", () => {
            const div = document.createElement("div");
            div.id = "test-element";
            domBuilder.registerElement("test-element", div);

            const element = domBuilder.getElement("test-element");

            expect(element).toBe(div);
        });

        test("存在しない要素の場合はnullを返す", () => {
            const element = domBuilder.getElement("non-existent");

            expect(element).toBeNull();
        });
    });

    describe("getAllElementIds", () => {
        test("すべての要素IDを取得", () => {
            const div1 = document.createElement("div");
            const div2 = document.createElement("div");

            domBuilder.registerElement("element-1", div1);
            domBuilder.registerElement("element-2", div2);

            const ids = domBuilder.getAllElementIds();

            expect(ids).toContain("element-1");
            expect(ids).toContain("element-2");
        });
    });

    describe("hasElement", () => {
        test("要素が存在する場合はtrueを返す", () => {
            const div = document.createElement("div");
            domBuilder.registerElement("test-element", div);

            expect(domBuilder.hasElement("test-element")).toBe(true);
        });

        test("要素が存在しない場合はfalseを返す", () => {
            expect(domBuilder.hasElement("non-existent")).toBe(false);
        });
    });

    describe("removeElement", () => {
        test("要素を削除", () => {
            const div = document.createElement("div");
            document.body.appendChild(div);
            domBuilder.registerElement("test-element", div);

            domBuilder.removeElement("test-element");

            expect(domBuilder.hasElement("test-element")).toBe(false);
            expect(document.body.contains(div)).toBe(false);
        });

        test("親要素がない要素を削除してもエラーが発生しない", () => {
            const div = document.createElement("div");
            domBuilder.registerElement("test-element", div);

            expect(() => {
                domBuilder.removeElement("test-element");
            }).not.toThrow();
        });
    });

    describe("removeAllElements", () => {
        test("すべての要素を削除", () => {
            const div1 = document.createElement("div");
            const div2 = document.createElement("div");

            domBuilder.registerElement("element-1", div1);
            domBuilder.registerElement("element-2", div2);

            domBuilder.removeAllElements();

            expect(domBuilder.getAllElementIds()).toHaveLength(0);
        });
    });
});
