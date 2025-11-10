import { DateUtil, DomUtil } from "../utils";

/**
 * フィルターコンポーネント
 */
export class FilterContainer {
    private yearSelect: HTMLSelectElement;
    private monthSelect: HTMLSelectElement;
    private container: HTMLDivElement;

    /**
     * 年選択セレクトボックスを作成する（静的メソッド）
     * @param yearCount - 過去何年分を表示するか
     * @returns 年選択セレクトボックス
     */
    public static createYearSelect(yearCount: number = 10): HTMLSelectElement {
        const yearSelect = document.createElement("select");
        yearSelect.id = "year-select";

        // デフォルトオプション
        DomUtil.addOption(yearSelect, "", "-- 選択 --");

        // 過去yearCount年分のオプションを追加
        const currentYear = DateUtil.getCurrentYear();
        for (let i = 0; i < yearCount; i++) {
            const year = currentYear - i;
            DomUtil.addOption(yearSelect, year, year.toString());
        }

        // 現在の年をデフォルト選択
        yearSelect.value = currentYear.toString();

        return yearSelect;
    }

    /**
     * 月選択セレクトボックスを作成する（静的メソッド）
     * @returns 月選択セレクトボックス
     */
    public static createMonthSelect(): HTMLSelectElement {
        const monthSelect = document.createElement("select");
        monthSelect.id = "month-select";

        // デフォルトオプション
        DomUtil.addOption(monthSelect, "", "-- 選択 --");

        // 12ヶ月分のオプションを追加
        for (let i = 1; i <= 12; i++) {
            DomUtil.addOption(monthSelect, i.toString(), `${i}月`);
        }

        // 現在の月をデフォルト選択
        const currentMonth = DateUtil.getCurrentMonth();
        monthSelect.value = currentMonth.toString();

        return monthSelect;
    }

    constructor() {
        this.container = this.createContainer();
        this.yearSelect = this.createYearSelect();
        this.monthSelect = this.createMonthSelect();

        this.setupContainer();
    }

    /**
     * フィルターコンテナを作成する
     * @returns フィルターコンテナ
     */
    private createContainer(): HTMLDivElement {
        const container = document.createElement("div");
        container.style.margin = "0";
        return container;
    }

    /**
     * 年選択セレクトボックスを作成する
     * @param yearCount - 過去何年分を表示するか
     * @returns 年選択セレクトボックス
     */
    private createYearSelect(yearCount: number = 10): HTMLSelectElement {
        const yearSelect = document.createElement("select");
        yearSelect.id = "year-select";

        // デフォルトオプション
        DomUtil.addOption(yearSelect, "", "-- 選択 --");

        // 過去yearCount年分のオプションを追加
        const currentYear = DateUtil.getCurrentYear();
        for (let i = 0; i < yearCount; i++) {
            const year = currentYear - i;
            DomUtil.addOption(yearSelect, year, year.toString());
        }

        // 現在の年をデフォルト選択
        yearSelect.value = currentYear.toString();

        return yearSelect;
    }

    /**
     * 月選択セレクトボックスを作成する
     * @returns 月選択セレクトボックス
     */
    private createMonthSelect(): HTMLSelectElement {
        const monthSelect = document.createElement("select");
        monthSelect.id = "month-select";

        // デフォルトオプション
        DomUtil.addOption(monthSelect, "", "-- 選択 --");

        // 12ヶ月分のオプションを追加
        for (let i = 1; i <= 12; i++) {
            DomUtil.addOption(monthSelect, i.toString(), `${i}月`);
        }

        // 現在の月をデフォルト選択
        const currentMonth = DateUtil.getCurrentMonth();
        monthSelect.value = currentMonth.toString();

        return monthSelect;
    }

    /**
     * コンテナを設定する
     */
    private setupContainer(): void {
        // 年フィルター
        this.container.appendChild(DomUtil.createLabel("年: ", "year-select"));
        this.container.appendChild(this.yearSelect);

        // 月フィルター
        this.container.appendChild(DomUtil.createLabel("月: ", "month-select", "20px"));
        this.container.appendChild(this.monthSelect);
    }

    /**
     * 年選択の変更イベントを設定する
     * @param callback - 変更時のコールバック関数
     */
    public onYearChange(callback: (yearValue: string) => void): void {
        this.yearSelect.addEventListener("change", () => {
            callback(this.yearSelect.value);
        });
    }

    /**
     * 月選択の変更イベントを設定する
     * @param callback - 変更時のコールバック関数
     */
    public onMonthChange(callback: (monthValue: string) => void): void {
        this.monthSelect.addEventListener("change", () => {
            callback(this.monthSelect.value);
        });
    }

    /**
     * フィルター値の変更イベントを設定する
     * @param callback - 変更時のコールバック関数
     */
    public onFilterChange(callback: (yearValue: string, monthValue: string) => void): void {
        const handler = (): void => {
            callback(this.yearSelect.value, this.monthSelect.value);
        };

        this.yearSelect.addEventListener("change", handler);
        this.monthSelect.addEventListener("change", handler);
    }

    /**
     * 選択された年を取得する
     * @returns 選択された年
     */
    public getSelectedYear(): string {
        return this.yearSelect.value;
    }

    /**
     * 選択された月を取得する
     * @returns 選択された月
     */
    public getSelectedMonth(): string {
        return this.monthSelect.value;
    }

    /**
     * フィルターコンテナ要素を取得する
     * @returns フィルターコンテナ要素
     */
    public getElement(): HTMLDivElement {
        return this.container;
    }

    /**
     * 年を設定する
     * @param year - 設定する年
     */
    public setYear(year: string): void {
        this.yearSelect.value = year;
    }

    /**
     * 月を設定する
     * @param month - 設定する月
     */
    public setMonth(month: string): void {
        this.monthSelect.value = month;
    }
}
