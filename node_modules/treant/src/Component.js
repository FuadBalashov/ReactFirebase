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
