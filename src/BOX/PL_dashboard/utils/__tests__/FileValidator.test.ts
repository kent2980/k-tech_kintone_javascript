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
            const file = new File(["test content"], "test.xlsx", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const result = FileValidator.validateFileSize(file, 10);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test("ファイルサイズが制限を超える場合は失敗", () => {
            // 大きなファイルをシミュレート（実際には10MBを超えるファイルを作成できないため、モックを使用）
            const largeContent = "x".repeat(11 * 1024 * 1024); // 11MB
            const file = new File([largeContent], "large.xlsx", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const result = FileValidator.validateFileSize(file, 10);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test("空ファイルの場合は失敗", () => {
            const file = new File([], "empty.xlsx", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const result = FileValidator.validateFileSize(file, 10);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("ファイルが空です");
        });
    });

    describe("validateFileExtension", () => {
        test("許可された拡張子の場合は成功", () => {
            const file = new File(["test"], "test.xlsx", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

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
            const file = new File(["test"], "test.xlsx", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

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

        test("ファイル名が長すぎる場合は失敗", () => {
            const longName = "x".repeat(256);
            const result = FileValidator.validateFileName(longName);

            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("ファイル名が長すぎます"))).toBe(true);
        });

        test("空のファイル名の場合は失敗", () => {
            const result = FileValidator.validateFileName("");

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("ファイル名が空です");
        });

        test("拡張子がない場合は失敗", () => {
            const file = new File(["test"], "test", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const result = FileValidator.validateFileExtension(file, ["xlsx", "xls"]);

            expect(result.isValid).toBe(false);
            expect(
                result.errors.some(
                    (e) =>
                        e.includes("拡張子がありません") ||
                        e.includes("許可されていないファイル形式")
                )
            ).toBe(true);
        });
    });

    describe("validateExcelFile", () => {
        test("正常なExcelファイルの場合は成功", () => {
            const file = new File(["test"], "test.xlsx", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

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
            const file = new File([largeContent], "large.xlsx", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const result = FileValidator.validateExcelFile(file, 10);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe("validateFileName - edge cases", () => {
        test("危険な文字が複数含まれている場合", () => {
            const result = FileValidator.validateFileName("test../file<>name");

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });

        test("ファイル名がちょうど255文字の場合", () => {
            const longName = "x".repeat(255);
            const result = FileValidator.validateFileName(longName);

            expect(result.isValid).toBe(true);
        });

        test("ファイル名が空白のみの場合", () => {
            const result = FileValidator.validateFileName("   ");

            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("空です"))).toBe(true);
        });

        test("ファイル名にnull文字が含まれている場合", () => {
            const result = FileValidator.validateFileName("test\0file");

            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("危険な文字"))).toBe(true);
        });

        test("ファイル名にパストラバーサル文字が含まれている場合", () => {
            const result = FileValidator.validateFileName("../../../etc/passwd");

            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("危険な文字"))).toBe(true);
        });
    });

    describe("validateMagicNumber", () => {
        test("XLSX形式のマジックナンバーを検証", async () => {
            // XLSX形式のマジックナンバー: [0x50, 0x4b, 0x03, 0x04]
            const xlsxMagicBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);
            const arrayBuffer = xlsxMagicBytes.buffer;

            const mockReader = {
                readAsArrayBuffer: jest.fn(function (this: any, file: File) {
                    Promise.resolve().then(() => {
                        this.result = arrayBuffer;
                        if (this.onload) {
                            this.onload({ target: this } as any);
                        }
                    });
                }),
                result: null as any,
                onload: null as any,
                onerror: null as any,
            };

            (global as any).FileReader = jest.fn(() => mockReader);

            const file = new File([xlsxMagicBytes], "test.xlsx", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const resultPromise = FileValidator.validateMagicNumber(file);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = arrayBuffer;
                mockReader.onload({ target: mockReader } as any);
            }
            const result = await resultPromise;

            expect(result.isValid).toBe(true);
        });

        test("XLS形式のマジックナンバーを検証", async () => {
            // XLS形式のマジックナンバー: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]
            const xlsMagicBytes = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
            const arrayBuffer = xlsMagicBytes.buffer;

            const mockReader = {
                readAsArrayBuffer: jest.fn(function (this: any, file: File) {
                    Promise.resolve().then(() => {
                        this.result = arrayBuffer;
                        if (this.onload) {
                            this.onload({ target: this } as any);
                        }
                    });
                }),
                result: null as any,
                onload: null as any,
                onerror: null as any,
            };

            (global as any).FileReader = jest.fn(() => mockReader);

            const file = new File([xlsMagicBytes], "test.xls", {
                type: "application/vnd.ms-excel",
            });

            const resultPromise = FileValidator.validateMagicNumber(file);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = arrayBuffer;
                mockReader.onload({ target: mockReader } as any);
            }
            const result = await resultPromise;

            expect(result.isValid).toBe(true);
        });

        test("無効なマジックナンバーの場合は失敗", async () => {
            const invalidBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            const arrayBuffer = invalidBytes.buffer;

            const mockReader = {
                readAsArrayBuffer: jest.fn(function (this: any, file: File) {
                    Promise.resolve().then(() => {
                        this.result = arrayBuffer;
                        if (this.onload) {
                            this.onload({ target: this } as any);
                        }
                    });
                }),
                result: null as any,
                onload: null as any,
                onerror: null as any,
            };

            (global as any).FileReader = jest.fn(() => mockReader);

            const file = new File([invalidBytes], "test.txt", {
                type: "text/plain",
            });

            const resultPromise = FileValidator.validateMagicNumber(file);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = arrayBuffer;
                mockReader.onload({ target: mockReader } as any);
            }
            const result = await resultPromise;

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test("ファイルが小さすぎる場合は失敗", async () => {
            const smallBytes = new Uint8Array([0x50, 0x4b]); // 2バイトのみ
            const arrayBuffer = smallBytes.buffer;

            const mockReader = {
                readAsArrayBuffer: jest.fn(function (this: any, file: File) {
                    Promise.resolve().then(() => {
                        this.result = arrayBuffer;
                        if (this.onload) {
                            this.onload({ target: this } as any);
                        }
                    });
                }),
                result: null as any,
                onload: null as any,
                onerror: null as any,
            };

            (global as any).FileReader = jest.fn(() => mockReader);

            const file = new File([smallBytes], "test.xlsx", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const resultPromise = FileValidator.validateMagicNumber(file);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = arrayBuffer;
                mockReader.onload({ target: mockReader } as any);
            }
            const result = await resultPromise;

            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("小さすぎて形式を判定できません"))).toBe(
                true
            );
        });

        test("ファイル読み込みエラーの場合は失敗", async () => {
            const mockReader = {
                readAsArrayBuffer: jest.fn(function (this: any, file: File) {
                    Promise.resolve().then(() => {
                        if (this.onerror) {
                            this.onerror({} as any);
                        }
                    });
                }),
                result: null as any,
                onload: null as any,
                onerror: null as any,
            };

            (global as any).FileReader = jest.fn(() => mockReader);

            const file = new File(["test"], "test.xlsx", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const resultPromise = FileValidator.validateMagicNumber(file);
            await Promise.resolve();
            if (mockReader.onerror) {
                mockReader.onerror({} as any);
            }
            const result = await resultPromise;

            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("読み込みエラー"))).toBe(true);
        });
    });

    describe("validateExcelFile - MIME type warnings", () => {
        test("拡張子が正しくMIMEタイプが間違っている場合は警告", () => {
            const file = new File(["test"], "test.xlsx", { type: "text/plain" });

            const result = FileValidator.validateExcelFile(file, 10);

            expect(result.isValid).toBe(true);
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });
});
