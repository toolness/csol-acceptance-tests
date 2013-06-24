var url = require('url');
var fs = require('fs');
var path = require('path');
var assert = require('assert');

var repoPath = require('./util').repoPath;

var MONGODB = url.parse(process.env.MONGODB_URL ||
                        'mongodb://localhost:27017/csol_accept_test');
var REDIS = url.parse(process.env.REDIS_URL ||
                      'redis://localhost:6379/');
var MYSQL = url.parse(process.env.MYSQL_URL ||
                      'mysql://root:@localhost:3306/csol_accept_test');
var PORT = parseInt(process.env.PORT || '3000');

var ENV = {
  CSOL_SITE: {
    PORT: PORT.toString(),
    NODE_ENV: 'development',
    CSOL_HOST: 'http://localhost:' + PORT,
    COOKIE_SECRET: 'chris is cool',
    CSOL_DB_NAME: MYSQL.pathname.slice(1),
    CSOL_DB_USER: MYSQL.auth.split(':')[0],    
    CSOL_DB_PASS: MYSQL.auth.split(':')[1],
    CSOL_DB_HOST: MYSQL.hostname,
    CSOL_DB_PORT: MYSQL.port,
    CSOL_AWS_FAKE_S3_DIR: repoPath('data/csol-fake-s3'),
    CSOL_MANDRILL_KEY: '',

    // TODO: Do these have to be valid?
    CSOL_IREMIX_URL: 'http://csol.staging-iremix.me/api/v1',
    CSOL_IREMIX_USER: 'iremixuser',
    CSOL_IREMIX_PASS: 'iremixpass'
  },
  AESTIMIA: {
    PORT: (PORT + 1).toString(),
    COOKIE_SECRET: 'aestimiacookiesecret',
    API_SECRET: 'aestimiaapisecret',
    MONGO_URL: url.format(MONGODB) + '_aestimia',
    DEBUG: '',
    ENABLE_STUBBYID: '',
    THEME_DIR: repoPath('aestimia/theme/csol')
  },
  OPENBADGER: {
    PORT: (PORT + 2).toString(),
    NODE_ENV: 'development',
    THEME_DIR: repoPath('openbadger/themes/csol'),
    OPENBADGER_ENABLE_STUBBYID: '',
    OPENBADGER_AWS_FAKE_S3_DIR: repoPath('data/openbadger-fake-s3'),
    OPENBADGER_HOST: 'localhost',
    OPENBADGER_PROTOCOL: 'http',
    OPENBADGER_LOGDIR: repoPath('data/openbadger-log'),
    OPENBADGER_SECRET: 'badgerbadgerbadgerbadger',
    OPENBADGER_JWT_SECRET: 'badgerjwtsecret',
    OPENBADGER_LIMITED_JWT_SECRET: 'ihavelimitedaccess',
    OPENBADGER_REDIS_HOST: REDIS.hostname,
    OPENBADGER_REDIS_PORT: REDIS.port,
    OPENBADGER_MONGO_HOST: MONGODB.hostname,
    OPENBADGER_MONGO_PORT: MONGODB.port,
    OPENBADGER_MONGO_DB: MONGODB.pathname.slice(1) + '_openbadger',
    OPENBADGER_CLAIM_URL_TEXT: 'csol.org/claim',
    OPENBADGER_ADMINS: '["*@admin.org"]',
  }
};

// More CSOL-site environment variables.

ENV.CSOL_SITE.CSOL_OPENBADGER_URL = 'http://localhost:' +
                                    ENV.OPENBADGER.PORT + '/v2/';
ENV.CSOL_SITE.CSOL_OPENBADGER_SECRET = ENV.OPENBADGER.OPENBADGER_JWT_SECRET;
ENV.CSOL_SITE.CSOL_AESTIMIA_URL = 'http://localhost:' + ENV.AESTIMIA.PORT + 
                                  '/api/';
ENV.CSOL_SITE.CSOL_AESTIMIA_SECRET = ENV.AESTIMIA.API_SECRET;

// More Aestimia environment variables.

ENV.AESTIMIA.PERSONA_AUDIENCE = 'http://localhost:' + ENV.AESTIMIA.PORT;

// More Openbadger environment variables.

ENV.OPENBADGER.OPENBADGER_PORT = ENV.OPENBADGER.PORT;
ENV.OPENBADGER.OPENBADGER_PERSONA_AUDIENCE = 'http://localhost:' +
                                             ENV.OPENBADGER.PORT;
ENV.OPENBADGER.OPENBADGER_NOTIFICATION_WEBHOOK = 
  'http://localhost:' + ENV.CSOL_SITE.PORT + '/notify/claim';

sanityCheckEnvironment();
createDataDirectories();

module.exports = ENV;

if (!module.parent)
  console.log(ENV);

function createDataDirectories() {
  [
    ENV.OPENBADGER.OPENBADGER_LOGDIR,
    ENV.OPENBADGER.OPENBADGER_AWS_FAKE_S3_DIR,
    ENV.CSOL_SITE.CSOL_AWS_FAKE_S3_DIR
  ].map(function mkPath(abspath) {
    var parts = abspath.split(path.sep).slice(1);
    var currPath = path.sep;

    for (var i = 0; i < parts.length; i++) {
      currPath += parts[i];
      if (!fs.existsSync(currPath))
        fs.mkdirSync(currPath);
      currPath += '/';
    }
  });
}

function sanityCheckEnvironment() {
  assert(!isNaN(PORT) && PORT >= 0, "Port must be valid.");

  Object.keys(ENV).forEach(function(project) {
    var env = ENV[project];
    Object.keys(env).forEach(function(envVar) {
      assert.equal(typeof(env[envVar]), 'string', envVar +
                   ' must be a string');
    });
  });
}
