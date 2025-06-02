Ext.define("Ext.locale.ja.grid.column.Groups", {
    override: "Ext.grid.column.Groups",

    config: {
        groupSummaryTpl: "集計 ({name})",
        summaryTpl: "集計 ({store.data.length})"
    },
    text: "グループ"
});
