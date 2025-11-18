/**
 * ErrorHandlerのユニットテスト
 */

import { ErrorHandler, ErrorHandlingStrategy } from "../ErrorHandler";
import { Logger } from "../Logger";
import { UserFriendlyMessages } from "../UserFriendlyMessages";

// Loggerをモック
jest.mock("../Logger", () => ({
    Logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    },
}));

// UserFriendlyMessagesをモック
jest.mock("../UserFriendlyMessages", () => ({
    UserFriendlyMessages: {
        fromContext: jest.fn((error: Error | unknown, context?: Record<string, unknown>) => {
            if (error instanceof Error) {
                return `ユーザー向けメッセージ: ${error.message}`;
            }
            return "ユーザー向けメッセージ";
        }),
    },
}));

describe("ErrorHandler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("normalizeError", () => {
        test("Errorオブジェクトを正しく変換", () => {
            const error = new Error("テストエラー");
            const context = { method: "testMethod" };

            const result = ErrorHandler.normalizeError(error, context);

            expect(result.message).toBe("テストエラー");
            expect(result.code).toBe("Error");
            expect(result.context).toEqual(context);
            expect(result.originalError).toBe(error);
            expect(result.timestamp).toBeInstanceOf(Date);
        });

        test("Error以外のオブジェクトを正しく変換", () => {
            const error = "文字列エラー";
            const result = ErrorHandler.normalizeError(error);

            expect(result.message).toBe("文字列エラー");
            expect(result.code).toBe("UNKNOWN_ERROR");
            expect(result.originalError).toBe(error);
        });

        test("null/undefinedを正しく変換", () => {
            const result1 = ErrorHandler.normalizeError(null);
            const result2 = ErrorHandler.normalizeError(undefined);

            expect(result1.message).toBe("null");
            expect(result2.message).toBe("undefined");
        });
    });

    describe("logError", () => {
        test("エラーをログに記録", () => {
            const error = new Error("テストエラー");
            const context = { method: "testMethod" };

            ErrorHandler.logError("エラーが発生しました", error, context);

            expect(Logger.error).toHaveBeenCalledWith(
                "エラーが発生しました",
                expect.objectContaining({
                    error: "テストエラー",
                    code: "Error",
                    context,
                })
            );
        });
    });

    describe("handleError", () => {
        test("Result.failureを返す", () => {
            const error = new Error("テストエラー");
            const context = { method: "testMethod" };

            const result = ErrorHandler.handleError(error, context);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.message).toBe("テストエラー");
                expect(result.error.context).toEqual(context);
            }
        });
    });

    describe("handleErrorAndReturnNull", () => {
        test("エラーをログに記録してnullを返す", () => {
            const error = new Error("テストエラー");
            const context = { method: "testMethod" };

            const result = ErrorHandler.handleErrorAndReturnNull(
                "エラーが発生しました",
                error,
                context
            );

            expect(result).toBeNull();
            expect(Logger.error).toHaveBeenCalled();
        });
    });

    describe("handleErrorAndReturnEmpty", () => {
        test("エラーをログに記録して空配列を返す", () => {
            const error = new Error("テストエラー");
            const context = { method: "testMethod" };

            const result = ErrorHandler.handleErrorAndReturnEmpty(
                "エラーが発生しました",
                error,
                context
            );

            expect(result).toEqual([]);
            expect(Logger.error).toHaveBeenCalled();
        });
    });

    describe("handleErrorAndRethrow", () => {
        test("エラーをログに記録して再スロー", () => {
            const error = new Error("テストエラー");
            const context = { method: "testMethod" };

            expect(() => {
                ErrorHandler.handleErrorAndRethrow("エラーが発生しました", error, context);
            }).toThrow("テストエラー");

            expect(Logger.error).toHaveBeenCalled();
        });

        test("Errorインスタンスでない場合は新しいErrorをスロー", () => {
            const error = "文字列エラー";
            const context = { method: "testMethod" };

            expect(() => {
                ErrorHandler.handleErrorAndRethrow("エラーが発生しました", error, context);
            }).toThrow("エラーが発生しました: 文字列エラー");

            expect(Logger.error).toHaveBeenCalled();
        });
    });

    describe("getUserFriendlyMessage", () => {
        test("ユーザー向けメッセージを取得", () => {
            const error = new Error("ネットワークエラー");
            const context = { method: "fetchData" };

            const message = ErrorHandler.getUserFriendlyMessage(error, context);

            expect(message).toContain("ユーザー向けメッセージ");
            expect(UserFriendlyMessages.fromContext).toHaveBeenCalledWith(error, context);
        });
    });
});
