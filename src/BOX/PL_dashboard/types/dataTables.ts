/**
 * DataTables型定義
 */

/**
 * DataTables設定オプション
 *
 * @category Types
 */
export interface DataTablesOptions {
    paging?: boolean;
    pageLength?: number;
    searching?: boolean;
    ordering?: boolean;
    info?: boolean;
    responsive?: boolean;
    scrollX?: boolean;
    fixedHeader?: boolean;
    language?: {
        url?: string;
    };
    lengthMenu?: (number | string)[][];
    dom?: string;
    buttons?: DataTablesButton[];
    columnDefs?: DataTablesColumnDef[];
    order?: [number, "asc" | "desc"][];
}

export interface DataTablesButton {
    extend?: string;
    text?: string;
    className?: string;
    charset?: string;
    bom?: boolean;
    filename?: string | (() => string);
}

export interface DataTablesColumnDef {
    targets: string | number | (string | number)[];
    className?: string;
    type?: string;
}

/**
 * DataTables API
 *
 * @category Types
 */
export interface DataTablesApi {
    clear: () => DataTablesApi;
    rows: {
        add: (data: unknown[]) => DataTablesApi;
    };
    draw: () => DataTablesApi;
    destroy: () => void;
}

// DataTables設定オブジェクトの型定義
export interface DataTablesSettings {
    aoColumns?: unknown[];
    aoData?: unknown[];
    oFeatures?: {
        bPaginate?: boolean;
        bLengthChange?: boolean;
        bFilter?: boolean;
        bInfo?: boolean;
        bAutoWidth?: boolean;
    };
    [key: string]: unknown;
}

// DataTables JSONレスポンスの型定義
export interface DataTablesJsonResponse {
    draw?: number;
    recordsTotal?: number;
    recordsFiltered?: number;
    data?: unknown[];
    [key: string]: unknown;
}

// DataTables initCompleteコールバックの型定義
export type DataTablesInitCompleteCallback = (
    settings: DataTablesSettings,
    json: DataTablesJsonResponse
) => void;

export interface ExcelCell {
    v: string | number | boolean | Date;
    t: "n" | "s" | "b" | "d" | "e" | "z";
    w?: string;
    f?: string;
}
