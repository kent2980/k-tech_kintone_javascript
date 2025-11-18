/**
 * ファイル検証ユーティリティ
 * ファイルサイズ、形式、悪意のあるファイルの検出を行う
 */

import { Logger } from "./Logger";

/**
 * ファイル検証結果
 */
export interface FileValidationResult {
    /** 検証が成功したか */
    isValid: boolean;
    /** エラーメッセージの配列 */
    errors: string[];
    /** 警告メッセージの配列 */
    warnings: string[];
}

/**
 * Excelファイルのマジックナンバー（ファイルシグネチャ）
 * Excelファイルの先頭バイト列でファイル形式を判定
 */
const EXCEL_MAGIC_NUMBERS = {
    // XLSX形式（ZIP形式のため、ZIPのマジックナンバー）
    XLSX: [0x50, 0x4b, 0x03, 0x04], // PK\x03\x04
    // XLS形式（OLE2形式）
    XLS: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], // \xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1
};

/**
 * 許可されるExcelファイルのMIMEタイプ
 */
const ALLOWED_MIME_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "application/octet-stream", // 一部のブラウザでExcelファイルがこのMIMEタイプになる場合がある
];

/**
 * 許可されるExcelファイルの拡張子
 */
const ALLOWED_EXTENSIONS = ["xlsx", "xls"];

/**
 * ファイル検証ユーティリティクラス
 */
export class FileValidator {
    /** デフォルトの最大ファイルサイズ（10MB） */
    private static readonly DEFAULT_MAX_SIZE_MB = 10;

    /**
     * Excelファイルを検証する
     * @param file - 検証するファイル
     * @param maxSizeMB - 最大ファイルサイズ（MB、デフォルト: 10MB）
     * @returns 検証結果
     */
    static validateExcelFile(file: File, maxSizeMB: number = this.DEFAULT_MAX_SIZE_MB): FileValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. ファイルサイズの検証
        const sizeResult = this.validateFileSize(file, maxSizeMB);
        if (!sizeResult.isValid) {
            errors.push(...sizeResult.errors);
        }

        // 2. ファイル拡張子の検証
        const extensionResult = this.validateFileExtension(file, ALLOWED_EXTENSIONS);
        if (!extensionResult.isValid) {
            errors.push(...extensionResult.errors);
        }

        // 3. MIMEタイプの検証（警告のみ、拡張子が正しければ許可）
        const mimeResult = this.validateMimeType(file, ALLOWED_MIME_TYPES);
        if (!mimeResult.isValid && extensionResult.isValid) {
            // 拡張子が正しい場合は警告のみ
            warnings.push(...mimeResult.errors);
        } else if (!mimeResult.isValid) {
            // 拡張子も間違っている場合はエラー
            errors.push(...mimeResult.errors);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * ファイルサイズを検証する
     * @param file - 検証するファイル
     * @param maxSizeMB - 最大ファイルサイズ（MB）
     * @returns 検証結果
     */
    static validateFileSize(file: File, maxSizeMB: number): FileValidationResult {
        const maxBytes = maxSizeMB * 1024 * 1024;
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

        if (file.size === 0) {
            return {
                isValid: false,
                errors: ["ファイルが空です"],
                warnings: [],
            };
        }

        if (file.size > maxBytes) {
            return {
                isValid: false,
                errors: [
                    `ファイルサイズが大きすぎます。最大${maxSizeMB}MBまで許可されていますが、現在のファイルは${fileSizeMB}MBです。`,
                ],
                warnings: [],
            };
        }

        return {
            isValid: true,
            errors: [],
            warnings: [],
        };
    }

    /**
     * ファイル拡張子を検証する
     * @param file - 検証するファイル
     * @param allowedExtensions - 許可される拡張子の配列（小文字）
     * @returns 検証結果
     */
    static validateFileExtension(file: File, allowedExtensions: string[]): FileValidationResult {
        const extension = file.name.split(".").pop()?.toLowerCase();

        if (!extension) {
            return {
                isValid: false,
                errors: ["ファイルに拡張子がありません"],
                warnings: [],
            };
        }

        if (!allowedExtensions.includes(extension)) {
            return {
                isValid: false,
                errors: [
                    `許可されていないファイル形式です。許可されている形式: ${allowedExtensions.join(", ")}`,
                ],
                warnings: [],
            };
        }

        return {
            isValid: true,
            errors: [],
            warnings: [],
        };
    }

    /**
     * MIMEタイプを検証する
     * @param file - 検証するファイル
     * @param allowedMimeTypes - 許可されるMIMEタイプの配列
     * @returns 検証結果
     */
    static validateMimeType(file: File, allowedMimeTypes: string[]): FileValidationResult {
        // ブラウザによってはMIMEタイプが正しく設定されない場合があるため、警告のみ
        if (file.type && !allowedMimeTypes.includes(file.type)) {
            return {
                isValid: false,
                errors: [
                    `ファイルのMIMEタイプが正しくありません。検出されたMIMEタイプ: ${file.type}`,
                ],
                warnings: [],
            };
        }

        return {
            isValid: true,
            errors: [],
            warnings: [],
        };
    }

    /**
     * ファイルのマジックナンバー（ファイルシグネチャ）を検証する
     * 悪意のあるファイルの検出に有効
     * @param file - 検証するファイル
     * @returns 検証結果（Promise）
     */
    static async validateMagicNumber(file: File): Promise<FileValidationResult> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const arrayBuffer = event.target?.result;
                    if (!(arrayBuffer instanceof ArrayBuffer)) {
                        resolve({
                            isValid: false,
                            errors: ["ファイルの読み込みに失敗しました"],
                            warnings: [],
                        });
                        return;
                    }

                    const bytes = new Uint8Array(arrayBuffer);
                    const result = this.checkExcelMagicNumber(bytes);

                    if (!result.isValid) {
                        Logger.warn("Excelファイルのマジックナンバー検証に失敗", {
                            fileName: file.name,
                            errors: result.errors,
                        });
                    }

                    resolve(result);
                } catch (error) {
                    Logger.error("マジックナンバー検証でエラーが発生しました", error);
                    resolve({
                        isValid: false,
                        errors: ["ファイル形式の検証中にエラーが発生しました"],
                        warnings: [],
                    });
                }
            };

            reader.onerror = () => {
                resolve({
                    isValid: false,
                    errors: ["ファイルの読み込みエラー"],
                    warnings: [],
                });
            };

            // 最初の8バイトを読み込む（XLS形式のマジックナンバーを確認するため）
            reader.readAsArrayBuffer(file.slice(0, 8));
        });
    }

    /**
     * Excelファイルのマジックナンバーをチェック
     * @param bytes - ファイルの先頭バイト列
     * @returns 検証結果
     */
    private static checkExcelMagicNumber(bytes: Uint8Array): FileValidationResult {
        if (bytes.length < 4) {
            return {
                isValid: false,
                errors: ["ファイルが小さすぎて形式を判定できません"],
                warnings: [],
            };
        }

        // XLSX形式のチェック（ZIP形式のため、ZIPのマジックナンバーを確認）
        const xlsxMagic = EXCEL_MAGIC_NUMBERS.XLSX;
        const isXlsx = xlsxMagic.every((byte, index) => bytes[index] === byte);

        if (isXlsx) {
            return {
                isValid: true,
                errors: [],
                warnings: [],
            };
        }

        // XLS形式のチェック（OLE2形式）
        if (bytes.length >= 8) {
            const xlsMagic = EXCEL_MAGIC_NUMBERS.XLS;
            const isXls = xlsMagic.every((byte, index) => bytes[index] === byte);

            if (isXls) {
                return {
                    isValid: true,
                    errors: [],
                    warnings: [],
                };
            }
        }

        return {
            isValid: false,
            errors: [
                "ファイルが正しいExcel形式ではありません。ファイルが破損しているか、Excelファイル以外の可能性があります。",
            ],
            warnings: [],
        };
    }

    /**
     * ファイル名の安全性を検証する
     * 危険な文字やパストラバーサル攻撃を防ぐ
     * @param fileName - 検証するファイル名
     * @returns 検証結果
     */
    static validateFileName(fileName: string): FileValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 危険な文字のチェック
        const dangerousChars = ["../", "..\\", "/", "\\", "\0", "<", ">", ":", '"', "|", "?", "*"];
        for (const char of dangerousChars) {
            if (fileName.includes(char)) {
                errors.push(`ファイル名に危険な文字が含まれています: ${char}`);
            }
        }

        // ファイル名の長さチェック
        if (fileName.length > 255) {
            errors.push("ファイル名が長すぎます（255文字以下にしてください）");
        }

        // 空のファイル名チェック
        if (fileName.trim().length === 0) {
            errors.push("ファイル名が空です");
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
}

