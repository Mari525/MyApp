Ext.define('Ext.locale.ja.field.Text', {
    override: 'Ext.field.Text',

    badFormatMessage: '値が要求される形式と一致しません',
    config: {
        requiredMessage: 'このフィールドは必須です',
        validationMessage: '有効な形式ではありません'
    }
});
