/**
 * エラーハンドリングユーティリティ
 * エラー情報を保持し、一貫したエラーハンドリングを提供
 */

import { Logger } from "./Logger";
import { Result, ErrorDetails } from "../types/result";
import { UserFriendlyMessages } from "./UserFriendlyMessages";

/**
 * エラーハンドリング戦略
 */
export enum ErrorHandlingStrategy {
    /** エラーをログに記録してnullを返す（既存コードとの互換性） */
    LOG_AND_RETURN_NULL = "LOG_AND_RETURN_NULL",
    /** エラーをログに記録して空配列を返す（既存コードとの互換性） */
    LOG_AND_RETURN_EMPTY = "LOG_AND_RETURN_EMPTY",
    /** エラーを再スローする（呼び出し側で処理） */
    RETHROW = "RETHROW",
    /** Result型を返す（エラー情報を保持） */
    RETURN_RESULT = "RETURN_RESULT",
}

/**
 * エラーハンドリングヘルパークラス
 */
export class ErrorHandler {
    /**
     * エラーを標準形式に変換
     * @param error - エラーオブジェクト
     * @param context - エラー発生コンテキスト
     * @returns エラー詳細
     */
    static normalizeError(
        error: Error | unknown,
        context?: Record<string, unknown>
    ): ErrorDetails {
        if (error instanceof Error) {
            return {
                message: error.message,
                code: error.name,
                originalError: error,
                context,
                timestamp: new Date(),
            };
        }

        return {
            message: String(error),
            code: "UNKNOWN_ERROR",
            originalError: error,
            context,
            timestamp: new Date(),
        };
    }

    /**
     * エラーをログに記録（詳細情報を含む）
     * @param message - エラーメッセージ
     * @param error - エラーオブジェクト
     * @param context - エラー発生コンテキスト
     */
    static logError(
        message: string,
        error: Error | unknown,
        context?: Record<string, unknown>
    ): void {
        const errorDetails = this.normalizeError(error, context);
        Logger.error(message, {
            error: errorDetails.message,
            code: errorDetails.code,
            context: errorDetails.context,
            timestamp: errorDetails.timestamp,
            originalError: errorDetails.originalError,
        });
    }

    /**
     * ユーザー向けエラーメッセージを取得
     * @param error - エラーオブジェクト
     * @param context - エラー発生コンテキスト
     * @param defaultMessage - デフォルトメッセージ（オプション）
     * @returns ユーザーフレンドリーなメッセージ
     */
    static getUserFriendlyMessage(
        error: Error | unknown,
        context?: Record<string, unknown>,
        defaultMessage?: string
    ): string {
        return UserFriendlyMessages.fromContext(error, context) || defaultMessage || "";
    }

    /**
     * エラーを処理してResult型を返す
     * @param error - エラーオブジェクト
     * @param context - エラー発生コンテキスト
     * @returns Failure型のResult
     */
    static handleError(
        error: Error | unknown,
        context?: Record<string, unknown>
    ): Result<never> {
        const errorDetails = this.normalizeError(error, context);
        this.logError("エラーが発生しました", error, context);
        return {
            success: false,
            error: errorDetails,
        };
    }

    /**
     * エラーを処理してnullを返す（既存コードとの互換性）
     * @param message - エラーメッセージ
     * @param error - エラーオブジェクト
     * @param context - エラー発生コンテキスト
     * @returns null
     */
    static handleErrorAndReturnNull(
        message: string,
        error: Error | unknown,
        context?: Record<string, unknown>
    ): null {
        this.logError(message, error, context);
        return null;
    }

    /**
     * エラーを処理して空配列を返す（既存コードとの互換性）
     * @param message - エラーメッセージ
     * @param error - エラーオブジェクト
     * @param context - エラー発生コンテキスト
     * @returns 空配列
     */
    static handleErrorAndReturnEmpty<T>(
        message: string,
        error: Error | unknown,
        context?: Record<string, unknown>
    ): T[] {
        this.logError(message, error, context);
        return [];
    }

    /**
     * エラーを処理して再スローする
     * @param message - エラーメッセージ
     * @param error - エラーオブジェクト
     * @param context - エラー発生コンテキスト
     * @throws エラーを再スロー
     */
    static handleErrorAndRethrow(
        message: string,
        error: Error | unknown,
        context?: Record<string, unknown>
    ): never {
        this.logError(message, error, context);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`${message}: ${String(error)}`);
    }
}

