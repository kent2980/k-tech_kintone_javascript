declare namespace cybozu {
    namespace data {
        namespace page {
            const FORM_DATA: FormData;
        }
    }
}

interface FormData {
    schema: {
        table: {
            [key: string]: TableData;
        };
        subtable: {
            [key: string]: SubtableData;
        };
    };
}
