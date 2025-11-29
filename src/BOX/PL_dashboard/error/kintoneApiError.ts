// それ以外の登録失敗（ロールバック対象）
export class kintoneApiFatalRegisterError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FatalRegisterError";
    }

    /**
     * ユーザーフレンドリーなメッセージを取得
     * *  ユーザーフレンドリーなメッセージ
     */
    getUserFriendlyMessage(): string {
        // 技術的なメッセージをユーザーフレンドリーなメッセージに変換
        if (this.message.includes("登録") || this.message.includes("保存")) {
            return "データの登録中にエラーが発生しました。しばらく待ってから再度お試しください。";
        }
        if (this.message.includes("更新")) {
            return "データの更新中にエラーが発生しました。しばらく待ってから再度お試しください。";
        }
        if (this.message.includes("削除")) {
            return "データの削除中にエラーが発生しました。しばらく待ってから再度お試しください。";
        }
        return "データの処理中にエラーが発生しました。しばらく待ってから再度お試しください。";
    }
}
