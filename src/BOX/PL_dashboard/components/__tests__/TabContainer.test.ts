/**
 * TabContainer test suite - Simplified
 */

import { TabContainer } from "../TabContainer";

describe("TabContainer", () => {
    let tabContainer: TabContainer;

    beforeEach(() => {
        // Mock document.createElement
        const originalCreateElement = document.createElement.bind(document);
        document.createElement = jest.fn().mockImplementation((tagName: string) => {
            const element = originalCreateElement(tagName);

            if (tagName === "div") {
                element.appendChild = jest.fn().mockImplementation((child) => child);
                element.querySelector = jest.fn();
                element.querySelectorAll = jest.fn().mockReturnValue([]);
                element.removeChild = jest.fn();
            }
            if (tagName === "button") {
                element.addEventListener = jest.fn();
                element.setAttribute = jest.fn();
                element.getAttribute = jest.fn();
            }

            return element;
        });

        tabContainer = new TabContainer();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("constructor", () => {
        it("should create TabContainer instance", () => {
            expect(tabContainer).toBeInstanceOf(TabContainer);
        });

        it("should create main container elements", () => {
            expect(document.createElement).toHaveBeenCalledWith("div");

            // Verify at least 3 div elements were created (main, buttons, contents)
            const mockCalls = (document.createElement as jest.Mock).mock.calls;
            const divCalls = mockCalls.filter((call) => call[0] === "div");
            expect(divCalls.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe("addTab", () => {
        it("should add tab with content", () => {
            const mockContent = document.createElement("div");
            mockContent.innerHTML = "Test content";

            const result = tabContainer.addTab("tab1", "Tab 1", mockContent);

            expect(result).toBeInstanceOf(HTMLElement);
        });

        it("should add multiple tabs", () => {
            const content1 = document.createElement("div");
            const content2 = document.createElement("div");

            const result1 = tabContainer.addTab("tab1", "Tab 1", content1);
            const result2 = tabContainer.addTab("tab2", "Tab 2", content2);

            expect(result1).toBeInstanceOf(HTMLElement);
            expect(result2).toBeInstanceOf(HTMLElement);
        });

        it("should set first tab as active", () => {
            const mockContent = document.createElement("div");

            tabContainer.addTab("tab1", "Tab 1", mockContent, true);

            expect(tabContainer.getActiveTabId()).toBe("tab1");
        });
    });

    describe("switchTab", () => {
        beforeEach(() => {
            const content1 = document.createElement("div");
            const content2 = document.createElement("div");

            tabContainer.addTab("tab1", "Tab 1", content1, true);
            tabContainer.addTab("tab2", "Tab 2", content2);
        });

        it("should switch to existing tab", () => {
            tabContainer.switchTab("tab2");

            expect(tabContainer.getActiveTabId()).toBe("tab2");
        });

        it("should handle switching to same tab", () => {
            tabContainer.switchTab("tab1");

            expect(tabContainer.getActiveTabId()).toBe("tab1");
        });
    });

    describe("removeTab", () => {
        beforeEach(() => {
            const content1 = document.createElement("div");
            const content2 = document.createElement("div");

            tabContainer.addTab("tab1", "Tab 1", content1, true);
            tabContainer.addTab("tab2", "Tab 2", content2);
        });

        it("should remove existing tab", () => {
            expect(() => tabContainer.removeTab("tab2")).not.toThrow();
        });

        it("should handle removing active tab", () => {
            tabContainer.removeTab("tab1");

            expect(tabContainer.getActiveTabId()).toBe(null);
        });
    });

    describe("getActiveTabId", () => {
        it("should return null when no tabs are active", () => {
            const activeTabId = tabContainer.getActiveTabId();

            expect(activeTabId).toBe(null);
        });

        it("should return active tab id", () => {
            const mockContent = document.createElement("div");
            tabContainer.addTab("tab1", "Tab 1", mockContent, true);

            const activeTabId = tabContainer.getActiveTabId();

            expect(activeTabId).toBe("tab1");
        });
    });

    describe("getElement", () => {
        it("should return main container element", () => {
            const element = tabContainer.getElement();

            expect(element).toBeInstanceOf(HTMLElement);
            expect(element.tagName).toBe("DIV");
        });
    });

    describe("getContainers", () => {
        it("should return container objects", () => {
            const containers = tabContainer.getContainers();

            expect(containers).toHaveProperty("tabContainer");
            expect(containers).toHaveProperty("tabButtonsContainer");
            expect(containers).toHaveProperty("tabContentsContainer");
            expect(containers.tabContainer).toBeInstanceOf(HTMLElement);
        });
    });

    describe("clearTabs", () => {
        it("should clear all tabs", () => {
            const content1 = document.createElement("div");
            const content2 = document.createElement("div");

            tabContainer.addTab("tab1", "Tab 1", content1);
            tabContainer.addTab("tab2", "Tab 2", content2);

            tabContainer.clearTabs();

            expect(tabContainer.getActiveTabId()).toBe(null);
        });

        it("should handle clearing when no tabs exist", () => {
            expect(() => tabContainer.clearTabs()).not.toThrow();
        });
    });

    describe("Error handling", () => {
        it("should handle null content parameter", () => {
            expect(() => tabContainer.addTab("tab1", "Tab 1", null as any)).not.toThrow();
        });

        it("should handle empty tab parameters", () => {
            const mockContent = document.createElement("div");

            expect(() => tabContainer.addTab("", "Tab 1", mockContent)).not.toThrow();
            expect(() => tabContainer.addTab("tab1", "", mockContent)).not.toThrow();
        });

        it("should handle invalid tab operations", () => {
            expect(() => tabContainer.switchTab("nonexistent")).not.toThrow();
            expect(() => tabContainer.removeTab("nonexistent")).not.toThrow();
        });
    });

    describe("Integration", () => {
        it("should create complete tab interface", () => {
            const content1 = document.createElement("div");
            const content2 = document.createElement("div");
            const content3 = document.createElement("div");

            // Add multiple tabs
            tabContainer.addTab("overview", "概要", content1, true);
            tabContainer.addTab("details", "詳細", content2);
            tabContainer.addTab("settings", "設定", content3);

            // Verify active tab
            expect(tabContainer.getActiveTabId()).toBe("overview");

            // Switch tabs
            tabContainer.switchTab("details");
            expect(tabContainer.getActiveTabId()).toBe("details");

            // Remove tab
            tabContainer.removeTab("settings");
            expect(tabContainer.getActiveTabId()).toBe("details");

            // Clear all tabs
            tabContainer.clearTabs();
            expect(tabContainer.getActiveTabId()).toBe(null);
        });

        it("should maintain proper container structure", () => {
            const containers = tabContainer.getContainers();
            const element = tabContainer.getElement();

            expect(element).toBe(containers.tabContainer);
            expect(containers.tabButtonsContainer).toBeInstanceOf(HTMLElement);
            expect(containers.tabContentsContainer).toBeInstanceOf(HTMLElement);
        });
    });
});
