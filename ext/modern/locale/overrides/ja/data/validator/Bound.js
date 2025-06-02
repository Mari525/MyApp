Ext.define('Ext.locale.ja.data.validator.Bound', {
    override: 'Ext.data.validator.Bound',

    config: {
        emptyMessage: '有効な値でなければなりません',
        minOnlyMessage: '値は {0} より大きくなければなりません',
        maxOnlyMessage: '値は {0} より小さくなければなりません',
        bothMessage: '有効な値の範囲は {0} ～ {1} です'
    }
});
