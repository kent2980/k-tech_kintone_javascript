declare namespace daily {
    /**
     * Represents the fields structure for P/L dashboard application.
     * Contains various cost and personnel metrics for business operations.
     *
     * @property {kintone.fieldTypes.Date} date - 日付
     * @property {kintone.fieldTypes.Number} indirect_material_costs - 間接材料費
     * @property {kintone.fieldTypes.Number} inside_overtime_cost - 社内残業費
     * @property {kintone.fieldTypes.Number} outside_overtime_cost - 社外残業費
     * @property {kintone.fieldTypes.Number} other_added_value - その他付加価値
     * @property {kintone.fieldTypes.SingleLineText} other_indirect_material_costs - その他間接材料費
     * @property {kintone.fieldTypes.Number} inside_holiday_expenses - 社内休日手当
     * @property {kintone.fieldTypes.Number} outside_holiday_expenses - 社外休日手当
     * @property {kintone.fieldTypes.Number} direct_personnel - 直接人員
     * @property {kintone.fieldTypes.Number} temporary_employees - 臨時従業員
     * @property {kintone.fieldTypes.Number} labor_costs - 労務費
     * @property {kintone.fieldTypes.Number} indirect_overtime - 間接残業
     * @property {kintone.fieldTypes.Number} total_sub_cost - 総原価
     * @property {kintone.fieldTypes.Number} indirect_holiday_work - 間接休日出勤
     * @property {kintone.fieldTypes.Number} indirect_personnel - 間接人員
     * @property {kintone.fieldTypes.Number} night_shift_allowance - 夜勤手当
     */
    interface Fields {
        date: kintone.fieldTypes.Date;
        indirect_material_costs: kintone.fieldTypes.Number;
        inside_overtime_cost: kintone.fieldTypes.Number;
        outside_overtime_cost: kintone.fieldTypes.Number;
        other_added_value: kintone.fieldTypes.Number;
        other_indirect_material_costs: kintone.fieldTypes.SingleLineText;
        inside_holiday_expenses: kintone.fieldTypes.Number;
        outside_holiday_expenses: kintone.fieldTypes.Number;
        direct_personnel: kintone.fieldTypes.Number;
        temporary_employees: kintone.fieldTypes.Number;
        labor_costs: kintone.fieldTypes.Number;
        indirect_overtime: kintone.fieldTypes.Number;
        total_sub_cost: kintone.fieldTypes.Number;
        indirect_holiday_work: kintone.fieldTypes.Number;
        indirect_personnel: kintone.fieldTypes.Number;
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
