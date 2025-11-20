/**
 * UserFriendlyMessagesのユニットテスト
 */

import { UserFriendlyMessages } from "../UserFriendlyMessages";

describe("UserFriendlyMessages", () => {
    describe("toUserFriendly", () => {
        test("Errorオブジェクトからメッセージを変換", () => {
            const error = new Error("NetworkError");
            error.name = "NetworkError";
            const message = UserFriendlyMessages.toUserFriendly(error);

            expect(message).toContain("ネットワーク接続");
        });

        test("エラーコードでマッピングを確認", () => {
            const error = new Error("CB_AU01");
            error.name = "CB_AU01";
            const message = UserFriendlyMessages.toUserFriendly(error);

            expect(message).toContain("権限");
        });

        test("エラーメッセージでマッピングを確認", () => {
            const error = new Error("Failed to fetch");
            const message = UserFriendlyMessages.toUserFriendly(error);

            expect(message).toContain("データの取得に失敗");
        });

        test("パターンマッチングで確認", () => {
            const error = new Error("ネットワーク接続エラー");
            const message = UserFriendlyMessages.toUserFriendly(error);

            expect(message).toContain("ネットワーク接続");
        });

        test("文字列エラーを変換", () => {
            const message = UserFriendlyMessages.toUserFriendly("TimeoutError");

            expect(message).toContain("タイムアウト");
        });

        test("未知のエラーの場合はデフォルトメッセージを返す", () => {
            const error = new Error("Unknown error");
            const message = UserFriendlyMessages.toUserFriendly(error);

            expect(message).toContain("予期しないエラー");
        });

        test("デフォルトメッセージを指定", () => {
            const error = new Error("Unknown error");
            const message = UserFriendlyMessages.toUserFriendly(error, "カスタムメッセージ");

            expect(message).toBe("カスタムメッセージ");
        });

        test("その他の型のエラーを変換", () => {
            const message = UserFriendlyMessages.toUserFriendly({ error: "test" });

            expect(message).toContain("予期しないエラー");
        });
    });

    describe("fromErrorCode", () => {
        test("エラーコードからメッセージを取得", () => {
            const message = UserFriendlyMessages.fromErrorCode("CB_VA01");

            expect(message).toContain("入力データ");
        });

        test("未知のエラーコードの場合はデフォルトメッセージを返す", () => {
            const message = UserFriendlyMessages.fromErrorCode("UNKNOWN_CODE");

            expect(message).toContain("予期しないエラー");
        });

        test("デフォルトメッセージを指定", () => {
            const message = UserFriendlyMessages.fromErrorCode(
                "UNKNOWN_CODE",
                "カスタムメッセージ"
            );

            expect(message).toBe("カスタムメッセージ");
        });
    });

    describe("fromContext", () => {
        test("コンテキストなしでメッセージを生成", () => {
            const error = new Error("NetworkError");
            const message = UserFriendlyMessages.fromContext(error);

            expect(message).toContain("ネットワーク接続");
        });

        test("fetchPLMonthlyDataのコンテキストでメッセージを生成", () => {
            const error = new Error("NetworkError");
            const message = UserFriendlyMessages.fromContext(error, {
                method: "fetchPLMonthlyData",
            });

            expect(message).toContain("月次データの取得に失敗");
        });

        test("fetchPLDailyDataのコンテキストでメッセージを生成", () => {
            const error = new Error("NetworkError");
            const message = UserFriendlyMessages.fromContext(error, { method: "fetchPLDailyData" });

            expect(message).toContain("日次データの取得に失敗");
        });

        test("savePLMonthlyDataのコンテキストでメッセージを生成", () => {
            const error = new Error("NetworkError");
            const message = UserFriendlyMessages.fromContext(error, {
                method: "savePLMonthlyData",
            });

            expect(message).toContain("月次データの登録に失敗");
        });

        test("savePLDailyDataのコンテキストでメッセージを生成", () => {
            const error = new Error("NetworkError");
            const message = UserFriendlyMessages.fromContext(error, { method: "savePLDailyData" });

            expect(message).toContain("日次データの登録に失敗");
        });

        test("saveProductionReportDataのコンテキストでメッセージを生成", () => {
            const error = new Error("NetworkError");
            const message = UserFriendlyMessages.fromContext(error, {
                method: "saveProductionReportData",
            });

            expect(message).toContain("生産日報データの登録に失敗");
        });

        test("未知のメソッドのコンテキストでメッセージを生成", () => {
            const error = new Error("NetworkError");
            const message = UserFriendlyMessages.fromContext(error, { method: "unknownMethod" });

            expect(message).toContain("ネットワーク接続");
            expect(message).not.toContain("取得に失敗");
        });
    });
});
