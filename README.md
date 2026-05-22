![GitHub package.json version](https://img.shields.io/github/package-json/v/thzero/library_server_fastify)
![David](https://img.shields.io/david/thzero/library_server_fastify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# library_server_fastify

An opinionated library of common functionality to bootstrap a Fastify based API application.

### Requirements

#### NodeJs

Requires [NodeJs ](https://nodejs.org) version 18+.

### Installation

[![NPM](https://nodei.co/npm/@thzero/library_server.png?compact=true)](https://npmjs.org/package/@thzero/library_server_fastify)

### Rate Limiting

Rate limiting is provided by [@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit).

#### Defaults

The following defualts are used.

```js
    max: 100,          // maximum requests per timeWindow per IP
    timeWindow: '1 minute'
```

You can adjust the defaults by overriding the following method in your FastifyBootMain dervived class.

```js
_initRateLimit()
```

#### Per-Route Overrides

To apply a stricter limit to a specific route, pass a `rateLimit` config:

```js
router.post(this._join('/logger'), {
    config: {
        rateLimit: {
            max: 30,
            timeWindow: '1 minute'
        }
    }
}, async (request, reply) => { ... });
```

#### Disabling Rate Limiting Globally

To disable rate limiting for the entire application, override `_initRateLimit` in your `FastifyBootMain` derived class and return `null`:

```js
_initRateLimit(options) {
    return null;
}
```

#### Disabling Rate Limiting on a Route

To opt a route out of rate limiting entirely (e.g. a health check or catch-all):

```js
router.get(this._join('/'), {
    config: { rateLimit: false }
}, (request, reply) => {
    reply.status(494).send();
});
```
