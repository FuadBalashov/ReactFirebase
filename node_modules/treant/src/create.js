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
