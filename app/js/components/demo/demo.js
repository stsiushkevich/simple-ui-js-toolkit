/**
 * demo
 * */
/*-----------------Widgets of View -------------------------*/

var SentTextViewer = UI.Widget({
    extends: UIWidgets.Box,

    _sections: {
        box: null
    },

    '@Constructor': function(id){
        this.super(UIWidgets.Box, '@Constructor', id);
    },

    init: function(){
        this.super(UIWidgets.Box, 'init');

        this._sections.box = this.$dom.find('.box');
    },
    setText: function(text){
        this.getBoxSection().html(text);
    },
    getBoxSection: function(){
        return this._sections.box;
    }
});

var SomeTextForm = UI.Widget({
    extends: UIWidgets.Form,

    init: function(settings){
        this.super(UIWidgets.Form, 'init');
        var me = this;
        this.onSubmit(function(e){
            e.preventDefault();
            settings.onSubmit(me.getData());
        });
    }
});

var View = UI.View({
    extends: UIWidgets.View,

    '@Constructor': function(){
        this.super(UIWidgets.View, '@Constructor');
    },

    '@Component sentTextViewer': [SentTextViewer, 'sentTextViewer'],
    '@Component someTextForm': [SomeTextForm, 'someTextForm'],

    init: function(){
        var me = this;
        this['sentTextViewer'].init();

        this['someTextForm'].init({
            onSubmit: function(data){
                me['sentTextViewer'].setText(data['someText']);
            }
        });
    }
});

var view = UI.createInstance(View);
view.onReady(function(e){
    this.init();
});