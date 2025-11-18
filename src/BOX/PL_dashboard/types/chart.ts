/**
 * Chart.js型定義
 */

// Chart.js Tick Context型定義
export interface ChartTickContext {
    /** ティックのインデックス */
    index: number;
    /** ティックの値 */
    tick?: {
        value: number | string;
        label?: string;
    };
    /** データセットのインデックス */
    datasetIndex?: number;
    /** データポイントのインデックス */
    dataIndex?: number;
    [key: string]: unknown;
}

// Chart.js ticks.colorコールバックの型定義
export type ChartTickColorCallback = (context: ChartTickContext) => string | undefined;

// Chart.js ticks.font.weightコールバックの型定義
export type ChartTickFontWeightCallback = (context: ChartTickContext) => string | number | undefined;

