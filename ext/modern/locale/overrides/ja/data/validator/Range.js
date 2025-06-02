Ext.define('Ext.locale.ja.data.validator.Range', {
    override: 'Ext.data.validator.Range',

    config: {
        nanMessage: '数値でなければなりません',
        minOnlyMessage: '少なくとも{0}にする必要があります',
        maxOnlyMessage: '{0}以下にする必要があります',
        bothMessage: '有効な値の範囲は {0} ～ {1} です'
    }
});
