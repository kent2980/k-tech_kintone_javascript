declare namespace daily {
    interface Fields {
        /** 日付 */
        date: kintone.fieldTypes.Date;
        /** 売上高 */
        indirect_material_costs: kintone.fieldTypes.Number;
        /** 内部残業費 */
        inside_overtime_cost: kintone.fieldTypes.Number;
        /** 外部残業費 */
        outside_overtime_cost: kintone.fieldTypes.Number;
        /** その他間接材料費 */
        other_indirect_material_costs: kintone.fieldTypes.SingleLineText;
        /** 内部休日出勤費 */
        inside_holiday_expenses: kintone.fieldTypes.Number;
        /** 外部休日出勤費 */
        outside_holiday_expenses: kintone.fieldTypes.Number;
        /** その他間接労務費 */
        direct_personnel: kintone.fieldTypes.Number;
        /** 臨時雇人費 */
        temporary_employees: kintone.fieldTypes.Number;
        /** その他間接経費 */
        labor_costs: kintone.fieldTypes.Number;
        /** 間接残業費 */
        indirect_overtime: kintone.fieldTypes.Number;
        /** 合計間接費 */
        total_sub_cost: kintone.fieldTypes.Number;
        /** 間接休日出勤費 */
        indirect_holiday_work: kintone.fieldTypes.Number;
        /** 間接人件費 */
        indirect_personnel: kintone.fieldTypes.Number;
        /** 夜勤手当 */
        night_shift_allowance: kintone.fieldTypes.Number;
    }
    interface SavedFields extends Fields {
        $id: kintone.fieldTypes.Id;
        $revision: kintone.fieldTypes.Revision;
        更新者: kintone.fieldTypes.Modifier;
        作成者: kintone.fieldTypes.Creator;
        レコード番号: kintone.fieldTypes.RecordNumber;
        更新日時: kintone.fieldTypes.UpdatedTime;
        作成日時: kintone.fieldTypes.CreatedTime;
    }
}
