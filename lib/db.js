var mysql = require('mysql');

exports.create = function(options, cb) {
  var conn = mysql.createConnection({
    host: options.host,
    port: options.port,
    user: options.user,
    password: options.password
  });
  conn.connect();
  conn.query('CREATE DATABASE IF NOT EXISTS ' + options.db + ';', cb);
  conn.end();
};
