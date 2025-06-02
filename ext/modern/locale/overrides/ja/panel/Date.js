Ext.define('Ext.locale.ja.panel.Date', {
    override: 'Ext.panel.Date',

    config: {
        nextText: '翌月 (Ctrl+→)',
        prevText: '前月 (Ctrl+←)',
        buttons: {
            footerTodayButton: {
                text: "今日"
            }
        }
    }
});
