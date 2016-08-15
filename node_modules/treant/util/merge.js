var extend = require("./extend")

module.exports = function( obj, extension ){
  return extend(extend({}, obj), extension)
}
