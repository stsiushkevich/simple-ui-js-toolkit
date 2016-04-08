var WidgetRegister = UIFactory.createClass('WidgetRegister');
var wgRegister = UIFactory.createInstance(WidgetRegister);

var LoginView = UIFactory.createClass('View', {
    extends: UIWidgets.View
});

var view = UIFactory.createInstance(LoginView, {
    wgRegister: wgRegister
});

view.onReady(function(e){
    this.createWidgets({
        sentTextViewer: SentTextViewer,
        someTextForm: SomeTextForm
    });
    this.init();
});


/*-----------------Widgets of View -------------------------*/

var SentTextViewer = UIFactory.createClass('Widget', {
    init: function(){
        this.$dom = $(this.dom);
    },
    setText: function(text){
        this.$dom.find('.box').html(text);
    }
});

var SomeTextForm = UIFactory.createClass('Widget', {
    extends: UIWidgets.Form,

    init: function(){
        this.$dom = $(this.dom);

        var me = this;
        this.$dom.submit(function(){
            var $someText = $(me.dom.elements.someText);
            me.wgRegister.get('sentTextViewer').setText($someText.val());
            return false;
        });
    }
});