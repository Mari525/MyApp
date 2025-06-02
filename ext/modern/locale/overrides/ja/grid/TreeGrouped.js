Ext.define("Ext.locale.ja.grid.TreeGrouped", {
    override: "Ext.grid.TreeGrouped",

    config: {
        groupSummaryTpl: "集計 ({name})",
        summaryTpl: "集計 ({store.data.length})"
    }
});
