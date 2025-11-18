/**
 * FileValidatorのユニットテスト
 */

import { FileValidator, FileValidationResult } from "../FileValidator";

// FileReaderをモック
(global as any).FileReader = jest.fn().mockImplementation(() => ({
    readAsArrayBuffer: jest.fn(),
    result: null,
    onload: null,
    onerror: null,
}));

// FileReaderの静的プロパティを追加
if ((global as any).FileReader) {
    (global as any).FileReader.EMPTY = 0;
    (global as any).FileReader.LOADING = 1;
    (global as any).FileReader.DONE = 2;
}

describe("FileValidator", () => {
    describe("validateFileSize", () => {
        test("ファイルサイズが制限内の場合は成功", () => {
            const file = new File(["test content"], "test.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

            const result = FileValidator.validateFileSize(file, 10);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test("ファイルサイズが制限を超える場合は失敗", () => {
            // 大きなファイルをシミュレート（実際には10MBを超えるファイルを作成できないため、モックを使用）
            const largeContent = "x".repeat(11 * 1024 * 1024); // 11MB
            const file = new File([largeContent], "large.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

            const result = FileValidator.validateFileSize(file, 10);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe("validateFileExtension", () => {
        test("許可された拡張子の場合は成功", () => {
            const file = new File(["test"], "test.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

            const result = FileValidator.validateFileExtension(file, ["xlsx", "xls"]);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test("許可されていない拡張子の場合は失敗", () => {
            const file = new File(["test"], "test.txt", { type: "text/plain" });

            const result = FileValidator.validateFileExtension(file, ["xlsx", "xls"]);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe("validateMimeType", () => {
        test("許可されたMIMEタイプの場合は成功", () => {
            const file = new File(["test"], "test.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

            const result = FileValidator.validateMimeType(file, [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ]);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test("許可されていないMIMEタイプの場合は失敗", () => {
            const file = new File(["test"], "test.xlsx", { type: "text/plain" });

            const result = FileValidator.validateMimeType(file, [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ]);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe("validateFileName", () => {
        test("正常なファイル名の場合は成功", () => {
            const result = FileValidator.validateFileName("test.xlsx");

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test("危険な文字が含まれる場合は失敗", () => {
            const result = FileValidator.validateFileName("../../../etc/passwd");

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test("null文字が含まれる場合は失敗", () => {
            const result = FileValidator.validateFileName("test\0.xlsx");

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe("validateExcelFile", () => {
        test("正常なExcelファイルの場合は成功", () => {
            const file = new File(["test"], "test.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

            const result = FileValidator.validateExcelFile(file, 10);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test("拡張子が間違っている場合は失敗", () => {
            const file = new File(["test"], "test.txt", { type: "text/plain" });

            const result = FileValidator.validateExcelFile(file, 10);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test("ファイルサイズが制限を超える場合は失敗", () => {
            const largeContent = "x".repeat(11 * 1024 * 1024);
            const file = new File([largeContent], "large.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

            const result = FileValidator.validateExcelFile(file, 10);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
});

