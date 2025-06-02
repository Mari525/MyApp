Ext.define('MyApp.view.ProductsTab', {
  extend: 'Ext.panel.Panel',
  xtype: 'productstabs',
  layout: 'border',

  initComponent: function() {
      var me = this;
      var store = Ext.create('MyApp.store.ProductStore');

      me.items = [
          {
              xtype: 'form',
              region: 'north',
              padding: 10,
              layout: 'hbox',
              defaults: {
                  margin: '0 10 0 0'
              },
              items: [
                  {
                      xtype: 'textfield',
                      fieldLabel: 'ID',
                      labelWidth: 30,
                      width: 150,
                      itemId: 'filterId',
                      emptyText: 'Фильтр по ID',
                      enableKeyEvents: true,
                      listeners: {
                          specialkey: function(field, e) {
                              if (e.getKey() === Ext.EventObject.ENTER) {
                                  me.applyFilters();
                              }
                          }
                      }
                  },
                  {
                      xtype: 'textfield',
                      fieldLabel: 'Описание',
                      labelWidth: 70,
                      width: 250,
                      itemId: 'filterDescription',
                      emptyText: 'Фильтр по описанию',
                      enableKeyEvents: true,
                      listeners: {
                          specialkey: function(field, e) {
                              if (e.getKey() === Ext.EventObject.ENTER) {
                                  me.applyFilters();
                              }
                          }
                      }
                  },
                  {
                      xtype: 'button',
                      text: 'Фильтр',
                      handler: function() {
                          me.applyFilters();
                      }
                  }
              ]
          },
          {
              xtype: 'grid',
              region: 'center',
              itemId: 'productGrid',
              store: store,
              columns: [
                  { text: 'ID', dataIndex: 'id', width: 50 },
                  { 
                      text: 'Имя', 
                      dataIndex: 'name', 
                      flex: 1, 
                      renderer: function(value, meta, record) {
                          meta.tdCls = 'clickable-cell';
                          return value;
                      } 
                  },
                  { text: 'Описание', dataIndex: 'description', flex: 2 },
                  { text: 'Цена', dataIndex: 'price', width: 80, renderer: Ext.util.Format.numberRenderer('0.00') },
                  { 
                      text: 'Кол-во', 
                      dataIndex: 'quantity', 
                      width: 80, 
                      renderer: function(value, meta, record) {
                          if (value === 0) {
                              meta.style = 'background-color:red;';
                          }
                          return value;
                      }
                  }
              ],
              height: 300,
              selModel: 'cellmodel',
              viewConfig: {
                  stripeRows: true,
                  trackOver: false
              },
              listeners: {
                  cellclick: function(grid, td, cellIndex, record, tr, rowIndex, e) {
                      var column = grid.getHeaderCt().getHeaderAtIndex(cellIndex);
                      if (column.dataIndex === 'name') {
                          me.openProductCard(record);
                      }
                  }
              }
          }
      ];

      me.callParent();


      me.applyFilters = function() {
          var idVal = me.down('#filterId').getValue();
          var descVal = me.down('#filterDescription').getValue();
          var store = me.down('#productGrid').getStore();

          store.clearFilter();

          if (idVal) {
              store.addFilter(function(record) {
                  return record.get('id') === parseInt(idVal);
              });
          }

          if (descVal) {
              store.addFilter(function(record) {
                  return record.get('description').toLowerCase().indexOf(descVal.toLowerCase()) !== -1;
              });
          }
      };

      me.openProductCard = function(record) {
          Ext.create('MyApp.view.ProductCardWindow', {
              record: record
          }).show();
      };
  }
});
