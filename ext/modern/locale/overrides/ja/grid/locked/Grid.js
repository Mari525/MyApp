Ext.define("Ext.locale.ja.grid.locked.Grid", {
    override: 'Ext.grid.locked.Grid',

    config: {
        columnMenu: {
            items: {
                region: {
                    text: '固定'
                }
            }
        },
        regions: {
            left: {
                menuLabel: '左に固定'
            },
            center: {
                menuLabel: '固定を解除'
            },
            right: {
                menuLabel: '右に固定'
            }
        }
    }
});
