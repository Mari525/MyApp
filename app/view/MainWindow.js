Ext.define('MyApp.view.MainWindow', {
  extend: 'Ext.window.Window',
  xtype: 'mainwindow',
  title: 'Главное окно',
  width: 800,
  height: 600,
  layout: 'border',
  modal: false,
  maximizable: true,
  closable: false,

  initComponent: function() {
      var me = this;

      me.items = [
          {
              xtype: 'toolbar',
              region: 'north',
              height: 40,
              items: [
                  {
                      xtype: 'button',
                      text: 'Товары',
                      handler: function() {
                          me.openProductsTab();
                      }
                  },
                  { xtype: 'tbfill' },
                  {
                      xtype: 'button',
                      text: 'Выход',
                      handler: function() {
                          me.close();
                          Ext.create('MyApp.view.LoginWindow', {
                              onLoginSuccess: function() {
                                  Ext.create('MyApp.view.MainWindow').show();
                              }
                          });
                      }
                  }
              ]
          },
          {
              xtype: 'tabpanel',
              region: 'center',
              itemId: 'mainTabPanel',
              items: []
          }
      ];

      me.callParent();

      me.openProductsTab = function() {
          var tabPanel = me.down('#mainTabPanel');
          var existing = tabPanel.items.findBy(function(tab) {
              return tab.title === 'Товары';
          });
          if (existing) {
              tabPanel.setActiveTab(existing);
              return;
          }

          var productsTab = Ext.create('MyApp.view.ProductsTab');
          tabPanel.add(productsTab);
          tabPanel.setActiveTab(productsTab);
      };
  }
});
