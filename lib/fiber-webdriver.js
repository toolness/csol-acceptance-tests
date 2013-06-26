var Fiber = require('fibers');
var elementConstructor = require('wd/lib/element').element;

function wrapObject(obj) {
  if (Array.isArray(obj))
    return obj.map(wrapObject);
  if (obj instanceof elementConstructor)
    return new FiberWebdriverObject(obj);
  return obj;
}

function unwrapObject(obj) {
  if (Array.isArray(obj))
    return obj.map(unwrapObject);
  if (obj instanceof FiberWebdriverObject)
    return obj._asyncWebdriverObject;
  return obj;
}

function FiberWebdriverObject(asyncWebdriverObject) {
  var self = this;
  var methodNames = Object.keys(Object.getPrototypeOf(asyncWebdriverObject))
    .filter(function(name) {
      return (typeof(asyncWebdriverObject[name]) == "function" &&
              name[0] != '_');
    });

  self._asyncWebdriverObject = asyncWebdriverObject;
  methodNames.forEach(function(name) {
    self[name] = function() {
      var method = asyncWebdriverObject[name];
      var fiber = Fiber.current;
      var args = unwrapObject([].slice.call(arguments));
      var errorToThrow = new Error(name + " failed");

      args.push(function(err, result) {
        if (err) {
          errorToThrow.originalError = err;
          errorToThrow.message += " (" + err.message + ")";
          return fiber.throwInto(errorToThrow);
        }

        return fiber.run(wrapObject(result));
      });
      method.apply(asyncWebdriverObject, args);
      return Fiber.yield();
    };
  });
}

module.exports = FiberWebdriverObject;
