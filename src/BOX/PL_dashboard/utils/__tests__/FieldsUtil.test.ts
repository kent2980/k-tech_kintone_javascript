/**
 * FieldsUtilのユニットテスト
 */

// GeneratedFieldsUtilをモック
jest.mock("../../generated/fields", () => ({
    GeneratedFieldsUtil: {
        getMonthlyFields: jest.fn(() => ["year_month", "inside_unit", "outside_unit"]),
        getDailyFields: jest.fn(() => ["date", "inside_unit", "outside_unit"]),
        getLineDailyFields: jest.fn(() => ["date", "line_name", "model_name"]),
        getModelMasterFields: jest.fn(() => ["model_name", "unit_price"]),
        getHolidayFields: jest.fn(() => ["date", "holiday_type"]),
        getAllFields: jest.fn(() => ({
            monthly: ["year_month", "inside_unit", "outside_unit"],
            daily: ["date", "inside_unit", "outside_unit"],
            line_daily: ["date", "line_name", "model_name"],
            model_master: ["model_name", "unit_price"],
            holiday: ["date", "holiday_type"],
        })),
    },
}));

import { FieldsUtil } from "../FieldsUtil";

describe("FieldsUtil", () => {
    beforeEach(() => {
        // キャッシュをクリア
        FieldsUtil.clearCache();
    });

    describe("getMonthlyFields", () => {
        test("月次データのフィールド名を取得", () => {
            const fields = FieldsUtil.getMonthlyFields();

            expect(Array.isArray(fields)).toBe(true);
            expect(fields.length).toBeGreaterThan(0);
        });

        test("キャッシュから取得", () => {
            const fields1 = FieldsUtil.getMonthlyFields();
            const fields2 = FieldsUtil.getMonthlyFields();

            expect(fields1).toEqual(fields2);
        });
    });

    describe("getDailyFields", () => {
        test("日次データのフィールド名を取得", () => {
            const fields = FieldsUtil.getDailyFields();

            expect(Array.isArray(fields)).toBe(true);
            expect(fields.length).toBeGreaterThan(0);
        });
    });

    describe("getLineDailyFields", () => {
        test("生産日報データのフィールド名を取得", () => {
            const fields = FieldsUtil.getLineDailyFields();

            expect(Array.isArray(fields)).toBe(true);
            expect(fields.length).toBeGreaterThan(0);
        });
    });

    describe("getModelMasterFields", () => {
        test("マスタ機種データのフィールド名を取得", () => {
            const fields = FieldsUtil.getModelMasterFields();

            expect(Array.isArray(fields)).toBe(true);
            expect(fields.length).toBeGreaterThan(0);
        });
    });

    describe("getHolidayFields", () => {
        test("祝日データのフィールド名を取得", () => {
            const fields = FieldsUtil.getHolidayFields();

            expect(Array.isArray(fields)).toBe(true);
            expect(fields.length).toBeGreaterThan(0);
        });
    });

    describe("extractFieldsFromType", () => {
        test("型からフィールド名を抽出", () => {
            const sampleObject = {
                field1: "value1",
                field2: "value2",
                field3: 123,
            };

            const fields = FieldsUtil.extractFieldsFromType(sampleObject);

            expect(fields).toContain("field1");
            expect(fields).toContain("field2");
            expect(fields).toContain("field3");
        });
    });

    describe("getCommonFields", () => {
        test("共通フィールドを抽出", () => {
            const fieldLists = [
                ["field1", "field2", "field3"],
                ["field2", "field3", "field4"],
                ["field2", "field3", "field5"],
            ];

            const commonFields = FieldsUtil.getCommonFields(fieldLists);

            expect(commonFields).toEqual(["field2", "field3"]);
        });

        test("空の配列の場合は空配列を返す", () => {
            const commonFields = FieldsUtil.getCommonFields([]);

            expect(commonFields).toEqual([]);
        });

        test("共通フィールドがない場合は空配列を返す", () => {
            const fieldLists = [
                ["field1", "field2"],
                ["field3", "field4"],
            ];

            const commonFields = FieldsUtil.getCommonFields(fieldLists);

            expect(commonFields).toEqual([]);
        });
    });

    describe("filterFields", () => {
        test("含めるパターンでフィルタリング", () => {
            const fields = ["date", "inside_unit", "outside_unit", "other_field"];

            const filtered = FieldsUtil.filterFields(fields, ["unit"]);

            expect(filtered).toContain("inside_unit");
            expect(filtered).toContain("outside_unit");
            expect(filtered).not.toContain("date");
        });

        test("除外パターンでフィルタリング", () => {
            const fields = ["date", "inside_unit", "outside_unit", "other_field"];

            const filtered = FieldsUtil.filterFields(fields, [], ["unit"]);

            expect(filtered).toContain("date");
            expect(filtered).toContain("other_field");
            expect(filtered).not.toContain("inside_unit");
            expect(filtered).not.toContain("outside_unit");
        });

        test("含めるパターンと除外パターンの両方でフィルタリング", () => {
            const fields = ["date", "inside_unit", "outside_unit", "other_field"];

            const filtered = FieldsUtil.filterFields(fields, ["unit"], ["outside"]);

            expect(filtered).toContain("inside_unit");
            expect(filtered).not.toContain("outside_unit");
        });

        test("パターンが指定されていない場合はすべてのフィールドを返す", () => {
            const fields = ["field1", "field2", "field3"];

            const filtered = FieldsUtil.filterFields(fields);

            expect(filtered).toEqual(fields);
        });
    });

    describe("getFieldStatistics", () => {
        test("フィールド統計を取得", () => {
            const stats = FieldsUtil.getFieldStatistics();

            expect(stats).toHaveProperty("totalFields");
            expect(stats).toHaveProperty("fieldsByType");
            expect(stats.totalFields).toBeGreaterThan(0);
        });
    });

    describe("groupFieldsByType", () => {
        test("フィールドをタイプでグループ化", () => {
            const fields = [
                "date",
                "created_at",
                "inside_unit",
                "total_cost",
                "overtime_hour",
                "model_name",
                "other_field",
            ];

            const groups = FieldsUtil.groupFieldsByType(fields);

            expect(groups.date.length).toBeGreaterThan(0);
            expect(groups.number.length).toBeGreaterThan(0);
            expect(groups.text.length).toBeGreaterThan(0);
            expect(groups.time.length).toBeGreaterThan(0);
        });

        test("空の配列の場合は空のグループを返す", () => {
            const groups = FieldsUtil.groupFieldsByType([]);

            expect(groups.date).toEqual([]);
            expect(groups.number).toEqual([]);
            expect(groups.text).toEqual([]);
            expect(groups.time).toEqual([]);
            expect(groups.other).toEqual([]);
        });
    });

    describe("clearCache", () => {
        test("すべてのキャッシュをクリア", () => {
            FieldsUtil.getMonthlyFields(); // キャッシュに保存
            FieldsUtil.clearCache();

            // キャッシュがクリアされていることを確認（新しいインスタンスが作成される）
            const fields = FieldsUtil.getMonthlyFields();
            expect(fields).toBeTruthy();
        });

        test("特定のキーのキャッシュをクリア", () => {
            FieldsUtil.getMonthlyFields(); // キャッシュに保存
            FieldsUtil.clearCache("monthly_fields");

            // キャッシュがクリアされていることを確認
            const fields = FieldsUtil.getMonthlyFields();
            expect(fields).toBeTruthy();
        });
    });

    describe("fieldsToStringArray", () => {
        test("フィールド名の配列を文字列配列として返す", () => {
            const fields = ["field1", "field2", "field3"];

            const result = FieldsUtil.fieldsToStringArray(fields);

            expect(result).toEqual(fields);
        });
    });
});
