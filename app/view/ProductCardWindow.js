Ext.define('MyApp.view.ProductCardWindow', {
  extend: 'Ext.window.Window',
  xtype: 'productcardwindow',
  title: 'Карточка товара',
  modal: true,
  closeAction: 'destroy',
  width: 400,
  layout: 'fit',

  config: {
      record: null
  },

  initComponent: function() {
      var me = this;
      var record = me.getRecord();

      me.items = [
          {
              xtype: 'form',
              bodyPadding: 10,
              defaultType: 'textfield',
              items: [
                  {
                      fieldLabel: 'Id',
                      name: 'id',
                      value: record.get('id'),
                      readOnly: true,
                      width: 200,
                  },
                  {
                      fieldLabel: 'Имя',
                      name: 'name',
                      value: record.get('name'),
                      readOnly: true,
                      width: 300
                  },
                  {
                      fieldLabel: 'Цена',
                      name: 'price',
                      xtype: 'numberfield',
                      minValue: 0,
                      value: record.get('price'),
                      allowBlank: false,
                      width: 200
                  },
                  {
                      fieldLabel: 'Кол-во',
                      name: 'quantity',
                      xtype: 'numberfield',
                      minValue: 0,
                      allowBlank: false,
                      value: record.get('quantity'),
                      width: 200
                  }
              ]
          }
      ];

      me.buttons = [
          {
              text: 'Сохранить',
              handler: function() {
                  var form = me.down('form').getForm();
                  if (form.isValid()) {
                      var values = form.getValues();
                      var store = Ext.data.StoreManager.lookup('productstore') || me.getRecord().store;

                      var rec = store.getById(values.id);
                      var changed = false;
                      if (parseFloat(values.price) !== rec.get('price')) {
                          changed = true;
                      }
                      if (parseInt(values.quantity) !== rec.get('quantity')) {
                          changed = true;
                      }

                      if (changed) {
                          Ext.Msg.confirm('Подтверждение', 'Обнаружены изменения. Сохранить?', function(btn) {
                              if (btn === 'yes') {
                                  rec.set('price', parseFloat(values.price));
                                  rec.set('quantity', parseInt(values.quantity));
                                  Ext.Msg.alert('Успех', 'Данные сохранены');
                                  me.close();
                              }
                          });
                      } else {
                          Ext.Msg.alert('Информация', 'Нет изменений');
                      }
                  }
              }
          },
          {
              text: 'Отмена',
              handler: function() {
                  me.close();
              }
          }
      ];

      me.callParent();
      me.initValidation();
  },

  initValidation: function() {
      var me = this;
      var form = me.down('form');
      var priceField = form.down('[name=price]');
      var quantityField = form.down('[name=quantity]');

      priceField.on('change', function(field, newValue) {
          if (newValue < 0) {
              Ext.Msg.alert('Ошибка', 'Цена не может быть отрицательной');
              field.setValue(0);
          }
      });
      quantityField.on('change', function(field, newValue) {
          if (newValue < 0 || !Number.isInteger(newValue)) {
              Ext.Msg.alert('Ошибка', 'Количество должно быть неотрицательным целым числом');
              field.setValue(0);
          }
      });
  }
});
