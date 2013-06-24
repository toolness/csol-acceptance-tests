var path = require('path');

exports.repoPath = function repoPath(relpath) {
  var pathParts = [__dirname, '..'];
  pathParts.push.apply(pathParts, relpath.split('/'));
  return path.join.apply(path, pathParts);
};
