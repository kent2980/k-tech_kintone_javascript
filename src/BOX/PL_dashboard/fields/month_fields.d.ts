declare namespace monthly {
    interface Fields {
        /** 年月 */
        year_month: kintone.fieldTypes.SingleLineText;
        /** 派遣人員 */
        dispatch: kintone.fieldTypes.Number;
        /** 間接人員 */
        indirect: kintone.fieldTypes.Number;
        /** 派遣人員数 */
        dispatch_number: kintone.fieldTypes.Number;
        /** 年 */
        year: kintone.fieldTypes.Number;
        /** 直行人員 */
        direct: kintone.fieldTypes.Number;
        /** 社員単価 */
        inside_unit: kintone.fieldTypes.Number;
        /** 月 */
        month: kintone.fieldTypes.DropDown;
        /** 間接人員数 */
        indirect_number: kintone.fieldTypes.Number;
        /** 派遣社員単価 */
        outside_unit: kintone.fieldTypes.Number;
        /** 直行人員数 */
        direct_number: kintone.fieldTypes.Number;
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
