import { defineConfig } from "vite";

export default defineConfig(({ command, mode }) => {
    // 環境変数でビルド対象を制御
    const buildTarget = process.env.BUILD_TARGET || "desktop";

    const inputMap = {
        desktop: { PL_dashboard: "./src/BOX/PL_dashboard/PL_dashboard.ts" },
        mobile: { "PL_dashboard.mobile": "./src/BOX/PL_dashboard//PL_dashboard.mobile.ts" },
    };

    // 出力ディレクトリを分ける代わりに、emptyOutDirをfalseにして上書きを防ぐ
    return {
        build: {
            outDir: "dist",
            emptyOutDir: false, // ビルド前にディレクトリをクリアしない
            sourcemap: true,
            rollupOptions: {
                input: inputMap[buildTarget as keyof typeof inputMap] || inputMap.desktop,
                output: {
                    entryFileNames: "[name].js",
                    format: "iife",
                    // jQueryの外部依存設定を削除 - すべてバンドルに含める
                },
            },
        },
        // 開発時の設定
        define: {
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
        },
    };
});
