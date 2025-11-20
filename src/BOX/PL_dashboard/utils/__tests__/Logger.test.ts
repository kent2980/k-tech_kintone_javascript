/**
 * Loggerのユニットテスト
 */

describe("Logger", () => {
    let originalConsoleLog: typeof console.log;
    let originalConsoleError: typeof console.error;
    let originalConsoleWarn: typeof console.warn;
    let originalConsoleDebug: typeof console.debug;
    let originalEnv: string | undefined;

    beforeEach(() => {
        originalConsoleLog = console.log;
        originalConsoleError = console.error;
        originalConsoleWarn = console.warn;
        originalConsoleDebug = console.debug;
        originalEnv = process.env.NODE_ENV;

        console.log = jest.fn();
        console.error = jest.fn();
        console.warn = jest.fn();
        console.debug = jest.fn();

        // モジュールをリセットして、環境変数の変更を反映させる
        jest.resetModules();
    });

    afterEach(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.debug = originalConsoleDebug;
        if (originalEnv !== undefined) {
            process.env.NODE_ENV = originalEnv;
        } else {
            delete process.env.NODE_ENV;
        }
        jest.resetModules();
    });

    describe("error", () => {
        test("エラーログを出力（開発環境に関係なく常に出力）", () => {
            const { Logger } = require("../Logger");
            Logger.error("error message");
            expect(console.error).toHaveBeenCalled();
            const callArgs = (console.error as jest.Mock).mock.calls[0];
            expect(callArgs[0]).toContain("error message");
        });

        test("エラーオブジェクトを出力", () => {
            const { Logger } = require("../Logger");
            const error = new Error("test error");
            Logger.error("error message", error);
            expect(console.error).toHaveBeenCalled();
            const callArgs = (console.error as jest.Mock).mock.calls[0];
            expect(callArgs[0]).toContain("error message");
            expect(callArgs[1]).toBe(error);
        });
    });

    describe("info", () => {
        test("開発環境で情報ログを出力", () => {
            process.env.NODE_ENV = "development";
            const { Logger } = require("../Logger");
            Logger.info("info message");
            expect(console.log).toHaveBeenCalled();
            const callArgs = (console.log as jest.Mock).mock.calls[0];
            expect(callArgs[0]).toContain("info message");
            expect(callArgs[1]).toBe("");
        });

        test("開発環境で追加データを出力", () => {
            process.env.NODE_ENV = "development";
            const { Logger } = require("../Logger");
            const data = { key: "value" };
            Logger.info("info message", data);
            expect(console.log).toHaveBeenCalled();
            const callArgs = (console.log as jest.Mock).mock.calls[0];
            expect(callArgs[0]).toContain("info message");
            expect(callArgs[1]).toBe(data);
        });

        test("本番環境では情報ログを出力しない", () => {
            process.env.NODE_ENV = "production";
            const { Logger } = require("../Logger");
            Logger.info("info message");
            expect(console.log).not.toHaveBeenCalled();
        });
    });

    describe("warn", () => {
        test("開発環境で警告ログを出力", () => {
            process.env.NODE_ENV = "development";
            const { Logger } = require("../Logger");
            Logger.warn("warning message");
            expect(console.warn).toHaveBeenCalled();
            const callArgs = (console.warn as jest.Mock).mock.calls[0];
            expect(callArgs[0]).toContain("warning message");
            expect(callArgs[1]).toBe("");
        });

        test("本番環境では警告ログを出力しない", () => {
            process.env.NODE_ENV = "production";
            const { Logger } = require("../Logger");
            Logger.warn("warning message");
            expect(console.warn).not.toHaveBeenCalled();
        });
    });

    describe("success", () => {
        test("開発環境で成功ログを出力", () => {
            process.env.NODE_ENV = "development";
            const { Logger } = require("../Logger");
            Logger.success("success message");
            expect(console.log).toHaveBeenCalled();
            const callArgs = (console.log as jest.Mock).mock.calls[0];
            expect(callArgs[0]).toContain("success message");
            expect(callArgs[1]).toBe("");
        });

        test("本番環境では成功ログを出力しない", () => {
            process.env.NODE_ENV = "production";
            const { Logger } = require("../Logger");
            Logger.success("success message");
            expect(console.log).not.toHaveBeenCalled();
        });
    });

    describe("debug", () => {
        test("開発環境でデバッグログを出力", () => {
            process.env.NODE_ENV = "development";
            const { Logger } = require("../Logger");
            Logger.debug("debug message");
            expect(console.debug).toHaveBeenCalled();
            const callArgs = (console.debug as jest.Mock).mock.calls[0];
            expect(callArgs[0]).toContain("debug message");
            expect(callArgs[1]).toBe("");
        });

        test("本番環境ではデバッグログを出力しない", () => {
            process.env.NODE_ENV = "production";
            const { Logger } = require("../Logger");
            Logger.debug("debug message");
            expect(console.debug).not.toHaveBeenCalled();
        });

        test("console.debugが存在しない場合は何もしない", () => {
            process.env.NODE_ENV = "development";
            const { Logger } = require("../Logger");
            const originalDebug = console.debug;
            delete (console as any).debug;

            expect(() => {
                Logger.debug("debug message");
            }).not.toThrow();

            console.debug = originalDebug;
        });
    });
});
