Ext.application({
  name: 'MyApp',

  requires: [
      'MyApp.model.Product',
      'MyApp.store.ProductStore',
      'MyApp.view.LoginWindow',
      'MyApp.view.MainWindow',
      'MyApp.view.ProductsTab',
      'MyApp.view.ProductCardWindow'
  ],

  launch: function() {
      Ext.create('MyApp.view.LoginWindow', {
          onLoginSuccess: function() {
              Ext.create('MyApp.view.MainWindow').show();
          }
      });
  }
});
