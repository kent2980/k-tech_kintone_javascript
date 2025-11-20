/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_ID_PRODUCTION_REPORT: string;
    readonly VITE_APP_ID_MASTER_MODEL: string;
    readonly VITE_APP_ID_PL_DAILY: string;
    readonly VITE_APP_ID_PL_MONTHLY: string;
    readonly VITE_APP_ID_HOLIDAY: string;
    readonly VITE_KINTONE_BASE_URL: string;
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

