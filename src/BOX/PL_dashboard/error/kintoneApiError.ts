// 重複エラー（ロールバックしない）
export class kintoneApiDuplicateError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DuplicateError";
    }
}

// それ以外の登録失敗（ロールバック対象）
export class kintoneApiFatalRegisterError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FatalRegisterError";
    }
}
