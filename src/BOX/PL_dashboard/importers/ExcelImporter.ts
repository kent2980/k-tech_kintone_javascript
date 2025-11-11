import * as XLSX from "xlsx";
import { Logger } from "../utils";

/**
 * PL管理Excel専用インポーター
 * 表形式ではないExcelファイルから特定のセルを読み込むためのクラス
 */
export class ExcelImporter {
    private workbook: XLSX.WorkBook | null = null;
    private file: File;

    /**
     * コンストラクタ
     * @param file - インポートするExcelファイル
     */
    constructor(file: File) {
        this.file = file;
    }

    /**
     * Excelファイルを読み込んで展開
     */
    async load(): Promise<void> {
        try {
            const arrayBuffer = await this.readFileAsArrayBuffer(this.file);
            this.workbook = XLSX.read(arrayBuffer, {
                type: "array",
                cellDates: true,
                cellNF: false,
                cellText: false,
            });
            Logger.debug("Excelファイルを読み込みました", {
                sheetNames: this.workbook.SheetNames,
            });
        } catch (error) {
            Logger.error("Excelファイルの読み込みに失敗しました", error);
            throw new Error("Excelファイルの読み込みに失敗しました");
        }
    }

    /**
     * シート名の一覧を取得
     * @returns シート名の配列
     */
    getSheetNames(): string[] {
        if (!this.workbook) {
            throw new Error("Excelファイルが読み込まれていません。load()を先に実行してください");
        }
        return this.workbook.SheetNames;
    }

    /**
     * 指定したシートを取得
     * @param sheetName - シート名（省略時は最初のシート）
     * @returns シートオブジェクト
     */
    getSheet(sheetName?: string): XLSX.WorkSheet {
        if (!this.workbook) {
            throw new Error("Excelファイルが読み込まれていません。load()を先に実行してください");
        }

        const name = sheetName || this.workbook.SheetNames[0];
        const sheet = this.workbook.Sheets[name];

        if (!sheet) {
            throw new Error(`シート "${name}" が見つかりません`);
        }

        return sheet;
    }

    /**
     * 特定のセルの値を取得
     * @param cellAddress - セルアドレス（例: "A1", "B5"）
     * @param sheetName - シート名（省略時は最初のシート）
     * @returns セルの値
     */
    getCellValue(cellAddress: string, sheetName?: string): any {
        const sheet = this.getSheet(sheetName);
        const cell = sheet[cellAddress];

        if (!cell) {
            return "";
        }

        return cell.v; // v: 値
    }

    /**
     * 特定のセルの値を文字列として取得
     * @param cellAddress - セルアドレス
     * @param sheetName - シート名
     * @returns セルの値（文字列）
     */
    getCellValueAsString(cellAddress: string, sheetName?: string): string {
        const value = this.getCellValue(cellAddress, sheetName);
        return value !== null && value !== undefined ? String(value) : "";
    }

    /**
     * 特定のセルの値を数値として取得
     * @param cellAddress - セルアドレス
     * @param sheetName - シート名
     * @returns セルの値（数値）
     */
    getCellValueAsNumber(cellAddress: string, sheetName?: string): number {
        const value = this.getCellValue(cellAddress, sheetName);
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    }

    /**
     * 特定のセルの値を日付として取得
     * @param cellAddress - セルアドレス
     * @param sheetName - シート名
     * @returns セルの値（Date）
     */
    getCellValueAsDate(cellAddress: string, sheetName?: string): Date | null {
        const sheet = this.getSheet(sheetName);
        const cell = sheet[cellAddress];

        if (!cell) {
            return null;
        }

        // Excelのシリアル値を日付に変換
        if (cell.t === "n") {
            return XLSX.SSF.parse_date_code(cell.v);
        } else if (cell.t === "d") {
            return cell.v;
        }

        return null;
    }

    /**
     * 範囲指定でセルの値を取得
     * @param range - 範囲（例: "A1:C10"）
     * @param sheetName - シート名
     * @returns 2次元配列
     */
    getRangeValues(range: string, sheetName?: string): any[][] {
        const sheet = this.getSheet(sheetName);
        const decodedRange = XLSX.utils.decode_range(range);
        const result: any[][] = [];

        for (let row = decodedRange.s.r; row <= decodedRange.e.r; row++) {
            const rowData: any[] = [];
            for (let col = decodedRange.s.c; col <= decodedRange.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = sheet[cellAddress];
                rowData.push(cell ? cell.v : null);
            }
            result.push(rowData);
        }

        return result;
    }

    /** 開始行から最終行までの指定列の値を取得
     * @param colName - 列名（例: "A", "B"）
     * @param startRow - 開始行番号（1始まり）
     * @param sheetName - シート名
     * @returns 値の配列
     */
    getColumnValues(colName: string, startRow: number, sheetName?: string): string[] {
        const sheet = this.getSheet(sheetName);
        const colIndex = XLSX.utils.decode_col(colName);
        const result: string[] = [];

        if (!sheet["!ref"]) {
            Logger.warn("シートに範囲が定義されていません");
            return result;
        }

        const range = XLSX.utils.decode_range(sheet["!ref"]);

        // 指定列で値が入っている最終行を探す
        let lastRowWithValue = startRow - 1;
        for (let row = range.e.r; row >= startRow - 1; row--) {
            const cellAddress = ExcelImporter.getCellAddress(row, colIndex);
            const cellValue = this.getCellValueAsString(cellAddress, sheetName);
            if (cellValue !== "") {
                lastRowWithValue = row;
                break;
            }
        }

        // 開始行から値が入っている最終行までループ
        for (let row = startRow - 1; row <= lastRowWithValue; row++) {
            const cellAddress = ExcelImporter.getCellAddress(row, colIndex);
            const cellValue = this.getCellValueAsString(cellAddress, sheetName);
            result.push(cellValue);
        }

        return result;
    }

    /**
     * 行番号と列番号からセルアドレスを生成
     * @param row - 行番号（0始まり）
     * @param col - 列番号（0始まり）
     * @returns セルアドレス（例: "A1"）
     */
    static getCellAddress(row: number, col: number): string {
        return XLSX.utils.encode_cell({ r: row, c: col });
    }

    /**
     * 列名から列番号を取得
     * @param colName - 列名（例: "A", "AB"）
     * @returns 列番号（0始まり）
     */
    static getColumnNumber(colName: string): number {
        return XLSX.utils.decode_col(colName);
    }

    /**
     * シート全体をJSON形式に変換
     * @param sheetName - シート名
     * @param options - 変換オプション
     * @returns JSON配列
     */
    sheetToJson<T = any>(
        sheetName?: string,
        options: {
            header?: number | string[];
            range?: string | number;
            defval?: any;
        } = {}
    ): T[] {
        const sheet = this.getSheet(sheetName);
        return XLSX.utils.sheet_to_json<T>(sheet, options);
    }

    /**
     * ファイルをArrayBufferとして読み込む
     * @param file - 読み込むファイル
     * @returns ArrayBuffer
     */
    private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result;
                if (result instanceof ArrayBuffer) {
                    resolve(result);
                } else {
                    reject(new Error("ファイルの読み込みに失敗しました"));
                }
            };
            reader.onerror = () => reject(new Error("ファイルの読み込みエラー"));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * ワークブックを破棄
     */
    dispose(): void {
        this.workbook = null;
        Logger.debug("Excelワークブックを破棄しました");
    }
}
