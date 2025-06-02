Ext.define('MyApp.view.LoginWindow', {
    extend: 'Ext.window.Window',
    xtype: 'loginwindow',
    title: 'Вход в систему',
    modal: true,
    closable: false,
    closeAction: 'hide',
    autoShow: true,
    width: 300,
    layout: 'fit',
    config: {
        onLoginSuccess: null
    },

    constructor: function(config) {
        this.callParent(arguments);
    },

    initComponent: function() {
        var me = this;
        me.items = [
            {
                xtype: 'form',
                bodyPadding: 10,
                defaultType: 'textfield',
                items: [
                    {
                        fieldLabel: 'Логин',
                        name: 'login',
                        allowBlank: false
                    },
                    {
                        fieldLabel: 'Пароль',
                        name: 'password',
                        inputType: 'password',
                        allowBlank: false
                    }
                ],
                buttons: [
                    {
                        text: 'Вход',
                        handler: function() {
                            var form = this.up('form').getForm();
                            if (form.isValid()) {
                                var values = form.getValues();
                                if (values.login === 'admin' && values.password === 'padmin') {
                                    me.hide();
                                    if (me.getOnLoginSuccess()) {
                                        me.getOnLoginSuccess().call(me);
                                    }
                                } else {
                                    Ext.Msg.alert('Ошибка', 'Неверный логин или пароль');
                                }
                            }
                        }
                    }
                ]
            }
        ];
        me.callParent(arguments);
    }
});
