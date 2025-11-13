export class ActiveFilterStore {
    private static instance: ActiveFilterStore;
    private activeFilters: Record<string, any> = {};

    private constructor() {}

    public static getInstance(): ActiveFilterStore {
        if (!ActiveFilterStore.instance) {
            ActiveFilterStore.instance = new ActiveFilterStore();
        }
        return ActiveFilterStore.instance;
    }

    public setFilter(year: number, month: number): void {
        this.activeFilters = {
            year: year,
            month: month,
        };
    }

    public getFilter(): Record<string, any> {
        return this.activeFilters;
    }

    public clearFilters(): void {
        this.activeFilters = {};
    }
}
