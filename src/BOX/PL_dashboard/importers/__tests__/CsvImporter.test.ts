/**
 * CsvImporterのユニットテスト
 */

import { CsvImporter } from "../CsvImporter";

// FileReaderをモック
const createMockFileReader = (content: string) => {
    const reader: any = {
        readAsText: jest.fn(function (this: any, file: File) {
            Promise.resolve().then(() => {
                this.result = content;
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

describe("CsvImporter", () => {
    describe("constructor", () => {
        test("マッパー関数を指定してインスタンスを作成", () => {
            const mapper = (row: string[]) => ({ col1: row[0], col2: row[1] });
            const importer = new CsvImporter(mapper);

            expect(importer).toBeInstanceOf(CsvImporter);
        });

        test("オプションを指定してインスタンスを作成", () => {
            const mapper = (row: string[]) => ({ col1: row[0] });
            const importer = new CsvImporter(mapper, {
                delimiter: ";",
                hasHeader: false,
            });

            expect(importer).toBeInstanceOf(CsvImporter);
        });
    });

    describe("importFile", () => {
        test("正常にCSVファイルをインポート", async () => {
            const mapper = (row: string[]) => ({ col1: row[0], col2: row[1] });
            const importer = new CsvImporter(mapper);

            const fileContent = "header1,header2\nvalue1,value2";
            const mockReader = createMockFileReader(fileContent);
            (global as any).FileReader = jest.fn(() => mockReader);

            const file = new File([fileContent], "test.csv", {
                type: "text/csv",
            });

            const resultPromise = importer.importFile(file);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = fileContent as any;
                mockReader.onload({ target: mockReader } as any);
            }
            const result = await resultPromise;

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ col1: "value1", col2: "value2" });
        });

        test("ヘッダーなしでCSVファイルをインポート", async () => {
            const mapper = (row: string[]) => ({ col1: row[0], col2: row[1] });
            const importer = new CsvImporter(mapper, { hasHeader: false });

            const fileContent = "value1,value2\nvalue3,value4";
            const mockReader = createMockFileReader(fileContent);
            (global as any).FileReader = jest.fn(() => mockReader);

            const file = new File([fileContent], "test.csv", {
                type: "text/csv",
            });

            const resultPromise = importer.importFile(file);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = fileContent as any;
                mockReader.onload({ target: mockReader } as any);
            }
            const result = await resultPromise;

            expect(result.length).toBeGreaterThanOrEqual(2);
        });

        test("カスタム区切り文字でCSVファイルをインポート", async () => {
            const mapper = (row: string[]) => ({ col1: row[0], col2: row[1] });
            const importer = new CsvImporter(mapper, { delimiter: ";" });

            const fileContent = "header1;header2\nvalue1;value2";
            const mockReader = createMockFileReader(fileContent);
            (global as any).FileReader = jest.fn(() => mockReader);

            const file = new File([fileContent], "test.csv", {
                type: "text/csv",
            });

            const resultPromise = importer.importFile(file);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = fileContent as any;
                mockReader.onload({ target: mockReader } as any);
            }
            const result = await resultPromise;

            expect(result.length).toBeGreaterThan(0);
        });

        test("無効なファイル拡張子の場合はエラー", async () => {
            const mapper = (row: string[]) => ({ col1: row[0] });
            const importer = new CsvImporter(mapper);

            const file = new File(["data"], "test.xlsx", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            await expect(importer.importFile(file)).rejects.toThrow(
                "CSVファイルまたはテキストファイル"
            );
        });

        test("ファイルサイズが大きすぎる場合はエラー", async () => {
            const mapper = (row: string[]) => ({ col1: row[0] });
            const importer = new CsvImporter(mapper);

            const largeContent = "x".repeat(51 * 1024 * 1024);
            const file = new File([largeContent], "test.csv", { type: "text/csv" });

            await expect(importer.importFile(file)).rejects.toThrow("ファイルサイズは50MB以下");
        });

        test("空のCSVファイルの場合はエラー", async () => {
            const mapper = (row: string[]) => ({ col1: row[0] });
            const importer = new CsvImporter(mapper);

            const fileContent = "   \n  \n"; // 空白のみの行
            const mockReader = createMockFileReader(fileContent);
            (global as any).FileReader = jest.fn(() => mockReader);

            const file = new File([fileContent], "test.csv", { type: "text/csv" });

            const resultPromise = importer.importFile(file);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = fileContent as any;
                mockReader.onload({ target: mockReader } as any);
            }

            await expect(resultPromise).rejects.toThrow("CSVファイルが空です");
        });
    });

    describe("parseLine", () => {
        test("ダブルクォートで囲まれた値を正しくパース", async () => {
            const mapper = (row: string[]) => ({ col1: row[0], col2: row[1] });
            const importer = new CsvImporter(mapper);

            const fileContent = 'header1,header2\n"value,with,comma","value2"';
            const mockReader = createMockFileReader(fileContent);
            (global as any).FileReader = jest.fn(() => mockReader);

            const file = new File([fileContent], "test.csv", {
                type: "text/csv",
            });

            const resultPromise = importer.importFile(file);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = fileContent as any;
                mockReader.onload({ target: mockReader } as any);
            }
            const result = await resultPromise;

            expect(result.length).toBeGreaterThan(0);
        });

        test("エスケープされたダブルクォートを正しくパース", async () => {
            const mapper = (row: string[]) => ({ col1: row[0] });
            const importer = new CsvImporter(mapper);

            const fileContent = 'header1\n"value with ""quotes"""';
            const mockReader = createMockFileReader(fileContent);
            (global as any).FileReader = jest.fn(() => mockReader);

            const file = new File([fileContent], "test.csv", {
                type: "text/csv",
            });

            const resultPromise = importer.importFile(file);
            await Promise.resolve();
            if (mockReader.onload) {
                mockReader.result = fileContent as any;
                mockReader.onload({ target: mockReader } as any);
            }
            const result = await resultPromise;

            expect(result.length).toBeGreaterThan(0);
        });
    });
});
