/**
 * アクティブフィルターの型定義
 */
export interface ActiveFilter {
    year: number;
    month: number;
}

export class ActiveFilterStore {
    private static instance: ActiveFilterStore;
    private activeFilters: Partial<ActiveFilter> = {};

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

    public getFilter(): Partial<ActiveFilter> {
        return this.activeFilters;
    }

    public clearFilters(): void {
        this.activeFilters = {};
    }
}
