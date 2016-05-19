/**
 * demo
 * */

var view = UIFactory.createInstance(UI.View({extends: UIWidgets.View}), {
    wgRegister: UIFactory.createInstance(UI.WidgetRegister())
});

view.onReady(function(e){
    this.createWidgets({
        sentTextViewer: SentTextViewer,
        someTextForm: SomeTextForm
    });
    this.init();
});


/*-----------------Widgets of View -------------------------*/

var SentTextViewer = UI.Widget({
    init: function(){
        this.$dom = $(this.dom);
    },
    setText: function(text){
        this.$dom.find('.box').html(text);
    }
});

var SomeTextForm = UI.Widget({
    extends: UIWidgets.Form,

    init: function(){
        this.super('init');

        var me = this;
        this.submit(function(){
            var $someText = $(me.dom.elements.someText);
            me.getWidget('sentTextViewer').setText($someText.val());
            return false;
        });
    }
});