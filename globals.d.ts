// グローバル変数の型定義

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
