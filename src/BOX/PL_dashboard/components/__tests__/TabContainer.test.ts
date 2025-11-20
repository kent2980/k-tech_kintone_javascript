/**
 * TabContainerのユニットテスト
 */

import { TabContainer } from "../TabContainer";

describe("TabContainer", () => {
    let tabContainer: TabContainer;

    beforeEach(() => {
        tabContainer = new TabContainer();
        document.body.innerHTML = "";
    });

    describe("constructor", () => {
        test("タブコンテナを正しく作成", () => {
            const element = tabContainer.getElement();

            expect(element).toBeInstanceOf(HTMLDivElement);
            expect(element.id).toBe("tab-container");
            expect(element.querySelector("#tab-buttons")).toBeTruthy();
            expect(element.querySelector("#tab-contents")).toBeTruthy();
        });
    });

    describe("addTab", () => {
        test("タブを追加", () => {
            const content = document.createElement("div");
            content.textContent = "Test Content";

            const button = tabContainer.addTab("tab-1", "タブ1", content, true);

            expect(button).toBeInstanceOf(HTMLButtonElement);
            expect(button.textContent).toBe("タブ1");
            expect(button.dataset.tabId).toBe("tab-1");
        });

        test("アクティブなタブを追加", () => {
            const content = document.createElement("div");
            const button = tabContainer.addTab("tab-1", "タブ1", content, true);

            expect(tabContainer.getActiveTabId()).toBe("tab-1");
            expect(button.classList.contains("active")).toBe(true);
        });

        test("非アクティブなタブを追加", () => {
            const content = document.createElement("div");
            const button = tabContainer.addTab("tab-1", "タブ1", content, false);

            expect(button.classList.contains("active")).toBe(false);
        });
    });

    describe("switchTab", () => {
        test("タブを切り替え", () => {
            const content1 = document.createElement("div");
            const content2 = document.createElement("div");

            tabContainer.addTab("tab-1", "タブ1", content1, true);
            tabContainer.addTab("tab-2", "タブ2", content2, false);

            tabContainer.switchTab("tab-2");

            expect(tabContainer.getActiveTabId()).toBe("tab-2");
        });

        test("存在しないタブを切り替えてもエラーが発生しない", () => {
            expect(() => {
                tabContainer.switchTab("non-existent-tab");
            }).not.toThrow();
        });
    });

    describe("getActiveTabId", () => {
        test("アクティブなタブIDを取得", () => {
            const content = document.createElement("div");
            tabContainer.addTab("tab-1", "タブ1", content, true);

            expect(tabContainer.getActiveTabId()).toBe("tab-1");
        });

        test("タブが存在しない場合はnullを返す", () => {
            expect(tabContainer.getActiveTabId()).toBeNull();
        });
    });

    describe("getElement", () => {
        test("タブコンテナ要素を取得", () => {
            const element = tabContainer.getElement();

            expect(element).toBeInstanceOf(HTMLDivElement);
            expect(element.id).toBe("tab-container");
        });
    });

    describe("getContainers", () => {
        test("タブコンテナの結果を取得", () => {
            const containers = tabContainer.getContainers();

            expect(containers.tabContainer).toBeInstanceOf(HTMLDivElement);
            expect(containers.tabButtonsContainer).toBeInstanceOf(HTMLDivElement);
            expect(containers.tabContentsContainer).toBeInstanceOf(HTMLDivElement);
        });
    });

    describe("removeTab", () => {
        test("タブを削除", () => {
            const content = document.createElement("div");
            tabContainer.addTab("tab-1", "タブ1", content, true);

            tabContainer.removeTab("tab-1");

            const element = tabContainer.getElement();
            expect(element.querySelector('[data-tab-id="tab-1"]')).toBeNull();
        });

        test("アクティブなタブを削除するとactiveTabIdがnullになる", () => {
            const content = document.createElement("div");
            tabContainer.addTab("tab-1", "タブ1", content, true);

            tabContainer.removeTab("tab-1");

            expect(tabContainer.getActiveTabId()).toBeNull();
        });
    });

    describe("clearTabs", () => {
        test("すべてのタブをクリア", () => {
            const content1 = document.createElement("div");
            const content2 = document.createElement("div");

            tabContainer.addTab("tab-1", "タブ1", content1, true);
            tabContainer.addTab("tab-2", "タブ2", content2, false);

            tabContainer.clearTabs();

            expect(tabContainer.getActiveTabId()).toBeNull();
            const element = tabContainer.getElement();
            expect(element.querySelector("#tab-buttons")?.children.length).toBe(0);
            expect(element.querySelector("#tab-contents")?.children.length).toBe(0);
        });
    });
});
