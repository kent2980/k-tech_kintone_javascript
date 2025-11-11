/**
 * DataTables型定義
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

export interface DataTablesApi {
    clear: () => DataTablesApi;
    rows: {
        add: (data: unknown[]) => DataTablesApi;
    };
    draw: () => DataTablesApi;
    destroy: () => void;
}

export interface ExcelCell {
    v: string | number | boolean | Date;
    t: "n" | "s" | "b" | "d" | "e" | "z";
    w?: string;
    f?: string;
}
