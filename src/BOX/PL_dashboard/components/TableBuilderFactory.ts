import { TableBuilderConfig } from "../types";
import { PLDashboardTableBuilder } from "./PLDashboardTableBuilder";

export class TableBuilderFactory {
    static createProductionTableBuilder(
        tableId: string,
        config?: Partial<TableBuilderConfig>
    ): PLDashboardTableBuilder {
        return new PLDashboardTableBuilder(tableId, config);
    }

    static createProfitCalculationTableBuilder(
        tableId: string,
        config?: Partial<TableBuilderConfig>
    ): PLDashboardTableBuilder {
        return new PLDashboardTableBuilder(tableId, {
            ...config,
            dataTablesOptions: {
                order: [[0, "asc"]],
            },
        });
    }

    static createRevenueAnalysisTableBuilder(
        tableId: string,
        config?: Partial<TableBuilderConfig>
    ): PLDashboardTableBuilder {
        return new PLDashboardTableBuilder(tableId, {
            ...config,
            dataTablesOptions: {
                order: [[0, "asc"]],
            },
        });
    }
}
