/**
 * FilterContainerのユニットテスト
 */

import { FilterContainer } from "../FilterContainer";

describe("FilterContainer", () => {
    let filterContainer: FilterContainer;

    beforeEach(() => {
        filterContainer = new FilterContainer();
        document.body.innerHTML = "";
    });

    describe("constructor", () => {
        test("フィルターコンテナを正しく作成", () => {
            const element = filterContainer.getElement();

            expect(element).toBeInstanceOf(HTMLDivElement);
            expect(element.querySelector("#year-select")).toBeTruthy();
            expect(element.querySelector("#month-select")).toBeTruthy();
        });
    });

    describe("getSelectedYear", () => {
        test("選択された年を取得", () => {
            const year = filterContainer.getSelectedYear();
            expect(year).toBeTruthy();
            expect(typeof year).toBe("string");
        });
    });

    describe("getSelectedMonth", () => {
        test("選択された月を取得", () => {
            const month = filterContainer.getSelectedMonth();
            expect(month).toBeTruthy();
            expect(typeof month).toBe("string");
        });
    });

    describe("setYear", () => {
        test("年を設定", () => {
            filterContainer.setYear("2024");
            expect(filterContainer.getSelectedYear()).toBe("2024");
        });
    });

    describe("setMonth", () => {
        test("月を設定", () => {
            filterContainer.setMonth("1");
            expect(filterContainer.getSelectedMonth()).toBe("1");
        });
    });

    describe("onYearChange", () => {
        test("年の変更イベントを設定", () => {
            const callback = jest.fn();
            filterContainer.onYearChange(callback);

            filterContainer.setYear("2023");

            // changeイベントを発火
            const yearSelect = filterContainer
                .getElement()
                .querySelector("#year-select") as HTMLSelectElement;
            yearSelect.dispatchEvent(new Event("change"));

            expect(callback).toHaveBeenCalledWith("2023");
        });
    });

    describe("onMonthChange", () => {
        test("月の変更イベントを設定", () => {
            const callback = jest.fn();
            filterContainer.onMonthChange(callback);

            filterContainer.setMonth("12");

            // changeイベントを発火
            const monthSelect = filterContainer
                .getElement()
                .querySelector("#month-select") as HTMLSelectElement;
            monthSelect.dispatchEvent(new Event("change"));

            expect(callback).toHaveBeenCalledWith("12");
        });
    });

    describe("onFilterChange", () => {
        test("フィルター変更イベントを設定", () => {
            const callback = jest.fn();
            filterContainer.onFilterChange(callback);

            filterContainer.setYear("2024");
            filterContainer.setMonth("06");

            // changeイベントを発火
            const yearSelect = filterContainer
                .getElement()
                .querySelector("#year-select") as HTMLSelectElement;
            yearSelect.dispatchEvent(new Event("change"));

            expect(callback).toHaveBeenCalledWith("2024", filterContainer.getSelectedMonth());
        });
    });

    describe("getElement", () => {
        test("フィルターコンテナ要素を取得", () => {
            const element = filterContainer.getElement();

            expect(element).toBeInstanceOf(HTMLDivElement);
            expect(element.querySelector("#year-select")).toBeTruthy();
            expect(element.querySelector("#month-select")).toBeTruthy();
        });
    });
});
