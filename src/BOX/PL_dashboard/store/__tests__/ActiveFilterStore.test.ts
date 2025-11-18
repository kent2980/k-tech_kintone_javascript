/**
 * ActiveFilterStoreのユニットテスト
 */

import { ActiveFilterStore } from "../ActiveFilterStore";

describe("ActiveFilterStore", () => {
    let store: ActiveFilterStore;

    beforeEach(() => {
        // シングルトンのインスタンスをリセット
        (ActiveFilterStore as any).instance = undefined;
        store = ActiveFilterStore.getInstance();
    });

    afterEach(() => {
        store.clearFilters();
    });

    describe("getInstance", () => {
        test("シングルトンインスタンスを取得", () => {
            const instance1 = ActiveFilterStore.getInstance();
            const instance2 = ActiveFilterStore.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe("setFilter", () => {
        test("フィルターを設定", () => {
            store.setFilter(2024, 1);

            const filter = store.getFilter();

            expect(filter.year).toBe(2024);
            expect(filter.month).toBe(1);
        });
    });

    describe("getFilter", () => {
        test("フィルターを取得", () => {
            store.setFilter(2024, 12);

            const filter = store.getFilter();

            expect(filter.year).toBe(2024);
            expect(filter.month).toBe(12);
        });

        test("フィルターが設定されていない場合は空オブジェクトを返す", () => {
            const filter = store.getFilter();

            expect(filter).toEqual({});
        });
    });

    describe("clearFilters", () => {
        test("フィルターをクリア", () => {
            store.setFilter(2024, 1);
            store.clearFilters();

            const filter = store.getFilter();

            expect(filter).toEqual({});
        });
    });
});
