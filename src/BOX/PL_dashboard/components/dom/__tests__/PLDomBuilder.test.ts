/**
 * PLDomBuilderのユニットテスト
 */

import { PLDomBuilder } from "../PLDomBuilder";

describe("PLDomBuilder", () => {
    let domBuilder: PLDomBuilder;

    beforeEach(() => {
        domBuilder = new PLDomBuilder();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        domBuilder.removeAllElements();
    });

    describe("createTabButton", () => {
        test("タブボタンを正しく作成", () => {
            const button = domBuilder.createTabButton("test-tab", "テストタブ");

            expect(button).toBeInstanceOf(HTMLButtonElement);
            expect(button.id).toBe("test-tab-button");
            expect(button.textContent).toBe("テストタブ");
        });

        test("アクティブなタブボタンにはactiveクラスを設定", () => {
            const button = domBuilder.createTabButton("test-tab", "テストタブ", true);

            // アクティブなボタンは背景色が変わる（activeクラスではなくスタイルで制御）
            expect(button.style.backgroundColor).toBe("rgb(52, 152, 219)");
        });
    });

    describe("createTabContent", () => {
        test("文字列コンテンツでタブコンテンツを作成", () => {
            const content = domBuilder.createTabContent("test-tab", "テストコンテンツ");

            expect(content).toBeInstanceOf(HTMLDivElement);
            expect(content.id).toBe("test-tab-content");
            expect(content.innerHTML).toContain("テストコンテンツ");
        });

        test("HTMLElementコンテンツでタブコンテンツを作成", () => {
            const element = document.createElement("div");
            element.textContent = "要素コンテンツ";

            const content = domBuilder.createTabContent("test-tab", element);

            expect(content).toBeInstanceOf(HTMLDivElement);
            expect(content.contains(element)).toBe(true);
        });

        test("アクティブなタブコンテンツは表示される", () => {
            const content = domBuilder.createTabContent("test-tab", "テスト", true);

            expect(content.style.display).toBe("block");
        });
    });

    describe("createNoDataMessage", () => {
        test("データなしメッセージを正しく作成", () => {
            const message = domBuilder.createNoDataMessage("データがありません");

            expect(message).toBeInstanceOf(HTMLDivElement);
            expect(message.textContent).toBe("データがありません");
        });
    });

    describe("createScrollableContainer", () => {
        test("スクロール可能なコンテナを正しく作成", () => {
            const container = domBuilder.createScrollableContainer("scroll-container");

            expect(container).toBeInstanceOf(HTMLDivElement);
            expect(container.id).toBe("scroll-container");
            expect(container.style.overflowY).toBe("auto");
        });

        test("カスタム最大高さを設定", () => {
            const container = domBuilder.createScrollableContainer("scroll-container", "800px");

            expect(container.style.maxHeight).toBe("800px");
        });
    });

    describe("getElementInfo", () => {
        test("要素情報を正しく取得", () => {
            const button = domBuilder.createTabButton("test-tab", "テスト");

            const info = domBuilder.getElementInfo("test-tab-button");

            expect(info).toBeDefined();
            expect(info?.id).toBe("test-tab-button");
        });

        test("存在しない要素の場合はnullを返す", () => {
            const info = domBuilder.getElementInfo("non-existent");

            expect(info).toBeNull();
        });
    });
});

