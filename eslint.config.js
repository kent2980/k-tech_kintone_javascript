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
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-inferrable-types": "off",
            "no-console": "warn",
            "prefer-const": "error",
            "no-var": "error",
            "no-undef": "off", // kintoneのグローバル変数があるため一時的に無効化
            "no-unused-vars": "warn", // 開発中は警告レベル
        },
    },
    {
        ignores: [
            "node_modules/**",
            "dist/**",
            "coverage/**",
            "*.config.js",
            "*.config.ts",
            ".vscode/**",
            ".git/**",
            "globals.d.ts",
            "kintone.d.ts",
            "src/setupTests.ts",
            "src/**/__tests__/**",
            "src/BOX/PL_dashboard/PL_dashboard.ts", // Legacy file - will be refactored
            "src/BOX/PL_dashboard/generated/**", // 自動生成されたファイル
            "src/BOX/PL_dashboard/scripts/generate-fields.js", // Node.jsスクリプト
        ],
    },
];
