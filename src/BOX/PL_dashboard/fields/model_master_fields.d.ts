declare namespace model_master {
    interface Fields {
        /** 人数 - Number of people required for production */
        number_of_people: kintone.fieldTypes.Number;
        /** 付加価値 - Added value per unit (円) */
        added_value: kintone.fieldTypes.Number;
        /** BKC - Model code identifier */
        model_code: kintone.fieldTypes.SingleLineText;
        /** 機種名 - Model name */
        model_name: kintone.fieldTypes.SingleLineText;
        /** 生産ライン - Production line name */
        line_name: kintone.fieldTypes.SingleLineText;
        /** 時間 - Time required per unit (hours) */
        time: kintone.fieldTypes.Number;
        /** カスタマー - Customer name */
        customer: kintone.fieldTypes.SingleLineText;
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
