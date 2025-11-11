import * as fs from "fs";
import * as path from "path";
import { InterfaceDeclaration, Project } from "ts-morph";

/**
 * ts-morphを使用してTypeScriptの型定義からフィールド定義を自動生成するスクリプト
 */
class FieldsGenerator {
    private project: Project;
    private fieldsDir: string;
    private outputDir: string;

    constructor() {
        this.project = new Project({
            tsConfigFilePath: path.resolve(__dirname, "../../../tsconfig.json"),
        });
        this.fieldsDir = path.resolve(__dirname, "../fields");
        this.outputDir = path.resolve(__dirname, "../generated");

        // 出力ディレクトリが存在しない場合は作成
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * フィールド定義ファイルを解析してフィールドリストを抽出
     */
    generateFieldDefinitions(): void {
        console.log("🔍 フィールド定義ファイルを解析中...");

        // 各フィールド定義ファイルを解析
        const fieldFiles = [
            { file: "month_fields.d.ts", namespace: "monthly", interface: "Fields" },
            { file: "daily_fields.d.ts", namespace: "daily", interface: "Fields" },
            { file: "line_daily_fields.d.ts", namespace: "line_daily", interface: "Fields" },
            { file: "model_master_fields.d.ts", namespace: "model_master", interface: "Fields" },
            { file: "holiday_fields.d.ts", namespace: "holiday", interface: "Fields" },
        ];

        const fieldDefinitions: Record<string, string[]> = {};

        for (const fieldFile of fieldFiles) {
            const filePath = path.join(this.fieldsDir, fieldFile.file);

            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️  ファイルが見つかりません: ${filePath}`);
                continue;
            }

            console.log(`📄 解析中: ${fieldFile.file}`);

            // ファイルをプロジェクトに追加
            const sourceFile = this.project.addSourceFileAtPath(filePath);

            // 名前空間からインターフェースを取得
            const namespaces = sourceFile.getModules();
            const targetNamespace = namespaces.find(
                (ns: any) => ns.getName() === fieldFile.namespace
            );

            if (!targetNamespace) {
                console.warn(
                    `⚠️  名前空間 '${fieldFile.namespace}' が見つかりません in ${fieldFile.file}`
                );
                continue;
            }

            const interfaces = targetNamespace.getInterfaces();
            const targetInterface = interfaces.find(
                (iface: any) => iface.getName() === fieldFile.interface
            );

            if (!targetInterface) {
                console.warn(
                    `⚠️  インターフェース '${fieldFile.interface}' が見つかりません in ${fieldFile.namespace}`
                );
                continue;
            }

            // インターフェースのプロパティからフィールド名を抽出
            const fields = this.extractFieldsFromInterface(targetInterface);
            fieldDefinitions[fieldFile.namespace] = fields;

            console.log(`✅ ${fieldFile.namespace}: ${fields.length}個のフィールドを検出`);
        }

        // 生成されたフィールド定義を出力
        this.generateFieldsFile(fieldDefinitions);
        this.generateTypedFieldsFile(fieldDefinitions);

        console.log("🎉 フィールド定義の生成が完了しました！");
    }

    /**
     * インターフェースからフィールド名を抽出
     */
    private extractFieldsFromInterface(interfaceDecl: InterfaceDeclaration): string[] {
        const fields: string[] = [];

        // プロパティシグネチャを取得
        const properties = interfaceDecl.getProperties();

        for (const property of properties) {
            const fieldName = property.getName();
            const fieldType = property.getTypeNodeOrThrow().getText();

            // SUBTABLEタイプやComplexな型は除外
            if (this.shouldIncludeField(fieldName, fieldType)) {
                fields.push(fieldName);
            } else {
                console.log(`🚫 除外: ${fieldName} (タイプ: ${fieldType})`);
            }
        }

        return fields.sort(); // アルファベット順でソート
    }

    /**
     * フィールドを含めるかどうかの判定
     */
    private shouldIncludeField(fieldName: string, fieldType: string): boolean {
        // 除外するフィールドタイプ
        const excludeTypes = ["SUBTABLE", 'type: "SUBTABLE"', "Array<{", "value: Array<"];

        // 除外するフィールド名パターン
        const excludeNames = ["deflist_table", "man_hours_table", "chg_o_table"];

        // タイプによる除外
        if (excludeTypes.some((excludeType) => fieldType.includes(excludeType))) {
            return false;
        }

        // 名前による除外
        if (excludeNames.includes(fieldName)) {
            return false;
        }

        return true;
    }

    /**
     * 基本的なフィールド定義ファイルを生成
     */
    private generateFieldsFile(fieldDefinitions: Record<string, string[]>): void {
        const outputPath = path.join(this.outputDir, "fields.ts");

        let content = `/**
 * 自動生成されたフィールド定義
 * ⚠️ このファイルは自動生成されます。直接編集しないでください。
 *
 * 生成日時: ${new Date().toISOString()}
 * 生成コマンド: npm run generate:fields
 */

export const GENERATED_FIELDS = {\n`;

        for (const [namespace, fields] of Object.entries(fieldDefinitions)) {
            content += `  ${namespace}: [\n`;
            for (const field of fields) {
                content += `    '${field}',\n`;
            }
            content += `  ],\n\n`;
        }

        content += `} as const;

/**
 * フィールド定義へのアクセサー
 */
export class GeneratedFieldsUtil {
  static getMonthlyFields(): readonly string[] {
    return GENERATED_FIELDS.monthly;
  }

  static getDailyFields(): readonly string[] {
    return GENERATED_FIELDS.daily;
  }

  static getLineDailyFields(): readonly string[] {
    return GENERATED_FIELDS.line_daily;
  }

  static getModelMasterFields(): readonly string[] {
    return GENERATED_FIELDS.model_master;
  }

  static getHolidayFields(): readonly string[] {
    return GENERATED_FIELDS.holiday;
  }

  static getAllFields(): typeof GENERATED_FIELDS {
    return GENERATED_FIELDS;
  }
}
`;

        fs.writeFileSync(outputPath, content, "utf-8");
        console.log(`📝 生成完了: ${outputPath}`);
    }

    /**
     * 型安全なフィールド定義ファイルを生成
     */
    private generateTypedFieldsFile(fieldDefinitions: Record<string, string[]>): void {
        const outputPath = path.join(this.outputDir, "typed-fields.ts");

        let content = `/**
 * 型安全なフィールド定義
 * ⚠️ このファイルは自動生成されます。直接編集しないでください。
 *
 * 生成日時: ${new Date().toISOString()}
 */

/// <reference path="../fields/month_fields.d.ts" />
/// <reference path="../fields/daily_fields.d.ts" />
/// <reference path="../fields/line_daily_fields.d.ts" />
/// <reference path="../fields/model_master_fields.d.ts" />
/// <reference path="../fields/holiday_fields.d.ts" />

`;

        // 各名前空間の型定義を生成
        for (const [namespace, fields] of Object.entries(fieldDefinitions)) {
            const capitalizedNamespace = namespace.charAt(0).toUpperCase() + namespace.slice(1);

            content += `/**
 * ${capitalizedNamespace} フィールドの型安全な定義
 */
export const ${namespace.toUpperCase()}_FIELD_KEYS = {\n`;

            for (const field of fields) {
                content += `  ${field}: '${field}' as const,\n`;
            }

            content += `} as const;

export type ${capitalizedNamespace}FieldKey = keyof typeof ${namespace.toUpperCase()}_FIELD_KEYS;
export type ${capitalizedNamespace}FieldValue = typeof ${namespace.toUpperCase()}_FIELD_KEYS[${capitalizedNamespace}FieldKey];

`;
        }

        content += `/**
 * 型安全なフィールドアクセサー
 */
export class TypeSafeGeneratedFields {
  static getMonthlyField<K extends MonthlyFieldKey>(key: K): typeof MONTHLY_FIELD_KEYS[K] {
    return MONTHLY_FIELD_KEYS[key];
  }

  static getDailyField<K extends DailyFieldKey>(key: K): typeof DAILY_FIELD_KEYS[K] {
    return DAILY_FIELD_KEYS[key];
  }

  static getLineDailyField<K extends Line_dailyFieldKey>(key: K): typeof LINE_DAILY_FIELD_KEYS[K] {
    return LINE_DAILY_FIELD_KEYS[key];
  }

  static getModelMasterField<K extends Model_masterFieldKey>(key: K): typeof MODEL_MASTER_FIELD_KEYS[K] {
    return MODEL_MASTER_FIELD_KEYS[key];
  }

  static getHolidayField<K extends HolidayFieldKey>(key: K): typeof HOLIDAY_FIELD_KEYS[K] {
    return HOLIDAY_FIELD_KEYS[key];
  }
}
`;

        fs.writeFileSync(outputPath, content, "utf-8");
        console.log(`📝 生成完了: ${outputPath}`);
    }
}

// スクリプト実行部分
if (require.main === module) {
    console.log("🚀 フィールド定義生成スクリプトを開始...");

    try {
        const generator = new FieldsGenerator();
        generator.generateFieldDefinitions();

        console.log("✨ 全ての処理が正常に完了しました！");
        process.exit(0);
    } catch (error) {
        console.error("❌ エラーが発生しました:", error);
        process.exit(1);
    }
}

export { FieldsGenerator };
