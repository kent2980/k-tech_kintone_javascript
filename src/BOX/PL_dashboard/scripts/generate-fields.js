const { Project } = require("ts-morph");
const path = require("path");
const fs = require("fs");

/**
 * ts-morphを使用してTypeScriptの型定義からフィールド定義を自動生成するスクリプト
 */
class FieldsGenerator {
    constructor() {
        this.project = new Project({
            tsConfigFilePath: path.resolve(__dirname, "../../../../tsconfig.json"),
            compilerOptions: {
                target: 99, // Latest
            },
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
    generateFieldDefinitions() {
        console.log("🔍 フィールド定義ファイルを解析中...");

        // 各フィールド定義ファイルを解析
        const fieldFiles = [
            { file: "month_fields.d.ts", namespace: "monthly", interface: "Fields" },
            { file: "daily_fields.d.ts", namespace: "daily", interface: "Fields" },
            { file: "line_daily_fields.d.ts", namespace: "line_daily", interface: "Fields" },
            { file: "model_master_fields.d.ts", namespace: "model_master", interface: "Fields" },
            { file: "holiday_fields.d.ts", namespace: "holiday", interface: "Fields" },
        ];

        const fieldDefinitions = {};

        for (const fieldFile of fieldFiles) {
            const filePath = path.join(this.fieldsDir, fieldFile.file);

            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️  ファイルが見つかりません: ${filePath}`);
                continue;
            }

            console.log(`📄 解析中: ${fieldFile.file}`);

            try {
                // ファイルをプロジェクトに追加
                const sourceFile = this.project.addSourceFileAtPath(filePath);

                // 名前空間からインターフェースを取得
                const modules = sourceFile.getModules();
                const targetNamespace = modules.find((ns) => ns.getName() === fieldFile.namespace);

                if (!targetNamespace) {
                    console.warn(
                        `⚠️  名前空間 '${fieldFile.namespace}' が見つかりません in ${fieldFile.file}`
                    );
                    continue;
                }

                const interfaces = targetNamespace.getInterfaces();
                const targetInterface = interfaces.find(
                    (iface) => iface.getName() === fieldFile.interface
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
            } catch (error) {
                console.error(`❌ ${fieldFile.file} の解析でエラー:`, error.message);

                // フォールバック: ファイル内容を正規表現で解析
                console.log(`🔄 正規表現による解析にフォールバック...`);
                const fields = this.extractFieldsFromFileContent(filePath, fieldFile.namespace);
                if (fields.length > 0) {
                    fieldDefinitions[fieldFile.namespace] = fields;
                    console.log(
                        `✅ ${fieldFile.namespace}: ${fields.length}個のフィールドを検出（正規表現）`
                    );
                }
            }
        }

        // 生成されたフィールド定義を出力
        this.generateFieldsFile(fieldDefinitions);

        console.log("🎉 フィールド定義の生成が完了しました！");
    }

    /**
     * インターフェースからフィールド名を抽出
     */
    extractFieldsFromInterface(interfaceDecl) {
        const fields = [];

        // プロパティシグネチャを取得
        const properties = interfaceDecl.getProperties();

        for (const property of properties) {
            const fieldName = property.getName();
            const fieldType = property.getTypeNode() ? property.getTypeNode().getText() : "";

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
     * ファイル内容を正規表現で解析してフィールドを抽出（フォールバック）
     */
    extractFieldsFromFileContent(filePath, namespace) {
        const content = fs.readFileSync(filePath, "utf-8");
        const fields = [];

        // interface Fields { ... } の部分を抽出
        const interfaceRegex = new RegExp(`interface\\s+Fields\\s*\\{([^}]+)\\}`, "s");
        const match = content.match(interfaceRegex);

        if (!match) {
            console.warn(`⚠️ Fieldsインターフェースが見つかりません: ${filePath}`);
            return [];
        }

        const interfaceBody = match[1];

        // フィールド名を抽出（コメント行とSUBTABLEは除外）
        const fieldLines = interfaceBody.split("\n");

        for (const line of fieldLines) {
            const trimmedLine = line.trim();

            // 空行やコメント行をスキップ
            if (
                !trimmedLine ||
                trimmedLine.startsWith("/**") ||
                trimmedLine.startsWith("*") ||
                trimmedLine.startsWith("*/")
            ) {
                continue;
            }

            // フィールド定義行を解析
            const fieldMatch = trimmedLine.match(/^(\w+)\s*:/);
            if (fieldMatch) {
                const fieldName = fieldMatch[1];

                // SUBTABLEや複雑な型をチェック
                if (this.shouldIncludeField(fieldName, trimmedLine)) {
                    fields.push(fieldName);
                } else {
                    console.log(`🚫 除外: ${fieldName} (行: ${trimmedLine})`);
                }
            }
        }

        return fields.sort();
    }

    /**
     * フィールドを含めるかどうかの判定
     */
    shouldIncludeField(fieldName, fieldType) {
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
    generateFieldsFile(fieldDefinitions) {
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

module.exports = { FieldsGenerator };
