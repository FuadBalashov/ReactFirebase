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
