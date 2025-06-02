Ext.define('MyApp.store.ProductStore', {
  extend: 'Ext.data.Store',
  alias: 'store.productstore',
  model: 'MyApp.model.Product',
  data: [
      { id: 1, name: 'Товар 1', description: 'Описание 1', price: 10.5, quantity: 5 },
      { id: 2, name: 'Товар 2', description: 'Описание 2', price: 20.0, quantity: 0 },
      { id: 3, name: 'Товар 3', description: 'Описание 3', price: 15.75, quantity: 12 }
  ],
  autoLoad: true
});
