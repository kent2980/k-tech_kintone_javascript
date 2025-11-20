/**
 * ロギングユーティリティ
 */
export class Logger {
    private static isDevelopment = (() => {
        // @ts-ignore - import.meta.envはViteビルド時に存在するが、Jest環境では存在しない可能性がある
        try {
            // @ts-ignore - import.meta.envはViteビルド時に存在する
            if (import.meta && import.meta.env && import.meta.env.MODE) {
                // @ts-ignore - import.meta.envはViteビルド時に存在する
                return import.meta.env.MODE === "development";
            }
        } catch {
            // import.metaが存在しない場合（Jest環境など）
        }
        return typeof process !== "undefined" && process.env
            ? process.env.NODE_ENV === "development"
            : false;
    })();

    /**
     * 情報ログを出力
     * @param message - メッセージ
     * @param data - 追加データ（オプション）
     */
    public static info(message: string, data?: unknown): void {
        if (this.isDevelopment) {
            console.log(`ℹ️ ${message}`, data || "");
        }
    }

    /**
     * 警告ログを出力
     * @param message - メッセージ
     * @param data - 追加データ（オプション）
     */
    public static warn(message: string, data?: unknown): void {
        if (this.isDevelopment) {
            console.warn(`⚠️ ${message}`, data || "");
        }
    }

    /**
     * エラーログを出力
     * @param message - メッセージ
     * @param error - エラーオブジェクト（オプション）
     */
    public static error(message: string, error?: Error | unknown): void {
        console.error(`❌ ${message}`, error || "");
    }

    /**
     * 成功ログを出力
     * @param message - メッセージ
     * @param data - 追加データ（オプション）
     */
    public static success(message: string, data?: unknown): void {
        if (this.isDevelopment) {
            console.log(`✅ ${message}`, data || "");
        }
    }

    /**
     * デバッグログを出力
     * @param message - メッセージ
     * @param data - 追加データ（オプション）
     */
    public static debug(message: string, data?: unknown): void {
        if (this.isDevelopment && console.debug) {
            console.debug(`🐛 ${message}`, data || "");
        }
    }
}
