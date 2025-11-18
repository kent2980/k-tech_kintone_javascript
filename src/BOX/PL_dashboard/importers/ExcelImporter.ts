import * as XLSX from "xlsx";
import { FileValidator, FileValidationResult } from "../utils/FileValidator";
import { Logger } from "../utils";

/**
 * DataFrameの形式でテーブルデータを格納するインターフェース
 * Pythonの pandas DataFrame に相当する構造
 */
export interface TableDataFrame<T extends Record<string, string | number | boolean | Date | null> = Record<string, string | number | boolean | Date | null>> {
    /** カラム名の配列 */
    columns: string[];
    /** レコードの配列（オブジェクト形式） */
    records: T[];
    /** 行数 */
    rowCount: number;
    /** 列数 */
    columnCount: number;
}

/**
 * 月次データをDataFrame形式で取得するためのインターフェース
 * 月次データの名前と値を持つ
 */
export interface MonthlyDataFrame extends Record<string, string | number | boolean | Date | null> {
    /** 社員単価 */
    inside_unit: number;
    /** 派遣単価 */
    outside_unit: number;
    /** 直行人員単価 */
    direct: number;
    /** 派遣人員単価 */
    dispatch: number;
    /** 間接人員単価 */
    indirect: number;
}

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
     * ファイルを検証する
     * @param maxSizeMB - 最大ファイルサイズ（MB、デフォルト: 10MB）
     * @returns 検証結果
     */
    async validateFile(maxSizeMB: number = 10): Promise<FileValidationResult> {
        // ファイル名の検証
        const fileNameResult = FileValidator.validateFileName(this.file.name);
        if (!fileNameResult.isValid) {
            return fileNameResult;
        }

        // Excelファイルの基本検証（サイズ、拡張子、MIMEタイプ）
        const excelResult = FileValidator.validateExcelFile(this.file, maxSizeMB);
        if (!excelResult.isValid) {
            return excelResult;
        }

        // マジックナンバーの検証（悪意のあるファイルの検出）
        const magicNumberResult = await FileValidator.validateMagicNumber(this.file);
        if (!magicNumberResult.isValid) {
            return magicNumberResult;
        }

        // 警告がある場合は警告を含めて返す
        return {
            isValid: true,
            errors: [],
            warnings: [...excelResult.warnings, ...magicNumberResult.warnings],
        };
    }

    /**
     * Excelファイルを読み込んで展開
     * @param validateBeforeLoad - 読み込み前に検証を行うか（デフォルト: true）
     * @param maxSizeMB - 最大ファイルサイズ（MB、デフォルト: 10MB）
     */
    async load(validateBeforeLoad: boolean = true, maxSizeMB: number = 10): Promise<void> {
        // 読み込み前に検証を実行
        if (validateBeforeLoad) {
            const validationResult = await this.validateFile(maxSizeMB);
            if (!validationResult.isValid) {
                const errorMessage = validationResult.errors.join("\n");
                Logger.error("Excelファイルの検証に失敗しました", {
                    errors: validationResult.errors,
                    warnings: validationResult.warnings,
                });
                throw new Error(`ファイル検証エラー: ${errorMessage}`);
            }

            // 警告がある場合はログに記録
            if (validationResult.warnings.length > 0) {
                Logger.warn("Excelファイルの検証で警告が発生しました", {
                    warnings: validationResult.warnings,
                });
            }
        }

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
     * 指定したシートが存在するか確認
     * @param sheetName - シート名
     * @returns 存在する場合はtrue、存在しない場合はfalse
     */
    hasSheet(sheetName: string): boolean {
        if (!this.workbook) {
            throw new Error("Excelファイルが読み込まれていません。load()を先に実行してください");
        }
        return this.workbook.SheetNames.includes(sheetName);
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

    /** 開始行から最終行までの指定列の値を取得（最終行は自動検出）
     * @param startColumn - 列名または列番号（1始まり）
     * @param endColumn - 列名または列番号（1始まり）
     * @param startRow - 開始行番号（1始まり）
     * @param sheetName - シート名
     * @returns 値の配列
     */
    getTableData(
        startColumn: string | number,
        endColumn: string | number,
        startRow: number,
        sheetName?: string
    ): string[][] {
        const sheet = this.getSheet(sheetName);
        const startColIndex =
            typeof startColumn === "string" ? XLSX.utils.decode_col(startColumn) : startColumn - 1;
        const endColIndex =
            typeof endColumn === "string" ? XLSX.utils.decode_col(endColumn) : endColumn - 1;
        const result: string[][] = [];

        let currentRow = startRow - 1; // 0始まりに変換
        while (true) {
            const firstCellAddress = XLSX.utils.encode_cell({ r: currentRow, c: startColIndex });
            const firstCell = sheet[firstCellAddress];
            if (
                !firstCell ||
                firstCell.v === null ||
                firstCell.v === undefined ||
                firstCell.v === ""
            ) {
                break; // 最終行に到達
            }
            const rowData: string[] = [];
            for (let col = startColIndex; col <= endColIndex; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: col });
                const cell = sheet[cellAddress];
                rowData.push(cell ? String(cell.v) : "");
            }
            result.push(rowData);
            currentRow++;
        }
        return result;
    }

    /**
     * 開始行から最終行までのテーブルデータをDataFrame形式で取得
     * Pythonの pandas DataFrame に相当する構造で、カラム名とレコード（オブジェクト形式）を返す
     * @param startColumn - 列名または列番号（1始まり）
     * @param endColumn - 列名または列番号（1始まり）
     * @param headerRow - ヘッダー行番号（1始まり、ここからカラム名を取得）
     * @param dataStartRow - データ開始行番号（1始まり、ここから実データを読み込む）
     * @param sheetName - シート名
     * @returns DataFrame形式のデータ
     */
    getTableDataAsDataFrame(
        startColumn: string | number,
        endColumn: string | number,
        headerRow: number,
        dataStartRow: number,
        sheetName?: string
    ): TableDataFrame {
        const sheet = this.getSheet(sheetName);
        const startColIndex =
            typeof startColumn === "string" ? XLSX.utils.decode_col(startColumn) : startColumn - 1;
        const endColIndex =
            typeof endColumn === "string" ? XLSX.utils.decode_col(endColumn) : endColumn - 1;

        // ヘッダー行からカラム名を取得
        const columns: string[] = [];
        const headerRowIndex = headerRow - 1; // 0始まりに変換
        for (let col = startColIndex; col <= endColIndex; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
            const cell = sheet[cellAddress];
            const columnName = cell ? String(cell.v) : `Column_${col + 1}`;
            columns.push(columnName);
        }

        // データ行を読み込んでレコード（オブジェクト形式）に変換
        const records: Record<string, any>[] = [];
        let currentRow = dataStartRow - 1; // 0始まりに変換

        while (true) {
            const firstCellAddress = XLSX.utils.encode_cell({ r: currentRow, c: startColIndex });
            const firstCell = sheet[firstCellAddress];

            // 最初のセルが空の場合は読み込み終了
            if (
                !firstCell ||
                firstCell.v === null ||
                firstCell.v === undefined ||
                firstCell.v === ""
            ) {
                break;
            }

            // 行のデータをオブジェクトに変換
            const record: Record<string, string | number | boolean | Date | null> = {};
            for (let col = startColIndex; col <= endColIndex; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: col });
                const cell = sheet[cellAddress];
                const columnName = columns[col - startColIndex];
                const value = cell ? cell.v : null;

                // 値の型を自動判定
                if (value === null || value === undefined || value === "") {
                    record[columnName] = null;
                } else if (typeof value === "number") {
                    record[columnName] = value;
                } else if (value instanceof Date) {
                    record[columnName] = value;
                } else {
                    record[columnName] = String(value);
                }
            }

            records.push(record);
            currentRow++;
        }

        return {
            columns,
            records,
            rowCount: records.length,
            columnCount: columns.length,
        };
    }

    /**
     * 縦方向のテーブルデータをDataFrame形式で取得（転置テーブル）
     * 左端（指定列）がカラム名で、右方向にデータが横並びのテーブル構造に対応
     * 例: A1:A10がカラム名、B1:X10がデータ（各行がレコード）
     * @param headerColumn - ヘッダー列名または列番号（1始まり）。ここからカラム名を取得
     * @param dataStartColumn - データ開始列名または列番号（1始まり）。ここからデータを読み込む
     * @param dataEndColumn - データ終了列名または列番号（1始まり）
     * @param startRow - 開始行番号（1始まり）
     * @param endRow - 終了行番号（1始まり）
     * @param sheetName - シート名
     * @returns DataFrame形式のデータ
     */
    getTableDataAsDataFrameTransposed(
        headerColumn: string | number,
        dataStartColumn: string | number,
        dataEndColumn: string | number,
        startRow: number,
        endRow: number,
        sheetName?: string
    ): TableDataFrame {
        const sheet = this.getSheet(sheetName);
        const headerColIndex =
            typeof headerColumn === "string"
                ? XLSX.utils.decode_col(headerColumn)
                : headerColumn - 1;
        const dataStartColIndex =
            typeof dataStartColumn === "string"
                ? XLSX.utils.decode_col(dataStartColumn)
                : dataStartColumn - 1;
        const dataEndColIndex =
            typeof dataEndColumn === "string"
                ? XLSX.utils.decode_col(dataEndColumn)
                : dataEndColumn - 1;
        const columns: string[] = [];
        const records: Record<string, any>[] = [];
        const startRowIndex = startRow - 1; // 0始まりに変換
        const endRowIndex = endRow - 1; // 0始まりに変換
        // カラム名を取得
        for (let row = startRowIndex; row <= endRowIndex; row++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: headerColIndex });
            const cell = sheet[cellAddress];
            let columnName = cell ? String(cell.v) : `Column_${row + 1}`;
            // columnNameが空かすでに存在する場合はrowを代入
            if (!columnName || columns.includes(columnName)) {
                columnName = `Column_${row + 1}`;
            }
            columns.push(columnName);
        }
        // レコードを取得
        for (let column = dataStartColIndex; column <= dataEndColIndex; column++) {
            const headerCellAddress = XLSX.utils.encode_cell({
                r: startRowIndex,
                c: headerColIndex,
            });
            const headerCell = sheet[headerCellAddress];

            // ヘッダーセルが空の場合は読み込み終了
            if (
                !headerCell ||
                headerCell.v === null ||
                headerCell.v === undefined ||
                headerCell.v === ""
            ) {
                break;
            }
            const record: Record<string, any> = {};
            let columnIndex = 0;
            for (let row = startRowIndex; row <= endRowIndex; row++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: column });
                const cell = sheet[cellAddress];
                const columnName = columns[columnIndex++];
                const value = cell ? cell.v : null;
                // 値の型を自動判定
                if (value === null || value === undefined || value === "") {
                    record[columnName] = null;
                } else if (typeof value === "number") {
                    record[columnName] = value;
                } else if (value instanceof Date) {
                    record[columnName] = value;
                } else {
                    record[columnName] = String(value);
                }
            }
            records.push(record);
        }
        return {
            columns,
            records,
            rowCount: records.length,
            columnCount: columns.length,
        };
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
