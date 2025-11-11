/**
 * モバイルダッシュボード型定義
 */

export interface SummaryData {
    totalQuantity: number;
    totalHours: number;
    totalValue: number;
    recordCount: number;
}

export interface MobileSummaryCardData {
    label: string;
    value: string;
    className?: string;
}
