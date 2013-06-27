var Fiber = require('fibers');

function fiberize(func) {
  return function() {
    var args = [].slice.call(arguments);
    var callback = args[args.length - 1];
    var world = this;
    var pendingCalled = false;

    if (callback.pending)
      world.pending = function() {
        pendingCalled = true;
        callback.pending();
      };

    Fiber(function() {
      try {
        func.apply(world, args.slice(0, -1));
      } catch (e) {
        if (callback.fail && !pendingCalled)
          return callback.fail(e);
        throw e;
      }
      if (!pendingCalled)
        callback();
    }).run();
  }
}

module.exports = fiberize;
