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

