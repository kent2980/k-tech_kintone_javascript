import { GeneratedFieldsUtil } from "../generated/fields";

/**
 * ts-morphで自動生成されたフィールド定義を使用するユーティリティクラス
 * TypeScriptのインターフェース定義から動的に生成されたフィールドリストを提供
 */
export class FieldsUtil {
    // フィールド情報のキャッシュ
    private static fieldCache: Map<string, string[]> = new Map();

    /**
     * PL月次データのフィールド名を取得
     * @returns フィールド名の配列
     */
    static getMonthlyFields(): string[] {
        const cacheKey = "monthly_fields";

        if (this.fieldCache.has(cacheKey)) {
            return this.fieldCache.get(cacheKey)!;
        }

        const fields = [...GeneratedFieldsUtil.getMonthlyFields()];
        this.fieldCache.set(cacheKey, fields);
        return fields;
    }

    /**
     * PL日次データのフィールド名を取得
     * @returns フィールド名の配列
     */
    static getDailyFields(): string[] {
        const cacheKey = "daily_fields";

        if (this.fieldCache.has(cacheKey)) {
            return this.fieldCache.get(cacheKey)!;
        }

        const fields = [...GeneratedFieldsUtil.getDailyFields()];
        this.fieldCache.set(cacheKey, fields);
        return fields;
    }

    /**
     * 生産日報データのフィールド名を取得
     * @returns フィールド名の配列
     */
    static getLineDailyFields(): string[] {
        const cacheKey = "line_daily_fields";

        if (this.fieldCache.has(cacheKey)) {
            return this.fieldCache.get(cacheKey)!;
        }

        const fields = [...GeneratedFieldsUtil.getLineDailyFields()];
        this.fieldCache.set(cacheKey, fields);
        return fields;
    }

    /**
     * マスタ機種データのフィールド名を取得
     * @returns フィールド名の配列
     */
    static getModelMasterFields(): string[] {
        const cacheKey = "model_master_fields";

        if (this.fieldCache.has(cacheKey)) {
            return this.fieldCache.get(cacheKey)!;
        }

        const fields = [...GeneratedFieldsUtil.getModelMasterFields()];
        this.fieldCache.set(cacheKey, fields);
        return fields;
    }

    /**
     * 祝日データのフィールド名を取得
     * @returns フィールド名の配列
     */
    static getHolidayFields(): string[] {
        const cacheKey = "holiday_fields";

        if (this.fieldCache.has(cacheKey)) {
            return this.fieldCache.get(cacheKey)!;
        }

        const fields = [...GeneratedFieldsUtil.getHolidayFields()];
        this.fieldCache.set(cacheKey, fields);
        return fields;
    }

    /**
     * 型定義からフィールド名を自動抽出する汎用メソッド
     * @param sampleObject - 型のサンプルオブジェクト
     * @returns フィールド名の配列
     */
    static extractFieldsFromType<T extends Record<string, unknown>>(
        sampleObject: Partial<T>
    ): (keyof T)[] {
        return Object.keys(sampleObject) as (keyof T)[];
    }

    /**
     * 複数のフィールドリストから共通フィールドを抽出
     * @param fieldLists - フィールドリストの配列
     * @returns 共通フィールドの配列
     */
    static getCommonFields(fieldLists: string[][]): string[] {
        if (fieldLists.length === 0) return [];

        return fieldLists[0].filter((field) => fieldLists.every((list) => list.includes(field)));
    }

    /**
     * フィールドを特定の条件でフィルタリング
     * @param fields - フィールド名の配列
     * @param includePatterns - 含めるパターン（正規表現文字列の配列）
     * @param excludePatterns - 除外するパターン（正規表現文字列の配列）
     * @returns フィルタリング後のフィールド配列
     */
    static filterFields(
        fields: string[],
        includePatterns: string[] = [],
        excludePatterns: string[] = []
    ): string[] {
        let filteredFields = fields;

        // 含めるパターンが指定されている場合
        if (includePatterns.length > 0) {
            const includeRegexes = includePatterns.map((pattern) => new RegExp(pattern));
            filteredFields = filteredFields.filter((field) =>
                includeRegexes.some((regex) => regex.test(field))
            );
        }

        // 除外パターンが指定されている場合
        if (excludePatterns.length > 0) {
            const excludeRegexes = excludePatterns.map((pattern) => new RegExp(pattern));
            filteredFields = filteredFields.filter(
                (field) => !excludeRegexes.some((regex) => regex.test(field))
            );
        }

        return filteredFields;
    }

    /**
     * 生成されたフィールド定義の統計情報を取得
     * @returns フィールド統計
     */
    static getFieldStatistics(): {
        totalFields: number;
        fieldsByType: Record<string, number>;
    } {
        const allFields = GeneratedFieldsUtil.getAllFields();
        const stats = {
            totalFields: 0,
            fieldsByType: {} as Record<string, number>,
        };

        for (const [type, fields] of Object.entries(allFields)) {
            stats.fieldsByType[type] = fields.length;
            stats.totalFields += fields.length;
        }

        return stats;
    }

    /**
     * 特定のフィールドタイプに基づいてフィールドをグループ化
     * @param fields - フィールド名の配列
     * @returns グループ化されたフィールド
     */
    static groupFieldsByType(fields: string[]): Record<string, string[]> {
        const groups: Record<string, string[]> = {
            date: [],
            number: [],
            text: [],
            time: [],
            other: [],
        };

        for (const field of fields) {
            if (field.includes("date") || field.includes("_at")) {
                groups.date.push(field);
            } else if (
                field.includes("number") ||
                field.includes("count") ||
                field.includes("cost") ||
                field.includes("value")
            ) {
                groups.number.push(field);
            } else if (
                field.includes("time") ||
                field.includes("hour") ||
                field.includes("overtime")
            ) {
                groups.time.push(field);
            } else if (field.includes("text") || field.includes("name") || field.includes("code")) {
                groups.text.push(field);
            } else {
                groups.other.push(field);
            }
        }

        return groups;
    }

    /**
     * キャッシュをクリア
     * @param cacheKey - 特定のキーのキャッシュをクリア（省略時は全て）
     */
    static clearCache(cacheKey?: string): void {
        if (cacheKey !== undefined) {
            this.fieldCache.delete(cacheKey);
        } else {
            this.fieldCache.clear();
        }
    }

    /**
     * フィールド名の配列を文字列配列として返す
     * @param fields - フィールド名の配列
     * @returns 文字列配列
     */
    static fieldsToStringArray(fields: string[]): string[] {
        return fields;
    }

    /**
     * デバッグ用：全フィールド定義を表示
     */
    static debugPrintAllFields(): void {
        console.log("📋 Generated Fields Debug Info:");
        const allFields = GeneratedFieldsUtil.getAllFields();

        for (const [type, fields] of Object.entries(allFields)) {
            console.log(`\n🔍 ${type.toUpperCase()} (${fields.length} fields):`);
            fields.forEach((field, index) => {
                console.log(`  ${(index + 1).toString().padStart(2, "0")}. ${field}`);
            });
        }

        const stats = this.getFieldStatistics();
        console.log(
            `\n📊 Total: ${stats.totalFields} fields across ${Object.keys(stats.fieldsByType).length} types`
        );
    }
}
