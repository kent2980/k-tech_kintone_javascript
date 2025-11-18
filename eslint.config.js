const js = require("@eslint/js");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
    js.configs.recommended,
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
                project: "./tsconfig.json",
                tsconfigRootDir: __dirname,
            },
            globals: {
                kintone: "readonly",
                cybozu: "readonly",
                window: "readonly",
                document: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                clearTimeout: "readonly",
                clearInterval: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            "@typescript-eslint/explicit-function-return-type": "warn",
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-inferrable-types": "off",
            "no-console": "warn",
            "prefer-const": "error",
            "no-var": "error",
            "no-undef": "off", // kintoneのグローバル変数があるため一時的に無効化
            "no-unused-vars": "warn", // 開発中は警告レベル
            "@typescript-eslint/naming-convention": [
                "error",
                // 定数（UPPER_SNAKE_CASE、camelCase、PascalCase、snake_case）を許可
                {
                    selector: "variable",
                    modifiers: ["const"],
                    format: ["UPPER_CASE", "camelCase", "PascalCase", "snake_case"],
                },
                // 通常の変数はcamelCase、UPPER_CASE、PascalCase、snake_caseを許可
                {
                    selector: "variable",
                    format: ["camelCase", "UPPER_CASE", "PascalCase", "snake_case"],
                },
                // パラメータはcamelCase、PascalCase、snake_caseを許可（未使用パラメータは_で始まることを許可）
                {
                    selector: "parameter",
                    format: ["camelCase", "PascalCase", "snake_case"],
                    leadingUnderscore: "allow",
                },
                // 関数はcamelCase
                {
                    selector: "function",
                    format: ["camelCase", "PascalCase"],
                },
                // type / interface のプロパティは除外（format のみ許容）
                {
                    selector: [
                        "property",
                        "classProperty",
                        "objectLiteralProperty",
                        "typeProperty",
                    ],
                    format: null, // ← これで検証しない（除外）
                },
            ],
        },
    },
    {
        files: ["**/*.{js,jsx}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
                // JavaScriptファイルにはprojectオプションを指定しない
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            "@typescript-eslint/explicit-function-return-type": "off", // JavaScriptでは不要
            "@typescript-eslint/no-explicit-any": "warn", // JavaScriptでは警告レベル
            "@typescript-eslint/no-unused-vars": "warn",
            "no-console": "warn",
            "prefer-const": "error",
            "no-var": "error",
            "no-undef": "off",
            "no-unused-vars": "warn",
        },
    },
    {
        ignores: [
            "node_modules/**",
            "dist/**",
            "coverage/**",
            "docs/**", // 自動生成されたドキュメント
            "*.config.js",
            "*.config.ts",
            ".lintstagedrc.js", // lint-staged設定ファイル
            ".vscode/**",
            ".git/**",
            "globals.d.ts",
            "kintone.d.ts",
            "src/setupTests.ts",
            "src/**/__tests__/**",
            "src/**/__mocks__/**", // テスト用のモックファイル
            "src/BOX/PL_dashboard/PL_dashboard.ts", // Legacy file - will be refactored
            "src/BOX/PL_dashboard/generated/**", // 自動生成されたファイル
            "src/BOX/PL_dashboard/scripts/**", // Node.jsスクリプト
        ],
    },
];
