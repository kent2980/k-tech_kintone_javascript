export class MasterModelStore {
    private static instance: MasterModelStore;
    private masterData: model_master.SavedFields[] = [];
    private constructor() {}

    public static getInstance(): MasterModelStore {
        if (!MasterModelStore.instance) {
            MasterModelStore.instance = new MasterModelStore();
        }
        return MasterModelStore.instance;
    }
    public setMasterData(data: model_master.SavedFields[]): void {
        this.masterData = Array.isArray(data) ? data : [];
    }

    public getMasterData(): model_master.SavedFields[] {
        return this.masterData;
    }

    public clearMasterData(): void {
        this.masterData = [];
    }
}
