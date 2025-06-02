Ext.define('Ext.locale.ja.data.validator.Length', {
    override: 'Ext.data.validator.Length',

    config: {
        minOnlyMessage: '長さは {0} 文字以上でなければなりません',
        maxOnlyMessage: '長さは {0} 文字以下でなければなりません',
        bothMessage: '長さは {0} 文字以上 {1} 文字以下でなければなりません'
    }
});
