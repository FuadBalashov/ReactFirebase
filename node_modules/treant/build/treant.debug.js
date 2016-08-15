(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.treant = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var hook = require("./src/hook")
var register = require("./src/register")
var component = require("./src/create")
var storage = require("./src/storage")
var Component = require("./src/Component")
var delegate = require("./src/delegate")
var fragment = require("./src/fragment")

var treant = {}
module.exports = treant

treant.register = register
treant.component = component
treant.storage = storage
treant.Component = Component
treant.delegate = delegate
treant.fragment = fragment
treant.hook = hook

var util = {}
treant.util = util

util.extend = require("./util/extend")
util.merge = require("./util/merge")
util.object = require("./util/object")

},{"./src/Component":3,"./src/create":5,"./src/delegate":6,"./src/fragment":7,"./src/hook":8,"./src/register":9,"./src/storage":11,"./util/extend":12,"./util/merge":13,"./util/object":14}],2:[function(require,module,exports){
'use strict';
module.exports = function (str) {
	str = str.trim();

	if (str.length === 1 || !(/[_.\- ]+/).test(str) ) {
		if (str[0] === str[0].toLowerCase() && str.slice(1) !== str.slice(1).toLowerCase()) {
			return str;
		}

		return str.toLowerCase();
	}

	return str
	.replace(/^[_.\- ]+/, '')
	.toLowerCase()
	.replace(/[_.\- ]+(\w|$)/g, function (m, p1) {
		return p1.toUpperCase();
	});
};

},{}],3:[function(require,module,exports){
var hook = require("./hook")
var registry = require("./registry")
var storage = require("./storage")
var delegate = require("./delegate")

module.exports = Component

function Component (element, options) {
  if (element && !(element instanceof Element)) {
    throw new Error("element should be an Element instance or null")
  }
  if (!(this instanceof Component)) {
    return new Component(element, options)
  }

  this._element = null
  this._id = null
  this.components = {}
  this.element = element || null
}

Component.create = function (name, element, options) {
  var ComponentConstructor = null

  if (registry.exists(name)) {
    ComponentConstructor = registry.get(name)
  }
  else {
    console.warn("Missing component definition: ", name)
    return null
  }

  return new ComponentConstructor(element, options)
}

Component.prototype = {
  constructor: Component,

  destroy: function () {
    storage.remove(this)
    this.element = null

    var components = this.components
    var component
    for (var name in components) {
      if (components.hasOwnProperty(name)) {
        component = components[name]
        if (component.destroy) {
          component.destroy()
        }
      }
    }
    this.components = null
  },

  delegate: function (options) {
    options.element = this.element
    options.context = options.context || this
    return delegate(options)
  },
  action: function (event) {
    return this.constructor.createAction(event)
  },

  dispatch: function (type, detail) {
    var definition = this.constructor.getEventDefinition(type, detail)
    return this.element.dispatchEvent(new window.CustomEvent(type, definition))
  },

  findComponent: function (name) {
    return hook.findComponent(name, this.element)
  },
  findAllComponents: function (name) {
    return hook.findAllComponents(name, this.element)
  },
  findSubComponents: function () {
    //var subComponents = []
    //var element = this.element
    //this.constructor.parents.forEach(function (ParentComponent) {
    //  var components = hook.findSubComponents(ParentComponent.componentName, element)
    //  subComponents = subComponents.concat(components)
    //})
    //subComponents = subComponents.concat(hook.findSubComponents(this.getMainComponentName(false), element))
    //return subComponents
    return hook.findSubComponents(this.getMainComponentName(false), this.element)
  },
  getComponentName: function (cc) {
    return hook.getComponentName(this.constructor.componentName, cc)
  },
  getMainComponentName: function (cc) {
    return hook.getMainComponentName(this.constructor.componentName, cc)
  },
  getSubComponentName: function (cc) {
    return hook.getSubComponentName(this.constructor.componentName, cc)
  },

  clearSubComponents: function () {
    var components = this.constructor.components

    for (var name in components) {
      if (components.hasOwnProperty(name)) {
        if (Array.isArray(components[name])) {
          this.components[name] = []
        }
        else {
          this.components[name] = components[name]
        }
      }
    }
  },
  assignSubComponents: function (transform) {
    if (!this.element) return

    var hostComponent = this
    var subComponents = this.findSubComponents()
    var constructor = this.constructor

    this.clearSubComponents()

    if (!subComponents.length) {
      return
    }

    if (typeof transform == "undefined" || transform === true) {
      transform = function (element, name) {
        // TODO: subclass subcomponents should be handled properly (B extends A that has a subcomponent A:a becomes B:a that's not in the registry)
        return registry.exists(name)
            ? Component.create(name, element, hostComponent)
            : element
      }
    }

    hook.assignSubComponents(this.components, subComponents, transform, function (components, name, element) {
      if (Array.isArray(constructor.components[name])) {
        components[name] = components[name] || []
        components[name].push(element)
      }
      else {
        components[name] = element
      }
    })
  }
}

Object.defineProperty(Component.prototype, "element", {
  get: function () {
    return this._element
  },
  set: function (element) {
    this._element = element
    if (element && this.constructor.componentName) {
      if (this.constructor.autoSave) {
        storage.save(this)
      }
      if (this.constructor.autoAssign) {
        this.assignSubComponents()
      }
      this.constructor.resetAttributes(this)
    }
  }
})

},{"./delegate":6,"./hook":8,"./registry":10,"./storage":11}],4:[function(require,module,exports){
var camelcase = require("camelcase")
var extend = require("../util/extend")
var merge = require("../util/merge")
var object = require("../util/object")
var delegate = require("./delegate")
var storage = require("./storage")
var registry = require("./registry")
var hook = require("./hook")

var defaultEventDefinition = {
  detail: null,
  view: window,
  bubbles: true,
  cancelable: true
}

module.exports = function (CustomComponent, componentName) {

  CustomComponent.componentName = componentName
  CustomComponent.autoAssign = true
  CustomComponent.autoSave = true
  CustomComponent.components = {}
  CustomComponent.parents = []

  var prototype = CustomComponent.prototype

  var _events = CustomComponent._events = {}
  var _constructors = CustomComponent._constructors = []
  var _attributes = CustomComponent._attributes = {}
  var _actions = CustomComponent._actions = []

  CustomComponent.extend = function (BaseComponent) {
    prototype = CustomComponent.prototype = Object.create(BaseComponent.prototype)
    CustomComponent.prototype.constructor = CustomComponent
    if (BaseComponent.componentName) {
      CustomComponent.parents = CustomComponent.parents.concat(BaseComponent.parents)
      CustomComponent.parents.push(BaseComponent)
      CustomComponent.autoAssign = BaseComponent.autoAssign
      extend(CustomComponent.components, BaseComponent.components)
      extend(_events, BaseComponent._events)
      _constructors = _constructors.concat(BaseComponent._constructors)
      extend(_attributes, BaseComponent._attributes)
      BaseComponent._actions.forEach(function (args) {
        var event = args[0]
        var matches = args[1]
        var matcher = CustomComponent.action(event)
        matches.forEach(function (args) {
          matcher.match.apply(matcher, args)
        })
      })
    }
  }
  CustomComponent.onCreate = function (constructor) {
    _constructors.push(constructor)
    return CustomComponent
  }

  CustomComponent.create = function (instance, args) {
    _constructors.forEach(function (constructor) {
      constructor.apply(instance, args)
    })
  }

  CustomComponent.method = function (name, fn) {
    object.method(prototype, name, fn)
    return CustomComponent
  }

  CustomComponent.property = function (name, fn) {
    object.property(prototype, name, fn)
    return CustomComponent
  }

  CustomComponent.get = function (name, fn) {
    object.defineGetter(prototype, name, fn)
    return CustomComponent
  }

  CustomComponent.set = function (name, fn) {
    object.defineSetter(prototype, name, fn)
    return CustomComponent
  }

  CustomComponent.accessor = function (name, get, set) {
    object.accessor(prototype, name, get, set)
    return CustomComponent
  }

  CustomComponent.proto = function (prototype) {
    for (var prop in prototype) {
      if (prototype.hasOwnProperty(prop)) {
        if (typeof prototype[prop] == "function") {
          if (prop === "onCreate") {
            CustomComponent.onCreate(prototype[prop])
          }
          else {
            CustomComponent.method(prop, prototype[prop])
          }
        }
        else {
          CustomComponent.property(prop, prototype[prop])
        }
      }
    }
    return CustomComponent
  }

  CustomComponent.shortcut = function (name, componentName, extra) {
    CustomComponent.get(name, function () {
      var element = this.element.querySelector(hook.selector(componentName, "~=", extra))
      return registry.exists(componentName) ? storage.get(element, componentName) : element
    })
  }

  CustomComponent.action = function action(event) {
    var matches = []
    var action = CustomComponent.createAction(event)
    var match = action.match

    _actions.push([event, matches])

    action.match = function (components, cb) {
      matches.push([components, cb])
      return match(components, cb)
    }

    return action
  }

  CustomComponent.createAction = function (event) {
    var delegator = delegate({element: window, event: event})
    var action = {}
    action.match = function (components, cb) {

      if (!cb) {
        cb = components
        components = []
      }

      if (typeof components == "string") {
        components = [components]
      }

      var selectors = components.map(function (component) {
        if (component[0] == ":") {
          component = componentName+component
        }
        return hook.selector(component, "~=")
      })
      selectors.unshift(hook.selector(componentName, "~="))

      delegator.match(selectors, function (e, main) {
        var instance = storage.get(main, componentName) || main
        var instanceComponents = instance.components
        var args = [e];

        [].slice.call(arguments, 2).forEach(function (element, i) {
          var name = components[i]
          name = name[0] == ":" ? name.substr(1) : name
          var propertyName = camelcase(name)
          var arg

          if (instanceComponents && instanceComponents.hasOwnProperty(propertyName)) {
            arg = instance.components[propertyName]
            if (Array.isArray(arg)) {
              arg.some(function (member) {
                if (member == element || member.element == element) {
                  arg = member
                  return true
                }
                return false
              })
            }
          }
          else {
            arg = storage.get(element, name) || element
          }

          args.push(arg)
        })

        return cb.apply(instance, args)
      })

      return action
    }
    return action
  }

  CustomComponent.event = function (type, definition) {
    _events[type] = definition
    return CustomComponent
  }

  CustomComponent.getEventDefinition = function (type, detail) {
    var definition = merge(defaultEventDefinition, _events[type])
    definition.detail = typeof detail == "undefined" ? definition.detail : detail
    return definition
  }

  CustomComponent.resetAttributes = function (instance) {
    if (!instance.element) return

    var attribute
    var value
    for (var name in _attributes) {
      if (_attributes.hasOwnProperty(name)) {
        attribute = _attributes[name]
        value = attribute.get.call(instance, false)
        if (attribute.hasDefault && !attribute.has.call(instance, value)) {
          attribute.set.call(instance, attribute.defaultValue, false)
        }
      }
    }
  }

  CustomComponent.attribute = function (name, def) {
    if (def == null) {
      def = {}
    }

    var typeOfDef = typeof def
    var type
    var defaultValue
    var getter
    var setter
    var onchange
    var property = camelcase(name)

    switch (typeOfDef) {
      case "boolean":
      case "number":
      case "string":
        // the definition is a primitive value
        type = typeOfDef
        defaultValue = def
        break
      case "object":
      default:
        // or a definition object
        defaultValue = typeof def["default"] == "undefined" ? null : def["default"]
        if (typeof def["type"] == "undefined") {
          if (defaultValue == null) {
            type = "string"
          }
          else {
            type = typeof defaultValue
          }
        }
        else {
          type = def["type"]
        }
        getter = def["get"]
        setter = def["set"]
        onchange = def["onchange"]
    }

    var parseValue
    var stringifyValue
    var has

    has = function (value) { return value != null }

    switch (type) {
      case "boolean":
        has = function (value) { return value !== false }
        parseValue = function (value) { return value != null }
        stringifyValue = function () { return "" }
        break
      case "number":
        parseValue = function (value) { return value == null ? null : parseInt(value, 10) }
        break
      case "float":
        parseValue = function (value) { return value == null ? null : parseFloat(value) }
        break
      case "string":
      default:
        stringifyValue = function (value) { return value == null ? null : value ? ""+value : "" }
    }

    _attributes[property] = {
      get: get,
      set: set,
      has: has,
      defaultValue: defaultValue,
      hasDefault: defaultValue != null
    }

    function get(useDefault) {
      var value = this.element.getAttribute(name)
      if (value == null && useDefault == true) {
        return defaultValue
      }
      return parseValue ? parseValue(value) : value
    }

    function set(value, callOnchange) {
      var old = get.call(this, false)
      if (!has(value)) {
        this.element.removeAttribute(name)
      }
      else if (old === value) {
        return
      }
      else {
        var newValue = stringifyValue ? stringifyValue(value) : value
        this.element.setAttribute(name, newValue)
      }
      onchange && callOnchange != false && onchange.call(this, old, value)
    }

    Object.defineProperty(prototype, property, {
      get: getter || get,
      set: setter || set
    })

    return CustomComponent
  }

  return CustomComponent
}

},{"../util/extend":12,"../util/merge":13,"../util/object":14,"./delegate":6,"./hook":8,"./registry":10,"./storage":11,"camelcase":2}],5:[function(require,module,exports){
var Component = require("./Component")
var hook = require("./hook")

module.exports = component

function component (name, root, options) {
  // component("string"[, {}])
  if (!(root instanceof Element)) {
    options = root
    root = null
  }
  var element = hook.findComponent(name, root)

  return Component.create(name, element, options)
}

component.all = function (name, root, options) {
  // component("string"[, {}])
  if (!(root instanceof Element)) {
    options = root
    root = null
  }
  // component("string"[, Element])
  var elements = hook.findAllComponents(name, root)

  return [].map.call(elements, function (element) {
    return Component.create(name, element, options)
  })
}

},{"./Component":3,"./hook":8}],6:[function(require,module,exports){
/**
 * Registers an event listener on an element
 * and returns a delegator.
 * A delegated event runs matches to find an event target,
 * then executes the handler paired with the matcher.
 * Matchers can check if an event target matches a given selector,
 * or see if an of its parents do.
 * */
module.exports = function delegate( options ){
    var element = options.element
        , event = options.event
        , capture = !!options.capture||false
        , context = options.context||element

    if( !element ){
        console.log("Can't delegate undefined element")
        return null
    }
    if( !event ){
        console.log("Can't delegate undefined event")
        return null
    }

    var delegator = createDelegator(context)
    element.addEventListener(event, delegator, capture)

    return delegator
}

/**
 * Returns a delegator that can be used as an event listener.
 * The delegator has static methods which can be used to register handlers.
 * */
function createDelegator( context ){
    var matchers = []

    function delegator( e ){
        var l = matchers.length
        if( !l ){
            return true
        }

        var el = this
            , i = -1
            , handler
            , selector
            , delegateElement
            , stopPropagation
            , args

        while( ++i < l ){
            args = matchers[i]
            handler = args[0]
            selector = args[1]

            delegateElement = matchCapturePath(selector, el, e)
            if( delegateElement && delegateElement.length ) {
                stopPropagation = false === handler.apply(context, [e].concat(delegateElement))
                if( stopPropagation ) {
                    return false
                }
            }
        }

        return true
    }

    /**
     * Registers a handler with a target finder logic
     * */
    delegator.match = function( selector, handler ){
        matchers.push([handler, selector])
        return delegator
    }

    return delegator
}

function matchCapturePath( selector, el, e ){
    var delegateElements = []
    var delegateElement = null
    if( Array.isArray(selector) ){
        var i = -1
        var l = selector.length
        while( ++i < l ){
            delegateElement = findParent(selector[i], el, e)
            if( !delegateElement ) return null
            delegateElements.push(delegateElement)
        }
    }
    else {
        delegateElement = findParent(selector, el, e)
        if( !delegateElement ) return null
        delegateElements.push(delegateElement)
    }
    return delegateElements
}

/**
 * Check if the target or any of its parent matches a selector
 * */
function findParent( selector, el, e ){
    var target = e.target
    switch( typeof selector ){
        case "string":
            while( target && target != el ){
                if( target.matches && target.matches(selector) ) return target
                target = target.parentNode
            }
            break
        case "function":
            while( target && target != el ){
                if( selector.call(el, target) ) return target
                target = target.parentNode
            }
            break
        default:
            return null
    }
    return null
}

},{}],7:[function(require,module,exports){
var merge = require("../util/merge")

module.exports = fragment

fragment.options = {
  variable: "f"
}

function fragment( html, compiler, compilerOptions ){
  compilerOptions = merge(fragment.options, compilerOptions)
  var render = null
  return function( templateData ){
    var temp = window.document.createElement("div")
    if( typeof compiler == "function" && !render ){
      render = compiler(html, compilerOptions)
    }
    if( render ){
      try{
        html = render(templateData)
      }
      catch( e ){
        console.error("Error rendering fragment with context:", templateData)
        console.error(render.toString())
        console.error(e)
        throw e
      }
    }

    temp.innerHTML = html
    var fragment = window.document.createDocumentFragment()
    while( temp.childNodes.length ){
      fragment.appendChild(temp.firstChild)
    }
    return fragment
  }
}
fragment.render = function( html, templateData ){
  return fragment(html)(templateData)
}

},{"../util/merge":13}],8:[function(require,module,exports){
var camelcase = require("camelcase")
var COMPONENT_ATTRIBUTE = "data-component"

var hook = module.exports = {}

hook.setHookAttribute = setHookAttribute
hook.selector = selector
hook.findComponent = findComponent
hook.findAllComponents = findAllComponents
hook.findSubComponents = findSubComponents
hook.getComponentName = getComponentName
hook.getMainComponentName = getMainComponentName
hook.getSubComponentName = getSubComponentName
hook.assignSubComponents = assignSubComponents
hook.filter = filter

function setHookAttribute (hook) {
  COMPONENT_ATTRIBUTE = hook
}

function selector (name, operator, extra) {
  name = name && '"' + name + '"'
  operator = name ? operator || "=" : ""
  extra = extra || ""
  return "[" + COMPONENT_ATTRIBUTE + operator + name + "]" + extra
}

function find (selector, root) {
  return (root || document).querySelector(selector)
}

function findAll (selector, root) {
  return (root || document).querySelectorAll(selector)
}

function findComponent (name, root) {
  return find(selector(name), root)
}

function findAllComponents (name, root) {
  return [].slice.call(findAll(selector(name), root))
}

function getComponentName (element, cc) {
  if (!element) return ""
  cc = cc == undefined || cc
  var value = typeof element == "string" ? element : element.getAttribute(COMPONENT_ATTRIBUTE) || ""
  return cc ? camelcase(value) : value
}

function getMainComponentName (element, cc) {
  cc = cc == undefined || cc
  var value = getComponentName(element, false).split(":")
  value = value[0] || ""
  return cc && value ? camelcase(value) : value
}

function getSubComponentName (element, cc) {
  cc = cc == undefined || cc
  var value = getComponentName(element, false).split(":")
  value = value[1] || ""
  return cc && value ? camelcase(value) : value
}

function getComponentNameList (element, cc) {
  return getComponentName(element, cc).split(/\s+/)
}

function findSubComponents (mainName, root) {
  var elements = findAll(selector(mainName+":", "*="), root)
  return filter(elements, function (element, componentName) {
    return getComponentNameList(componentName, false).some(function (name) {
      return getMainComponentName(name, false) == mainName && getSubComponentName(name)
    })
  })
}

function assignSubComponents (obj, subComponents, transform, assign) {
  return subComponents.reduce(function (obj, element) {
    getComponentNameList(element, false).forEach(function (name) {
      var subName = getSubComponentName(name, true)
      element = typeof transform == "function"
          ? transform(element, name)
          : element
      if (typeof assign == "function") {
        assign(obj, subName, element)
      }
      else if (Array.isArray(obj[subName])) {
        obj[subName].push(element)
      }
      else {
        obj[subName] = element
      }
    })
    return obj
  }, obj)
}

function filter (elements, filter) {
  switch (typeof filter) {
    case "function":
      return [].slice.call(elements).filter(function (element) {
        return filter(element, getComponentName(element, false))
      })
      break
    case "string":
      return [].slice.call(elements).filter(function (element) {
        return getComponentName(element) === filter
      })
      break
    default:
      return null
  }
}

},{"camelcase":2}],9:[function(require,module,exports){
var registry = require("./registry")
var Component = require("./Component")
var Internals = require("./Internals")

module.exports = function register (name, mixin) {
  mixin = [].slice.call(arguments, 1)

  function CustomComponent (element, options) {
    if (!(this instanceof CustomComponent)) {
      return new CustomComponent(element, options)
    }
    var instance = this

    this.name = name

    Component.call(instance, element, options)
    // at this point custom constructors can already access the element and sub components
    // so they only receive the options object for convenience
    CustomComponent.create(instance, [options])
  }

  Internals(CustomComponent, name)
  CustomComponent.extend(Component)
  CustomComponent.autoAssign = true
  mixin.forEach(function (mixin) {
    if (typeof mixin == "function") {
      if (mixin.componentName) {
        CustomComponent.extend(mixin)
      }
      else {
        mixin.call(CustomComponent.prototype, CustomComponent)
      }
    }
    else {
      CustomComponent.proto(mixin)
    }
  })

  return registry.set(name, CustomComponent)
}

},{"./Component":3,"./Internals":4,"./registry":10}],10:[function(require,module,exports){
var registry = module.exports = {}

var components = {}

registry.get = function exists (name) {
  return components[name]
}

registry.exists = function exists (name) {
  return !!components[name]
}

registry.set = function exists (name, ComponentConstructor) {
  return components[name] = ComponentConstructor
}

},{}],11:[function(require,module,exports){
var hook = require("./hook")
var camelcase = require("camelcase")

var storage = module.exports = {}
var components = []
var elements = []
var counter = 0

function createProperty (componentName) {
  return camelcase(componentName+"-id")
}

function getId (element, componentName) {
  return element.dataset[createProperty(componentName)]
}

function setId (element, componentName, id) {
  element.dataset[createProperty(componentName)] = id
}

function hasId (element, componentName) {
  return !!(element.dataset[createProperty(componentName)])
}

function removeId (element, componentName) {
  if (hasId(element, componentName)) {
    delete element.dataset[createProperty(componentName)]
  }
}

storage.get = function (element, componentName) {
  var store = components[getId(element, componentName)]
  return store ? store[componentName] : null
}
storage.save = function (component) {
  if (component.element) {
    var id = component._id
    var componentName = component.name
    var store

    if (!id) {
      id = ++counter
      setId(component.element, componentName, id)
      component._id = id
    }

    store = components[id]
    if (!store) {
      store = components[id] = {length: 0}
    }

    if (store[componentName] !== component) {
      ++store.length
      store[componentName] = component
    }

    var existingElement = elements[id]
    if (existingElement) {
      removeId(existingElement, componentName)
      setId(component.element, componentName, id)
    }

    elements[id] = component.element
  }
}
storage.remove = function (component, onlyComponent) {
  var element = component instanceof Element
      ? component
      : component.element
  var componentName = component.name
  var id = getId(element, componentName)
  var store = components[id]

  if (component instanceof Element) {
    if (onlyComponent) {
      if (delete store[onlyComponent]) --store.length
    }
    else {
      for (var prop in store) {
        if (store.hasOwnProperty(id)) {
          store[prop]._id = null
          //--store.length
        }
      }
      delete components[id]
    }
  }
  else {
    var existing = store[componentName]
    if (existing == component) {
      existing._id = null
      delete store[componentName]
      --store.length
    }
  }

  if (store && !store.length) {
    removeId(elements[id], componentName)
    delete elements[id]
  }
}


},{"./hook":8,"camelcase":2}],12:[function(require,module,exports){
module.exports = function extend( obj, extension ){
  for( var name in extension ){
    if( extension.hasOwnProperty(name) ) obj[name] = extension[name]
  }
  return obj
}

},{}],13:[function(require,module,exports){
var extend = require("./extend")

module.exports = function( obj, extension ){
  return extend(extend({}, obj), extension)
}

},{"./extend":12}],14:[function(require,module,exports){
var object = module.exports = {}

object.accessor = function (obj, name, get, set) {
  Object.defineProperty(obj, name, {
    get: get,
    set: set
  })
}

object.defineGetter = function (obj, name, fn) {
  Object.defineProperty(obj, name, {
    get: fn
  })
}

object.defineSetter = function (obj, name, fn) {
  Object.defineProperty(obj, name, {
    set: fn
  })
}

object.method = function (obj, name, fn) {
  Object.defineProperty(obj, name, {
    value: fn
  })
}

object.property = function (obj, name, fn) {
  Object.defineProperty(obj, name, {
    value: fn,
    configurable: true
  })
}

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jYW1lbGNhc2UvaW5kZXguanMiLCJzcmMvQ29tcG9uZW50LmpzIiwic3JjL0ludGVybmFscy5qcyIsInNyYy9jcmVhdGUuanMiLCJzcmMvZGVsZWdhdGUuanMiLCJzcmMvZnJhZ21lbnQuanMiLCJzcmMvaG9vay5qcyIsInNyYy9yZWdpc3Rlci5qcyIsInNyYy9yZWdpc3RyeS5qcyIsInNyYy9zdG9yYWdlLmpzIiwidXRpbC9leHRlbmQuanMiLCJ1dGlsL21lcmdlLmpzIiwidXRpbC9vYmplY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaG9vayA9IHJlcXVpcmUoXCIuL3NyYy9ob29rXCIpXG52YXIgcmVnaXN0ZXIgPSByZXF1aXJlKFwiLi9zcmMvcmVnaXN0ZXJcIilcbnZhciBjb21wb25lbnQgPSByZXF1aXJlKFwiLi9zcmMvY3JlYXRlXCIpXG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoXCIuL3NyYy9zdG9yYWdlXCIpXG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIi4vc3JjL0NvbXBvbmVudFwiKVxudmFyIGRlbGVnYXRlID0gcmVxdWlyZShcIi4vc3JjL2RlbGVnYXRlXCIpXG52YXIgZnJhZ21lbnQgPSByZXF1aXJlKFwiLi9zcmMvZnJhZ21lbnRcIilcblxudmFyIHRyZWFudCA9IHt9XG5tb2R1bGUuZXhwb3J0cyA9IHRyZWFudFxuXG50cmVhbnQucmVnaXN0ZXIgPSByZWdpc3RlclxudHJlYW50LmNvbXBvbmVudCA9IGNvbXBvbmVudFxudHJlYW50LnN0b3JhZ2UgPSBzdG9yYWdlXG50cmVhbnQuQ29tcG9uZW50ID0gQ29tcG9uZW50XG50cmVhbnQuZGVsZWdhdGUgPSBkZWxlZ2F0ZVxudHJlYW50LmZyYWdtZW50ID0gZnJhZ21lbnRcbnRyZWFudC5ob29rID0gaG9va1xuXG52YXIgdXRpbCA9IHt9XG50cmVhbnQudXRpbCA9IHV0aWxcblxudXRpbC5leHRlbmQgPSByZXF1aXJlKFwiLi91dGlsL2V4dGVuZFwiKVxudXRpbC5tZXJnZSA9IHJlcXVpcmUoXCIuL3V0aWwvbWVyZ2VcIilcbnV0aWwub2JqZWN0ID0gcmVxdWlyZShcIi4vdXRpbC9vYmplY3RcIilcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0cikge1xuXHRzdHIgPSBzdHIudHJpbSgpO1xuXG5cdGlmIChzdHIubGVuZ3RoID09PSAxIHx8ICEoL1tfLlxcLSBdKy8pLnRlc3Qoc3RyKSApIHtcblx0XHRpZiAoc3RyWzBdID09PSBzdHJbMF0udG9Mb3dlckNhc2UoKSAmJiBzdHIuc2xpY2UoMSkgIT09IHN0ci5zbGljZSgxKS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRyZXR1cm4gc3RyO1xuXHRcdH1cblxuXHRcdHJldHVybiBzdHIudG9Mb3dlckNhc2UoKTtcblx0fVxuXG5cdHJldHVybiBzdHJcblx0LnJlcGxhY2UoL15bXy5cXC0gXSsvLCAnJylcblx0LnRvTG93ZXJDYXNlKClcblx0LnJlcGxhY2UoL1tfLlxcLSBdKyhcXHd8JCkvZywgZnVuY3Rpb24gKG0sIHAxKSB7XG5cdFx0cmV0dXJuIHAxLnRvVXBwZXJDYXNlKCk7XG5cdH0pO1xufTtcbiIsInZhciBob29rID0gcmVxdWlyZShcIi4vaG9va1wiKVxudmFyIHJlZ2lzdHJ5ID0gcmVxdWlyZShcIi4vcmVnaXN0cnlcIilcbnZhciBzdG9yYWdlID0gcmVxdWlyZShcIi4vc3RvcmFnZVwiKVxudmFyIGRlbGVnYXRlID0gcmVxdWlyZShcIi4vZGVsZWdhdGVcIilcblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnRcblxuZnVuY3Rpb24gQ29tcG9uZW50IChlbGVtZW50LCBvcHRpb25zKSB7XG4gIGlmIChlbGVtZW50ICYmICEoZWxlbWVudCBpbnN0YW5jZW9mIEVsZW1lbnQpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiZWxlbWVudCBzaG91bGQgYmUgYW4gRWxlbWVudCBpbnN0YW5jZSBvciBudWxsXCIpXG4gIH1cbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENvbXBvbmVudCkpIHtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudChlbGVtZW50LCBvcHRpb25zKVxuICB9XG5cbiAgdGhpcy5fZWxlbWVudCA9IG51bGxcbiAgdGhpcy5faWQgPSBudWxsXG4gIHRoaXMuY29tcG9uZW50cyA9IHt9XG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQgfHwgbnVsbFxufVxuXG5Db21wb25lbnQuY3JlYXRlID0gZnVuY3Rpb24gKG5hbWUsIGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgdmFyIENvbXBvbmVudENvbnN0cnVjdG9yID0gbnVsbFxuXG4gIGlmIChyZWdpc3RyeS5leGlzdHMobmFtZSkpIHtcbiAgICBDb21wb25lbnRDb25zdHJ1Y3RvciA9IHJlZ2lzdHJ5LmdldChuYW1lKVxuICB9XG4gIGVsc2Uge1xuICAgIGNvbnNvbGUud2FybihcIk1pc3NpbmcgY29tcG9uZW50IGRlZmluaXRpb246IFwiLCBuYW1lKVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gbmV3IENvbXBvbmVudENvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpXG59XG5cbkNvbXBvbmVudC5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBDb21wb25lbnQsXG5cbiAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xuICAgIHN0b3JhZ2UucmVtb3ZlKHRoaXMpXG4gICAgdGhpcy5lbGVtZW50ID0gbnVsbFxuXG4gICAgdmFyIGNvbXBvbmVudHMgPSB0aGlzLmNvbXBvbmVudHNcbiAgICB2YXIgY29tcG9uZW50XG4gICAgZm9yICh2YXIgbmFtZSBpbiBjb21wb25lbnRzKSB7XG4gICAgICBpZiAoY29tcG9uZW50cy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICBjb21wb25lbnQgPSBjb21wb25lbnRzW25hbWVdXG4gICAgICAgIGlmIChjb21wb25lbnQuZGVzdHJveSkge1xuICAgICAgICAgIGNvbXBvbmVudC5kZXN0cm95KClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNvbXBvbmVudHMgPSBudWxsXG4gIH0sXG5cbiAgZGVsZWdhdGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucy5lbGVtZW50ID0gdGhpcy5lbGVtZW50XG4gICAgb3B0aW9ucy5jb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0IHx8IHRoaXNcbiAgICByZXR1cm4gZGVsZWdhdGUob3B0aW9ucylcbiAgfSxcbiAgYWN0aW9uOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5jcmVhdGVBY3Rpb24oZXZlbnQpXG4gIH0sXG5cbiAgZGlzcGF0Y2g6IGZ1bmN0aW9uICh0eXBlLCBkZXRhaWwpIHtcbiAgICB2YXIgZGVmaW5pdGlvbiA9IHRoaXMuY29uc3RydWN0b3IuZ2V0RXZlbnREZWZpbml0aW9uKHR5cGUsIGRldGFpbClcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IHdpbmRvdy5DdXN0b21FdmVudCh0eXBlLCBkZWZpbml0aW9uKSlcbiAgfSxcblxuICBmaW5kQ29tcG9uZW50OiBmdW5jdGlvbiAobmFtZSkge1xuICAgIHJldHVybiBob29rLmZpbmRDb21wb25lbnQobmFtZSwgdGhpcy5lbGVtZW50KVxuICB9LFxuICBmaW5kQWxsQ29tcG9uZW50czogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICByZXR1cm4gaG9vay5maW5kQWxsQ29tcG9uZW50cyhuYW1lLCB0aGlzLmVsZW1lbnQpXG4gIH0sXG4gIGZpbmRTdWJDb21wb25lbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgLy92YXIgc3ViQ29tcG9uZW50cyA9IFtdXG4gICAgLy92YXIgZWxlbWVudCA9IHRoaXMuZWxlbWVudFxuICAgIC8vdGhpcy5jb25zdHJ1Y3Rvci5wYXJlbnRzLmZvckVhY2goZnVuY3Rpb24gKFBhcmVudENvbXBvbmVudCkge1xuICAgIC8vICB2YXIgY29tcG9uZW50cyA9IGhvb2suZmluZFN1YkNvbXBvbmVudHMoUGFyZW50Q29tcG9uZW50LmNvbXBvbmVudE5hbWUsIGVsZW1lbnQpXG4gICAgLy8gIHN1YkNvbXBvbmVudHMgPSBzdWJDb21wb25lbnRzLmNvbmNhdChjb21wb25lbnRzKVxuICAgIC8vfSlcbiAgICAvL3N1YkNvbXBvbmVudHMgPSBzdWJDb21wb25lbnRzLmNvbmNhdChob29rLmZpbmRTdWJDb21wb25lbnRzKHRoaXMuZ2V0TWFpbkNvbXBvbmVudE5hbWUoZmFsc2UpLCBlbGVtZW50KSlcbiAgICAvL3JldHVybiBzdWJDb21wb25lbnRzXG4gICAgcmV0dXJuIGhvb2suZmluZFN1YkNvbXBvbmVudHModGhpcy5nZXRNYWluQ29tcG9uZW50TmFtZShmYWxzZSksIHRoaXMuZWxlbWVudClcbiAgfSxcbiAgZ2V0Q29tcG9uZW50TmFtZTogZnVuY3Rpb24gKGNjKSB7XG4gICAgcmV0dXJuIGhvb2suZ2V0Q29tcG9uZW50TmFtZSh0aGlzLmNvbnN0cnVjdG9yLmNvbXBvbmVudE5hbWUsIGNjKVxuICB9LFxuICBnZXRNYWluQ29tcG9uZW50TmFtZTogZnVuY3Rpb24gKGNjKSB7XG4gICAgcmV0dXJuIGhvb2suZ2V0TWFpbkNvbXBvbmVudE5hbWUodGhpcy5jb25zdHJ1Y3Rvci5jb21wb25lbnROYW1lLCBjYylcbiAgfSxcbiAgZ2V0U3ViQ29tcG9uZW50TmFtZTogZnVuY3Rpb24gKGNjKSB7XG4gICAgcmV0dXJuIGhvb2suZ2V0U3ViQ29tcG9uZW50TmFtZSh0aGlzLmNvbnN0cnVjdG9yLmNvbXBvbmVudE5hbWUsIGNjKVxuICB9LFxuXG4gIGNsZWFyU3ViQ29tcG9uZW50czogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb21wb25lbnRzID0gdGhpcy5jb25zdHJ1Y3Rvci5jb21wb25lbnRzXG5cbiAgICBmb3IgKHZhciBuYW1lIGluIGNvbXBvbmVudHMpIHtcbiAgICAgIGlmIChjb21wb25lbnRzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNvbXBvbmVudHNbbmFtZV0pKSB7XG4gICAgICAgICAgdGhpcy5jb21wb25lbnRzW25hbWVdID0gW11cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbXBvbmVudHNbbmFtZV0gPSBjb21wb25lbnRzW25hbWVdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGFzc2lnblN1YkNvbXBvbmVudHM6IGZ1bmN0aW9uICh0cmFuc2Zvcm0pIHtcbiAgICBpZiAoIXRoaXMuZWxlbWVudCkgcmV0dXJuXG5cbiAgICB2YXIgaG9zdENvbXBvbmVudCA9IHRoaXNcbiAgICB2YXIgc3ViQ29tcG9uZW50cyA9IHRoaXMuZmluZFN1YkNvbXBvbmVudHMoKVxuICAgIHZhciBjb25zdHJ1Y3RvciA9IHRoaXMuY29uc3RydWN0b3JcblxuICAgIHRoaXMuY2xlYXJTdWJDb21wb25lbnRzKClcblxuICAgIGlmICghc3ViQ29tcG9uZW50cy5sZW5ndGgpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdHJhbnNmb3JtID09IFwidW5kZWZpbmVkXCIgfHwgdHJhbnNmb3JtID09PSB0cnVlKSB7XG4gICAgICB0cmFuc2Zvcm0gPSBmdW5jdGlvbiAoZWxlbWVudCwgbmFtZSkge1xuICAgICAgICAvLyBUT0RPOiBzdWJjbGFzcyBzdWJjb21wb25lbnRzIHNob3VsZCBiZSBoYW5kbGVkIHByb3Blcmx5IChCIGV4dGVuZHMgQSB0aGF0IGhhcyBhIHN1YmNvbXBvbmVudCBBOmEgYmVjb21lcyBCOmEgdGhhdCdzIG5vdCBpbiB0aGUgcmVnaXN0cnkpXG4gICAgICAgIHJldHVybiByZWdpc3RyeS5leGlzdHMobmFtZSlcbiAgICAgICAgICAgID8gQ29tcG9uZW50LmNyZWF0ZShuYW1lLCBlbGVtZW50LCBob3N0Q29tcG9uZW50KVxuICAgICAgICAgICAgOiBlbGVtZW50XG4gICAgICB9XG4gICAgfVxuXG4gICAgaG9vay5hc3NpZ25TdWJDb21wb25lbnRzKHRoaXMuY29tcG9uZW50cywgc3ViQ29tcG9uZW50cywgdHJhbnNmb3JtLCBmdW5jdGlvbiAoY29tcG9uZW50cywgbmFtZSwgZWxlbWVudCkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29uc3RydWN0b3IuY29tcG9uZW50c1tuYW1lXSkpIHtcbiAgICAgICAgY29tcG9uZW50c1tuYW1lXSA9IGNvbXBvbmVudHNbbmFtZV0gfHwgW11cbiAgICAgICAgY29tcG9uZW50c1tuYW1lXS5wdXNoKGVsZW1lbnQpXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29tcG9uZW50c1tuYW1lXSA9IGVsZW1lbnRcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb21wb25lbnQucHJvdG90eXBlLCBcImVsZW1lbnRcIiwge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fZWxlbWVudFxuICB9LFxuICBzZXQ6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgdGhpcy5fZWxlbWVudCA9IGVsZW1lbnRcbiAgICBpZiAoZWxlbWVudCAmJiB0aGlzLmNvbnN0cnVjdG9yLmNvbXBvbmVudE5hbWUpIHtcbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLmF1dG9TYXZlKSB7XG4gICAgICAgIHN0b3JhZ2Uuc2F2ZSh0aGlzKVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuYXV0b0Fzc2lnbikge1xuICAgICAgICB0aGlzLmFzc2lnblN1YkNvbXBvbmVudHMoKVxuICAgICAgfVxuICAgICAgdGhpcy5jb25zdHJ1Y3Rvci5yZXNldEF0dHJpYnV0ZXModGhpcylcbiAgICB9XG4gIH1cbn0pXG4iLCJ2YXIgY2FtZWxjYXNlID0gcmVxdWlyZShcImNhbWVsY2FzZVwiKVxudmFyIGV4dGVuZCA9IHJlcXVpcmUoXCIuLi91dGlsL2V4dGVuZFwiKVxudmFyIG1lcmdlID0gcmVxdWlyZShcIi4uL3V0aWwvbWVyZ2VcIilcbnZhciBvYmplY3QgPSByZXF1aXJlKFwiLi4vdXRpbC9vYmplY3RcIilcbnZhciBkZWxlZ2F0ZSA9IHJlcXVpcmUoXCIuL2RlbGVnYXRlXCIpXG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoXCIuL3N0b3JhZ2VcIilcbnZhciByZWdpc3RyeSA9IHJlcXVpcmUoXCIuL3JlZ2lzdHJ5XCIpXG52YXIgaG9vayA9IHJlcXVpcmUoXCIuL2hvb2tcIilcblxudmFyIGRlZmF1bHRFdmVudERlZmluaXRpb24gPSB7XG4gIGRldGFpbDogbnVsbCxcbiAgdmlldzogd2luZG93LFxuICBidWJibGVzOiB0cnVlLFxuICBjYW5jZWxhYmxlOiB0cnVlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKEN1c3RvbUNvbXBvbmVudCwgY29tcG9uZW50TmFtZSkge1xuXG4gIEN1c3RvbUNvbXBvbmVudC5jb21wb25lbnROYW1lID0gY29tcG9uZW50TmFtZVxuICBDdXN0b21Db21wb25lbnQuYXV0b0Fzc2lnbiA9IHRydWVcbiAgQ3VzdG9tQ29tcG9uZW50LmF1dG9TYXZlID0gdHJ1ZVxuICBDdXN0b21Db21wb25lbnQuY29tcG9uZW50cyA9IHt9XG4gIEN1c3RvbUNvbXBvbmVudC5wYXJlbnRzID0gW11cblxuICB2YXIgcHJvdG90eXBlID0gQ3VzdG9tQ29tcG9uZW50LnByb3RvdHlwZVxuXG4gIHZhciBfZXZlbnRzID0gQ3VzdG9tQ29tcG9uZW50Ll9ldmVudHMgPSB7fVxuICB2YXIgX2NvbnN0cnVjdG9ycyA9IEN1c3RvbUNvbXBvbmVudC5fY29uc3RydWN0b3JzID0gW11cbiAgdmFyIF9hdHRyaWJ1dGVzID0gQ3VzdG9tQ29tcG9uZW50Ll9hdHRyaWJ1dGVzID0ge31cbiAgdmFyIF9hY3Rpb25zID0gQ3VzdG9tQ29tcG9uZW50Ll9hY3Rpb25zID0gW11cblxuICBDdXN0b21Db21wb25lbnQuZXh0ZW5kID0gZnVuY3Rpb24gKEJhc2VDb21wb25lbnQpIHtcbiAgICBwcm90b3R5cGUgPSBDdXN0b21Db21wb25lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQ29tcG9uZW50LnByb3RvdHlwZSlcbiAgICBDdXN0b21Db21wb25lbnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ3VzdG9tQ29tcG9uZW50XG4gICAgaWYgKEJhc2VDb21wb25lbnQuY29tcG9uZW50TmFtZSkge1xuICAgICAgQ3VzdG9tQ29tcG9uZW50LnBhcmVudHMgPSBDdXN0b21Db21wb25lbnQucGFyZW50cy5jb25jYXQoQmFzZUNvbXBvbmVudC5wYXJlbnRzKVxuICAgICAgQ3VzdG9tQ29tcG9uZW50LnBhcmVudHMucHVzaChCYXNlQ29tcG9uZW50KVxuICAgICAgQ3VzdG9tQ29tcG9uZW50LmF1dG9Bc3NpZ24gPSBCYXNlQ29tcG9uZW50LmF1dG9Bc3NpZ25cbiAgICAgIGV4dGVuZChDdXN0b21Db21wb25lbnQuY29tcG9uZW50cywgQmFzZUNvbXBvbmVudC5jb21wb25lbnRzKVxuICAgICAgZXh0ZW5kKF9ldmVudHMsIEJhc2VDb21wb25lbnQuX2V2ZW50cylcbiAgICAgIF9jb25zdHJ1Y3RvcnMgPSBfY29uc3RydWN0b3JzLmNvbmNhdChCYXNlQ29tcG9uZW50Ll9jb25zdHJ1Y3RvcnMpXG4gICAgICBleHRlbmQoX2F0dHJpYnV0ZXMsIEJhc2VDb21wb25lbnQuX2F0dHJpYnV0ZXMpXG4gICAgICBCYXNlQ29tcG9uZW50Ll9hY3Rpb25zLmZvckVhY2goZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gYXJnc1swXVxuICAgICAgICB2YXIgbWF0Y2hlcyA9IGFyZ3NbMV1cbiAgICAgICAgdmFyIG1hdGNoZXIgPSBDdXN0b21Db21wb25lbnQuYWN0aW9uKGV2ZW50KVxuICAgICAgICBtYXRjaGVzLmZvckVhY2goZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICBtYXRjaGVyLm1hdGNoLmFwcGx5KG1hdGNoZXIsIGFyZ3MpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cbiAgfVxuICBDdXN0b21Db21wb25lbnQub25DcmVhdGUgPSBmdW5jdGlvbiAoY29uc3RydWN0b3IpIHtcbiAgICBfY29uc3RydWN0b3JzLnB1c2goY29uc3RydWN0b3IpXG4gICAgcmV0dXJuIEN1c3RvbUNvbXBvbmVudFxuICB9XG5cbiAgQ3VzdG9tQ29tcG9uZW50LmNyZWF0ZSA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgYXJncykge1xuICAgIF9jb25zdHJ1Y3RvcnMuZm9yRWFjaChmdW5jdGlvbiAoY29uc3RydWN0b3IpIHtcbiAgICAgIGNvbnN0cnVjdG9yLmFwcGx5KGluc3RhbmNlLCBhcmdzKVxuICAgIH0pXG4gIH1cblxuICBDdXN0b21Db21wb25lbnQubWV0aG9kID0gZnVuY3Rpb24gKG5hbWUsIGZuKSB7XG4gICAgb2JqZWN0Lm1ldGhvZChwcm90b3R5cGUsIG5hbWUsIGZuKVxuICAgIHJldHVybiBDdXN0b21Db21wb25lbnRcbiAgfVxuXG4gIEN1c3RvbUNvbXBvbmVudC5wcm9wZXJ0eSA9IGZ1bmN0aW9uIChuYW1lLCBmbikge1xuICAgIG9iamVjdC5wcm9wZXJ0eShwcm90b3R5cGUsIG5hbWUsIGZuKVxuICAgIHJldHVybiBDdXN0b21Db21wb25lbnRcbiAgfVxuXG4gIEN1c3RvbUNvbXBvbmVudC5nZXQgPSBmdW5jdGlvbiAobmFtZSwgZm4pIHtcbiAgICBvYmplY3QuZGVmaW5lR2V0dGVyKHByb3RvdHlwZSwgbmFtZSwgZm4pXG4gICAgcmV0dXJuIEN1c3RvbUNvbXBvbmVudFxuICB9XG5cbiAgQ3VzdG9tQ29tcG9uZW50LnNldCA9IGZ1bmN0aW9uIChuYW1lLCBmbikge1xuICAgIG9iamVjdC5kZWZpbmVTZXR0ZXIocHJvdG90eXBlLCBuYW1lLCBmbilcbiAgICByZXR1cm4gQ3VzdG9tQ29tcG9uZW50XG4gIH1cblxuICBDdXN0b21Db21wb25lbnQuYWNjZXNzb3IgPSBmdW5jdGlvbiAobmFtZSwgZ2V0LCBzZXQpIHtcbiAgICBvYmplY3QuYWNjZXNzb3IocHJvdG90eXBlLCBuYW1lLCBnZXQsIHNldClcbiAgICByZXR1cm4gQ3VzdG9tQ29tcG9uZW50XG4gIH1cblxuICBDdXN0b21Db21wb25lbnQucHJvdG8gPSBmdW5jdGlvbiAocHJvdG90eXBlKSB7XG4gICAgZm9yICh2YXIgcHJvcCBpbiBwcm90b3R5cGUpIHtcbiAgICAgIGlmIChwcm90b3R5cGUuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm90b3R5cGVbcHJvcF0gPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgaWYgKHByb3AgPT09IFwib25DcmVhdGVcIikge1xuICAgICAgICAgICAgQ3VzdG9tQ29tcG9uZW50Lm9uQ3JlYXRlKHByb3RvdHlwZVtwcm9wXSlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBDdXN0b21Db21wb25lbnQubWV0aG9kKHByb3AsIHByb3RvdHlwZVtwcm9wXSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgQ3VzdG9tQ29tcG9uZW50LnByb3BlcnR5KHByb3AsIHByb3RvdHlwZVtwcm9wXSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gQ3VzdG9tQ29tcG9uZW50XG4gIH1cblxuICBDdXN0b21Db21wb25lbnQuc2hvcnRjdXQgPSBmdW5jdGlvbiAobmFtZSwgY29tcG9uZW50TmFtZSwgZXh0cmEpIHtcbiAgICBDdXN0b21Db21wb25lbnQuZ2V0KG5hbWUsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoaG9vay5zZWxlY3Rvcihjb21wb25lbnROYW1lLCBcIn49XCIsIGV4dHJhKSlcbiAgICAgIHJldHVybiByZWdpc3RyeS5leGlzdHMoY29tcG9uZW50TmFtZSkgPyBzdG9yYWdlLmdldChlbGVtZW50LCBjb21wb25lbnROYW1lKSA6IGVsZW1lbnRcbiAgICB9KVxuICB9XG5cbiAgQ3VzdG9tQ29tcG9uZW50LmFjdGlvbiA9IGZ1bmN0aW9uIGFjdGlvbihldmVudCkge1xuICAgIHZhciBtYXRjaGVzID0gW11cbiAgICB2YXIgYWN0aW9uID0gQ3VzdG9tQ29tcG9uZW50LmNyZWF0ZUFjdGlvbihldmVudClcbiAgICB2YXIgbWF0Y2ggPSBhY3Rpb24ubWF0Y2hcblxuICAgIF9hY3Rpb25zLnB1c2goW2V2ZW50LCBtYXRjaGVzXSlcblxuICAgIGFjdGlvbi5tYXRjaCA9IGZ1bmN0aW9uIChjb21wb25lbnRzLCBjYikge1xuICAgICAgbWF0Y2hlcy5wdXNoKFtjb21wb25lbnRzLCBjYl0pXG4gICAgICByZXR1cm4gbWF0Y2goY29tcG9uZW50cywgY2IpXG4gICAgfVxuXG4gICAgcmV0dXJuIGFjdGlvblxuICB9XG5cbiAgQ3VzdG9tQ29tcG9uZW50LmNyZWF0ZUFjdGlvbiA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciBkZWxlZ2F0b3IgPSBkZWxlZ2F0ZSh7ZWxlbWVudDogd2luZG93LCBldmVudDogZXZlbnR9KVxuICAgIHZhciBhY3Rpb24gPSB7fVxuICAgIGFjdGlvbi5tYXRjaCA9IGZ1bmN0aW9uIChjb21wb25lbnRzLCBjYikge1xuXG4gICAgICBpZiAoIWNiKSB7XG4gICAgICAgIGNiID0gY29tcG9uZW50c1xuICAgICAgICBjb21wb25lbnRzID0gW11cbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRzID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgY29tcG9uZW50cyA9IFtjb21wb25lbnRzXVxuICAgICAgfVxuXG4gICAgICB2YXIgc2VsZWN0b3JzID0gY29tcG9uZW50cy5tYXAoZnVuY3Rpb24gKGNvbXBvbmVudCkge1xuICAgICAgICBpZiAoY29tcG9uZW50WzBdID09IFwiOlwiKSB7XG4gICAgICAgICAgY29tcG9uZW50ID0gY29tcG9uZW50TmFtZStjb21wb25lbnRcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaG9vay5zZWxlY3Rvcihjb21wb25lbnQsIFwifj1cIilcbiAgICAgIH0pXG4gICAgICBzZWxlY3RvcnMudW5zaGlmdChob29rLnNlbGVjdG9yKGNvbXBvbmVudE5hbWUsIFwifj1cIikpXG5cbiAgICAgIGRlbGVnYXRvci5tYXRjaChzZWxlY3RvcnMsIGZ1bmN0aW9uIChlLCBtYWluKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IHN0b3JhZ2UuZ2V0KG1haW4sIGNvbXBvbmVudE5hbWUpIHx8IG1haW5cbiAgICAgICAgdmFyIGluc3RhbmNlQ29tcG9uZW50cyA9IGluc3RhbmNlLmNvbXBvbmVudHNcbiAgICAgICAgdmFyIGFyZ3MgPSBbZV07XG5cbiAgICAgICAgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQsIGkpIHtcbiAgICAgICAgICB2YXIgbmFtZSA9IGNvbXBvbmVudHNbaV1cbiAgICAgICAgICBuYW1lID0gbmFtZVswXSA9PSBcIjpcIiA/IG5hbWUuc3Vic3RyKDEpIDogbmFtZVxuICAgICAgICAgIHZhciBwcm9wZXJ0eU5hbWUgPSBjYW1lbGNhc2UobmFtZSlcbiAgICAgICAgICB2YXIgYXJnXG5cbiAgICAgICAgICBpZiAoaW5zdGFuY2VDb21wb25lbnRzICYmIGluc3RhbmNlQ29tcG9uZW50cy5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eU5hbWUpKSB7XG4gICAgICAgICAgICBhcmcgPSBpbnN0YW5jZS5jb21wb25lbnRzW3Byb3BlcnR5TmFtZV1cbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgICAgICAgICAgYXJnLnNvbWUoZnVuY3Rpb24gKG1lbWJlcikge1xuICAgICAgICAgICAgICAgIGlmIChtZW1iZXIgPT0gZWxlbWVudCB8fCBtZW1iZXIuZWxlbWVudCA9PSBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICBhcmcgPSBtZW1iZXJcbiAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGFyZyA9IHN0b3JhZ2UuZ2V0KGVsZW1lbnQsIG5hbWUpIHx8IGVsZW1lbnRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhcmdzLnB1c2goYXJnKVxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBjYi5hcHBseShpbnN0YW5jZSwgYXJncylcbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBhY3Rpb25cbiAgICB9XG4gICAgcmV0dXJuIGFjdGlvblxuICB9XG5cbiAgQ3VzdG9tQ29tcG9uZW50LmV2ZW50ID0gZnVuY3Rpb24gKHR5cGUsIGRlZmluaXRpb24pIHtcbiAgICBfZXZlbnRzW3R5cGVdID0gZGVmaW5pdGlvblxuICAgIHJldHVybiBDdXN0b21Db21wb25lbnRcbiAgfVxuXG4gIEN1c3RvbUNvbXBvbmVudC5nZXRFdmVudERlZmluaXRpb24gPSBmdW5jdGlvbiAodHlwZSwgZGV0YWlsKSB7XG4gICAgdmFyIGRlZmluaXRpb24gPSBtZXJnZShkZWZhdWx0RXZlbnREZWZpbml0aW9uLCBfZXZlbnRzW3R5cGVdKVxuICAgIGRlZmluaXRpb24uZGV0YWlsID0gdHlwZW9mIGRldGFpbCA9PSBcInVuZGVmaW5lZFwiID8gZGVmaW5pdGlvbi5kZXRhaWwgOiBkZXRhaWxcbiAgICByZXR1cm4gZGVmaW5pdGlvblxuICB9XG5cbiAgQ3VzdG9tQ29tcG9uZW50LnJlc2V0QXR0cmlidXRlcyA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgIGlmICghaW5zdGFuY2UuZWxlbWVudCkgcmV0dXJuXG5cbiAgICB2YXIgYXR0cmlidXRlXG4gICAgdmFyIHZhbHVlXG4gICAgZm9yICh2YXIgbmFtZSBpbiBfYXR0cmlidXRlcykge1xuICAgICAgaWYgKF9hdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgIGF0dHJpYnV0ZSA9IF9hdHRyaWJ1dGVzW25hbWVdXG4gICAgICAgIHZhbHVlID0gYXR0cmlidXRlLmdldC5jYWxsKGluc3RhbmNlLCBmYWxzZSlcbiAgICAgICAgaWYgKGF0dHJpYnV0ZS5oYXNEZWZhdWx0ICYmICFhdHRyaWJ1dGUuaGFzLmNhbGwoaW5zdGFuY2UsIHZhbHVlKSkge1xuICAgICAgICAgIGF0dHJpYnV0ZS5zZXQuY2FsbChpbnN0YW5jZSwgYXR0cmlidXRlLmRlZmF1bHRWYWx1ZSwgZmFsc2UpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBDdXN0b21Db21wb25lbnQuYXR0cmlidXRlID0gZnVuY3Rpb24gKG5hbWUsIGRlZikge1xuICAgIGlmIChkZWYgPT0gbnVsbCkge1xuICAgICAgZGVmID0ge31cbiAgICB9XG5cbiAgICB2YXIgdHlwZU9mRGVmID0gdHlwZW9mIGRlZlxuICAgIHZhciB0eXBlXG4gICAgdmFyIGRlZmF1bHRWYWx1ZVxuICAgIHZhciBnZXR0ZXJcbiAgICB2YXIgc2V0dGVyXG4gICAgdmFyIG9uY2hhbmdlXG4gICAgdmFyIHByb3BlcnR5ID0gY2FtZWxjYXNlKG5hbWUpXG5cbiAgICBzd2l0Y2ggKHR5cGVPZkRlZikge1xuICAgICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgLy8gdGhlIGRlZmluaXRpb24gaXMgYSBwcmltaXRpdmUgdmFsdWVcbiAgICAgICAgdHlwZSA9IHR5cGVPZkRlZlxuICAgICAgICBkZWZhdWx0VmFsdWUgPSBkZWZcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgXCJvYmplY3RcIjpcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIG9yIGEgZGVmaW5pdGlvbiBvYmplY3RcbiAgICAgICAgZGVmYXVsdFZhbHVlID0gdHlwZW9mIGRlZltcImRlZmF1bHRcIl0gPT0gXCJ1bmRlZmluZWRcIiA/IG51bGwgOiBkZWZbXCJkZWZhdWx0XCJdXG4gICAgICAgIGlmICh0eXBlb2YgZGVmW1widHlwZVwiXSA9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgaWYgKGRlZmF1bHRWYWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICB0eXBlID0gXCJzdHJpbmdcIlxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlb2YgZGVmYXVsdFZhbHVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHR5cGUgPSBkZWZbXCJ0eXBlXCJdXG4gICAgICAgIH1cbiAgICAgICAgZ2V0dGVyID0gZGVmW1wiZ2V0XCJdXG4gICAgICAgIHNldHRlciA9IGRlZltcInNldFwiXVxuICAgICAgICBvbmNoYW5nZSA9IGRlZltcIm9uY2hhbmdlXCJdXG4gICAgfVxuXG4gICAgdmFyIHBhcnNlVmFsdWVcbiAgICB2YXIgc3RyaW5naWZ5VmFsdWVcbiAgICB2YXIgaGFzXG5cbiAgICBoYXMgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHZhbHVlICE9IG51bGwgfVxuXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgICBoYXMgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHZhbHVlICE9PSBmYWxzZSB9XG4gICAgICAgIHBhcnNlVmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHZhbHVlICE9IG51bGwgfVxuICAgICAgICBzdHJpbmdpZnlWYWx1ZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIFwiXCIgfVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICBwYXJzZVZhbHVlID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB2YWx1ZSA9PSBudWxsID8gbnVsbCA6IHBhcnNlSW50KHZhbHVlLCAxMCkgfVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSBcImZsb2F0XCI6XG4gICAgICAgIHBhcnNlVmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHZhbHVlID09IG51bGwgPyBudWxsIDogcGFyc2VGbG9hdCh2YWx1ZSkgfVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgc3RyaW5naWZ5VmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHZhbHVlID09IG51bGwgPyBudWxsIDogdmFsdWUgPyBcIlwiK3ZhbHVlIDogXCJcIiB9XG4gICAgfVxuXG4gICAgX2F0dHJpYnV0ZXNbcHJvcGVydHldID0ge1xuICAgICAgZ2V0OiBnZXQsXG4gICAgICBzZXQ6IHNldCxcbiAgICAgIGhhczogaGFzLFxuICAgICAgZGVmYXVsdFZhbHVlOiBkZWZhdWx0VmFsdWUsXG4gICAgICBoYXNEZWZhdWx0OiBkZWZhdWx0VmFsdWUgIT0gbnVsbFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldCh1c2VEZWZhdWx0KSB7XG4gICAgICB2YXIgdmFsdWUgPSB0aGlzLmVsZW1lbnQuZ2V0QXR0cmlidXRlKG5hbWUpXG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCAmJiB1c2VEZWZhdWx0ID09IHRydWUpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZVxuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnNlVmFsdWUgPyBwYXJzZVZhbHVlKHZhbHVlKSA6IHZhbHVlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0KHZhbHVlLCBjYWxsT25jaGFuZ2UpIHtcbiAgICAgIHZhciBvbGQgPSBnZXQuY2FsbCh0aGlzLCBmYWxzZSlcbiAgICAgIGlmICghaGFzKHZhbHVlKSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvbGQgPT09IHZhbHVlKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBuZXdWYWx1ZSA9IHN0cmluZ2lmeVZhbHVlID8gc3RyaW5naWZ5VmFsdWUodmFsdWUpIDogdmFsdWVcbiAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCBuZXdWYWx1ZSlcbiAgICAgIH1cbiAgICAgIG9uY2hhbmdlICYmIGNhbGxPbmNoYW5nZSAhPSBmYWxzZSAmJiBvbmNoYW5nZS5jYWxsKHRoaXMsIG9sZCwgdmFsdWUpXG4gICAgfVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvdHlwZSwgcHJvcGVydHksIHtcbiAgICAgIGdldDogZ2V0dGVyIHx8IGdldCxcbiAgICAgIHNldDogc2V0dGVyIHx8IHNldFxuICAgIH0pXG5cbiAgICByZXR1cm4gQ3VzdG9tQ29tcG9uZW50XG4gIH1cblxuICByZXR1cm4gQ3VzdG9tQ29tcG9uZW50XG59XG4iLCJ2YXIgQ29tcG9uZW50ID0gcmVxdWlyZShcIi4vQ29tcG9uZW50XCIpXG52YXIgaG9vayA9IHJlcXVpcmUoXCIuL2hvb2tcIilcblxubW9kdWxlLmV4cG9ydHMgPSBjb21wb25lbnRcblxuZnVuY3Rpb24gY29tcG9uZW50IChuYW1lLCByb290LCBvcHRpb25zKSB7XG4gIC8vIGNvbXBvbmVudChcInN0cmluZ1wiWywge31dKVxuICBpZiAoIShyb290IGluc3RhbmNlb2YgRWxlbWVudCkpIHtcbiAgICBvcHRpb25zID0gcm9vdFxuICAgIHJvb3QgPSBudWxsXG4gIH1cbiAgdmFyIGVsZW1lbnQgPSBob29rLmZpbmRDb21wb25lbnQobmFtZSwgcm9vdClcblxuICByZXR1cm4gQ29tcG9uZW50LmNyZWF0ZShuYW1lLCBlbGVtZW50LCBvcHRpb25zKVxufVxuXG5jb21wb25lbnQuYWxsID0gZnVuY3Rpb24gKG5hbWUsIHJvb3QsIG9wdGlvbnMpIHtcbiAgLy8gY29tcG9uZW50KFwic3RyaW5nXCJbLCB7fV0pXG4gIGlmICghKHJvb3QgaW5zdGFuY2VvZiBFbGVtZW50KSkge1xuICAgIG9wdGlvbnMgPSByb290XG4gICAgcm9vdCA9IG51bGxcbiAgfVxuICAvLyBjb21wb25lbnQoXCJzdHJpbmdcIlssIEVsZW1lbnRdKVxuICB2YXIgZWxlbWVudHMgPSBob29rLmZpbmRBbGxDb21wb25lbnRzKG5hbWUsIHJvb3QpXG5cbiAgcmV0dXJuIFtdLm1hcC5jYWxsKGVsZW1lbnRzLCBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgIHJldHVybiBDb21wb25lbnQuY3JlYXRlKG5hbWUsIGVsZW1lbnQsIG9wdGlvbnMpXG4gIH0pXG59XG4iLCIvKipcbiAqIFJlZ2lzdGVycyBhbiBldmVudCBsaXN0ZW5lciBvbiBhbiBlbGVtZW50XG4gKiBhbmQgcmV0dXJucyBhIGRlbGVnYXRvci5cbiAqIEEgZGVsZWdhdGVkIGV2ZW50IHJ1bnMgbWF0Y2hlcyB0byBmaW5kIGFuIGV2ZW50IHRhcmdldCxcbiAqIHRoZW4gZXhlY3V0ZXMgdGhlIGhhbmRsZXIgcGFpcmVkIHdpdGggdGhlIG1hdGNoZXIuXG4gKiBNYXRjaGVycyBjYW4gY2hlY2sgaWYgYW4gZXZlbnQgdGFyZ2V0IG1hdGNoZXMgYSBnaXZlbiBzZWxlY3RvcixcbiAqIG9yIHNlZSBpZiBhbiBvZiBpdHMgcGFyZW50cyBkby5cbiAqICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlbGVnYXRlKCBvcHRpb25zICl7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnRcbiAgICAgICAgLCBldmVudCA9IG9wdGlvbnMuZXZlbnRcbiAgICAgICAgLCBjYXB0dXJlID0gISFvcHRpb25zLmNhcHR1cmV8fGZhbHNlXG4gICAgICAgICwgY29udGV4dCA9IG9wdGlvbnMuY29udGV4dHx8ZWxlbWVudFxuXG4gICAgaWYoICFlbGVtZW50ICl7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQ2FuJ3QgZGVsZWdhdGUgdW5kZWZpbmVkIGVsZW1lbnRcIilcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgaWYoICFldmVudCApe1xuICAgICAgICBjb25zb2xlLmxvZyhcIkNhbid0IGRlbGVnYXRlIHVuZGVmaW5lZCBldmVudFwiKVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH1cblxuICAgIHZhciBkZWxlZ2F0b3IgPSBjcmVhdGVEZWxlZ2F0b3IoY29udGV4dClcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGRlbGVnYXRvciwgY2FwdHVyZSlcblxuICAgIHJldHVybiBkZWxlZ2F0b3Jcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgZGVsZWdhdG9yIHRoYXQgY2FuIGJlIHVzZWQgYXMgYW4gZXZlbnQgbGlzdGVuZXIuXG4gKiBUaGUgZGVsZWdhdG9yIGhhcyBzdGF0aWMgbWV0aG9kcyB3aGljaCBjYW4gYmUgdXNlZCB0byByZWdpc3RlciBoYW5kbGVycy5cbiAqICovXG5mdW5jdGlvbiBjcmVhdGVEZWxlZ2F0b3IoIGNvbnRleHQgKXtcbiAgICB2YXIgbWF0Y2hlcnMgPSBbXVxuXG4gICAgZnVuY3Rpb24gZGVsZWdhdG9yKCBlICl7XG4gICAgICAgIHZhciBsID0gbWF0Y2hlcnMubGVuZ3RoXG4gICAgICAgIGlmKCAhbCApe1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlbCA9IHRoaXNcbiAgICAgICAgICAgICwgaSA9IC0xXG4gICAgICAgICAgICAsIGhhbmRsZXJcbiAgICAgICAgICAgICwgc2VsZWN0b3JcbiAgICAgICAgICAgICwgZGVsZWdhdGVFbGVtZW50XG4gICAgICAgICAgICAsIHN0b3BQcm9wYWdhdGlvblxuICAgICAgICAgICAgLCBhcmdzXG5cbiAgICAgICAgd2hpbGUoICsraSA8IGwgKXtcbiAgICAgICAgICAgIGFyZ3MgPSBtYXRjaGVyc1tpXVxuICAgICAgICAgICAgaGFuZGxlciA9IGFyZ3NbMF1cbiAgICAgICAgICAgIHNlbGVjdG9yID0gYXJnc1sxXVxuXG4gICAgICAgICAgICBkZWxlZ2F0ZUVsZW1lbnQgPSBtYXRjaENhcHR1cmVQYXRoKHNlbGVjdG9yLCBlbCwgZSlcbiAgICAgICAgICAgIGlmKCBkZWxlZ2F0ZUVsZW1lbnQgJiYgZGVsZWdhdGVFbGVtZW50Lmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICBzdG9wUHJvcGFnYXRpb24gPSBmYWxzZSA9PT0gaGFuZGxlci5hcHBseShjb250ZXh0LCBbZV0uY29uY2F0KGRlbGVnYXRlRWxlbWVudCkpXG4gICAgICAgICAgICAgICAgaWYoIHN0b3BQcm9wYWdhdGlvbiApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcnMgYSBoYW5kbGVyIHdpdGggYSB0YXJnZXQgZmluZGVyIGxvZ2ljXG4gICAgICogKi9cbiAgICBkZWxlZ2F0b3IubWF0Y2ggPSBmdW5jdGlvbiggc2VsZWN0b3IsIGhhbmRsZXIgKXtcbiAgICAgICAgbWF0Y2hlcnMucHVzaChbaGFuZGxlciwgc2VsZWN0b3JdKVxuICAgICAgICByZXR1cm4gZGVsZWdhdG9yXG4gICAgfVxuXG4gICAgcmV0dXJuIGRlbGVnYXRvclxufVxuXG5mdW5jdGlvbiBtYXRjaENhcHR1cmVQYXRoKCBzZWxlY3RvciwgZWwsIGUgKXtcbiAgICB2YXIgZGVsZWdhdGVFbGVtZW50cyA9IFtdXG4gICAgdmFyIGRlbGVnYXRlRWxlbWVudCA9IG51bGxcbiAgICBpZiggQXJyYXkuaXNBcnJheShzZWxlY3RvcikgKXtcbiAgICAgICAgdmFyIGkgPSAtMVxuICAgICAgICB2YXIgbCA9IHNlbGVjdG9yLmxlbmd0aFxuICAgICAgICB3aGlsZSggKytpIDwgbCApe1xuICAgICAgICAgICAgZGVsZWdhdGVFbGVtZW50ID0gZmluZFBhcmVudChzZWxlY3RvcltpXSwgZWwsIGUpXG4gICAgICAgICAgICBpZiggIWRlbGVnYXRlRWxlbWVudCApIHJldHVybiBudWxsXG4gICAgICAgICAgICBkZWxlZ2F0ZUVsZW1lbnRzLnB1c2goZGVsZWdhdGVFbGVtZW50KVxuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBkZWxlZ2F0ZUVsZW1lbnQgPSBmaW5kUGFyZW50KHNlbGVjdG9yLCBlbCwgZSlcbiAgICAgICAgaWYoICFkZWxlZ2F0ZUVsZW1lbnQgKSByZXR1cm4gbnVsbFxuICAgICAgICBkZWxlZ2F0ZUVsZW1lbnRzLnB1c2goZGVsZWdhdGVFbGVtZW50KVxuICAgIH1cbiAgICByZXR1cm4gZGVsZWdhdGVFbGVtZW50c1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoZSB0YXJnZXQgb3IgYW55IG9mIGl0cyBwYXJlbnQgbWF0Y2hlcyBhIHNlbGVjdG9yXG4gKiAqL1xuZnVuY3Rpb24gZmluZFBhcmVudCggc2VsZWN0b3IsIGVsLCBlICl7XG4gICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0XG4gICAgc3dpdGNoKCB0eXBlb2Ygc2VsZWN0b3IgKXtcbiAgICAgICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICAgICAgd2hpbGUoIHRhcmdldCAmJiB0YXJnZXQgIT0gZWwgKXtcbiAgICAgICAgICAgICAgICBpZiggdGFyZ2V0Lm1hdGNoZXMgJiYgdGFyZ2V0Lm1hdGNoZXMoc2VsZWN0b3IpICkgcmV0dXJuIHRhcmdldFxuICAgICAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIFwiZnVuY3Rpb25cIjpcbiAgICAgICAgICAgIHdoaWxlKCB0YXJnZXQgJiYgdGFyZ2V0ICE9IGVsICl7XG4gICAgICAgICAgICAgICAgaWYoIHNlbGVjdG9yLmNhbGwoZWwsIHRhcmdldCkgKSByZXR1cm4gdGFyZ2V0XG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgICByZXR1cm4gbnVsbFxufVxuIiwidmFyIG1lcmdlID0gcmVxdWlyZShcIi4uL3V0aWwvbWVyZ2VcIilcblxubW9kdWxlLmV4cG9ydHMgPSBmcmFnbWVudFxuXG5mcmFnbWVudC5vcHRpb25zID0ge1xuICB2YXJpYWJsZTogXCJmXCJcbn1cblxuZnVuY3Rpb24gZnJhZ21lbnQoIGh0bWwsIGNvbXBpbGVyLCBjb21waWxlck9wdGlvbnMgKXtcbiAgY29tcGlsZXJPcHRpb25zID0gbWVyZ2UoZnJhZ21lbnQub3B0aW9ucywgY29tcGlsZXJPcHRpb25zKVxuICB2YXIgcmVuZGVyID0gbnVsbFxuICByZXR1cm4gZnVuY3Rpb24oIHRlbXBsYXRlRGF0YSApe1xuICAgIHZhciB0ZW1wID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICBpZiggdHlwZW9mIGNvbXBpbGVyID09IFwiZnVuY3Rpb25cIiAmJiAhcmVuZGVyICl7XG4gICAgICByZW5kZXIgPSBjb21waWxlcihodG1sLCBjb21waWxlck9wdGlvbnMpXG4gICAgfVxuICAgIGlmKCByZW5kZXIgKXtcbiAgICAgIHRyeXtcbiAgICAgICAgaHRtbCA9IHJlbmRlcih0ZW1wbGF0ZURhdGEpXG4gICAgICB9XG4gICAgICBjYXRjaCggZSApe1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgcmVuZGVyaW5nIGZyYWdtZW50IHdpdGggY29udGV4dDpcIiwgdGVtcGxhdGVEYXRhKVxuICAgICAgICBjb25zb2xlLmVycm9yKHJlbmRlci50b1N0cmluZygpKVxuICAgICAgICBjb25zb2xlLmVycm9yKGUpXG4gICAgICAgIHRocm93IGVcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0ZW1wLmlubmVySFRNTCA9IGh0bWxcbiAgICB2YXIgZnJhZ21lbnQgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG4gICAgd2hpbGUoIHRlbXAuY2hpbGROb2Rlcy5sZW5ndGggKXtcbiAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHRlbXAuZmlyc3RDaGlsZClcbiAgICB9XG4gICAgcmV0dXJuIGZyYWdtZW50XG4gIH1cbn1cbmZyYWdtZW50LnJlbmRlciA9IGZ1bmN0aW9uKCBodG1sLCB0ZW1wbGF0ZURhdGEgKXtcbiAgcmV0dXJuIGZyYWdtZW50KGh0bWwpKHRlbXBsYXRlRGF0YSlcbn1cbiIsInZhciBjYW1lbGNhc2UgPSByZXF1aXJlKFwiY2FtZWxjYXNlXCIpXG52YXIgQ09NUE9ORU5UX0FUVFJJQlVURSA9IFwiZGF0YS1jb21wb25lbnRcIlxuXG52YXIgaG9vayA9IG1vZHVsZS5leHBvcnRzID0ge31cblxuaG9vay5zZXRIb29rQXR0cmlidXRlID0gc2V0SG9va0F0dHJpYnV0ZVxuaG9vay5zZWxlY3RvciA9IHNlbGVjdG9yXG5ob29rLmZpbmRDb21wb25lbnQgPSBmaW5kQ29tcG9uZW50XG5ob29rLmZpbmRBbGxDb21wb25lbnRzID0gZmluZEFsbENvbXBvbmVudHNcbmhvb2suZmluZFN1YkNvbXBvbmVudHMgPSBmaW5kU3ViQ29tcG9uZW50c1xuaG9vay5nZXRDb21wb25lbnROYW1lID0gZ2V0Q29tcG9uZW50TmFtZVxuaG9vay5nZXRNYWluQ29tcG9uZW50TmFtZSA9IGdldE1haW5Db21wb25lbnROYW1lXG5ob29rLmdldFN1YkNvbXBvbmVudE5hbWUgPSBnZXRTdWJDb21wb25lbnROYW1lXG5ob29rLmFzc2lnblN1YkNvbXBvbmVudHMgPSBhc3NpZ25TdWJDb21wb25lbnRzXG5ob29rLmZpbHRlciA9IGZpbHRlclxuXG5mdW5jdGlvbiBzZXRIb29rQXR0cmlidXRlIChob29rKSB7XG4gIENPTVBPTkVOVF9BVFRSSUJVVEUgPSBob29rXG59XG5cbmZ1bmN0aW9uIHNlbGVjdG9yIChuYW1lLCBvcGVyYXRvciwgZXh0cmEpIHtcbiAgbmFtZSA9IG5hbWUgJiYgJ1wiJyArIG5hbWUgKyAnXCInXG4gIG9wZXJhdG9yID0gbmFtZSA/IG9wZXJhdG9yIHx8IFwiPVwiIDogXCJcIlxuICBleHRyYSA9IGV4dHJhIHx8IFwiXCJcbiAgcmV0dXJuIFwiW1wiICsgQ09NUE9ORU5UX0FUVFJJQlVURSArIG9wZXJhdG9yICsgbmFtZSArIFwiXVwiICsgZXh0cmFcbn1cblxuZnVuY3Rpb24gZmluZCAoc2VsZWN0b3IsIHJvb3QpIHtcbiAgcmV0dXJuIChyb290IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKVxufVxuXG5mdW5jdGlvbiBmaW5kQWxsIChzZWxlY3Rvciwgcm9vdCkge1xuICByZXR1cm4gKHJvb3QgfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG59XG5cbmZ1bmN0aW9uIGZpbmRDb21wb25lbnQgKG5hbWUsIHJvb3QpIHtcbiAgcmV0dXJuIGZpbmQoc2VsZWN0b3IobmFtZSksIHJvb3QpXG59XG5cbmZ1bmN0aW9uIGZpbmRBbGxDb21wb25lbnRzIChuYW1lLCByb290KSB7XG4gIHJldHVybiBbXS5zbGljZS5jYWxsKGZpbmRBbGwoc2VsZWN0b3IobmFtZSksIHJvb3QpKVxufVxuXG5mdW5jdGlvbiBnZXRDb21wb25lbnROYW1lIChlbGVtZW50LCBjYykge1xuICBpZiAoIWVsZW1lbnQpIHJldHVybiBcIlwiXG4gIGNjID0gY2MgPT0gdW5kZWZpbmVkIHx8IGNjXG4gIHZhciB2YWx1ZSA9IHR5cGVvZiBlbGVtZW50ID09IFwic3RyaW5nXCIgPyBlbGVtZW50IDogZWxlbWVudC5nZXRBdHRyaWJ1dGUoQ09NUE9ORU5UX0FUVFJJQlVURSkgfHwgXCJcIlxuICByZXR1cm4gY2MgPyBjYW1lbGNhc2UodmFsdWUpIDogdmFsdWVcbn1cblxuZnVuY3Rpb24gZ2V0TWFpbkNvbXBvbmVudE5hbWUgKGVsZW1lbnQsIGNjKSB7XG4gIGNjID0gY2MgPT0gdW5kZWZpbmVkIHx8IGNjXG4gIHZhciB2YWx1ZSA9IGdldENvbXBvbmVudE5hbWUoZWxlbWVudCwgZmFsc2UpLnNwbGl0KFwiOlwiKVxuICB2YWx1ZSA9IHZhbHVlWzBdIHx8IFwiXCJcbiAgcmV0dXJuIGNjICYmIHZhbHVlID8gY2FtZWxjYXNlKHZhbHVlKSA6IHZhbHVlXG59XG5cbmZ1bmN0aW9uIGdldFN1YkNvbXBvbmVudE5hbWUgKGVsZW1lbnQsIGNjKSB7XG4gIGNjID0gY2MgPT0gdW5kZWZpbmVkIHx8IGNjXG4gIHZhciB2YWx1ZSA9IGdldENvbXBvbmVudE5hbWUoZWxlbWVudCwgZmFsc2UpLnNwbGl0KFwiOlwiKVxuICB2YWx1ZSA9IHZhbHVlWzFdIHx8IFwiXCJcbiAgcmV0dXJuIGNjICYmIHZhbHVlID8gY2FtZWxjYXNlKHZhbHVlKSA6IHZhbHVlXG59XG5cbmZ1bmN0aW9uIGdldENvbXBvbmVudE5hbWVMaXN0IChlbGVtZW50LCBjYykge1xuICByZXR1cm4gZ2V0Q29tcG9uZW50TmFtZShlbGVtZW50LCBjYykuc3BsaXQoL1xccysvKVxufVxuXG5mdW5jdGlvbiBmaW5kU3ViQ29tcG9uZW50cyAobWFpbk5hbWUsIHJvb3QpIHtcbiAgdmFyIGVsZW1lbnRzID0gZmluZEFsbChzZWxlY3RvcihtYWluTmFtZStcIjpcIiwgXCIqPVwiKSwgcm9vdClcbiAgcmV0dXJuIGZpbHRlcihlbGVtZW50cywgZnVuY3Rpb24gKGVsZW1lbnQsIGNvbXBvbmVudE5hbWUpIHtcbiAgICByZXR1cm4gZ2V0Q29tcG9uZW50TmFtZUxpc3QoY29tcG9uZW50TmFtZSwgZmFsc2UpLnNvbWUoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgIHJldHVybiBnZXRNYWluQ29tcG9uZW50TmFtZShuYW1lLCBmYWxzZSkgPT0gbWFpbk5hbWUgJiYgZ2V0U3ViQ29tcG9uZW50TmFtZShuYW1lKVxuICAgIH0pXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGFzc2lnblN1YkNvbXBvbmVudHMgKG9iaiwgc3ViQ29tcG9uZW50cywgdHJhbnNmb3JtLCBhc3NpZ24pIHtcbiAgcmV0dXJuIHN1YkNvbXBvbmVudHMucmVkdWNlKGZ1bmN0aW9uIChvYmosIGVsZW1lbnQpIHtcbiAgICBnZXRDb21wb25lbnROYW1lTGlzdChlbGVtZW50LCBmYWxzZSkuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgdmFyIHN1Yk5hbWUgPSBnZXRTdWJDb21wb25lbnROYW1lKG5hbWUsIHRydWUpXG4gICAgICBlbGVtZW50ID0gdHlwZW9mIHRyYW5zZm9ybSA9PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgICA/IHRyYW5zZm9ybShlbGVtZW50LCBuYW1lKVxuICAgICAgICAgIDogZWxlbWVudFxuICAgICAgaWYgKHR5cGVvZiBhc3NpZ24gPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGFzc2lnbihvYmosIHN1Yk5hbWUsIGVsZW1lbnQpXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9ialtzdWJOYW1lXSkpIHtcbiAgICAgICAgb2JqW3N1Yk5hbWVdLnB1c2goZWxlbWVudClcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBvYmpbc3ViTmFtZV0gPSBlbGVtZW50XG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gb2JqXG4gIH0sIG9iailcbn1cblxuZnVuY3Rpb24gZmlsdGVyIChlbGVtZW50cywgZmlsdGVyKSB7XG4gIHN3aXRjaCAodHlwZW9mIGZpbHRlcikge1xuICAgIGNhc2UgXCJmdW5jdGlvblwiOlxuICAgICAgcmV0dXJuIFtdLnNsaWNlLmNhbGwoZWxlbWVudHMpLmZpbHRlcihmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZmlsdGVyKGVsZW1lbnQsIGdldENvbXBvbmVudE5hbWUoZWxlbWVudCwgZmFsc2UpKVxuICAgICAgfSlcbiAgICAgIGJyZWFrXG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgcmV0dXJuIFtdLnNsaWNlLmNhbGwoZWxlbWVudHMpLmZpbHRlcihmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZ2V0Q29tcG9uZW50TmFtZShlbGVtZW50KSA9PT0gZmlsdGVyXG4gICAgICB9KVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIG51bGxcbiAgfVxufVxuIiwidmFyIHJlZ2lzdHJ5ID0gcmVxdWlyZShcIi4vcmVnaXN0cnlcIilcbnZhciBDb21wb25lbnQgPSByZXF1aXJlKFwiLi9Db21wb25lbnRcIilcbnZhciBJbnRlcm5hbHMgPSByZXF1aXJlKFwiLi9JbnRlcm5hbHNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiByZWdpc3RlciAobmFtZSwgbWl4aW4pIHtcbiAgbWl4aW4gPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcblxuICBmdW5jdGlvbiBDdXN0b21Db21wb25lbnQgKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ3VzdG9tQ29tcG9uZW50KSkge1xuICAgICAgcmV0dXJuIG5ldyBDdXN0b21Db21wb25lbnQoZWxlbWVudCwgb3B0aW9ucylcbiAgICB9XG4gICAgdmFyIGluc3RhbmNlID0gdGhpc1xuXG4gICAgdGhpcy5uYW1lID0gbmFtZVxuXG4gICAgQ29tcG9uZW50LmNhbGwoaW5zdGFuY2UsIGVsZW1lbnQsIG9wdGlvbnMpXG4gICAgLy8gYXQgdGhpcyBwb2ludCBjdXN0b20gY29uc3RydWN0b3JzIGNhbiBhbHJlYWR5IGFjY2VzcyB0aGUgZWxlbWVudCBhbmQgc3ViIGNvbXBvbmVudHNcbiAgICAvLyBzbyB0aGV5IG9ubHkgcmVjZWl2ZSB0aGUgb3B0aW9ucyBvYmplY3QgZm9yIGNvbnZlbmllbmNlXG4gICAgQ3VzdG9tQ29tcG9uZW50LmNyZWF0ZShpbnN0YW5jZSwgW29wdGlvbnNdKVxuICB9XG5cbiAgSW50ZXJuYWxzKEN1c3RvbUNvbXBvbmVudCwgbmFtZSlcbiAgQ3VzdG9tQ29tcG9uZW50LmV4dGVuZChDb21wb25lbnQpXG4gIEN1c3RvbUNvbXBvbmVudC5hdXRvQXNzaWduID0gdHJ1ZVxuICBtaXhpbi5mb3JFYWNoKGZ1bmN0aW9uIChtaXhpbikge1xuICAgIGlmICh0eXBlb2YgbWl4aW4gPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBpZiAobWl4aW4uY29tcG9uZW50TmFtZSkge1xuICAgICAgICBDdXN0b21Db21wb25lbnQuZXh0ZW5kKG1peGluKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIG1peGluLmNhbGwoQ3VzdG9tQ29tcG9uZW50LnByb3RvdHlwZSwgQ3VzdG9tQ29tcG9uZW50KVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIEN1c3RvbUNvbXBvbmVudC5wcm90byhtaXhpbilcbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIHJlZ2lzdHJ5LnNldChuYW1lLCBDdXN0b21Db21wb25lbnQpXG59XG4iLCJ2YXIgcmVnaXN0cnkgPSBtb2R1bGUuZXhwb3J0cyA9IHt9XG5cbnZhciBjb21wb25lbnRzID0ge31cblxucmVnaXN0cnkuZ2V0ID0gZnVuY3Rpb24gZXhpc3RzIChuYW1lKSB7XG4gIHJldHVybiBjb21wb25lbnRzW25hbWVdXG59XG5cbnJlZ2lzdHJ5LmV4aXN0cyA9IGZ1bmN0aW9uIGV4aXN0cyAobmFtZSkge1xuICByZXR1cm4gISFjb21wb25lbnRzW25hbWVdXG59XG5cbnJlZ2lzdHJ5LnNldCA9IGZ1bmN0aW9uIGV4aXN0cyAobmFtZSwgQ29tcG9uZW50Q29uc3RydWN0b3IpIHtcbiAgcmV0dXJuIGNvbXBvbmVudHNbbmFtZV0gPSBDb21wb25lbnRDb25zdHJ1Y3RvclxufVxuIiwidmFyIGhvb2sgPSByZXF1aXJlKFwiLi9ob29rXCIpXG52YXIgY2FtZWxjYXNlID0gcmVxdWlyZShcImNhbWVsY2FzZVwiKVxuXG52YXIgc3RvcmFnZSA9IG1vZHVsZS5leHBvcnRzID0ge31cbnZhciBjb21wb25lbnRzID0gW11cbnZhciBlbGVtZW50cyA9IFtdXG52YXIgY291bnRlciA9IDBcblxuZnVuY3Rpb24gY3JlYXRlUHJvcGVydHkgKGNvbXBvbmVudE5hbWUpIHtcbiAgcmV0dXJuIGNhbWVsY2FzZShjb21wb25lbnROYW1lK1wiLWlkXCIpXG59XG5cbmZ1bmN0aW9uIGdldElkIChlbGVtZW50LCBjb21wb25lbnROYW1lKSB7XG4gIHJldHVybiBlbGVtZW50LmRhdGFzZXRbY3JlYXRlUHJvcGVydHkoY29tcG9uZW50TmFtZSldXG59XG5cbmZ1bmN0aW9uIHNldElkIChlbGVtZW50LCBjb21wb25lbnROYW1lLCBpZCkge1xuICBlbGVtZW50LmRhdGFzZXRbY3JlYXRlUHJvcGVydHkoY29tcG9uZW50TmFtZSldID0gaWRcbn1cblxuZnVuY3Rpb24gaGFzSWQgKGVsZW1lbnQsIGNvbXBvbmVudE5hbWUpIHtcbiAgcmV0dXJuICEhKGVsZW1lbnQuZGF0YXNldFtjcmVhdGVQcm9wZXJ0eShjb21wb25lbnROYW1lKV0pXG59XG5cbmZ1bmN0aW9uIHJlbW92ZUlkIChlbGVtZW50LCBjb21wb25lbnROYW1lKSB7XG4gIGlmIChoYXNJZChlbGVtZW50LCBjb21wb25lbnROYW1lKSkge1xuICAgIGRlbGV0ZSBlbGVtZW50LmRhdGFzZXRbY3JlYXRlUHJvcGVydHkoY29tcG9uZW50TmFtZSldXG4gIH1cbn1cblxuc3RvcmFnZS5nZXQgPSBmdW5jdGlvbiAoZWxlbWVudCwgY29tcG9uZW50TmFtZSkge1xuICB2YXIgc3RvcmUgPSBjb21wb25lbnRzW2dldElkKGVsZW1lbnQsIGNvbXBvbmVudE5hbWUpXVxuICByZXR1cm4gc3RvcmUgPyBzdG9yZVtjb21wb25lbnROYW1lXSA6IG51bGxcbn1cbnN0b3JhZ2Uuc2F2ZSA9IGZ1bmN0aW9uIChjb21wb25lbnQpIHtcbiAgaWYgKGNvbXBvbmVudC5lbGVtZW50KSB7XG4gICAgdmFyIGlkID0gY29tcG9uZW50Ll9pZFxuICAgIHZhciBjb21wb25lbnROYW1lID0gY29tcG9uZW50Lm5hbWVcbiAgICB2YXIgc3RvcmVcblxuICAgIGlmICghaWQpIHtcbiAgICAgIGlkID0gKytjb3VudGVyXG4gICAgICBzZXRJZChjb21wb25lbnQuZWxlbWVudCwgY29tcG9uZW50TmFtZSwgaWQpXG4gICAgICBjb21wb25lbnQuX2lkID0gaWRcbiAgICB9XG5cbiAgICBzdG9yZSA9IGNvbXBvbmVudHNbaWRdXG4gICAgaWYgKCFzdG9yZSkge1xuICAgICAgc3RvcmUgPSBjb21wb25lbnRzW2lkXSA9IHtsZW5ndGg6IDB9XG4gICAgfVxuXG4gICAgaWYgKHN0b3JlW2NvbXBvbmVudE5hbWVdICE9PSBjb21wb25lbnQpIHtcbiAgICAgICsrc3RvcmUubGVuZ3RoXG4gICAgICBzdG9yZVtjb21wb25lbnROYW1lXSA9IGNvbXBvbmVudFxuICAgIH1cblxuICAgIHZhciBleGlzdGluZ0VsZW1lbnQgPSBlbGVtZW50c1tpZF1cbiAgICBpZiAoZXhpc3RpbmdFbGVtZW50KSB7XG4gICAgICByZW1vdmVJZChleGlzdGluZ0VsZW1lbnQsIGNvbXBvbmVudE5hbWUpXG4gICAgICBzZXRJZChjb21wb25lbnQuZWxlbWVudCwgY29tcG9uZW50TmFtZSwgaWQpXG4gICAgfVxuXG4gICAgZWxlbWVudHNbaWRdID0gY29tcG9uZW50LmVsZW1lbnRcbiAgfVxufVxuc3RvcmFnZS5yZW1vdmUgPSBmdW5jdGlvbiAoY29tcG9uZW50LCBvbmx5Q29tcG9uZW50KSB7XG4gIHZhciBlbGVtZW50ID0gY29tcG9uZW50IGluc3RhbmNlb2YgRWxlbWVudFxuICAgICAgPyBjb21wb25lbnRcbiAgICAgIDogY29tcG9uZW50LmVsZW1lbnRcbiAgdmFyIGNvbXBvbmVudE5hbWUgPSBjb21wb25lbnQubmFtZVxuICB2YXIgaWQgPSBnZXRJZChlbGVtZW50LCBjb21wb25lbnROYW1lKVxuICB2YXIgc3RvcmUgPSBjb21wb25lbnRzW2lkXVxuXG4gIGlmIChjb21wb25lbnQgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgaWYgKG9ubHlDb21wb25lbnQpIHtcbiAgICAgIGlmIChkZWxldGUgc3RvcmVbb25seUNvbXBvbmVudF0pIC0tc3RvcmUubGVuZ3RoXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZm9yICh2YXIgcHJvcCBpbiBzdG9yZSkge1xuICAgICAgICBpZiAoc3RvcmUuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgc3RvcmVbcHJvcF0uX2lkID0gbnVsbFxuICAgICAgICAgIC8vLS1zdG9yZS5sZW5ndGhcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZGVsZXRlIGNvbXBvbmVudHNbaWRdXG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIHZhciBleGlzdGluZyA9IHN0b3JlW2NvbXBvbmVudE5hbWVdXG4gICAgaWYgKGV4aXN0aW5nID09IGNvbXBvbmVudCkge1xuICAgICAgZXhpc3RpbmcuX2lkID0gbnVsbFxuICAgICAgZGVsZXRlIHN0b3JlW2NvbXBvbmVudE5hbWVdXG4gICAgICAtLXN0b3JlLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIGlmIChzdG9yZSAmJiAhc3RvcmUubGVuZ3RoKSB7XG4gICAgcmVtb3ZlSWQoZWxlbWVudHNbaWRdLCBjb21wb25lbnROYW1lKVxuICAgIGRlbGV0ZSBlbGVtZW50c1tpZF1cbiAgfVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGV4dGVuZCggb2JqLCBleHRlbnNpb24gKXtcbiAgZm9yKCB2YXIgbmFtZSBpbiBleHRlbnNpb24gKXtcbiAgICBpZiggZXh0ZW5zaW9uLmhhc093blByb3BlcnR5KG5hbWUpICkgb2JqW25hbWVdID0gZXh0ZW5zaW9uW25hbWVdXG4gIH1cbiAgcmV0dXJuIG9ialxufVxuIiwidmFyIGV4dGVuZCA9IHJlcXVpcmUoXCIuL2V4dGVuZFwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBvYmosIGV4dGVuc2lvbiApe1xuICByZXR1cm4gZXh0ZW5kKGV4dGVuZCh7fSwgb2JqKSwgZXh0ZW5zaW9uKVxufVxuIiwidmFyIG9iamVjdCA9IG1vZHVsZS5leHBvcnRzID0ge31cblxub2JqZWN0LmFjY2Vzc29yID0gZnVuY3Rpb24gKG9iaiwgbmFtZSwgZ2V0LCBzZXQpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgbmFtZSwge1xuICAgIGdldDogZ2V0LFxuICAgIHNldDogc2V0XG4gIH0pXG59XG5cbm9iamVjdC5kZWZpbmVHZXR0ZXIgPSBmdW5jdGlvbiAob2JqLCBuYW1lLCBmbikge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBuYW1lLCB7XG4gICAgZ2V0OiBmblxuICB9KVxufVxuXG5vYmplY3QuZGVmaW5lU2V0dGVyID0gZnVuY3Rpb24gKG9iaiwgbmFtZSwgZm4pIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgbmFtZSwge1xuICAgIHNldDogZm5cbiAgfSlcbn1cblxub2JqZWN0Lm1ldGhvZCA9IGZ1bmN0aW9uIChvYmosIG5hbWUsIGZuKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG5hbWUsIHtcbiAgICB2YWx1ZTogZm5cbiAgfSlcbn1cblxub2JqZWN0LnByb3BlcnR5ID0gZnVuY3Rpb24gKG9iaiwgbmFtZSwgZm4pIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgbmFtZSwge1xuICAgIHZhbHVlOiBmbixcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSlcbn1cbiJdfQ==
