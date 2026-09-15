![GitHub package.json version](https://img.shields.io/github/package-json/v/thzero/library_server_fastify)
![David](https://img.shields.io/david/thzero/library_server_fastify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# library_server_fastify

An opinionated library of common functionality to bootstrap a Fastify based API application.

Supplies the web layer for [@thzero/library_server](https://github.com/thzero/library_server) — boot, middleware, plugins and the routes the framework owns. The services and repositories those routes call live in `library_server` and its satellite packages.

## Requirements

### NodeJs

Requires [NodeJs](https://nodejs.org) version 22+.

### Installation

[![NPM](https://nodei.co/npm/@thzero/library_server_fastify.png?compact=true)](https://npmjs.org/package/@thzero/library_server_fastify)

```
npm install @thzero/library_server_fastify
```

#### Peer dependencies

* `@thzero/library_common`
* `@thzero/library_common_service`
* `@thzero/library_server`

Fastify and its plugins (`@fastify/auth`, `@fastify/compress`, `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/routes`, `@fastify/static`) are direct dependencies — you do not install them yourself.

## Getting started

`FastifyBootMain` extends `BootMain` from `library_server` and wires Fastify in. An application subclasses it and starts it with its boot plugins:

```js
import BootMain from '@thzero/library_server_fastify/boot/index.js';

class AppBootMain extends BootMain {
    _initServicesLoggers() {
        this._registerServicesLogger(AppConstants.InjectorKeys.SERVICE_LOGGER_PINO, new pinoLoggerService());
    }
}

(async function() {
    await (new AppBootMain()).start(ApiPlugin, NewsApiPlugin, UsersApiPlugin);
})();
```

### Boot extension points

Override these on your `FastifyBootMain` derived class. Each is called during `_initApp` with the default options, and returning `null` disables that concern entirely.

| Method | Controls |
|---|---|
| `_initCompression(options)` | `@fastify/compress` |
| `_initCors(options)` | `@fastify/cors` |
| `_initHelmet(options)` | `@fastify/helmet` |
| `_initRateLimit(options)` | `@fastify/rate-limit` |
| `_initAuthentication(map)` | The authentication middleware registered as `authenticationDefault` |
| `_initAuthorization(map)` | The authorization middleware registered as `authorizationDefault` |
| `_initRoute(route)` | Called per route as it is registered |
| `_initAppListen(app, server, address, port, err)` | The listen callback |
| `_initAppPost(app, args)` | After the app is built, before it listens |

The inherited `library_server` hooks — `_initServices`, `_initRepositories`, `_initServicesLoggers`, `_initRoutes`, `_initCleanup` and the rest — apply here too.

## Middleware

### Authentication — `middleware/authentication.js`

Registered as `authenticationDefault`. Reads the bearer token from the `Authorization` header, verifies it through `SERVICE_AUTH`, and attaches `request.token`, `request.user` and `request.claims`.

Six header forms are accepted, matching the prefixes the constants declare:

```
Bearer <token>     bearer <token>     BEARER <token>
Bearer: <token>    bearer: <token>    BEARER: <token>
```

The prefix must be at the start; surrounding whitespace is trimmed; the remainder is taken whole, so a token containing the prefix again is not truncated.

With `required: false` a caller presenting no token passes through with no `request.user`. A caller who does present a token still has it validated, and an invalid one is a 401 either way.

### Authorization — `middleware/authorization.js`

Registered as `authorizationDefault`. Checks `request.user`'s roles against the route's `roles` through `SERVICE_SECURITY`.

With `required: false` and no `request.user`, it returns without denying — the route is anonymous-friendly. An authenticated caller on the same route still has their roles checked.

A route that runs authorization but declares no `roles` denies everyone. That is fail-closed, but it means `authorizationDefault` without a roles list is always a 401.

### Declaring a route's auth

```js
router.post(this._join('/things'),
    {
        preHandler: router.auth([
            router.authenticationDefault,
            router.authorizationDefault
        ],
        {
            relation: LibraryCommonConstants.Security.logicalAnd,
            roles: [ 'thing.create' ]
        }),
    },
    async (request, reply) => { ... }
);
```

* **`relation`** — how the middleware chain combines. `logicalAnd` means both must pass.
* **`roles`** — the roles the caller must hold.
* **`required: false`** — added to the options object, marks the route anonymous-friendly as described above.

Omitting `preHandler` entirely leaves the route **fully anonymous** — no token is read, so `request.user` is always undefined. That is deliberate for a few routes (`/usageMetrics/tag` records pre-sign-in telemetry); make sure it is deliberate for yours.

## Plugins

| Plugin | Hook | Purpose |
|---|---|---|
| `plugins/apiKey.js` | `onRequest` | Rejects a request whose api key header does not match the configured key |
| `plugins/responseTime.js` | `onRequest` + `onSend` | Sets the `X-Response-Time` header and logs the elapsed time |
| `plugins/settings.js` | `onRequest` | Sets `request.config`, and **`request.correlationId` from the inbound header** — this is where the correlationId every log line and response carries comes from |
| `plugins/usageMetrics.js` | `onSend` | Records a usage metric per response, fire and forget |
| `plugins/auth.js` | | A vendored fork of `@fastify/auth` providing `router.auth(...)` |

`apiKey` and `usageMetrics` strip the `Authorization` and api key headers from anything they record, so credentials do not reach the metrics collection.

## Routes

Registered by the boot plugins that an application passes to `start`:

| Route | Path | Auth |
|---|---|---|
| `routes/home.js` | `/` | anonymous |
| `routes/version.js` | `/version` | as configured |
| `routes/utility.js` | `/utility/…` | `utility` role for the privileged endpoints |
| `routes/plans.js` | `/plans/…` | |
| `routes/news.js` | `/news/…` | `news` role for admin endpoints |
| `routes/users.js` | `/users/…` | `user` role; lookups allow `required: false` |
| `routes/usageMetrics.js` | `/usageMetrics/listing` | `admin` role |
| | `/usageMetrics/tag` | anonymous by design |
| `routes/admin/…` | `/admin/<fragment>` | `<role>.create`, `.delete`, `.search`, `.update` |

Subclass `routes/index.js` (`FastifyBaseRoute`) for your own routes. `_join(path)` applies the route's prefix, `_jsonResponse(reply, response)` sends the framework's response envelope, and `_inject(app, injector, key, name)` decorates the router with a service so a handler can reach it.

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

## Development

```
npm run lint       # eslint .
npm run lint:fix   # eslint . --fix
npm test           # node --test "test/*.test.js"
```
