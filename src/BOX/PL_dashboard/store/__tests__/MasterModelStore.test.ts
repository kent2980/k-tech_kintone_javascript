/**
 * MasterModelStoreのユニットテスト
 */

import { MasterModelStore } from "../MasterModelStore";

describe("MasterModelStore", () => {
    let store: MasterModelStore;

    beforeEach(() => {
        // シングルトンのインスタンスをリセット
        (MasterModelStore as any).instance = undefined;
        store = MasterModelStore.getInstance();
    });

    afterEach(() => {
        store.clearMasterData();
    });

    describe("getInstance", () => {
        test("シングルトンインスタンスを取得", () => {
            const instance1 = MasterModelStore.getInstance();
            const instance2 = MasterModelStore.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe("setMasterData", () => {
        test("マスタデータを設定", () => {
            const masterData = [
                {
                    model_name: { value: "モデル1" },
                    unit_price: { value: "1000" },
                } as any,
            ];

            store.setMasterData(masterData);

            expect(store.getMasterData()).toEqual(masterData);
        });

        test("配列以外のデータを設定した場合は空配列になる", () => {
            store.setMasterData(null as any);

            expect(store.getMasterData()).toEqual([]);
        });
    });

    describe("getMasterData", () => {
        test("マスタデータを取得", () => {
            const masterData = [
                {
                    model_name: { value: "モデル1" },
                    unit_price: { value: "1000" },
                } as any,
            ];

            store.setMasterData(masterData);

            expect(store.getMasterData()).toEqual(masterData);
        });

        test("データが設定されていない場合は空配列を返す", () => {
            expect(store.getMasterData()).toEqual([]);
        });
    });

    describe("clearMasterData", () => {
        test("マスタデータをクリア", () => {
            const masterData = [
                {
                    model_name: { value: "モデル1" },
                    unit_price: { value: "1000" },
                } as any,
            ];

            store.setMasterData(masterData);
            store.clearMasterData();

            expect(store.getMasterData()).toEqual([]);
        });
    });
});
