declare namespace monthly {
    interface Fields {
        /** 年月 - Year and month (YYYY-MM) */
        year_month: kintone.fieldTypes.SingleLineText;
        /** 派遣人員 - Dispatch personnel count */
        dispatch: kintone.fieldTypes.Number;
        /** 間接人員 - Indirect personnel count */
        indirect: kintone.fieldTypes.Number;
        /** 年 - Year (YYYY) */
        year: kintone.fieldTypes.Number;
        /** 直行人員 - Direct personnel count */
        direct: kintone.fieldTypes.Number;
        /** 社員単価 - Inside employee unit cost (円/h) */
        inside_unit: kintone.fieldTypes.Number;
        /** 月 - Month dropdown selection */
        month: kintone.fieldTypes.DropDown;
        /** 派遣社員単価 - Outside contractor unit cost (円/h) */
        outside_unit: kintone.fieldTypes.Number;
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
