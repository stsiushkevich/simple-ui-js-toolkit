var UI, UIFactory, UIComponentFactory;
UI = UIFactory = UIComponentFactory = (function () {
    var VIEW = 'View';
    var WIDGET = 'Widget';
    var DATA_STORE = 'DataStore';
    var WIDGET_REGISTER = 'WidgetRegister';
    var AJAX_MANAGER = 'AjaxManager';
    var MODEL = 'Model';

    function getProperty(o, s) {
        s = s+''.replace(/\\[(\w+)\\]/g, '.$1'); // convert indexes to properties
        s = s.replace(/^\./, '');           // strip a leading dot
        var a = s.split('.');
        for (var i = 0, n = a.length; i < n; ++i) {
            var k = a[i];
            if (k in o) {
                o = o[k];
            } else {
                return;
            }
        }
        return o;
    }

    function setProperty(o, s, v) {
        s = s+''.replace(/\\[(\w+)\\]/g, '.$1'); // convert indexes to properties
        s = s.replace(/^\./, '');           // strip a leading dot
        var a = s.split('.');
        var d = o;
        for (var i = 0, n = a.length - 1; i < n; ++i) {
            var k = a[i];
            if(!(k in d)){
                d[k] = {};
            }
            d = d[k];
        }
        d[a[a.length - 1]] = v;
        return o;
    }

    function inherit(childClass){
        return{
            from: function(parentClass){
                var old = childClass.prototype;
                childClass.prototype = Object.create(clonePrototypeChain(parentClass.prototype));
                childClass.prototype.constructor = childClass;
                childClass._superClass = parentClass;
                for(var prop in old){
                    if(old.hasOwnProperty(prop) && !childClass.prototype[prop]){
                        childClass.prototype[prop] = old[prop];
                    }
                }
            }
        }
    }

    function clone(src){
        if(src !== null && 'object' === typeof src){
            var dst;
            if(Array.isArray(src)){
                dst = [];
                src.forEach(function(o){
                    dst.push(clone(o));
                });
            } else{
                dst = {};
                for(var k in src){
                    if(src.hasOwnProperty(k)){
                        dst[k] = clone(src[k]);
                    }
                }
            }
            return dst;
        } else{
            return src;
        }
    }

    function clonePrototypeChain(obj){
        var dest = {};
        var proto = Object.getPrototypeOf(obj);
        if(proto){
            dest = Object.create(clonePrototypeChain(proto));
        }
        var cObj = clone(obj);
        for(var key in cObj){
            if(cObj.hasOwnProperty(key)){
                dest[key] = cObj[key];
            }
        }
        return dest;
    }

    function invokeSuperMethod(superClass, methodName){
        var isInherits = false;
        var currentClass = this.constructor;
        while(currentClass._superClass){
            if(currentClass == superClass){
                isInherits = true; break;
            }
            currentClass = currentClass._superClass;
        }
        if(isInherits){
            var targetClass = superClass;
            while(!targetClass._isCustomClass){
                targetClass = targetClass._superClass;
            }
            if (targetClass.prototype[methodName]) {
                var args = [];
                for (var i = 2; i < arguments.length; i++) {
                    args.push(arguments[i]);
                }
                targetClass.prototype[methodName].apply(this, args);
            }
        } else{
            throw new TypeError("Current component class is not a successor of specified component class!");
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

    /*
     * Model object - data model
     * */
    function createModelClass(config){
        var _model = {};

        function Model(options) {
            if(options && options.dom){
                Object.defineProperty(this, 'dom', {
                    get: function () {
                        return options.dom;
                    }
                });
            }
        }

        if(config){
            if (config.extends) {
                inherit(Model).from(config.extends);

                Model.prototype.super = function (superClass, methodName) {
                    invokeSuperMethod.apply(this, arguments);
                };
            }

            for(var prop in config){
                if (config.hasOwnProperty(prop) && prop != 'extends') {
                    Model.prototype[prop] = config[prop];
                }
            }
        }

        Model._isCustomClass = true;

        Model.prototype.put = function (k, v) {
            return setProperty(_model, k, v);
        };

        Model.prototype.get = function (k) {
            if(k) return clone(getProperty(_model, k));
            return clone(_model);
        };

        Model.prototype.destroy = function (k) {
            if(k){
                this.put(k, {});
            } else{
                _model = {};
            }
        };

        return Model;
    }

    function createAjaxManagerClass(config){

        function AjaxManager() {}

        if (config.extends) {
            inherit(AjaxManager).from(config.extends);

            AjaxManager.prototype.super = function (superClass, methodName) {
                invokeSuperMethod.apply(this, arguments);
            };
        }

        for(var prop in config){
            if (config.hasOwnProperty(prop) && prop != 'extends') {
                AjaxManager.prototype[prop] = config[prop];
            }
        }
        AjaxManager._isCustomClass = true;

        return AjaxManager;
    }

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

        function DataStore(){}

        DataStore.prototype.getData = function(){
            return _data;
        };
        DataStore.prototype.setData = function(data){
            _data = data;
            for(var i=0; i<_eventHandlers.update.length; i++){
                _eventHandlers.update[i].call(this, data);
            }
        };
        DataStore.prototype.loadData = function(){
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
        DataStore.prototype.on = function(eventType, handler){
            if(_eventHandlers[eventType]) _eventHandlers[eventType].push(handler);
        };
        return DataStore;
    }

    function createComponentClass(config) {
        var _widgets = {};
        var _wgRegister = {};

        function Component(options) {
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

        Component.prototype.init = function () {
        };

        Component.prototype.getWidget = function(wgId){
            return this.wgRegister.get(wgId);
        };

        Component.prototype.getWg = function(wgId){
            return this.getWidget(wgId);
        };

        Component.prototype.wg = function(wgId){
            return this.getWidget(wgId);
        };

        if (config.extends) {
            inherit(Component).from(config.extends);

            Component.prototype.super = function (superClass, methodName) {
                invokeSuperMethod.apply(this, arguments);
            };
        }

        for(var prop in config){
            if (config.hasOwnProperty(prop) && prop != 'extends') {
                Component.prototype[prop] = config[prop];
            }
        }
        Component._isCustomClass = true;
        return Component;
    }

    function createViewClass(config){
        var Component = createComponentClass(config);
        function View(options) {
            Component.apply(this, arguments);
        }
        inherit(View).from(Component);
        return View;
    }

    function createWidgetClass(config){
        var _dataStore = null;
        var _view = null;

        var Component = createComponentClass(config);
        function Widget(options) {
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

            if(!_view){
                _view = options.view || null;
            }
        }
        inherit(Widget).from(Component);

        Widget.prototype.getView = function () {
            return _view;
        };

        return Widget;
    }

    function createWidgetRegisterClass(config){

        var _widgetRegister = {};

        function WidgetRegister(options) {}
        WidgetRegister.prototype.get = function(wgKey){
            if(wgKey) return _widgetRegister[wgKey];
            return null;
        };
        WidgetRegister.prototype.add = function(wgKey, wg){
            if(wgKey) _widgetRegister[wgKey] = wg;
        };
        WidgetRegister.prototype.keySet = function(){
            return Object.keys(_widgetRegister);
        };
        WidgetRegister.prototype.remove = function(wgKey){
            delete _widgetRegister[wgKey];
        };

        return WidgetRegister;
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
                case MODEL:             ParentClass = createModelClass(config); break;
                case VIEW:              ParentClass = createViewClass(config); break;
                case WIDGET:            ParentClass = createWidgetClass(config); break;
                case DATA_STORE:        ParentClass = createDataStoreClass(config); break;
                case WIDGET_REGISTER:   ParentClass = createWidgetRegisterClass(config); break;
                case AJAX_MANAGER:      ParentClass = createAjaxManagerClass(config); break;
            }
            function Wrapper(options){
                ParentClass.apply(this, arguments);
            }
            inherit(Wrapper).from(ParentClass);

            if(config && config['statics']){
                for(var key in config['statics']){
                    if(config['statics'].hasOwnProperty(key)){
                        Wrapper[key] = config['statics'][key];
                    }
                }
            }

            return Wrapper;
        },
        Model: function(config){
            return this.createClass(MODEL, config);
        },
        Widget: function(config){
            return this.createClass(WIDGET, config);
        },
        View: function(config){
            return this.createClass(VIEW, config);
        },
        DataStore: function(config){
            return this.createClass(DATA_STORE, config);
        },
        WidgetRegister: function(config){
            return this.createClass(WIDGET_REGISTER, config);
        },
        AjaxManager: function(config){
            return this.createClass(AJAX_MANAGER, config);
        },
        createInstance: function (Component, options) {
            return new Component(options);
        }
    }
})();