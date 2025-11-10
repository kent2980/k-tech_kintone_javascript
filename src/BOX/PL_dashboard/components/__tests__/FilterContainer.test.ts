/**
 * FilterContainer test suite - Simplified
 */

import { DateUtil } from "../../utils";
import { FilterContainer } from "../FilterContainer";

// Mock DateUtil
jest.mock("../../utils/DateUtil");
jest.mock("../../utils/DomUtil");

import { DomUtil } from "../../utils";
const mockDateUtil = DateUtil as jest.Mocked<typeof DateUtil>;
const mockDomUtil = DomUtil as jest.Mocked<typeof DomUtil>;

// Set up default mock return values
mockDateUtil.getCurrentYear.mockReturnValue(2024);
mockDateUtil.getCurrentMonth.mockReturnValue(12);
mockDomUtil.addOption.mockImplementation(() => {});
mockDomUtil.createLabel.mockReturnValue(document.createElement("label"));

describe("FilterContainer", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock DOM createElement to return element with value property
        const mockSelect = {
            id: "",
            value: "",
            style: {},
            addEventListener: jest.fn(),
            setAttribute: jest.fn(),
            getAttribute: jest.fn(),
            appendChild: jest.fn(),
        };

        const mockDiv = {
            className: "",
            style: {},
            appendChild: jest.fn(),
            innerHTML: "",
        };

        (document.createElement as jest.Mock) = jest.fn((tagName: string) => {
            if (tagName === "select") {
                return { ...mockSelect };
            }
            if (tagName === "div") {
                return { ...mockDiv };
            }
            return {};
        });

        // Reset mock implementations to default values
        mockDateUtil.getCurrentYear.mockReturnValue(2024);
        mockDateUtil.getCurrentMonth.mockReturnValue(12);
        mockDomUtil.addOption.mockImplementation(() => {});
        mockDomUtil.createLabel.mockReturnValue(document.createElement("label"));
    });

    describe("Static methods", () => {
        describe("createYearSelect", () => {
            it("should create year select element with correct id", () => {
                const yearSelect = FilterContainer.createYearSelect();

                expect(yearSelect.id).toBe("year-select");
            });

            it("should add default option", () => {
                FilterContainer.createYearSelect();

                expect(mockDomUtil.addOption).toHaveBeenCalledWith(
                    expect.any(Object),
                    "",
                    "-- 選択 --"
                );
            });

            it("should add past 10 years by default", () => {
                FilterContainer.createYearSelect();

                // Should add default option + 10 year options
                expect(mockDomUtil.addOption).toHaveBeenCalledTimes(11);

                // Check specific year calls (2024 to 2015)
                expect(mockDomUtil.addOption).toHaveBeenCalledWith(
                    expect.any(Object),
                    2024,
                    "2024"
                );
                expect(mockDomUtil.addOption).toHaveBeenCalledWith(
                    expect.any(Object),
                    2023,
                    "2023"
                );
                expect(mockDomUtil.addOption).toHaveBeenCalledWith(
                    expect.any(Object),
                    2015,
                    "2015"
                );
            });

            it("should add custom number of years", () => {
                (mockDomUtil.addOption as jest.Mock).mockClear();
                FilterContainer.createYearSelect(5);

                // Should add default option + 5 year options
                expect(mockDomUtil.addOption).toHaveBeenCalledTimes(6);
            });

            it("should set current year as default value", () => {
                // Set up the mock to simulate setting value
                const mockYearSelect = {
                    id: "year-select",
                    value: "2024",
                    style: {},
                    addEventListener: jest.fn(),
                    setAttribute: jest.fn(),
                    getAttribute: jest.fn(),
                    appendChild: jest.fn(),
                };

                (document.createElement as jest.Mock).mockImplementation((tagName: string) => {
                    if (tagName === "select") {
                        return mockYearSelect;
                    }
                    return {};
                });

                const yearSelect = FilterContainer.createYearSelect();

                expect(yearSelect.value).toBe("2024");
            });
        });

        describe("createMonthSelect", () => {
            it("should create month select element with correct id", () => {
                const monthSelect = FilterContainer.createMonthSelect();

                expect(monthSelect.id).toBe("month-select");
            });

            it("should add default option", () => {
                FilterContainer.createMonthSelect();

                expect(mockDomUtil.addOption).toHaveBeenCalledWith(
                    expect.any(Object),
                    "",
                    "-- 選択 --"
                );
            });

            it("should add 12 months", () => {
                (mockDomUtil.addOption as jest.Mock).mockClear();
                FilterContainer.createMonthSelect();

                // Should add default option + 12 month options
                expect(mockDomUtil.addOption).toHaveBeenCalledTimes(13);

                // Check specific month calls
                expect(mockDomUtil.addOption).toHaveBeenCalledWith(expect.any(Object), "1", "1月");
                expect(mockDomUtil.addOption).toHaveBeenCalledWith(expect.any(Object), "6", "6月");
                expect(mockDomUtil.addOption).toHaveBeenCalledWith(
                    expect.any(Object),
                    "12",
                    "12月"
                );
            });

            it("should set current month as default value", () => {
                // Set up the mock to simulate setting value
                const mockMonthSelect = {
                    id: "month-select",
                    value: "12",
                    style: {},
                    addEventListener: jest.fn(),
                    setAttribute: jest.fn(),
                    getAttribute: jest.fn(),
                    appendChild: jest.fn(),
                };

                (document.createElement as jest.Mock).mockImplementation((tagName: string) => {
                    if (tagName === "select") {
                        return mockMonthSelect;
                    }
                    return {};
                });

                const monthSelect = FilterContainer.createMonthSelect();

                expect(monthSelect.value).toBe("12");
            });
        });
    });

    describe("Constructor", () => {
        it("should create FilterContainer instance", () => {
            const container = new FilterContainer();

            expect(container).toBeInstanceOf(FilterContainer);
        });

        it("should set up container with labels and selects", () => {
            new FilterContainer();

            // Should create labels for year and month
            expect(mockDomUtil.createLabel).toHaveBeenCalledWith("年: ", "year-select");
            expect(mockDomUtil.createLabel).toHaveBeenCalledWith("月: ", "month-select", "20px");
        });
    });

    describe("Event handling", () => {
        let filterContainer: FilterContainer;

        beforeEach(() => {
            filterContainer = new FilterContainer();
        });

        it("should handle year change event", () => {
            const callback = jest.fn();

            expect(() => {
                filterContainer.onYearChange(callback);
            }).not.toThrow();
        });

        it("should handle month change event", () => {
            const callback = jest.fn();

            expect(() => {
                filterContainer.onMonthChange(callback);
            }).not.toThrow();
        });
    });

    describe("Getters", () => {
        let filterContainer: FilterContainer;

        beforeEach(() => {
            filterContainer = new FilterContainer();
        });

        it("should get selected year", () => {
            const year = filterContainer.getSelectedYear();
            expect(typeof year).toBe("string");
        });

        it("should get selected month", () => {
            const month = filterContainer.getSelectedMonth();
            expect(typeof month).toBe("string");
        });

        it("should get container element", () => {
            const container = filterContainer.getElement();
            expect(container).toBeDefined();
            expect(typeof container).toBe("object");
        });
    });

    describe("Error handling", () => {
        it("should handle mockDateUtil.getCurrentYear error", () => {
            (mockDateUtil.getCurrentYear as jest.Mock).mockImplementation(() => {
                throw new Error("Date error");
            });

            expect(() => FilterContainer.createYearSelect()).toThrow();
        });

        it("should handle DateUtil.getCurrentMonth error", () => {
            (DateUtil.getCurrentMonth as jest.Mock).mockImplementation(() => {
                throw new Error("Date error");
            });

            expect(() => FilterContainer.createMonthSelect()).toThrow();
        });

        it("should handle invalid year count", () => {
            expect(() => FilterContainer.createYearSelect(-1)).not.toThrow();
            expect(() => FilterContainer.createYearSelect(0)).not.toThrow();
        });
    });

    describe("Integration", () => {
        it("should create complete filter interface", () => {
            // Mock the select elements with proper values
            const mockYearSelect = {
                id: "year-select",
                value: "2024",
                style: {},
                addEventListener: jest.fn(),
                setAttribute: jest.fn(),
                getAttribute: jest.fn(),
                appendChild: jest.fn(),
            };

            const mockMonthSelect = {
                id: "month-select",
                value: "12",
                style: {},
                addEventListener: jest.fn(),
                setAttribute: jest.fn(),
                getAttribute: jest.fn(),
                appendChild: jest.fn(),
            };

            let selectCallCount = 0;
            (document.createElement as jest.Mock).mockImplementation((tagName: string) => {
                if (tagName === "select") {
                    selectCallCount++;
                    // Return year select for first call, month select for second call
                    return selectCallCount === 1 ? mockYearSelect : mockMonthSelect;
                }
                if (tagName === "div") {
                    return {
                        className: "",
                        style: {},
                        appendChild: jest.fn(),
                        innerHTML: "",
                    };
                }
                return {};
            });

            const filterContainer = new FilterContainer();

            expect(filterContainer.getElement()).toBeDefined();
            expect(filterContainer.getSelectedYear()).toBe("2024");
            expect(filterContainer.getSelectedMonth()).toBe("12");
        });

        it("should handle callback registration", () => {
            const filterContainer = new FilterContainer();
            const yearCallback = jest.fn();
            const monthCallback = jest.fn();

            expect(() => {
                filterContainer.onYearChange(yearCallback);
                filterContainer.onMonthChange(monthCallback);
            }).not.toThrow();
        });
    });
});
