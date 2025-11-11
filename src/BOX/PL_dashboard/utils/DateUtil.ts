import { DAYS_OF_WEEK } from "../config";

/**
 * 日付関連のユーティリティ関数
 */
export class DateUtil {
    /**
     * 曜日を取得する
     * @param dateObj - 日付オブジェクト
     * @returns 曜日
     */
    static getDayOfWeek(dateObj: Date): string {
        return DAYS_OF_WEEK[dateObj.getDay()];
    }

    /**
     * 日付を短い形式(mm/dd(曜日))に変換
     * @param dateString - YYYY-MM-DD形式の日付文字列
     * @returns mm/dd(曜日)形式の文字列
     */
    static formatDateShort(dateString: string): string {
        const dateObj = new Date(dateString);
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const dayOfWeek = this.getDayOfWeek(dateObj);
        return `${month}/${day}(${dayOfWeek})`;
    }

    /**
     * 指定された年月の最終日を取得
     * @param year - 年
     * @param month - 月
     * @returns 最終日
     */
    static getLastDayOfMonth(year: number, month: number): number {
        return new Date(year, month, 0).getDate();
    }

    /**
     * 今日の日付をYYYY-MM-DD形式で取得
     * @returns 今日の日付
     */
    static getTodayString(): string {
        return new Date().toISOString().split("T")[0];
    }

    /**
     * 現在の年を取得
     * @returns 現在の年
     */
    static getCurrentYear(): number {
        return new Date().getFullYear();
    }

    /**
     * 現在の月を取得（1-12）
     * @returns 現在の月
     */
    static getCurrentMonth(): number {
        return new Date().getMonth() + 1;
    }
}
