/**
 * Result型パターン - エラー情報を保持する型定義
 * 成功と失敗の両方を表現し、エラー情報を失わないようにする
 */

/**
 * エラー情報の詳細
 *
 * @category Types
 */
export interface ErrorDetails {
    /** エラーメッセージ */
    message: string;
    /** エラーコード（オプション） */
    code?: string;
    /** 元のエラーオブジェクト（オプション） */
    originalError?: Error | unknown;
    /** エラーが発生したコンテキスト情報（オプション） */
    context?: Record<string, unknown>;
    /** エラー発生時刻 */
    timestamp: Date;
}

/**
 * Result型 - 成功または失敗を表現
 *
 * @template T - 成功時のデータ型
 * @category Types
 */
export type Result<T> = Success<T> | Failure;

/**
 * 成功を表現する型
 *
 * @template T - 成功時のデータ型
 * @category Types
 */
export interface Success<T> {
    /** 成功フラグ */
    success: true;
    /** 成功時のデータ */
    data: T;
}

/**
 * 失敗を表現する型
 *
 * @category Types
 */
export interface Failure {
    /** 成功フラグ */
    success: false;
    /** エラー情報 */
    error: ErrorDetails;
}

/**
 * Result型のヘルパー関数
 * 型名Result<T>と衝突しないように、eslint-disable-next-lineを使用
 */
// eslint-disable-next-line no-redeclare
export const Result = {
    /**
     * 成功を表すResultを作成
     */
    success<T>(data: T): Success<T> {
        return {
            success: true,
            data,
        };
    },

    /**
     * 失敗を表すResultを作成
     */
    failure(
        message: string,
        originalError?: Error | unknown,
        code?: string,
        context?: Record<string, unknown>
    ): Failure {
        return {
            success: false,
            error: {
                message,
                code,
                originalError,
                context,
                timestamp: new Date(),
            },
        };
    },

    /**
     * エラーからFailureを作成
     */
    fromError(error: Error | unknown, context?: Record<string, unknown>): Failure {
        if (error instanceof Error) {
            return Result.failure(error.message, error, error.name, context);
        }
        return Result.failure(String(error), error, "UNKNOWN_ERROR", context);
    },

    /**
     * Resultが成功かどうかを判定
     */
    isSuccess<T>(result: Result<T>): result is Success<T> {
        return result.success === true;
    },

    /**
     * Resultが失敗かどうかを判定
     */
    isFailure<T>(result: Result<T>): result is Failure {
        return result.success === false;
    },
};
