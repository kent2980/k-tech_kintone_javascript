import { DomUtil } from "../DomUtil";

describe("DomUtil", () => {
    let selectElement: HTMLSelectElement;
    let container: HTMLDivElement;

    beforeEach(() => {
        // テスト用のDOM要素を準備
        selectElement = document.createElement("select");
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        // テスト後のクリーンアップ
        document.body.innerHTML = "";
    });

    describe("addOption", () => {
        it("should add option to select element", () => {
            DomUtil.addOption(selectElement, "value1", "Text 1");

            expect(selectElement.children.length).toBe(1);
            const option = selectElement.children[0] as HTMLOptionElement;
            expect(option.value).toBe("value1");
            expect(option.textContent).toBe("Text 1");
        });

        it("should handle number values", () => {
            DomUtil.addOption(selectElement, 2024, "Year 2024");

            const option = selectElement.children[0] as HTMLOptionElement;
            expect(option.value).toBe("2024");
            expect(option.textContent).toBe("Year 2024");
        });

        it("should add multiple options", () => {
            DomUtil.addOption(selectElement, "value1", "Text 1");
            DomUtil.addOption(selectElement, "value2", "Text 2");

            expect(selectElement.children.length).toBe(2);
            expect(selectElement.children[0].textContent).toBe("Text 1");
            expect(selectElement.children[1].textContent).toBe("Text 2");
        });
    });

    describe("createLabel", () => {
        it("should create label with basic properties", () => {
            const label = DomUtil.createLabel("Test Label", "test-id");

            expect(label.textContent).toBe("Test Label");
            expect(label.getAttribute("for")).toBe("test-id");
            expect(label.style.marginLeft).toBe("");
        });

        it("should create label with margin", () => {
            const label = DomUtil.createLabel("Test Label", "test-id", "20px");

            expect(label.textContent).toBe("Test Label");
            expect(label.getAttribute("for")).toBe("test-id");
            expect(label.style.marginLeft).toBe("20px");
        });

        it("should handle null margin", () => {
            const label = DomUtil.createLabel("Test Label", "test-id", null);

            expect(label.style.marginLeft).toBe("");
        });
    });

    describe("createTableCell", () => {
        it("should create basic td cell", () => {
            const cell = DomUtil.createTableCell("Test Content");

            expect(cell.tagName).toBe("TD");
            expect(cell.textContent).toBe("Test Content");
            expect(cell.style.border).toBe("1px solid rgb(204, 204, 204)");
            expect(cell.style.padding).toBe("6px");
            expect(cell.style.textAlign).toBe("center");
        });

        it("should create th cell", () => {
            const cell = DomUtil.createTableCell("Header", { tag: "th" });

            expect(cell.tagName).toBe("TH");
            expect(cell.textContent).toBe("Header");
            expect(cell.style.padding).toBe("8px");
        });

        it("should handle number content", () => {
            const cell = DomUtil.createTableCell(42);

            expect(cell.textContent).toBe("42");
        });

        it("should apply custom className", () => {
            const cell = DomUtil.createTableCell("Test", { className: "custom-class" });

            expect(cell.className).toBe("custom-class");
        });

        it("should apply custom styles", () => {
            const cell = DomUtil.createTableCell("Test", {
                styles: { color: "red", fontSize: "14px" },
            });

            expect(cell.style.color).toBe("red");
            expect(cell.style.fontSize).toBe("14px");
        });

        it("should apply sticky styles", () => {
            const cell = DomUtil.createTableCell("Sticky", {
                isSticky: true,
                stickyLeft: "100px",
            });

            expect(cell.style.position).toBe("sticky");
            expect(cell.style.left).toBe("100px");
            expect(cell.style.backgroundColor).toBe("rgb(255, 255, 255)");
            expect(cell.style.zIndex).toBe("9");
        });

        it("should apply sticky styles for th", () => {
            const cell = DomUtil.createTableCell("Sticky Header", {
                tag: "th",
                isSticky: true,
            });

            expect(cell.style.backgroundColor).toBe("rgb(245, 245, 245)");
            expect(cell.style.zIndex).toBe("11");
        });
    });

    describe("createTableRow", () => {
        it("should create basic table row", () => {
            const row = DomUtil.createTableRow();

            expect(row.tagName).toBe("TR");
            expect(row.className).toBe("");
        });

        it("should create row with className", () => {
            const row = DomUtil.createTableRow("row-class");

            expect(row.className).toBe("row-class");
        });
    });

    describe("applyStyles", () => {
        it("should apply multiple styles to element", () => {
            const div = document.createElement("div");
            const styles = {
                color: "red",
                fontSize: "16px",
                backgroundColor: "blue",
            };

            DomUtil.applyStyles(div, styles);

            expect(div.style.color).toBe("red");
            expect(div.style.fontSize).toBe("16px");
            expect(div.style.backgroundColor).toBe("blue");
        });

        it("should handle empty styles object", () => {
            const div = document.createElement("div");

            DomUtil.applyStyles(div, {});

            expect(div.style.length).toBe(0);
        });
    });

    describe("safeRemove", () => {
        it("should remove element from parent", () => {
            const child = document.createElement("span");
            container.appendChild(child);

            expect(container.children.length).toBe(1);

            DomUtil.safeRemove(child);

            expect(container.children.length).toBe(0);
        });

        it("should handle null element gracefully", () => {
            expect(() => {
                DomUtil.safeRemove(null);
            }).not.toThrow();
        });

        it("should handle element without parent", () => {
            const orphan = document.createElement("div");

            expect(() => {
                DomUtil.safeRemove(orphan);
            }).not.toThrow();
        });
    });

    describe("getElementById", () => {
        it("should get element by id", () => {
            const testElement = document.createElement("div");
            testElement.id = "test-element";
            container.appendChild(testElement);

            const result = DomUtil.getElementById("test-element");

            expect(result).toBe(testElement);
        });

        it("should return null for non-existent id", () => {
            const result = DomUtil.getElementById("non-existent");

            expect(result).toBeNull();
        });

        it("should check element type", () => {
            const testButton = document.createElement("button");
            testButton.id = "test-button";
            container.appendChild(testButton);

            const result = DomUtil.getElementById("test-button", HTMLButtonElement);

            expect(result).toBe(testButton);
        });

        it("should return null for wrong element type", () => {
            const testDiv = document.createElement("div");
            testDiv.id = "test-div";
            container.appendChild(testDiv);

            const result = DomUtil.getElementById("test-div", HTMLButtonElement);

            expect(result).toBeNull();
        });
    });
});
