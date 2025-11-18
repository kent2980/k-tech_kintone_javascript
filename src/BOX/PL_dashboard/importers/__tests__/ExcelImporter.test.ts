/**
 * ExcelImporterのユニットテスト
 */

const mockXLSXUtils = {
    decode_range: jest.fn((range: string) => ({
        s: { r: 0, c: 0 },
        e: { r: 1, c: 1 },
    })),
    encode_cell: jest.fn((cell: { r: number; c: number }) => {
        const col = String.fromCharCode(65 + cell.c);
        return `${col}${cell.r + 1}`;
    }),
    decode_col: jest.fn((col: string) => col.charCodeAt(0) - 65),
};

jest.mock("xlsx", () => ({
    read: jest.fn((data, options) => ({
        SheetNames: ["Sheet1", "Sheet2"],
        Sheets: {
            Sheet1: {
                A1: { v: "Value1", t: "s" },
                B1: { v: "Value2", t: "s" },
                A2: { v: 100, t: "n" },
                B2: { v: 200, t: "n" },
                A3: { v: 44927, t: "n" }, // Excel日付シリアル値
            },
            Sheet2: {
                A1: { v: "Value3", t: "s" },
            },
        },
    })),
    utils: mockXLSXUtils,
    SSF: {
        parse_date_code: jest.fn((serial: number) => new Date(2023, 0, 1)),
    },
}));

jest.mock("../../utils/FileValidator", () => ({
    FileValidator: {
        validateFileName: jest.fn(() => ({ isValid: true, errors: [], warnings: [] })),
        validateExcelFile: jest.fn(() => ({ isValid: true, errors: [], warnings: [] })),
        validateMagicNumber: jest.fn(() =>
            Promise.resolve({ isValid: true, errors: [], warnings: [] })
        ),
    },
}));

// FileReaderをモック
const createMockFileReader = () => {
    const reader: any = {
        readAsArrayBuffer: jest.fn(function (this: any, file: File) {
            Promise.resolve().then(() => {
                this.result = new ArrayBuffer(8);
                if (this.onload) {
                    this.onload({ target: this } as any);
                }
            });
        }),
        result: null as any,
        onload: null as any,
        onerror: null as any,
    };
    return reader;
};

import { ExcelImporter } from "../ExcelImporter";
import { FileValidator } from "../../utils/FileValidator";
import * as XLSX from "xlsx";

describe("ExcelImporter", () => {
    let importer: ExcelImporter;
    let mockFile: File;

    beforeEach(() => {
        mockFile = new File(["test content"], "test.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        importer = new ExcelImporter(mockFile);
        jest.clearAllMocks();
        (FileValidator.validateFileName as jest.Mock).mockReturnValue({
            isValid: true,
            errors: [],
            warnings: [],
        });
        (FileValidator.validateExcelFile as jest.Mock).mockReturnValue({
            isValid: true,
            errors: [],
            warnings: [],
        });
        (FileValidator.validateMagicNumber as jest.Mock).mockResolvedValue({
            isValid: true,
            errors: [],
            warnings: [],
        });
    });

    describe("constructor", () => {
        test("ファイルを指定してインスタンスを作成", () => {
            const newImporter = new ExcelImporter(mockFile);
            expect(newImporter).toBeInstanceOf(ExcelImporter);
        });
    });

    describe("validateFile", () => {
        test("正常にファイルを検証", async () => {
            const result = await importer.validateFile(10);

            expect(result.isValid).toBe(true);
            expect(FileValidator.validateFileName).toHaveBeenCalled();
            expect(FileValidator.validateExcelFile).toHaveBeenCalled();
            expect(FileValidator.validateMagicNumber).toHaveBeenCalled();
        });

        test("ファイル名の検証に失敗した場合", async () => {
            (FileValidator.validateFileName as jest.Mock).mockReturnValue({
                isValid: false,
                errors: ["ファイル名が無効です"],
                warnings: [],
            });

            const result = await importer.validateFile(10);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("ファイル名が無効です");
        });

        test("Excelファイルの検証に失敗した場合", async () => {
            (FileValidator.validateExcelFile as jest.Mock).mockReturnValue({
                isValid: false,
                errors: ["ファイルサイズが大きすぎます"],
                warnings: [],
            });

            const result = await importer.validateFile(10);

            expect(result.isValid).toBe(false);
        });

        test("マジックナンバーの検証に失敗した場合", async () => {
            (FileValidator.validateMagicNumber as jest.Mock).mockResolvedValue({
                isValid: false,
                errors: ["ファイル形式が無効です"],
                warnings: [],
            });

            const result = await importer.validateFile(10);

            expect(result.isValid).toBe(false);
        });
    });

    describe("load", () => {
        test("正常にExcelファイルを読み込む", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(true, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            expect(XLSX.read).toHaveBeenCalled();
        });

        test("検証をスキップして読み込む", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            expect(XLSX.read).toHaveBeenCalled();
        });

        test("検証に失敗した場合はエラーをスロー", async () => {
            (FileValidator.validateExcelFile as jest.Mock).mockReturnValue({
                isValid: false,
                errors: ["ファイルサイズが大きすぎます"],
                warnings: [],
            });

            await expect(importer.load(true, 10)).rejects.toThrow("ファイル検証エラー");
        });
    });

    describe("hasSheet", () => {
        test("シートが存在する場合はtrueを返す", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            expect(importer.hasSheet("Sheet1")).toBe(true);
        });

        test("シートが存在しない場合はfalseを返す", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            expect(importer.hasSheet("NonExistentSheet")).toBe(false);
        });

        test("ファイルが読み込まれていない場合はエラー", () => {
            expect(() => {
                importer.hasSheet("Sheet1");
            }).toThrow("Excelファイルが読み込まれていません");
        });
    });

    describe("getSheetNames", () => {
        test("シート名の一覧を取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const sheetNames = importer.getSheetNames();

            expect(sheetNames).toEqual(["Sheet1", "Sheet2"]);
        });

        test("ファイルが読み込まれていない場合はエラー", () => {
            expect(() => {
                importer.getSheetNames();
            }).toThrow("Excelファイルが読み込まれていません");
        });
    });

    describe("getSheet", () => {
        test("指定したシートを取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const sheet = importer.getSheet("Sheet1");

            expect(sheet).toBeDefined();
            expect(sheet.A1).toBeDefined();
        });

        test("シート名を省略した場合は最初のシートを取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const sheet = importer.getSheet();

            expect(sheet).toBeDefined();
        });

        test("存在しないシートを指定した場合はエラー", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            expect(() => {
                importer.getSheet("NonExistentSheet");
            }).toThrow('シート "NonExistentSheet" が見つかりません');
        });

        test("ファイルが読み込まれていない場合はエラー", () => {
            expect(() => {
                importer.getSheet();
            }).toThrow("Excelファイルが読み込まれていません");
        });
    });

    describe("getCellValue", () => {
        test("セルの値を取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const value = importer.getCellValue("A1", "Sheet1");

            expect(value).toBe("Value1");
        });

        test("存在しないセルの場合は空文字を返す", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const value = importer.getCellValue("Z999", "Sheet1");

            expect(value).toBe("");
        });
    });

    describe("getCellValueAsString", () => {
        test("セルの値を文字列として取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const value = importer.getCellValueAsString("A1", "Sheet1");

            expect(typeof value).toBe("string");
            expect(value).toBe("Value1");
        });

        test("nullの場合は空文字を返す", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const value = importer.getCellValueAsString("Z999", "Sheet1");

            expect(value).toBe("");
        });
    });

    describe("getCellValueAsNumber", () => {
        test("セルの値を数値として取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const value = importer.getCellValueAsNumber("A2", "Sheet1");

            expect(typeof value).toBe("number");
            expect(value).toBe(100);
        });

        test("数値に変換できない場合は0を返す", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const value = importer.getCellValueAsNumber("A1", "Sheet1");

            expect(value).toBe(0);
        });
    });

    describe("getCellValueAsDate", () => {
        test("セルの値を日付として取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const value = importer.getCellValueAsDate("A3", "Sheet1");

            expect(value).toBeInstanceOf(Date);
        });

        test("存在しないセルの場合はnullを返す", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const value = importer.getCellValueAsDate("Z999", "Sheet1");

            expect(value).toBeNull();
        });
    });

    describe("getRangeValues", () => {
        test("範囲指定でセルの値を取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const values = importer.getRangeValues("A1:B2", "Sheet1");

            expect(Array.isArray(values)).toBe(true);
            expect(values.length).toBeGreaterThan(0);
        });
    });

    describe("getTableData", () => {
        test("テーブルデータを取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const data = importer.getTableData("A", "B", 1, "Sheet1");

            expect(Array.isArray(data)).toBe(true);
        });

        test("列番号でテーブルデータを取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const data = importer.getTableData(1, 2, 1, "Sheet1");

            expect(Array.isArray(data)).toBe(true);
        });
    });

    describe("getTableDataAsDataFrame", () => {
        test("DataFrame形式でテーブルデータを取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const dataFrame = importer.getTableDataAsDataFrame("A", "B", 1, 2, "Sheet1");

            expect(dataFrame).toHaveProperty("columns");
            expect(dataFrame).toHaveProperty("records");
            expect(dataFrame).toHaveProperty("rowCount");
            expect(dataFrame).toHaveProperty("columnCount");
        });
    });
});
