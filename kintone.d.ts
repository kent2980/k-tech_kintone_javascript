// kintone型定義ファイル
declare namespace kintone {
  namespace fieldTypes {
    interface Id {
      type: "ID";
      value: string;
    }

    interface Revision {
      type: "REVISION";
      value: string;
    }

    interface RecordNumber {
      type: "RECORD_NUMBER";
      value: string;
    }

    interface Creator {
      type: "CREATOR";
      value: {
        code: string;
        name: string;
      };
    }

    interface Modifier {
      type: "MODIFIER";
      value: {
        code: string;
        name: string;
      };
    }

    interface CreatedTime {
      type: "CREATED_TIME";
      value: string;
    }

    interface UpdatedTime {
      type: "UPDATED_TIME";
      value: string;
    }

    interface SingleLineText {
      type: "SINGLE_LINE_TEXT";
      value: string;
    }

    interface MultiLineText {
      type: "MULTI_LINE_TEXT";
      value: string;
    }

    interface RichText {
      type: "RICH_TEXT";
      value: string;
    }

    interface Number {
      type: "NUMBER";
      value: string;
    }

    interface Calc {
      type: "CALC";
      value: string;
    }

    interface CheckBox {
      type: "CHECK_BOX";
      value: string[];
    }

    interface RadioButton {
      type: "RADIO_BUTTON";
      value: string;
    }

    interface MultiSelect {
      type: "MULTI_SELECT";
      value: string[];
    }

    interface DropDown {
      type: "DROP_DOWN";
      value: string;
    }

    interface Date {
      type: "DATE";
      value: string;
    }

    interface Time {
      type: "TIME";
      value: string;
    }

    interface DateTime {
      type: "DATETIME";
      value: string;
    }

    interface Link {
      type: "LINK";
      value: string;
    }

    interface File {
      type: "FILE";
      value: Array<{
        contentType: string;
        fileKey: string;
        name: string;
        size: string;
      }>;
    }

    interface UserSelect {
      type: "USER_SELECT";
      value: Array<{
        code: string;
        name: string;
      }>;
    }

    interface OrganizationSelect {
      type: "ORGANIZATION_SELECT";
      value: Array<{
        code: string;
        name: string;
      }>;
    }

    interface GroupSelect {
      type: "GROUP_SELECT";
      value: Array<{
        code: string;
        name: string;
      }>;
    }

    interface Category {
      type: "CATEGORY";
      value: string[];
    }

    interface Status {
      type: "STATUS";
      value: string;
    }

    interface StatusAssignee {
      type: "STATUS_ASSIGNEE";
      value: Array<{
        code: string;
        name: string;
      }>;
    }

    interface Subtable<T> {
      type: "SUBTABLE";
      value: Array<{
        id: string;
        value: T;
      }>;
    }
  }

  namespace types {
    interface Fields {
      [fieldCode: string]: any;
    }

    interface SavedFields extends Fields {
      $id: fieldTypes.Id;
      $revision: fieldTypes.Revision;
    }
  }

  interface Record {
    [fieldCode: string]: any;
  }

  namespace api {
    interface RecordsResponse<T> {
      records: T[];
      totalCount?: string;
    }
  }
}
