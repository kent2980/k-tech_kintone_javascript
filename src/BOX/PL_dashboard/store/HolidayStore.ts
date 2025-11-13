export class HolidayStore {
    private static instance: HolidayStore;
    private holidays: holiday.SavedFields[] = [];

    private constructor() {}

    public static getInstance(): HolidayStore {
        if (!HolidayStore.instance) {
            HolidayStore.instance = new HolidayStore();
        }
        return HolidayStore.instance;
    }

    public setHolidayData(data: holiday.SavedFields[]): void {
        this.holidays = Array.isArray(data) ? data : [];
    }

    public getHolidayData(): holiday.SavedFields[] {
        return this.holidays;
    }

    public findByDate(date: string): holiday.SavedFields | undefined {
        return this.holidays.find((h) => h.date?.value === date);
    }

    public getSelectHolidayDates(year: number, month: number): Date[] {
        const selectedDates: Date[] = [];
        this.holidays.forEach((holiday) => {
            if (holiday.date?.value) {
                const holidayDate = new Date(holiday.date.value);
                if (holidayDate.getFullYear() === year && holidayDate.getMonth() + 1 === month) {
                    selectedDates.push(holidayDate);
                }
            }
        });
        return selectedDates;
    }
}
