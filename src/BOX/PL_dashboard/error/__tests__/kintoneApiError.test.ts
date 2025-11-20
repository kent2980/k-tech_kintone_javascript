/**
 * kintoneApiErrorのユニットテスト
 */

import { kintoneApiFatalRegisterError } from "../kintoneApiError";

describe("kintoneApiFatalRegisterError", () => {
    describe("constructor", () => {
        test("エラーメッセージを設定", () => {
            const error = new kintoneApiFatalRegisterError("テストエラー");
            expect(error.message).toBe("テストエラー");
            expect(error.name).toBe("FatalRegisterError");
            expect(error).toBeInstanceOf(Error);
        });
    });

    describe("getUserFriendlyMessage", () => {
        test("登録に関するメッセージを変換", () => {
            const error = new kintoneApiFatalRegisterError("データの登録に失敗しました");
            const message = error.getUserFriendlyMessage();
            expect(message).toBe(
                "データの登録中にエラーが発生しました。しばらく待ってから再度お試しください。"
            );
        });

        test("保存に関するメッセージを変換", () => {
            const error = new kintoneApiFatalRegisterError("データの保存に失敗しました");
            const message = error.getUserFriendlyMessage();
            expect(message).toBe(
                "データの登録中にエラーが発生しました。しばらく待ってから再度お試しください。"
            );
        });

        test("更新に関するメッセージを変換", () => {
            const error = new kintoneApiFatalRegisterError("データの更新に失敗しました");
            const message = error.getUserFriendlyMessage();
            expect(message).toBe(
                "データの更新中にエラーが発生しました。しばらく待ってから再度お試しください。"
            );
        });

        test("削除に関するメッセージを変換", () => {
            const error = new kintoneApiFatalRegisterError("データの削除に失敗しました");
            const message = error.getUserFriendlyMessage();
            expect(message).toBe(
                "データの削除中にエラーが発生しました。しばらく待ってから再度お試しください。"
            );
        });

        test("その他のメッセージをデフォルトメッセージに変換", () => {
            const error = new kintoneApiFatalRegisterError("不明なエラーが発生しました");
            const message = error.getUserFriendlyMessage();
            expect(message).toBe(
                "データの処理中にエラーが発生しました。しばらく待ってから再度お試しください。"
            );
        });

        test("空のメッセージをデフォルトメッセージに変換", () => {
            const error = new kintoneApiFatalRegisterError("");
            const message = error.getUserFriendlyMessage();
            expect(message).toBe(
                "データの処理中にエラーが発生しました。しばらく待ってから再度お試しください。"
            );
        });
    });
});
