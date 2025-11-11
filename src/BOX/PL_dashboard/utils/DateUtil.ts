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

    /**
     * 指定された年月の全日付リストを生成（YYYY-MM-DD形式）
     * @param year - 年（文字列）
     * @param month - 月（文字列、1-12）
     * @returns 月の全日付の配列
     */
    static generateMonthlyDateList(year: string, month: string): string[] {
        if (!year || !month) {
            return [];
        }

        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);

        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return [];
        }

        const datesInMonth = this.getLastDayOfMonth(yearNum, monthNum);
        const dateList: string[] = [];

        for (let day = 1; day <= datesInMonth; day++) {
            const dateString = `${year}-${month.padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            dateList.push(dateString);
        }

        return dateList;
    }

    /**
     * 指定された年月の全日付リスト（祝日を除く）を生成
     * @param year - 年（文字列）
     * @param month - 月（文字列、1-12）
     * @param holidayData - 祝日データ
     * @returns 祝日を除く月の全日付の配列
     */
    static generateWorkingDaysList(
        year: string,
        month: string,
        holidayData: { date?: { value: string } }[] = []
    ): string[] {
        const allDates = this.generateMonthlyDateList(year, month);
        const holidaySet = new Set(
            holidayData.map((holiday) => holiday.date?.value).filter(Boolean)
        );

        return allDates.filter((date) => {
            const dateObj = new Date(date);
            const dayOfWeek = dateObj.getDay();

            // 土曜日（6）と日曜日（0）、および祝日を除外
            return dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(date);
        });
    }
}
