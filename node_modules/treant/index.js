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
