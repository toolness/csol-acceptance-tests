[![Build Status](https://travis-ci.org/toolness/csol-acceptance-tests.png?branch=master)](https://travis-ci.org/toolness/csol-acceptance-tests)

This is an attempt at making it easy to set up the entire Chicago Summer
of Learning infrastructure and run acceptance tests on it.

## Prerequisites

You'll need node, MongoDB, Redis, and MySQL. For automated assessment
testing, you'll need phantomJS 1.8 or newer; manual testing doesn't 
require this.

## Quick Start

First, run this to set things up:

```bash
git clone --recursive https://github.com/toolness/csol-acceptance-tests.git
cd csol-acceptance-tests
npm install
node csol.js init
```

### Automated Acceptance Testing

```bash
node csol.js test
```

### Manual Testing

```bash
node csol.js start
```

At this point, you can browse to the following sites:

* http://localhost:3000/ for CSOL-site
* http://localhost:3001/ for Aestimia
* http://localhost:3002/ for Openbadger

## Environment Variables

All environment variables are optional.

* `PORT`: The *starting* port used by this test infrastructure.
  If it is set to 3000 (the default), then CSOL-site will be bound to
  port 3000, Aestimia will be at 3001, and Openbadger will be at 3002.

* `MONGODB_URL`: The URL to the MongoDB instance used by Aestimia and
  Openbadger. The pathname will be used as a prefix for the actual
  database name, since separate databases will be used by the
  two services. If it is set to
  `mongodb://localhost:27017/csol_accept_test` (the default), then
  Aestimia will use the `csol_accept_test_aestimia` database and
  Openbadger willl use `csol_accept_test_openbadger`.

* `REDIS_URL`: The URL to the Redis instance used by Openbadger. The
  default value is `redis://localhost:6379`.

* `MYSQL_URL`: The MySQL URL used by CSOL-site. The default value is
  `mysql://root:@localhost:3306/csol_accept_test`.
