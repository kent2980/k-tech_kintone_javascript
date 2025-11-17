export interface KintoneSaveResults {
    ok: boolean;
    records: {
        id: string;
        revision: string;
    }[];
}

export interface KintoneSaveResult {
    ok: boolean;
    id: string;
    revision: string;
}

export interface KintoneDuplicateResult {
    ok: boolean;
}
