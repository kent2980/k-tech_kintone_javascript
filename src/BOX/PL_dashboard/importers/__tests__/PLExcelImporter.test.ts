/**
 * PLExcelImporterのユニットテスト
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

// 生産履歴シートのモックデータ
const productionSheetData = {
    A3: { v: "日付\r\n(生産日）", t: "s" },
    B3: { v: "ライン", t: "s" },
    C3: { v: "付加価値", t: "s" },
    D3: { v: "機種名", t: "s" },
    E3: { v: "台数", t: "s" },
    F3: { v: "社員工数\r\n（h）", t: "s" },
    G3: { v: "派遣工数\r\n（h）", t: "s" },
    H3: { v: "【社】残業工数\r\n（h）", t: "s" },
    I3: { v: "派残業工数\r\n（h）", t: "s" },
    A4: { v: 44927, t: "n" }, // 2023-01-01
    B4: { v: "【ライン1】", t: "s" },
    C4: { v: 1000, t: "n" },
    D4: { v: "機種A", t: "s" },
    E4: { v: 10, t: "n" },
    F4: { v: 8, t: "n" },
    G4: { v: 4, t: "n" },
    H4: { v: 2, t: "n" },
    I4: { v: 1, t: "n" },
    G2: { v: 100, t: "n" }, // 社員単価
    I2: { v: 80, t: "n" }, // 派遣単価
};

// 経費計算シートのモックデータ
const expenseSheetData = {
    B26: { v: "実績", t: "s" },
    G26: { v: 44927, t: "n" }, // 2023-01-01
    A28: { v: 200, t: "n" }, // 直行人員単価
    A30: { v: 150, t: "n" }, // 派遣人員単価
    A32: { v: 180, t: "n" }, // 間接人員単価
    C28: { v: 5, t: "n" }, // 直行人員数
    C30: { v: 3, t: "n" }, // 派遣人員数
    C32: { v: 2, t: "n" }, // 間接人員数
    Column_31: { v: 1000, t: "n" },
    "　経費": { v: 2000, t: "n" },
    Column_33: { v: 1500, t: "n" },
    Column_36: { v: 500, t: "n" },
    Column_39: { v: 300, t: "n" },
    Column_42: { v: 400, t: "n" },
    実績: { v: 44927, t: "n" },
    Column_66: { v: 200, t: "n" },
};

jest.mock("xlsx", () => ({
    read: jest.fn((data, options) => ({
        SheetNames: ["生産履歴（Assy）", "ＰＬ (日毎) (計画反映版)"],
        Sheets: {
            "生産履歴（Assy）": productionSheetData,
            "ＰＬ (日毎) (計画反映版)": expenseSheetData,
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

jest.mock("../../utils/Logger", () => ({
    Logger: {
        debug: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        success: jest.fn(),
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

import * as XLSX from "xlsx";
import { Logger } from "../../../../utils/Logger";
import { FileValidator } from "../../utils/FileValidator";
import { PLExcelImporter } from "../PLExcelImporter";

describe("PLExcelImporter", () => {
    let importer: PLExcelImporter;
    let mockFile: File;

    beforeEach(() => {
        mockFile = new File(["test content"], "test.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        importer = new PLExcelImporter(mockFile);
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
            const newImporter = new PLExcelImporter(mockFile);
            expect(newImporter).toBeInstanceOf(PLExcelImporter);
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
            expect(Logger.debug).toHaveBeenCalledWith("PLExcelファイルを読み込みました");
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

        test("読み込みエラー時にエラーをスロー", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            (FileValidator.validateExcelFile as jest.Mock).mockReturnValue({
                isValid: false,
                errors: ["ファイルサイズが大きすぎます"],
                warnings: [],
            });

            await expect(importer.load(true, 10)).rejects.toThrow();
            expect(Logger.error).toHaveBeenCalled();
        });
    });

    describe("dispose", () => {
        test("リソースを解放", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            importer.dispose();

            expect(Logger.debug).toHaveBeenCalledWith("PLExcelImporterを破棄しました");
        });
    });

    describe("getProductionData", () => {
        test("正常に生産実績データを取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            // モックデータを適切に設定
            const mockSheet = {
                A3: { v: "日付\r\n(生産日）", t: "s" },
                B3: { v: "ライン", t: "s" },
                C3: { v: "付加価値", t: "n" },
                D3: { v: "機種名", t: "s" },
                E3: { v: "台数", t: "n" },
                F3: { v: "社員工数\r\n（h）", t: "n" },
                G3: { v: "派遣工数\r\n（h）", t: "n" },
                H3: { v: "【社】残業工数\r\n（h）", t: "n" },
                I3: { v: "派残業工数\r\n（h）", t: "n" },
                A4: { v: 44927, t: "n" },
                B4: { v: "【ライン1】", t: "s" },
                C4: { v: 1000, t: "n" },
                D4: { v: "機種A", t: "s" },
                E4: { v: 10, t: "n" },
                F4: { v: 8, t: "n" },
                G4: { v: 4, t: "n" },
                H4: { v: 2, t: "n" },
                I4: { v: 1, t: "n" },
            };
            (XLSX.read as jest.Mock).mockReturnValue({
                SheetNames: ["生産履歴（Assy）"],
                Sheets: {
                    "生産履歴（Assy）": mockSheet,
                },
            });

            const data = importer.getProductionData();

            expect(Array.isArray(data)).toBe(true);
        });

        test("シートが存在しない場合はエラーをスロー", async () => {
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
                importer.getProductionData("存在しないシート");
            }).toThrow('シート "存在しないシート" が見つかりません');
        });

        test("ファイルがロードされていない場合はエラーをスロー", () => {
            expect(() => {
                importer.getProductionData();
            }).toThrow("Excelファイルが読み込まれていません");
        });
    });

    describe("getExpenseCalculationData", () => {
        test("正常に経費計算データを取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            // 経費計算シートのモックデータを設定
            (XLSX.read as jest.Mock).mockReturnValue({
                SheetNames: ["ＰＬ (日毎) (計画反映版)"],
                Sheets: {
                    "ＰＬ (日毎) (計画反映版)": expenseSheetData,
                },
            });

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const data = importer.getExpenseCalculationData();

            expect(Array.isArray(data)).toBe(true);
        });

        test("シートが存在しない場合はエラーをスロー", async () => {
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
                importer.getExpenseCalculationData("存在しないシート");
            }).toThrow('シート "存在しないシート" が見つかりません');
        });

        test("ファイルがロードされていない場合はエラーをスロー", () => {
            expect(() => {
                importer.getExpenseCalculationData();
            }).toThrow("Excelファイルが読み込まれていません");
        });
    });

    describe("getMonthlyData", () => {
        test("正常に月次データを取得", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            // 月次データ取得に必要なシートを設定
            (XLSX.read as jest.Mock).mockReturnValue({
                SheetNames: ["生産履歴（Assy）", "ＰＬ (日毎) (計画反映版)"],
                Sheets: {
                    "生産履歴（Assy）": productionSheetData,
                    "ＰＬ (日毎) (計画反映版)": expenseSheetData,
                },
            });

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const data = importer.getMonthlyData();

            expect(data).toHaveProperty("year");
            expect(data).toHaveProperty("month");
            expect(data).toHaveProperty("year_month");
            expect(data).toHaveProperty("inside_unit");
            expect(data).toHaveProperty("outside_unit");
        });

        test("シート1が存在しない場合はエラーをスロー", async () => {
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
                importer.getMonthlyData("存在しないシート1", "ＰＬ (日毎) (計画反映版)");
            }).toThrow('シート "存在しないシート1" が見つかりません');
        });

        test("シート2が存在しない場合はエラーをスロー", async () => {
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
                importer.getMonthlyData("生産履歴（Assy）", "存在しないシート2");
            }).toThrow('シート "存在しないシート2" が見つかりません');
        });

        test("ファイルがロードされていない場合はエラーをスロー", () => {
            expect(() => {
                importer.getMonthlyData();
            }).toThrow("Excelファイルが読み込まれていません");
        });
    });

    describe("validateFormat", () => {
        test("正常なフォーマットの場合はok=true", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            // 必要な列を含むモックシートデータ
            const productionSheet = {
                ...productionSheetData,
                A3: { v: "日付", t: "s" },
                B3: { v: "ライン", t: "s" },
                C3: { v: "付加価値", t: "s" },
                D3: { v: "機種名", t: "s" },
                E3: { v: "台数", t: "s" },
            };
            const expenseSheet = {
                ...expenseSheetData,
                B26: { v: "実績", t: "s" },
                G26: { v: 44927, t: "n" },
                G27: { v: "直行残業(ｈ)", t: "s" },
                G28: { v: "間接材料費", t: "s" },
                G29: { v: "夜勤手当", t: "s" },
            };

            (XLSX.read as jest.Mock).mockReturnValue({
                SheetNames: ["生産履歴（Assy）", "ＰＬ (日毎) (計画反映版)"],
                Sheets: {
                    "生産履歴（Assy）": productionSheet,
                    "ＰＬ (日毎) (計画反映版)": expenseSheet,
                },
            });

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const result = importer.validateFormat();

            expect(result.ok).toBe(true);
            expect(result.messages).toEqual([]);
        });

        test("シートが存在しない場合はエラーメッセージを返す", async () => {
            const mockReader = createMockFileReader();
            (global as any).FileReader = jest.fn(() => mockReader);

            const resultPromise = importer.load(false, 10);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = new ArrayBuffer(8);
                mockReader.onload({ target: mockReader } as any);
            }
            await resultPromise;

            const result = importer.validateFormat({
                productionSheet: "存在しないシート",
            });

            expect(result.ok).toBe(false);
            expect(result.messages.length).toBeGreaterThan(0);
        });

        test("ファイルがロードされていない場合はエラーをスロー", () => {
            expect(() => {
                importer.validateFormat();
            }).toThrow("Excelファイルがロードされていません");
        });
    });
});
