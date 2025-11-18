/**
 * DomBatchUpdaterのユニットテスト
 */

import {
    DomBatchUpdater,
    batchAppend,
    batchAppendRows,
    batchAppendCells,
} from "../DomBatchUpdater";

describe("DomBatchUpdater", () => {
    let updater: DomBatchUpdater;

    beforeEach(() => {
        updater = new DomBatchUpdater();
        document.body.innerHTML = "";
    });

    describe("append", () => {
        test("要素をフラグメントに追加", () => {
            const div = document.createElement("div");
            updater.append(div);

            expect(updater.getChildCount()).toBe(1);
        });

        test("メソッドチェーンが可能", () => {
            const div1 = document.createElement("div");
            const div2 = document.createElement("div");

            const result = updater.append(div1).append(div2);

            expect(result).toBe(updater);
            expect(updater.getChildCount()).toBe(2);
        });
    });

    describe("appendAll", () => {
        test("複数の要素をフラグメントに追加", () => {
            const div1 = document.createElement("div");
            const div2 = document.createElement("div");
            const div3 = document.createElement("div");

            updater.appendAll([div1, div2, div3]);

            expect(updater.getChildCount()).toBe(3);
        });

        test("メソッドチェーンが可能", () => {
            const div1 = document.createElement("div");
            const div2 = document.createElement("div");

            const result = updater.appendAll([div1]).appendAll([div2]);

            expect(result).toBe(updater);
            expect(updater.getChildCount()).toBe(2);
        });
    });

    describe("appendTo", () => {
        test("フラグメントを親要素に追加", () => {
            const parent = document.createElement("div");
            const child = document.createElement("div");

            updater.append(child).appendTo(parent);

            expect(parent.contains(child)).toBe(true);
            expect(updater.getChildCount()).toBe(0); // 新しいフラグメントが作成される
        });

        test("親要素を返す", () => {
            const parent = document.createElement("div");
            const child = document.createElement("div");

            const result = updater.append(child).appendTo(parent);

            expect(result).toBe(parent);
        });
    });

    describe("clear", () => {
        test("フラグメントをクリア", () => {
            const div1 = document.createElement("div");
            const div2 = document.createElement("div");

            updater.append(div1).append(div2);
            expect(updater.getChildCount()).toBe(2);

            updater.clear();
            expect(updater.getChildCount()).toBe(0);
        });

        test("メソッドチェーンが可能", () => {
            const result = updater.clear();

            expect(result).toBe(updater);
        });
    });

    describe("getChildCount", () => {
        test("子要素数を取得", () => {
            expect(updater.getChildCount()).toBe(0);

            updater.append(document.createElement("div"));
            expect(updater.getChildCount()).toBe(1);

            updater.append(document.createElement("div"));
            expect(updater.getChildCount()).toBe(2);
        });
    });
});

describe("batchAppend", () => {
    test("複数の要素を一度に追加", () => {
        const parent = document.createElement("div");
        const child1 = document.createElement("div");
        const child2 = document.createElement("div");

        batchAppend(parent, [child1, child2]);

        expect(parent.children.length).toBe(2);
        expect(parent.contains(child1)).toBe(true);
        expect(parent.contains(child2)).toBe(true);
    });

    test("親要素を返す", () => {
        const parent = document.createElement("div");
        const result = batchAppend(parent, []);

        expect(result).toBe(parent);
    });
});

describe("batchAppendRows", () => {
    test("複数のテーブル行を一度に追加", () => {
        const tbody = document.createElement("tbody");
        const row1 = document.createElement("tr");
        const row2 = document.createElement("tr");

        batchAppendRows(tbody, [row1, row2]);

        expect(tbody.children.length).toBe(2);
        expect(tbody.contains(row1)).toBe(true);
        expect(tbody.contains(row2)).toBe(true);
    });

    test("テーブルボディ要素を返す", () => {
        const tbody = document.createElement("tbody");
        const result = batchAppendRows(tbody, []);

        expect(result).toBe(tbody);
    });
});

describe("batchAppendCells", () => {
    test("複数のテーブルセルを一度に追加", () => {
        const row = document.createElement("tr");
        const cell1 = document.createElement("td");
        const cell2 = document.createElement("td");

        batchAppendCells(row, [cell1, cell2]);

        expect(row.children.length).toBe(2);
        expect(row.contains(cell1)).toBe(true);
        expect(row.contains(cell2)).toBe(true);
    });

    test("テーブル行要素を返す", () => {
        const row = document.createElement("tr");
        const result = batchAppendCells(row, []);

        expect(result).toBe(row);
    });
});
