// グローバル変数の型定義

// Vite環境変数の型定義
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_ID_PRODUCTION_REPORT?: string;
    readonly VITE_APP_ID_MASTER_MODEL?: string;
    readonly VITE_APP_ID_PL_DAILY?: string;
    readonly VITE_APP_ID_PL_MONTHLY?: string;
    readonly VITE_APP_ID_HOLIDAY?: string;
    readonly NODE_ENV?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// pdfMake
declare const pdfMake: any;

declare interface Window {
  DataTable: any;
}

// CSS modules
declare module "*.css";
declare module "*.min.css";

// pdfMake modules
declare module "pdfmake/build/pdfmake";
declare module "pdfmake/build/vfs_fonts";

// DOMPurify modules (テスト環境用)
declare module "dompurify" {
    export interface Config {
        ALLOWED_TAGS?: string[];
        ALLOWED_ATTR?: string[];
        ALLOW_DATA_ATTR?: boolean;
        KEEP_CONTENT?: boolean;
        [key: string]: unknown;
    }

    export interface DOMPurify {
        sanitize(html: string, config?: Config): string;
        isSupported: boolean;
        [key: string]: unknown;
    }

    const DOMPurify: DOMPurify;
    export default DOMPurify;
}

// kintone API
declare namespace kintone {
  namespace app {
    function getId(): number;
    function getHeaderSpaceElement(): HTMLElement | null;
  }

  namespace api {
    function url(path: string, detectGuestSpace: boolean): string;
  }

  function api(url: string, method: string, params: any): Promise<any>;

  namespace events {
    function on(eventName: string, handler: (event: any) => any): void;
  }
}
