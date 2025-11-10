import { CalculationUtil } from "../CalculationUtil";

describe("CalculationUtil", () => {
    describe("calculateOvertimeCost", () => {
        it("should calculate overtime cost with 1.25 multiplier", () => {
            const result = CalculationUtil.calculateOvertimeCost(10, 1000);
            expect(result).toBe(12500); // 10 * 1000 * 1.25
        });

        it("should handle zero hours", () => {
            const result = CalculationUtil.calculateOvertimeCost(0, 1000);
            expect(result).toBe(0);
        });
    });

    describe("calculateProfitRate", () => {
        it("should calculate profit rate correctly", () => {
            const result = CalculationUtil.calculateProfitRate(25, 100);
            expect(result).toBe("25.00%");
        });

        it("should handle zero revenue", () => {
            const result = CalculationUtil.calculateProfitRate(25, 0);
            expect(result).toBe("0%");
        });

        it("should handle negative revenue", () => {
            const result = CalculationUtil.calculateProfitRate(25, -100);
            expect(result).toBe("0%");
        });
    });

    describe("safeNumber", () => {
        it("should convert valid string to number", () => {
            expect(CalculationUtil.safeNumber("123")).toBe(123);
            expect(CalculationUtil.safeNumber("123.45")).toBe(123.45);
        });

        it("should return default value for invalid input", () => {
            expect(CalculationUtil.safeNumber("")).toBe(0);
            expect(CalculationUtil.safeNumber(null)).toBe(0);
            expect(CalculationUtil.safeNumber(undefined)).toBe(0);
            expect(CalculationUtil.safeNumber("invalid")).toBe(0);
        });

        it("should return custom default value", () => {
            expect(CalculationUtil.safeNumber("", 999)).toBe(999);
            expect(CalculationUtil.safeNumber(null, -1)).toBe(-1);
        });

        it("should handle number input", () => {
            expect(CalculationUtil.safeNumber(42)).toBe(42);
            expect(CalculationUtil.safeNumber(0)).toBe(0);
        });
    });

    describe("roundNumber", () => {
        it("should round to whole number by default", () => {
            expect(CalculationUtil.roundNumber(3.14159)).toBe(3);
            expect(CalculationUtil.roundNumber(3.6)).toBe(4);
        });

        it("should round to specified decimal places", () => {
            expect(CalculationUtil.roundNumber(3.14159, 2)).toBe(3.14);
            expect(CalculationUtil.roundNumber(3.14659, 2)).toBe(3.15);
        });
    });

    describe("divideByThousand", () => {
        it("should divide by 1000", () => {
            expect(CalculationUtil.divideByThousand(5000)).toBe(5);
            expect(CalculationUtil.divideByThousand(1500)).toBe(1.5);
        });
    });

    describe("sum", () => {
        it("should calculate sum of array", () => {
            expect(CalculationUtil.sum([1, 2, 3, 4, 5])).toBe(15);
            expect(CalculationUtil.sum([])).toBe(0);
            expect(CalculationUtil.sum([42])).toBe(42);
        });
    });

    describe("average", () => {
        it("should calculate average of array", () => {
            expect(CalculationUtil.average([1, 2, 3, 4, 5])).toBe(3);
            expect(CalculationUtil.average([10, 20])).toBe(15);
        });

        it("should return 0 for empty array", () => {
            expect(CalculationUtil.average([])).toBe(0);
        });
    });

    describe("parsePercentage", () => {
        it("should parse percentage string", () => {
            expect(CalculationUtil.parsePercentage("50%")).toBe(50);
            expect(CalculationUtil.parsePercentage("25.5%")).toBe(25.5);
        });

        it("should handle string without percentage sign", () => {
            expect(CalculationUtil.parsePercentage("75")).toBe(75);
        });
    });

    describe("toPercentageString", () => {
        it("should convert number to percentage string", () => {
            expect(CalculationUtil.toPercentageString(25)).toBe("25.00%");
            expect(CalculationUtil.toPercentageString(33.333, 1)).toBe("33.3%");
        });
    });
});
