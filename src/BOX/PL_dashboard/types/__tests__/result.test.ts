/**
 * result.tsのユニットテスト
 */

import { Result, Success, Failure, ErrorDetails } from "../result";

describe("Result", () => {
    describe("success", () => {
        test("成功を表すResultを作成", () => {
            const data = { id: 1, name: "test" };
            const result = Result.success(data);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(data);
        });

        test("数値データで成功を表すResultを作成", () => {
            const result = Result.success(123);

            expect(result.success).toBe(true);
            expect(result.data).toBe(123);
        });

        test("文字列データで成功を表すResultを作成", () => {
            const result = Result.success("test");

            expect(result.success).toBe(true);
            expect(result.data).toBe("test");
        });

        test("配列データで成功を表すResultを作成", () => {
            const data = [1, 2, 3];
            const result = Result.success(data);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(data);
        });

        test("nullデータで成功を表すResultを作成", () => {
            const result = Result.success(null);

            expect(result.success).toBe(true);
            expect(result.data).toBeNull();
        });
    });

    describe("failure", () => {
        test("失敗を表すResultを作成", () => {
            const result = Result.failure("エラーが発生しました");

            expect(result.success).toBe(false);
            expect(result.error.message).toBe("エラーが発生しました");
            expect(result.error.timestamp).toBeInstanceOf(Date);
        });

        test("エラーコードを指定して失敗を表すResultを作成", () => {
            const result = Result.failure("エラーが発生しました", undefined, "ERROR_CODE");

            expect(result.success).toBe(false);
            expect(result.error.message).toBe("エラーが発生しました");
            expect(result.error.code).toBe("ERROR_CODE");
        });

        test("元のエラーを指定して失敗を表すResultを作成", () => {
            const originalError = new Error("元のエラー");
            const result = Result.failure("エラーが発生しました", originalError);

            expect(result.success).toBe(false);
            expect(result.error.message).toBe("エラーが発生しました");
            expect(result.error.originalError).toBe(originalError);
        });

        test("コンテキスト情報を指定して失敗を表すResultを作成", () => {
            const context = { method: "test", param: "value" };
            const result = Result.failure("エラーが発生しました", undefined, undefined, context);

            expect(result.success).toBe(false);
            expect(result.error.message).toBe("エラーが発生しました");
            expect(result.error.context).toEqual(context);
        });

        test("すべてのパラメータを指定して失敗を表すResultを作成", () => {
            const originalError = new Error("元のエラー");
            const context = { method: "test" };
            const result = Result.failure(
                "エラーが発生しました",
                originalError,
                "ERROR_CODE",
                context
            );

            expect(result.success).toBe(false);
            expect(result.error.message).toBe("エラーが発生しました");
            expect(result.error.code).toBe("ERROR_CODE");
            expect(result.error.originalError).toBe(originalError);
            expect(result.error.context).toEqual(context);
        });
    });

    describe("fromError", () => {
        test("ErrorオブジェクトからFailureを作成", () => {
            const error = new Error("テストエラー");
            const result = Result.fromError(error);

            expect(result.success).toBe(false);
            expect(result.error.message).toBe("テストエラー");
            expect(result.error.originalError).toBe(error);
            expect(result.error.code).toBe("Error");
        });

        test("ErrorオブジェクトとコンテキストからFailureを作成", () => {
            const error = new Error("テストエラー");
            const context = { method: "test" };
            const result = Result.fromError(error, context);

            expect(result.success).toBe(false);
            expect(result.error.message).toBe("テストエラー");
            expect(result.error.originalError).toBe(error);
            expect(result.error.code).toBe("Error");
            expect(result.error.context).toEqual(context);
        });

        test("文字列からFailureを作成", () => {
            const error = "文字列エラー";
            const result = Result.fromError(error);

            expect(result.success).toBe(false);
            expect(result.error.message).toBe("文字列エラー");
            expect(result.error.originalError).toBe(error);
            expect(result.error.code).toBe("UNKNOWN_ERROR");
        });

        test("数値からFailureを作成", () => {
            const error = 123;
            const result = Result.fromError(error);

            expect(result.success).toBe(false);
            expect(result.error.message).toBe("123");
            expect(result.error.originalError).toBe(123);
            expect(result.error.code).toBe("UNKNOWN_ERROR");
        });

        test("nullからFailureを作成", () => {
            const error = null;
            const result = Result.fromError(error);

            expect(result.success).toBe(false);
            expect(result.error.message).toBe("null");
            expect(result.error.originalError).toBe(null);
            expect(result.error.code).toBe("UNKNOWN_ERROR");
        });

        test("undefinedからFailureを作成", () => {
            const error = undefined;
            const result = Result.fromError(error);

            expect(result.success).toBe(false);
            expect(result.error.message).toBe("undefined");
            expect(result.error.originalError).toBe(undefined);
            expect(result.error.code).toBe("UNKNOWN_ERROR");
        });
    });

    describe("isSuccess", () => {
        test("成功のResultを判定", () => {
            const result = Result.success("test");
            expect(Result.isSuccess(result)).toBe(true);
        });

        test("失敗のResultを判定", () => {
            const result = Result.failure("エラー");
            expect(Result.isSuccess(result)).toBe(false);
        });

        test("型ガードとして機能する", () => {
            const result: Result<string> = Result.success("test");
            if (Result.isSuccess(result)) {
                // 型ガードにより、resultはSuccess<string>として扱われる
                expect(result.data).toBe("test");
            }
        });
    });

    describe("isFailure", () => {
        test("失敗のResultを判定", () => {
            const result = Result.failure("エラー");
            expect(Result.isFailure(result)).toBe(true);
        });

        test("成功のResultを判定", () => {
            const result = Result.success("test");
            expect(Result.isFailure(result)).toBe(false);
        });

        test("型ガードとして機能する", () => {
            const result: Result<string> = Result.failure("エラー");
            if (Result.isFailure(result)) {
                // 型ガードにより、resultはFailureとして扱われる
                expect(result.error.message).toBe("エラー");
            }
        });
    });
});
