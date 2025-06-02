Ext.define("Ext.locale.ja.grid.plugin.filterbar.Operator", {
    override: "Ext.grid.plugin.filterbar.Operator",

    operatorsTextMap: {
        eq: "次と等しい",
        ne: "次と等しくない",
        gt: "次より大きい",
        ge: "次以上",
        lt: "次より小さい",
        le: "次以下",
        like: "次を含む",
        nlike: "次を含まない",
        empty: "空値である",
        nempty: "空値ではない",
        identical: "次と厳密に等しい",
        nidentical: "次と厳密に等しくない",
        regex: "次の正規表現に一致する",
        "in": "次に含まれる",
        notin: "次に含まれない"
    }
}, function() {
    var prototype = this.prototype,
        texts = prototype.operatorsTextMap;

    texts['='] = texts.eq;
    texts['=='] = texts.eq;
    texts['!='] = texts.ne;
    texts['==='] = texts.identical;
    texts['!=='] = texts.nidentical;
    texts['>'] = texts.gt;
    texts['>='] = texts.ge;
    texts['<'] = texts.lt;
    texts['<='] = texts.le;
    texts['/='] = texts.regex;
});
