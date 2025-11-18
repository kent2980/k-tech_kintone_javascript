/**
 * CalculationUtilのユニットテスト
 */

import { CalculationUtil } from "../CalculationUtil";

describe("CalculationUtil", () => {
    describe("calculateOvertimeCost", () => {
        test("残業コストを正しく計算", () => {
            const result = CalculationUtil.calculateOvertimeCost(10, 1000);

            expect(result).toBe(12500); // 10 * 1000 * 1.25
        });

        test("残業時間が0の場合は0を返す", () => {
            const result = CalculationUtil.calculateOvertimeCost(0, 1000);

            expect(result).toBe(0);
        });
    });

    describe("calculateProfitRate", () => {
        test("利益率を正しく計算", () => {
            const result = CalculationUtil.calculateProfitRate(500, 1000);

            expect(result).toBe("50.00%");
        });

        test("売上が0の場合は0%を返す", () => {
            const result = CalculationUtil.calculateProfitRate(500, 0);

            expect(result).toBe("0%");
        });

        test("売上が負の値の場合は0%を返す", () => {
            const result = CalculationUtil.calculateProfitRate(500, -100);

            expect(result).toBe("0%");
        });
    });

    describe("safeNumber", () => {
        test("数値文字列を数値に変換", () => {
            expect(CalculationUtil.safeNumber("123")).toBe(123);
            expect(CalculationUtil.safeNumber("123.45")).toBe(123.45);
        });

        test("数値をそのまま返す", () => {
            expect(CalculationUtil.safeNumber(123)).toBe(123);
            expect(CalculationUtil.safeNumber(123.45)).toBe(123.45);
        });

        test("undefinedの場合はデフォルト値を返す", () => {
            expect(CalculationUtil.safeNumber(undefined)).toBe(0);
            expect(CalculationUtil.safeNumber(undefined, 100)).toBe(100);
        });

        test("nullの場合はデフォルト値を返す", () => {
            expect(CalculationUtil.safeNumber(null)).toBe(0);
            expect(CalculationUtil.safeNumber(null, 100)).toBe(100);
        });

        test("空文字列の場合はデフォルト値を返す", () => {
            expect(CalculationUtil.safeNumber("")).toBe(0);
            expect(CalculationUtil.safeNumber("", 100)).toBe(100);
        });

        test("数値に変換できない文字列の場合はデフォルト値を返す", () => {
            expect(CalculationUtil.safeNumber("abc")).toBe(0);
            expect(CalculationUtil.safeNumber("abc", 100)).toBe(100);
        });
    });

    describe("divideByThousand", () => {
        test("数値を千単位で除算", () => {
            expect(CalculationUtil.divideByThousand(1000)).toBe(1);
            expect(CalculationUtil.divideByThousand(5000)).toBe(5);
            expect(CalculationUtil.divideByThousand(1234)).toBe(1.234);
        });

        test("0の場合は0を返す", () => {
            expect(CalculationUtil.divideByThousand(0)).toBe(0);
        });
    });

    describe("roundNumber", () => {
        test("数値を四捨五入", () => {
            expect(CalculationUtil.roundNumber(123.456)).toBe(123);
            expect(CalculationUtil.roundNumber(123.456, 1)).toBe(123.5);
            expect(CalculationUtil.roundNumber(123.456, 2)).toBe(123.46);
        });

        test("小数点以下桁数を指定しない場合は整数に丸める", () => {
            expect(CalculationUtil.roundNumber(123.456)).toBe(123);
        });
    });

    describe("parsePercentage", () => {
        test("パーセンテージ文字列を数値に変換", () => {
            expect(CalculationUtil.parsePercentage("50%")).toBe(50);
            expect(CalculationUtil.parsePercentage("123.45%")).toBe(123.45);
        });

        test("%記号がない場合も変換", () => {
            expect(CalculationUtil.parsePercentage("50")).toBe(50);
        });
    });

    describe("toPercentageString", () => {
        test("数値をパーセンテージ文字列に変換", () => {
            expect(CalculationUtil.toPercentageString(50)).toBe("50.00%");
            expect(CalculationUtil.toPercentageString(50, 1)).toBe("50.0%");
            expect(CalculationUtil.toPercentageString(50, 0)).toBe("50%");
        });
    });

    describe("sum", () => {
        test("配列の合計を計算", () => {
            expect(CalculationUtil.sum([1, 2, 3])).toBe(6);
            expect(CalculationUtil.sum([10, 20, 30])).toBe(60);
        });

        test("空配列の場合は0を返す", () => {
            expect(CalculationUtil.sum([])).toBe(0);
        });
    });

    describe("average", () => {
        test("配列の平均を計算", () => {
            expect(CalculationUtil.average([1, 2, 3])).toBe(2);
            expect(CalculationUtil.average([10, 20, 30])).toBe(20);
        });

        test("空配列の場合は0を返す", () => {
            expect(CalculationUtil.average([])).toBe(0);
        });
    });
});
