/**
 * Logger utility test suite - Fixed version
 */

// Mock console before any imports
const mockConsole = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

// Replace global console
Object.defineProperty(global, "console", {
    value: mockConsole,
    writable: true,
});

describe("Logger (Fixed)", () => {
    // Store original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
        jest.clearAllMocks();
        // Clear the module cache before each test
        jest.resetModules();
    });

    afterEach(() => {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
    });

    describe("Development environment", () => {
        beforeEach(() => {
            process.env.NODE_ENV = "development";
        });

        it("should log info message with emoji in development", () => {
            const { Logger } = require("../Logger");
            Logger.info("Test info message");

            expect(mockConsole.log).toHaveBeenCalledWith("ℹ️ Test info message", "");
        });

        it("should log info message with data in development", () => {
            const { Logger } = require("../Logger");
            const testData = { key: "value" };
            Logger.info("Test info message", testData);

            expect(mockConsole.log).toHaveBeenCalledWith("ℹ️ Test info message", testData);
        });

        it("should log warning message in development", () => {
            const { Logger } = require("../Logger");
            Logger.warn("Test warning message");

            expect(mockConsole.warn).toHaveBeenCalledWith("⚠️ Test warning message", "");
        });

        it("should log warning message with data in development", () => {
            const { Logger } = require("../Logger");
            const testData = { error: "warning data" };
            Logger.warn("Test warning", testData);

            expect(mockConsole.warn).toHaveBeenCalledWith("⚠️ Test warning", testData);
        });

        it("should log success message in development", () => {
            const { Logger } = require("../Logger");
            Logger.success("Test success message");

            expect(mockConsole.log).toHaveBeenCalledWith("✅ Test success message", "");
        });

        it("should log success message with data in development", () => {
            const { Logger } = require("../Logger");
            const testData = { result: "success" };
            Logger.success("Operation completed", testData);

            expect(mockConsole.log).toHaveBeenCalledWith("✅ Operation completed", testData);
        });

        it("should log debug message when console.debug exists", () => {
            const { Logger } = require("../Logger");
            Logger.debug("Debug message");

            expect(mockConsole.debug).toHaveBeenCalledWith("🐛 Debug message", "");
        });

        it("should log debug message with data", () => {
            const { Logger } = require("../Logger");
            const debugData = { debug: true };
            Logger.debug("Debug info", debugData);

            expect(mockConsole.debug).toHaveBeenCalledWith("🐛 Debug info", debugData);
        });

        it("should handle missing console.debug gracefully", () => {
            const { Logger } = require("../Logger");
            // Temporarily remove debug method
            const originalDebug = mockConsole.debug;
            delete (mockConsole as any).debug;

            expect(() => Logger.debug("Debug message")).not.toThrow();

            // Restore debug method
            mockConsole.debug = originalDebug;
        });
    });

    describe("Production environment", () => {
        beforeEach(() => {
            process.env.NODE_ENV = "production";
        });

        it("should not log info in production", () => {
            const { Logger } = require("../Logger");
            Logger.info("Production info");

            expect(mockConsole.log).not.toHaveBeenCalled();
        });

        it("should not log warning in production", () => {
            const { Logger } = require("../Logger");
            Logger.warn("Production warning");

            expect(mockConsole.warn).not.toHaveBeenCalled();
        });

        it("should not log success in production", () => {
            const { Logger } = require("../Logger");
            Logger.success("Production success");

            expect(mockConsole.log).not.toHaveBeenCalled();
        });

        it("should not log debug in production", () => {
            const { Logger } = require("../Logger");
            Logger.debug("Production debug");

            expect(mockConsole.debug).not.toHaveBeenCalled();
        });
    });

    describe("Error logging", () => {
        it("should always log errors regardless of environment", () => {
            process.env.NODE_ENV = "production";
            const { Logger } = require("../Logger");
            Logger.error("Error message");

            expect(mockConsole.error).toHaveBeenCalledWith("❌ Error message", "");
        });

        it("should log errors with error object", () => {
            const { Logger } = require("../Logger");
            const error = new Error("Test error");
            Logger.error("Something went wrong", error);

            expect(mockConsole.error).toHaveBeenCalledWith("❌ Something went wrong", error);
        });

        it("should log errors with custom error data", () => {
            const { Logger } = require("../Logger");
            const errorData = { code: 500, message: "Server error" };
            Logger.error("API Error", errorData);

            expect(mockConsole.error).toHaveBeenCalledWith("❌ API Error", errorData);
        });

        it("should handle error without data", () => {
            const { Logger } = require("../Logger");
            Logger.error("Error without data");

            expect(mockConsole.error).toHaveBeenCalledWith("❌ Error without data", "");
        });
    });

    describe("Environment detection", () => {
        it("should handle undefined NODE_ENV as production (no logging)", () => {
            delete process.env.NODE_ENV;
            const { Logger } = require("../Logger");
            Logger.info("Test message");

            // Should not log because undefined NODE_ENV is not "development"
            expect(mockConsole.log).not.toHaveBeenCalled();
        });

        it("should handle empty NODE_ENV as production (no logging)", () => {
            process.env.NODE_ENV = "";
            const { Logger } = require("../Logger");
            Logger.info("Test message");

            // Should not log because empty NODE_ENV is not "development"
            expect(mockConsole.log).not.toHaveBeenCalled();
        });

        it("should handle test environment as production (no logging)", () => {
            process.env.NODE_ENV = "test";
            const { Logger } = require("../Logger");
            Logger.info("Test environment message");

            // Should not log because test environment is not "development"
            expect(mockConsole.log).not.toHaveBeenCalled();
        });
    });
});
