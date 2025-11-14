/// <reference path="../../../../kintone.d.ts" />
/// <reference path="../../../../globals.d.ts" />
/// <reference path="../fields/daily_fields.d.ts" />
/// <reference path="../fields/month_fields.d.ts" />

/**
 * 損益計算の結果を格納するインターフェース
 */
export interface ProfitCalculationResult {
    /** 直行経費 */
    directCost: number;
    /** 派遣経費 */
    dispatchCost: number;
    /** 間接経費 */
    indirectCost: number;
    /** 直行残業&休出経費 */
    directOvertimeAndHolidayCost: number;
    /** 派遣残業&休出経費 */
    dispatchOvertimeAndHolidayCost: number;
    /** 間接残業&休出経費 */
    indirectOvertimeAndHolidayCost: number;
    /** 直行残業時間 */
    totalInsideOvertime: number;
    /** 直行休出時間 */
    totalInsideHolidayOvertime: number;
    /** 派遣残業時間 */
    totalOutsideOvertime: number;
    /** 派遣休出時間 */
    totalOutsideHolidayOvertime: number;
    /** 間接残業時間 */
    indirectOvertime: number;
    /** 間接休出時間 */
    indirectHolidayWork: number;
    /** 派遣人員経費(残業&休出) */
    dispatchExpenses: number;
    /** 総人員/製造経費 計 */
    totalPersonnelExpenses: number;
    /** その他間接材料費 */
    otherIndirectMaterialCosts: number;
}

/**
 * 損益計算サービス
 * 日次データと月次データから損益計算を行う
 */
export class ProfitCalculationService {
    /**
     * 直行経費を計算
     * @param directUnitPrice - 直行単価
     * @param directPersonnel - 直行人員
     * @returns 直行経費
     */
    static calculateDirectCost(directUnitPrice: number, directPersonnel: number): number {
        return Math.round(((directUnitPrice * 8) / 1000) * directPersonnel);
    }

    /**
     * 派遣経費を計算
     * @param dispatchUnitPrice - 派遣単価
     * @param temporaryEmployees - 派遣社員数
     * @returns 派遣経費
     */
    static calculateDispatchCost(dispatchUnitPrice: number, temporaryEmployees: number): number {
        return Math.round(((dispatchUnitPrice * 8) / 1000) * temporaryEmployees);
    }

    /**
     * 間接経費を計算
     * @param indirectUnitPrice - 間接単価
     * @param indirectPersonnel - 間接人員
     * @returns 間接経費
     */
    static calculateIndirectCost(indirectUnitPrice: number, indirectPersonnel: number): number {
        return Math.round(((indirectUnitPrice * 8) / 1000) * indirectPersonnel);
    }

    /**
     * 残業&休出経費を計算
     * @param unitPrice - 基本単価
     * @param overtimeHours - 残業時間
     * @param holidayHours - 休出時間
     * @returns 残業&休出経費
     */
    static calculateOvertimeAndHolidayCost(
        unitPrice: number,
        overtimeHours: number,
        holidayHours: number
    ): {
        overtimeCost: number;
        holidayCost: number;
        totalCost: number;
    } {
        const unitOvertimeCost = (unitPrice * 1.25) / 1000;
        const unitHolidayCost = (unitPrice * 1.35) / 1000;

        const overtimeCost = Math.round(overtimeHours * unitOvertimeCost);
        const holidayCost = Math.round(holidayHours * unitHolidayCost);

        return {
            overtimeCost,
            holidayCost,
            totalCost: overtimeCost + holidayCost,
        };
    }

    /**
     * 日次データから損益計算を実行
     * @param firstRecord - 日報データ（該当日の最初のレコード）
     * @param plMonthlyData - 月次データ
     * @param totals - 日付別集計データ
     * @returns 損益計算結果
     */
    static calculateDailyProfit(
        firstRecord: daily.SavedFields | null,
        plMonthlyData: monthly.SavedFields | null,
        totals: {
            totalInsideOvertime: number;
            totalInsideHolidayOvertime: number;
            totalOutsideOvertime: number;
            totalOutsideHolidayOvertime: number;
        }
    ): ProfitCalculationResult {
        // 月次データから単価を取得
        const directUnitPrice = plMonthlyData?.direct?.value
            ? Number(plMonthlyData.direct.value)
            : 0;
        const dispatchUnitPrice = plMonthlyData?.dispatch?.value
            ? Number(plMonthlyData.dispatch.value)
            : 0;
        const indirectUnitPrice = plMonthlyData?.indirect?.value
            ? Number(plMonthlyData.indirect.value)
            : 0;

        // 日次データから値を取得（nullの場合は0）
        const directPersonnel = firstRecord ? Number(firstRecord.direct_personnel?.value || 0) : 0;
        const temporaryEmployees = firstRecord
            ? Number(firstRecord.temporary_employees?.value || 0)
            : 0;
        const indirectPersonnel = firstRecord
            ? Number(firstRecord.indirect_personnel?.value || 0)
            : 0;
        const indirectOvertimeHours = firstRecord
            ? Number(firstRecord.indirect_overtime?.value || 0)
            : 0;
        const indirectHolidayWorkHours = firstRecord
            ? Number(firstRecord.indirect_holiday_work?.value || 0)
            : 0;

        // 各経費を計算
        const directCost = this.calculateDirectCost(directUnitPrice, directPersonnel);
        const dispatchCost = this.calculateDispatchCost(dispatchUnitPrice, temporaryEmployees);
        const indirectCost = this.calculateIndirectCost(indirectUnitPrice, indirectPersonnel);

        // 直行残業&休出経費
        const directOvertimeAndHoliday = this.calculateOvertimeAndHolidayCost(
            directUnitPrice,
            totals.totalInsideOvertime,
            totals.totalInsideHolidayOvertime
        );

        // 派遣残業&休出経費
        const dispatchOvertimeAndHoliday = this.calculateOvertimeAndHolidayCost(
            dispatchUnitPrice,
            totals.totalOutsideOvertime,
            totals.totalOutsideHolidayOvertime
        );

        // 間接残業&休出経費
        const indirectOvertimeAndHoliday = this.calculateOvertimeAndHolidayCost(
            indirectUnitPrice,
            indirectOvertimeHours,
            indirectHolidayWorkHours
        );

        // その他の経費（日次データから取得）
        const laborCosts = firstRecord ? Number(firstRecord.labor_costs?.value || 0) : 0;
        const indirectMaterialCosts = firstRecord
            ? Number(firstRecord.indirect_material_costs?.value || 0)
            : 0;
        const otherIndirectMaterialCosts = firstRecord
            ? Math.round(Number(firstRecord.other_indirect_material_costs?.value || 0))
            : 0;
        const nightShiftAllowance = firstRecord
            ? Number(firstRecord.night_shift_allowance?.value || 0)
            : 0;
        const totalSubCost = firstRecord ? Number(firstRecord.total_sub_cost?.value || 0) : 0;
        const insideOvertimeCost = firstRecord
            ? Number(firstRecord.inside_overtime_cost?.value || 0)
            : 0;
        const outsideOvertimeCostValue = firstRecord
            ? Number(firstRecord.outside_overtime_cost?.value || 0)
            : 0;
        const outsideHolidayExpensesValue = firstRecord
            ? Number(firstRecord.outside_holiday_expenses?.value || 0)
            : 0;

        // 派遣人員経費を計算
        const dispatchExpenses = outsideOvertimeCostValue + outsideHolidayExpensesValue;

        // 総人員/製造経費 計
        const totalPersonnelExpenses =
            directCost + // 直行経費
            dispatchCost + // 派遣経費
            indirectCost + // 間接経費
            directOvertimeAndHoliday.totalCost + // 直行残業&休出経費
            indirectOvertimeAndHoliday.totalCost + // 間接残業&休出経費
            laborCosts + //      その他経費
            indirectMaterialCosts + // 間接材料費
            otherIndirectMaterialCosts + // その他間接材料費
            nightShiftAllowance + // 夜勤手当
            totalSubCost + // 総副資材費
            insideOvertimeCost + // 直行残業経費
            outsideOvertimeCostValue; // 派遣残業経費

        return {
            directCost,
            dispatchCost,
            indirectCost,
            directOvertimeAndHolidayCost: directOvertimeAndHoliday.totalCost,
            dispatchOvertimeAndHolidayCost: dispatchOvertimeAndHoliday.totalCost,
            indirectOvertimeAndHolidayCost: indirectOvertimeAndHoliday.totalCost,
            totalInsideOvertime: totals.totalInsideOvertime,
            totalInsideHolidayOvertime: totals.totalInsideHolidayOvertime,
            totalOutsideOvertime: totals.totalOutsideOvertime,
            totalOutsideHolidayOvertime: totals.totalOutsideHolidayOvertime,
            indirectOvertime: indirectOvertimeAndHoliday.overtimeCost,
            indirectHolidayWork: indirectOvertimeAndHoliday.holidayCost,
            dispatchExpenses,
            totalPersonnelExpenses,
            otherIndirectMaterialCosts,
        };
    }

    /**
     * 収益分析データを作成
     * @param totalAddedValue - 総付加価値
     * @param totalPersonnelExpenses - 総人員/製造経費
     * @param cumulativeData - 累積データ
     * @returns 収益分析データ
     */
    static createRevenueAnalysisData(
        totalAddedValue: number,
        totalPersonnelExpenses: number,
        cumulativeData: {
            cumulativeAddedValue: number;
            cumulativeExpenses: number;
            cumulativeGrossProfit: number;
        }
    ): {
        grossProfit: number;
        profitRate: number;
        cumulativeProfitRate: number;
    } {
        const grossProfit = totalAddedValue - totalPersonnelExpenses;
        const profitRate = totalAddedValue > 0 ? (grossProfit / totalAddedValue) * 100 : 0;
        const cumulativeProfitRate =
            cumulativeData.cumulativeAddedValue > 0
                ? ((cumulativeData.cumulativeAddedValue - cumulativeData.cumulativeExpenses) /
                      cumulativeData.cumulativeAddedValue) *
                  100
                : 0;

        return {
            grossProfit,
            profitRate,
            cumulativeProfitRate,
        };
    }
}
