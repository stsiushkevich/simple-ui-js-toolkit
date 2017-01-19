/**
 * demo
 * */
/*-----------------Widgets of View -------------------------*/

var SentTextViewer = UI.Widget({
    extends: UIWidgets.Box,

    init: function(){
        this.ref('box', this.$dom.find('.box'));
    },
    setText: function(text){
        this.ref('box').html(text);
    }
});

var SomeTextForm = UI.Widget({
    extends: UIWidgets.Form,

    init: function(settings){
        var me = this;
        this.submit(function(e){
            e.preventDefault();
            settings.onSubmit(me.getData());
        });
    }
});

var View = UI.View({
    extends: UIWidgets.View,

    '@Widget sentTextViewer': [SentTextViewer, 'sentTextViewer'],
    '@Widget someTextForm': [SomeTextForm, 'someTextForm'],

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