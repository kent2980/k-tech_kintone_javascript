/**
 * DateUtilのユニットテスト
 */

import { DateUtil } from "../DateUtil";

describe("DateUtil", () => {
    describe("getDayOfWeek", () => {
        test("日曜日を取得", () => {
            const date = new Date("2024-01-07"); // 日曜日
            const dayOfWeek = DateUtil.getDayOfWeek(date);

            expect(dayOfWeek).toBe("日");
        });

        test("月曜日を取得", () => {
            const date = new Date("2024-01-01"); // 月曜日
            const dayOfWeek = DateUtil.getDayOfWeek(date);

            expect(dayOfWeek).toBe("月");
        });

        test("土曜日を取得", () => {
            const date = new Date("2024-01-06"); // 土曜日
            const dayOfWeek = DateUtil.getDayOfWeek(date);

            expect(dayOfWeek).toBe("土");
        });
    });

    describe("formatDateShort", () => {
        test("日付を短い形式に変換", () => {
            const result = DateUtil.formatDateShort("2024-01-15");

            expect(result).toMatch(/^01\/15\([月火水木金土日]\)$/);
        });

        test("月と日が1桁の場合は0埋め", () => {
            const result = DateUtil.formatDateShort("2024-01-05");

            expect(result).toMatch(/^01\/05\([月火水木金土日]\)$/);
        });
    });

    describe("getLastDayOfMonth", () => {
        test("1月の最終日を取得", () => {
            const lastDay = DateUtil.getLastDayOfMonth(2024, 1);

            expect(lastDay).toBe(31);
        });

        test("2月の最終日を取得（うるう年）", () => {
            const lastDay = DateUtil.getLastDayOfMonth(2024, 2);

            expect(lastDay).toBe(29);
        });

        test("2月の最終日を取得（平年）", () => {
            const lastDay = DateUtil.getLastDayOfMonth(2023, 2);

            expect(lastDay).toBe(28);
        });

        test("4月の最終日を取得", () => {
            const lastDay = DateUtil.getLastDayOfMonth(2024, 4);

            expect(lastDay).toBe(30);
        });
    });

    describe("getTodayString", () => {
        test("今日の日付をYYYY-MM-DD形式で取得", () => {
            const today = DateUtil.getTodayString();

            expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe("getCurrentYear", () => {
        test("現在の年を取得", () => {
            const year = DateUtil.getCurrentYear();

            expect(year).toBeGreaterThanOrEqual(2020);
            expect(year).toBeLessThanOrEqual(2100);
        });
    });

    describe("getCurrentMonth", () => {
        test("現在の月を取得（1-12）", () => {
            const month = DateUtil.getCurrentMonth();

            expect(month).toBeGreaterThanOrEqual(1);
            expect(month).toBeLessThanOrEqual(12);
        });
    });

    describe("generateMonthlyDateList", () => {
        test("月の全日付リストを生成", () => {
            const dates = DateUtil.generateMonthlyDateList("2024", "1");

            expect(dates.length).toBe(31);
            expect(dates[0]).toBe("2024-01-01");
            expect(dates[30]).toBe("2024-01-31");
        });

        test("2月の全日付リストを生成（うるう年）", () => {
            const dates = DateUtil.generateMonthlyDateList("2024", "2");

            expect(dates.length).toBe(29);
            expect(dates[0]).toBe("2024-02-01");
            expect(dates[28]).toBe("2024-02-29");
        });

        test("空の年または月の場合は空配列を返す", () => {
            expect(DateUtil.generateMonthlyDateList("", "1")).toEqual([]);
            expect(DateUtil.generateMonthlyDateList("2024", "")).toEqual([]);
        });

        test("無効な月の場合は空配列を返す", () => {
            expect(DateUtil.generateMonthlyDateList("2024", "13")).toEqual([]);
            expect(DateUtil.generateMonthlyDateList("2024", "0")).toEqual([]);
        });

        test("無効な年の場合は空配列を返す", () => {
            expect(DateUtil.generateMonthlyDateList("invalid", "1")).toEqual([]);
        });
    });

    describe("generateWorkingDaysList", () => {
        test("祝日を除く月の全日付リストを生成", () => {
            const holidayData = [
                { date: { value: "2024-01-01" } }, // 月曜日（祝日）
                { date: { value: "2024-01-08" } }, // 月曜日（祝日）
            ];

            const dates = DateUtil.generateWorkingDaysList("2024", "1", holidayData);

            // 1月は31日、土日を除くと約22-23日、祝日2日を除く
            expect(dates.length).toBeGreaterThan(0);
            expect(dates).not.toContain("2024-01-01");
            expect(dates).not.toContain("2024-01-08");
        });

        test("土日を除外", () => {
            const dates = DateUtil.generateWorkingDaysList("2024", "1", []);

            // 1月の土日を除外
            expect(dates).not.toContain("2024-01-06"); // 土曜日
            expect(dates).not.toContain("2024-01-07"); // 日曜日
        });

        test("祝日データがない場合でも動作", () => {
            const dates = DateUtil.generateWorkingDaysList("2024", "1", []);

            expect(dates.length).toBeGreaterThan(0);
        });
    });
});
