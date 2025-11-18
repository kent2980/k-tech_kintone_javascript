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
        "src/BOX/PL_dashboard/**/*.{ts,tsx}",
        "!src/BOX/PL_dashboard/**/*.d.ts",
        "!src/BOX/PL_dashboard/**/__tests__/**",
        "!src/BOX/PL_dashboard/**/__mocks__/**",
        "!src/BOX/PL_dashboard/**/*.test.{ts,tsx}",
        "!src/BOX/PL_dashboard/**/*.spec.{ts,tsx}",
        "!src/BOX/PL_dashboard/fields/**",
        "!src/BOX/PL_dashboard/generated/**",
        "!src/BOX/PL_dashboard/scripts/**",
    ],

    // カバレッジ出力
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html"],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
        "src/BOX/PL_dashboard/services/**/*.ts": {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
        "src/BOX/PL_dashboard/utils/**/*.ts": {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
        "src/BOX/PL_dashboard/components/**/*.ts": {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },

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
