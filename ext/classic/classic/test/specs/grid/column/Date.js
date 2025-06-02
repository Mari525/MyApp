topSuite("Ext.grid.column.Date", ['Ext.grid.Panel', 'Ext.form.field.Date', 'Ext.grid.plugin.CellEditing', 'Ext.grid.column.Number', 'Ext.form.field.Number'], function() {
    var grid, store, colRef, plugin, view;

    function getCell(rowIdx, colIdx) {
        return grid.getView().getCellInclusive({
            row: rowIdx,
            column: colIdx
        }, true);
    }

    function getCellText(rowIdx, colIdx) {
        var cell = getCell(rowIdx, colIdx);

        return cell.querySelector(grid.getView().innerSelector).innerHTML;
    }

    function triggerCellMouseEvent(type, rowIdx, cellIdx, button, x, y) {
        var target = getCell(rowIdx, cellIdx);

        jasmine.fireMouseEvent(target, type, x, y, button);
    }

    function getCellInner(rowIdx, colIdx) {
        var cell = getCell(rowIdx, colIdx, true);

        return cell.querySelector(grid.getView().innerSelector);
    }

    function expectEmptyText(column, rowIdx, colIdx) {
        var cell = getCellInner(rowIdx, colIdx),
            el = document.createElement('div');

        // We're doing this because ' ' !== '&#160;'. By letting the browser decode the entity, we
        // can then do a comparison.
        el.innerHTML = column.emptyCellText;
        expect(cell.textContent || cell.innerText).toBe(el.textContent || el.innerText);
    }

    function makeGrid(value) {
        store = new Ext.data.Store({
            model: spec.TestModel,
            data: [{
                field: value
            }]
        });

        grid = new Ext.grid.Panel({
            store: store,
            columns: [{
                xtype: 'datecolumn',
                format: 'Y-m-d',
                text: 'Col',
                dataIndex: 'field',
                flex: 1
            }],
            width: 400,
            height: 100,
            border: false,
            renderTo: Ext.getBody()
        });
        colRef = grid.getColumnManager().getColumns();
    }

    beforeEach(function() {
        Ext.define('spec.TestModel', {
            extend: 'Ext.data.Model',
            fields: [{
                name: 'field',
                defaultValue: undefined
            }]
        });
    });

    afterEach(function() {
        Ext.destroy(grid, store);
        colRef = store = grid = plugin = null;
        Ext.undefine('spec.TestModel');
        Ext.data.Model.schema.clear();
    });

    describe("renderer", function() {
        it("should render render non-date values", function() {
            makeGrid(null);
            var text = getCellText(0, 0);

            if (text === '&nbsp;') {
                text = '&#160;';
            }

            expect(text).toBe('&#160;');
        });

        it("should render the date according to the format", function() {
            makeGrid(new Date(2010, 2, 3));
            expect(getCellText(0, 0)).toBe('2010-03-03');
        });
    });

    describe("handling date column after data deletion", function() {
        beforeEach(function() {
            var simpsonsStore = new Ext.data.Store({
                fields: [{
                    name: 'name',
                    type: 'string'
                }, {
                    name: 'email',
                    type: 'string'
                }, {
                    name: 'phone',
                    type: 'string'
                }, {
                    name: 'dob',
                    type: 'date'
                }, {
                    name: 'age',
                    type: 'number'
                }],
                data: [{
                    name: 'Lisa',
                    email: 'lisa@simpsons.com',
                    phone: '555-111-1224',
                    dob: new Date('2012-01-01'),
                    age: 10
                }, {
                    name: 'Bart',
                    email: 'bart@simpsons.com',
                    phone: '555-222-1234',
                    age: 12
                }, {
                    name: 'Homer',
                    email: 'homer@simpsons.com',
                    phone: '555-222-1244',
                    dob: new Date('2012-02-02'),
                    age: 40
                }, {
                    name: 'Marge',
                    email: 'marge@simpsons.com',
                    phone: '555-222-1254',
                    dob: new Date('2012-03-03'),
                    age: 38
                }]
            });

            grid = new Ext.grid.Panel(Ext.apply({
                title: 'simpsonsStore',
                store: simpsonsStore,
                columns: [{
                    header: 'Name',
                    dataIndex: 'name',
                    editor: 'textfield'
                }, {
                    header: 'Email',
                    dataIndex: 'email',
                    editor: 'textfield'
                }, {
                    header: 'Phone',
                    dataIndex: 'phone',
                    editor: 'textfield'
                }, {
                    xtype: 'datecolumn',
                    header: 'DOB',
                    dataIndex: 'dob',
                    format: 'Y-m-d',
                    editor: {
                        xtype: 'datefield'
                    }
                }, {
                    xtype: 'numbercolumn',
                    text: 'Age',
                    flex: 1,
                    dataIndex: 'age',
                    editor: {
                        xtype: 'numberfield'
                    }
                }],
                selModel: 'cellmodel',
                height: 200,
                width: 600,
                minHeight: 30,
                renderTo: Ext.getBody()
            }));
            plugin = new Ext.grid.plugin.CellEditing();
            grid.addPlugin(plugin);
            view = grid.getView();
            colRef = grid.getColumnManager().getColumns();
        });

        it("should show empty cell text on removing data from the date cell", function() {
            triggerCellMouseEvent('dblclick', 0, 3);
            expect(plugin.editing).toBe(true);
            expect(plugin.getActiveColumn()).toBe(colRef[3]);

            runs(function() {
                plugin.getActiveEditor().field.selectText();
                plugin.getActiveEditor().field.setValue(null);
                plugin.getActiveEditor().field.setValue(null);
            });

            runs(function() {
                jasmine.fireKeyEvent(plugin.getActiveEditor().field.inputEl, 'keydown', 13);
            });

            waitsFor(function() {
                return !plugin.editing;
            });

            runs(function() {
                expect(view.actionableMode).toBe(false);
            });

            runs(function() {
                expectEmptyText(colRef[3], 0, 3);
                expect(plugin.editing).toBe(false);
            });
        });
    });
});
