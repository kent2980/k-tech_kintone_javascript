/**
 * ユーザーフレンドリーなエラーメッセージ変換ユーティリティ
 * 技術的なエラーメッセージをユーザーが理解しやすいメッセージに変換
 */

/**
 * エラーコードとユーザーフレンドリーなメッセージのマッピング
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
    // ネットワーク関連
    NetworkError: "ネットワーク接続に問題があります。インターネット接続を確認してください。",
    TimeoutError: "リクエストがタイムアウトしました。しばらく待ってから再度お試しください。",
    "Failed to fetch": "データの取得に失敗しました。ネットワーク接続を確認してください。",

    // Kintone API関連
    CB_AU01: "この操作を実行する権限がありません。管理者にお問い合わせください。",
    CB_VA01: "入力データに問題があります。入力内容を確認してください。",
    CB_NO02: "指定されたレコードが見つかりません。",
    CB_DE01: "データの登録中にエラーが発生しました。",
    CB_DE02: "データの更新中にエラーが発生しました。",
    CB_DE03: "データの削除中にエラーが発生しました。",
    FatalRegisterError:
        "データの登録中にエラーが発生しました。しばらく待ってから再度お試しください。",

    // ファイル関連
    "File not found": "ファイルが見つかりません。ファイルが存在するか確認してください。",
    "Invalid file format":
        "ファイルの形式が正しくありません。正しい形式のファイルを選択してください。",
    "File too large": "ファイルサイズが大きすぎます。より小さなファイルを選択してください。",

    // データ関連
    "Invalid data": "データの形式が正しくありません。",
    "Data validation failed": "データの検証に失敗しました。入力内容を確認してください。",
    "Duplicate record": "同じデータが既に登録されています。",

    // 一般的なエラー
    UNKNOWN_ERROR: "予期しないエラーが発生しました。しばらく待ってから再度お試しください。",
    "Internal server error":
        "サーバーでエラーが発生しました。しばらく待ってから再度お試しください。",
};

/**
 * エラーメッセージのパターンマッチング
 */
const ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
    {
        pattern: /ネットワーク|network|connection|接続/i,
        message: "ネットワーク接続に問題があります。インターネット接続を確認してください。",
    },
    {
        pattern: /タイムアウト|timeout/i,
        message: "リクエストがタイムアウトしました。しばらく待ってから再度お試しください。",
    },
    {
        pattern: /権限|permission|authorization|認証/i,
        message: "この操作を実行する権限がありません。管理者にお問い合わせください。",
    },
    {
        pattern: /ファイル|file|形式|format/i,
        message: "ファイルの処理中にエラーが発生しました。ファイルの形式を確認してください。",
    },
    {
        pattern: /データ|data|登録|保存|save/i,
        message: "データの処理中にエラーが発生しました。しばらく待ってから再度お試しください。",
    },
    {
        pattern: /重複|duplicate|既に存在/i,
        message: "同じデータが既に登録されています。",
    },
    {
        pattern: /見つかりません|not found|存在しません/i,
        message: "指定されたデータが見つかりません。",
    },
];

/**
 * ユーザーフレンドリーなエラーメッセージ変換クラス
 */
export class UserFriendlyMessages {
    /**
     * エラーメッセージをユーザーフレンドリーなメッセージに変換
     */
    static toUserFriendly(error: Error | unknown, defaultMessage?: string): string {
        // エラーオブジェクトからメッセージを抽出
        let errorMessage = "";
        let errorCode = "";

        if (error instanceof Error) {
            errorMessage = error.message;
            errorCode = error.name;
        } else if (typeof error === "string") {
            errorMessage = error;
        } else {
            errorMessage = String(error);
        }

        // エラーコードでマッピングを確認
        if (errorCode && ERROR_MESSAGE_MAP[errorCode]) {
            return ERROR_MESSAGE_MAP[errorCode];
        }

        // エラーメッセージでマッピングを確認
        if (errorMessage && ERROR_MESSAGE_MAP[errorMessage]) {
            return ERROR_MESSAGE_MAP[errorMessage];
        }

        // パターンマッチングで確認
        for (const { pattern, message } of ERROR_PATTERNS) {
            if (pattern.test(errorMessage) || pattern.test(errorCode)) {
                return message;
            }
        }

        // デフォルトメッセージまたは一般的なメッセージを返す
        return (
            defaultMessage ||
            ERROR_MESSAGE_MAP["UNKNOWN_ERROR"] ||
            "予期しないエラーが発生しました。しばらく待ってから再度お試しください。"
        );
    }

    /**
     * エラーコードからユーザーフレンドリーなメッセージを取得
     */
    static fromErrorCode(errorCode: string, defaultMessage?: string): string {
        return (
            ERROR_MESSAGE_MAP[errorCode] ||
            defaultMessage ||
            ERROR_MESSAGE_MAP["UNKNOWN_ERROR"] ||
            "予期しないエラーが発生しました。しばらく待ってから再度お試しください。"
        );
    }

    /**
     * コンテキストに応じたユーザーフレンドリーなメッセージを生成
     */
    static fromContext(error: Error | unknown, context?: Record<string, unknown>): string {
        const baseMessage = this.toUserFriendly(error);

        // コンテキストに応じた追加情報を付与
        if (context) {
            if (context.method === "fetchPLMonthlyData") {
                return `${baseMessage}\n月次データの取得に失敗しました。`;
            }
            if (context.method === "fetchPLDailyData") {
                return `${baseMessage}\n日次データの取得に失敗しました。`;
            }
            if (context.method === "savePLMonthlyData") {
                return `${baseMessage}\n月次データの登録に失敗しました。`;
            }
            if (context.method === "savePLDailyData") {
                return `${baseMessage}\n日次データの登録に失敗しました。`;
            }
            if (context.method === "saveProductionReportData") {
                return `${baseMessage}\n生産日報データの登録に失敗しました。`;
            }
        }

        return baseMessage;
    }
}
