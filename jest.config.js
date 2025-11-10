module.exports = {
    // TypeScript用の設定
    preset: "ts-jest",
    testEnvironment: "jsdom",

    // ファイルパターン
    testMatch: ["**/__tests__/**/*.(ts|tsx)", "**/*.(test|spec).(ts|tsx)"],

    // モジュール解決
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

    // セットアップファイル
    setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],

    // カバレッジ設定
    collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
        "!src/**/*.d.ts",
        "!src/setupTests.ts",
        "!src/**/*.test.{ts,tsx}",
        "!src/**/*.spec.{ts,tsx}",
    ],

    // カバレッジ出力
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html"],

    // モック設定
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },

    // グローバル変数（kintone環境をモック）
    transform: {
        "^.+\\.(ts|tsx)$": [
            "ts-jest",
            {
                tsconfig: {
                    module: "commonjs",
                },
            },
        ],
    },

    globals: {
        kintone: {},
    },

    // テスト環境のセットアップ
    testEnvironmentOptions: {
        // JSDOM用の設定
        url: "https://example.cybozu.com",
    },

    // 無視するパターン
    testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"],

    // 変換を無視するパターン
    transformIgnorePatterns: ["/node_modules/(?!(@kintone)/)"],
};
