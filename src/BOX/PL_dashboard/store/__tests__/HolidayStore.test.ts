/**
 * HolidayStoreのユニットテスト
 */

import { HolidayStore } from "../HolidayStore";

describe("HolidayStore", () => {
    let store: HolidayStore;

    beforeEach(() => {
        // シングルトンのインスタンスをリセット
        (HolidayStore as any).instance = undefined;
        store = HolidayStore.getInstance();
    });

    afterEach(() => {
        store.setHolidayData([]);
    });

    describe("getInstance", () => {
        test("シングルトンインスタンスを取得", () => {
            const instance1 = HolidayStore.getInstance();
            const instance2 = HolidayStore.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe("setHolidayData", () => {
        test("祝日データを設定", () => {
            const holidayData = [
                {
                    date: { value: "2024-01-01" },
                    holiday_type: { value: "元日" },
                } as any,
            ];

            store.setHolidayData(holidayData);

            expect(store.getHolidayData()).toEqual(holidayData);
        });

        test("配列以外のデータを設定した場合は空配列になる", () => {
            store.setHolidayData(null as any);

            expect(store.getHolidayData()).toEqual([]);
        });
    });

    describe("getHolidayData", () => {
        test("祝日データを取得", () => {
            const holidayData = [
                {
                    date: { value: "2024-01-01" },
                    holiday_type: { value: "元日" },
                } as any,
            ];

            store.setHolidayData(holidayData);

            expect(store.getHolidayData()).toEqual(holidayData);
        });

        test("データが設定されていない場合は空配列を返す", () => {
            expect(store.getHolidayData()).toEqual([]);
        });
    });

    describe("findByDate", () => {
        test("日付で祝日を検索", () => {
            const holidayData = [
                {
                    date: { value: "2024-01-01" },
                    holiday_type: { value: "元日" },
                } as any,
                {
                    date: { value: "2024-12-25" },
                    holiday_type: { value: "クリスマス" },
                } as any,
            ];

            store.setHolidayData(holidayData);

            const found = store.findByDate("2024-01-01");

            expect(found).toBeDefined();
            expect(found?.date?.value).toBe("2024-01-01");
        });

        test("存在しない日付の場合はundefinedを返す", () => {
            const holidayData = [
                {
                    date: { value: "2024-01-01" },
                    holiday_type: { value: "元日" },
                } as any,
            ];

            store.setHolidayData(holidayData);

            const found = store.findByDate("2024-12-31");

            expect(found).toBeUndefined();
        });
    });

    describe("getSelectHolidayDates", () => {
        test("指定された年月の祝日を取得", () => {
            const holidayData = [
                {
                    date: { value: "2024-01-01" },
                    holiday_type: { value: "元日" },
                } as any,
                {
                    date: { value: "2024-01-08" },
                    holiday_type: { value: "成人の日" },
                } as any,
                {
                    date: { value: "2024-12-25" },
                    holiday_type: { value: "クリスマス" },
                } as any,
            ];

            store.setHolidayData(holidayData);

            const dates = store.getSelectHolidayDates(2024, 1);

            expect(dates).toHaveLength(2);
            expect(dates[0].getFullYear()).toBe(2024);
            expect(dates[0].getMonth() + 1).toBe(1);
        });

        test("該当する祝日がない場合は空配列を返す", () => {
            const holidayData = [
                {
                    date: { value: "2024-01-01" },
                    holiday_type: { value: "元日" },
                } as any,
            ];

            store.setHolidayData(holidayData);

            const dates = store.getSelectHolidayDates(2024, 12);

            expect(dates).toEqual([]);
        });
    });
});
