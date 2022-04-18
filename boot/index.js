import path from 'path';

import Fastify from 'fastify';
import fastifyAuth from 'fastify-auth';
import fastifyCors from 'fastify-cors';
import fastifyHelmet from 'fastify-helmet';
import fastifyStatic from 'fastify-static';

import LibraryConstants from '@thzero/library_server/constants';

import injector from '@thzero/library_common/utility/injector';

import BootMain from '@thzero/library_server/boot';

import pluginApiKey from '@thzero/library_server_fastify/plugins/apiKey';
import pluginResponseTime from '@thzero/library_server_fastify/plugins/responseTime';
import pluginSettings from '@thzero/library_server_fastify/plugins/settings';
import pluginUsageMetrics from '@thzero/library_server_fastify/plugins/usageMetrics';

class FastifyBootMain extends BootMain {
	async _initApp(args, plugins) {
		
		// const serverFactory = (handler, opts) => {
		// 	const server = http.createServer((req, res) => {
		// 		handler(req, res)
		// 	});
		  
		// 	return server;
		// };
		  
		// const fastify = Fastify({ serverFactory, logger: true });
		const fastify = Fastify({ logger: true });
		const serverHttp = fastify.server;

		// // https://github.com/koajs/cors
		// app.use(koaCors({
		// 	allowMethods: 'GET,POST,DELETE',
		// 	maxAge : 7200,
		// 	allowHeaders: `${LibraryConstants.Headers.AuthKeys.API}, ${LibraryConstants.Headers.AuthKeys.AUTH}, ${LibraryConstants.Headers.CorrelationId}, Content-Type`,
		// 	credentials: true,
		// 	origin: '*'
		// }));
		// https://github.com/fastify/fastify-cors
		fastify.register(fastifyCors, { 
			allowMethods: 'GET,POST,DELETE',
			maxAge : 7200,
			allowHeaders: `${LibraryConstants.Headers.AuthKeys.API}, ${LibraryConstants.Headers.AuthKeys.AUTH}, ${LibraryConstants.Headers.CorrelationId}, Content-Type`,
			credentials: true,
			origin: '*'
		});
		
		// // https://www.npmjs.com/package/koa-helmet
		// app.use(koaHelmet());
		// https://github.com/fastify/fastify-helmet
		fastify.register(
			fastifyHelmet,
			// Example disables the `contentSecurityPolicy` middleware but keeps the rest.
			{ 
				// contentSecurityPolicy: false 
			}
		);

		// // error
		// app.use(async (ctx, next) => {
		// 	try {
		// 		await next();
		// 	}
		// 	catch (err) {
		// 		ctx.status = err.status || 500;
		// 		if (err instanceof TokenExpiredError) {
		// 			ctx.status = 401;
		// 			ctx.response.header['WWW-Authenticate'] = 'Bearer error="invalid_token", error_description="The access token expired"'
		// 		}
		// 		ctx.app.emit('error', err, ctx);
		// 		await this.usageMetricsServiceI.register(ctx, err).catch(() => {
		// 			this.loggerServiceI.exception('KoaBootMain', 'start', err);
		// 		});
		// 	}
		// });
		fastify.register(async (instance, opts, done) => {
			// try {
			// 	done();
			// }
			// catch (err) {
			// 	let status = err.status || 500;
			// 	if (err instanceof TokenExpiredError) {
			// 		status = 401;
			// 		response.header['WWW-Authenticate'] = 'Bearer error="invalid_token", error_description="The access token expired"'
			// 	}
			// 	app.emit('error', err, ctx);
			// 	await this.usageMetricsServiceI.register(ctx, err).catch(() => {
			// 		this.loggerServiceI.exception('KoaBootMain', 'start', err);
			// 	});
			// }
		});

		// app.on('error', (err, ctx) => {
		// 	this.loggerServiceI.error('KoaBootMain', 'start', 'Uncaught Exception', err);
		// });

		// // config
		// app.use(async (ctx, next) => {
		// 	ctx.config = this._appConfig;
		// 	await next();
		// });
		// // correlationId
		// app.use(async (ctx, next) => {
		// 	ctx.correlationId = ctx.request.header[LibraryConstants.Headers.CorrelationId];
		// 	await next();
		// });
		// fastify.register(async (instance, opts, done) => {
		// 	instance.addHook('onRequest', (request, reply, next) => {
		// 		request.config = this._appConfig;
		// 		request.correlationId = ctx.request.header[LibraryConstants.Headers.CorrelationId];
		// 		next();
		// 	});

		// 	done();
		// });
		fastify.register(pluginSettings, {
			config: this._appConfig
		});

		// // logger
		// app.use(async (ctx, next) => {
		// 	await next();
		// 	const rt = ctx.response.get(ResponseTime);
		// 	this.loggerServiceI.info2(`${ctx.method} ${ctx.url} - ${rt}`);
		// });

		// // x-response-time
		// app.use(async (ctx, next) => {
		// 	const start = Utility.timerStart();
		// 	await next();
		// 	const delta = Utility.timerStop(start, true);
		// 	ctx.set(ResponseTime, delta);
		// });
		// https://github.com/lolo32/fastify-response-time
		fastify.register(pluginResponseTime, {
			logger: this.loggerServiceI
		});

		// app.use(koaStatic('./public'));
		// https://github.com/fastify/fastify-static
		const __dirname = path.resolve();
		fastify.register(fastifyStatic, {
			root: path.join(__dirname, 'public'),
			prefix: '/public/', // optional: default '/'
		});

		this._initPreAuth(fastify);

		// // auth-api-token
		// app.use(async (ctx, next) => {
		// 	if (ctx.originalUrl === '/favicon.ico') {
		// 		await next();
		// 		return;
		// 	}

		// 	const key = ctx.get(LibraryConstants.Headers.AuthKeys.API);
		// 	// this.loggerServiceI.debug('KoaBootMain', 'start', 'auth-api-token.key', key);
		// 	if (!String.isNullOrEmpty(key)) {
		// 		const auth = ctx.config.get('auth');
		// 		if (auth) {
		// 			const apiKey = auth.apiKey;
		// 			// this.loggerServiceI.debug('KoaBootMain', 'start', 'auth-api-token.apiKey', apiKey);
		// 			// this.loggerServiceI.debug('KoaBootMain', 'start', 'auth-api-token.key===apiKey', (key === apiKey));
		// 			if (key === apiKey) {
		// 				ctx.state.apiKey = key;
		// 				await next();
		// 				return;
		// 			}
		// 		}
		// 	}

		// 	(async () => {
		// 		await this.usageMetricsServiceI.register(ctx).catch((err) => {
		// 			this.loggerServiceI.error('KoaBootMain', 'start', 'usageMetrics', err);
		// 		});
		// 	})();

		// 	console.log('Unauthorized... auth-api-token failure');
		// 	ctx.throw(401);
		// });
		// fastify.register((instance, opts, done) => {
		// 	instance.addHook('onRequest', (request, reply, next) => {
		// 		if (request.originalUrl === '/favicon.ico') {
		// 			next();
		// 			return;
		// 		}
	
		// 		const key = request.get(LibraryConstants.Headers.AuthKeys.API);
		// 		// this.loggerServiceI.debug('KoaBootMain', 'start', 'auth-api-token.key', key);
		// 		if (!String.isNullOrEmpty(key)) {
		// 			const auth = request.config.get('auth');
		// 			if (auth) {
		// 				const apiKey = auth.apiKey;
		// 				// this.loggerServiceI.debug('KoaBootMain', 'start', 'auth-api-token.apiKey', apiKey);
		// 				// this.loggerServiceI.debug('KoaBootMain', 'start', 'auth-api-token.key===apiKey', (key === apiKey));
		// 				if (key === apiKey) {
		// 					request.state.apiKey = key;
		// 					next();
		// 					return;
		// 				}
		// 			}
		// 		}
	
		// 		(async () => {
		// 			await this.usageMetricsServiceI.register(ctx).catch((err) => {
		// 				this.loggerServiceI.error('FastifyBootMain', 'start', 'usageMetrics', err);
		// 			});
		// 		})();
	
		// 		console.log('Unauthorized... auth-api-token failure');
		// 		request.throw(401);
		// 		next();
		// 	});

		// 	done();
		// });
		fastify.register(pluginApiKey, {
			logger: this.loggerServiceI,
			usageMetrics: this.usageMetricsServiceI
		});

		fastify.register(fastifyAuth, {
			logger: this.loggerServiceI,
			usageMetrics: this.usageMetricsServiceI
		});

		this._initPostAuth(fastify);

		this._routes = [];

		this._initPreRoutes(fastify);

		for (const pluginRoute of plugins)
			await pluginRoute.initRoutes(this._routes);

		await this._initRoutes();
				
		console.log();

		for (const route of this._routes) {
			await route.init(injector, fastify, this._appConfig);

			console.log([ route.id ]);

			// for (let i = 0; i < route.router.stack.length; i++)
			// 	console.log([ route.router.stack[i].path, route.router.stack[i].methods ]);

			console.log();
		}

		// // usage metrics
		// app.use(async (ctx, next) => {
		// 	await next();
		// 	await this.usageMetricsServiceI.register(ctx).catch((err) => {
		// 		this.loggerServiceI.error('KoaBootMain', 'start', 'usageMetrics', err);
		// 	});
		// });
		fastify.register(pluginUsageMetrics, {
			logger: this.loggerServiceI,
			usageMetrics: this.usageMetricsServiceI
		});

		return { app: fastify, server: serverHttp, listen: fastify.listen };
    }

	_initAppListen(app, server, port, err) {
		app.listen(port, err);
	}

	async _initAppPost(app, args) {
		this._initPostRoutes(app);
	}

	_initRoute(route) {
		this._routes.push(route);
	}
}

export default FastifyBootMain;
