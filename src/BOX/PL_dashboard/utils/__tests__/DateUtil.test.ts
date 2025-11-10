import { DateUtil } from "../DateUtil";

describe("DateUtil", () => {
    describe("getDayOfWeek", () => {
        it("should return correct day of week in Japanese", () => {
            // 2024年1月1日は月曜日
            const date = new Date("2024-01-01");
            expect(DateUtil.getDayOfWeek(date)).toBe("月");
        });

        it("should return correct day for Sunday", () => {
            // 2024年1月7日は日曜日
            const date = new Date("2024-01-07");
            expect(DateUtil.getDayOfWeek(date)).toBe("日");
        });
    });

    describe("formatDateShort", () => {
        it("should format date correctly", () => {
            const result = DateUtil.formatDateShort("2024-01-01");
            expect(result).toBe("01/01(月)");
        });

        it("should pad month and day with zeros", () => {
            const result = DateUtil.formatDateShort("2024-03-05");
            expect(result).toBe("03/05(火)");
        });
    });

    describe("getLastDayOfMonth", () => {
        it("should return correct last day for January", () => {
            const result = DateUtil.getLastDayOfMonth(2024, 1);
            expect(result).toBe(31);
        });

        it("should return correct last day for February in leap year", () => {
            const result = DateUtil.getLastDayOfMonth(2024, 2);
            expect(result).toBe(29);
        });

        it("should return correct last day for February in non-leap year", () => {
            const result = DateUtil.getLastDayOfMonth(2023, 2);
            expect(result).toBe(28);
        });
    });

    describe("getTodayString", () => {
        it("should return date in YYYY-MM-DD format", () => {
            const result = DateUtil.getTodayString();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe("getCurrentYear", () => {
        it("should return current year as number", () => {
            const result = DateUtil.getCurrentYear();
            expect(typeof result).toBe("number");
            expect(result).toBeGreaterThan(2020);
        });
    });

    describe("getCurrentMonth", () => {
        it("should return current month as number between 1-12", () => {
            const result = DateUtil.getCurrentMonth();
            expect(typeof result).toBe("number");
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(12);
        });
    });
});
