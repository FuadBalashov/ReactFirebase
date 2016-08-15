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
