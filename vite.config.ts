import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
    // 環境変数を読み込む
    const env = loadEnv(mode, process.cwd(), "");

    // 環境変数でビルド対象を制御
    const buildTarget = process.env.BUILD_TARGET || "desktop";

    const inputMap = {
        plugin: { plugin: "./src/plugin/main.ts" },
    };

    // 出力ディレクトリを分ける代わりに、emptyOutDirをfalseにして上書きを防ぐ
    const selectedInput = inputMap[buildTarget as keyof typeof inputMap] || inputMap.plugin;

    // inputが空の場合はdesktopを使用
    const finalInput = Object.keys(selectedInput).length > 0 ? selectedInput : inputMap.plugin;

    return {
        build: {
            outDir: "dist",
            emptyOutDir: false, // ビルド前にディレクトリをクリアしない
            sourcemap: true,
            rollupOptions: {
                input: finalInput,
                output: {
                    entryFileNames: "[name].js",
                    format: "iife",
                    // jQueryの外部依存設定を削除 - すべてバンドルに含める
                },
                external: [
                    // ネイティブモジュールを外部化
                    "fsevents",
                    /^fsevents/,
                ],
            },
        },
        // 開発時の設定
        define: {
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
        },
        resolve: {
            // dompurifyを適切に解決するための設定
            conditions: ["browser", "module", "import"],
        },
        optimizeDeps: {
            // dompurifyを事前バンドルに含める（開発時のみ）
            include: ["dompurify"],
        },
        ssr: {
            // SSR環境ではdompurifyを使用しない
            noExternal: ["dompurify"],
        },
    };
});
