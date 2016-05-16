var UIFactory, UIComponentFactory;
UIFactory = UIComponentFactory = (function () {
    var VIEW = 'View';
    var WIDGET = 'Widget';
    var DATA_STORE = 'DataStore';
    var WIDGET_REGISTER = 'WidgetRegister';

    function inherit(childClass){
        return{
            from: function(parentClass){
                var old = childClass.prototype;
                childClass.prototype = Object.create(parentClass.prototype);
                childClass.prototype.constructor = childClass;
                childClass.superClass = parentClass;
                for(var prop in old){
                    if(!childClass.prototype[prop]){
                        childClass.prototype[prop] = old[prop];
                    }
                }
            }
        }
    }

    /*
     * using example:
     * var MyStore = UIFactory.createClass('DataStore', {
     *   proxy:{
     *       url: ...
     *   }
     * });
     *
     * var myStore = UIFactory.createInstance(MyStore);     *
     * myStore.loadData()
     * var data = myStore.getData();
     *
     * data binding in widget example:
     *
     * var MyWidget = UIFactory.createClass('Widget', {
     *   init: function(){
     *
     *       this.dataStore.on('update', function(data){
     *           var widgets = Object.keys(self.widgets);
     *           for(var i=0; i<widgets.length, i++){
     *               var name = widgets[i];
     *               $(self.widgets[name]).setValue(data[name]);
     *           }
     *       });
     *
     *       var me = this;
     *       this.dataStore.on('loadError', function(error){
     *           var errorBox = me.widgets.errorBox;
     *           errorBox.setMessage(error.text);
     *           errorBox.show();
     *       });
     *
     *       this.widgets.updateButton.onClick(function(){
     *           me.loadData();
     *       });
     *    },
     *    loadData: function(){
     *       this.dataStore.loadData();
     *    }
     * });
     *
     * var myWidget = UIFactory.createInstance(MyWidget, {
     *   dom: document.getElementById('myElement'),
     *   dataStore: myStore
     * });
     *
     * */
    function createDataStoreClass(config){
        var _data = null;

        var _eventHandlers = {
            load: [],
            update: [],
            loadError: []
        };

        var _proxy = {};
        if(config.proxy){
            _proxy = config.proxy;
        }

        function Constructor(){}

        Constructor.prototype.getData = function(){
            return _data;
        };
        Constructor.prototype.setData = function(data){
            _data = data;
            for(var i=0; i<_eventHandlers.update.length; i++){
                _eventHandlers.update[i].call(this, data);
            }
        };
        Constructor.prototype.loadData = function(){
            var ajaxConfig = {type: 'GET', contentType: 'json'};
            for(var prop in _proxy){
                if(_proxy.hasOwnProperty(prop)){
                    ajaxConfig[prop] = _proxy[prop];
                }
            }
            var me = this;
            ajaxConfig.success = function(data){
                me.setData(data);
                for(var i=0; i<_eventHandlers.load.length; i++){
                    _eventHandlers.load[i].call(this, data);
                }
            };
            ajaxConfig.error = function(response){
                for(var i=0; i<_eventHandlers.loadError.length; i++){
                    _eventHandlers.loadError[i].call(this, response);
                }
            };
        };
        Constructor.prototype.on = function(eventType, handler){
            if(_eventHandlers[eventType]) _eventHandlers[eventType].push(handler);
        };
        return Constructor;
    }

    function createComponentClass(config) {
        var _widgets = {};
        var _wgRegister = {};

        function Constructor(options) {
            if (options.widgets) {
                for (var wg in options.widgets) {
                    _widgets[wg] = options.widgets[wg];
                }
            }
            Object.defineProperty(this, 'widgets', {
                get: function () {
                    return _widgets;
                }
            });

            if (options.wgRegister) {
                _wgRegister = options.wgRegister;
            }
            Object.defineProperty(this, 'wgRegister', {
                get: function () {
                    return _wgRegister;
                }
            });
        }

        Constructor.prototype.init = function () {
        };

        if (config.extends) {
            inherit(Constructor).from(config.extends);

            var callStackSize = 0;
            Constructor.prototype.super = function (methodName) {
                callStackSize++;

                var customClass = this.constructor;
                while (!customClass.isCustomClass) {
                    customClass = customClass.superClass;
                }

                for (var j = 0; j < callStackSize; j++) {
                    do {
                        customClass = customClass.superClass;
                    } while (!customClass.isCustomClass);
                }

                if (customClass.prototype[methodName]) {
                    var args = [];
                    for (var i = 1; i < arguments.length; i++) {
                        args[i - 1] = arguments[i];
                    }
                    customClass.prototype[methodName].apply(this, args);
                }

                callStackSize--;
            };
        }

        for(var prop in config){
            if (prop != 'extends') {
                Constructor.prototype[prop] = config[prop];
            }
        }
        Constructor.isCustomClass = true;
        return Constructor;
    }

    function createViewClass(config){
        var Component = createComponentClass(config);
        function Constructor(options) {
            Component.apply(this, arguments);
        }
        inherit(Constructor).from(Component);
        return Constructor;
    }

    function createWidgetClass(config){
        var _dataStore = null;

        var Component = createComponentClass(config);
        function Constructor(options) {
            Component.apply(this, arguments);
            if(options.dom){
                Object.defineProperty(this, 'dom', {
                    get: function () {
                        return options.dom;
                    }
                });
            }

            if(!_dataStore){
                _dataStore = options.dataStore || null;
            }
            Object.defineProperty(this, 'dataStore', {
                get: function () {
                    return _dataStore;
                }
            });
        }
        inherit(Constructor).from(Component);
        return Constructor;
    }

    function createWidgetRegisterClass(config){

        var _widgetRegister = {};

        function Constructor(options) {}
        Constructor.prototype.get = function(wgKey){
            if(wgKey) return _widgetRegister[wgKey];
            return null;
        };
        Constructor.prototype.add = function(wgKey, wg){
            if(wgKey) _widgetRegister[wgKey] = wg;
        };
        Constructor.prototype.keySet = function(){
            return Object.keys(_widgetRegister);
        };
        Constructor.prototype.remove = function(wgKey){
            delete _widgetRegister[wgKey];
        };

        return Constructor;
    }

    return {
        componentType:{
            VIEW: VIEW,
            WIDGET: WIDGET,
            DATA_STORE: DATA_STORE,
            WIDGET_REGISTER: WIDGET_REGISTER
        },
        createClass: function(componentType, config){
            var ParentClass = null;
            switch (componentType){
                case VIEW:              ParentClass = createViewClass(config); break;
                case WIDGET:            ParentClass = createWidgetClass(config); break;
                case DATA_STORE:        ParentClass = createDataStoreClass(config); break;
                case WIDGET_REGISTER:   ParentClass = createWidgetRegisterClass(config); break;
            }
            function Constructor(options){
                ParentClass.apply(this, arguments);
            }
            inherit(Constructor).from(ParentClass);
            return Constructor;
        },
        createInstance: function (Component, options) {
            return new Component(options);
        }
    }
})();