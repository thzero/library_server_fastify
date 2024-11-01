import path from 'path';

import Fastify from 'fastify';
// import fastifyAuth from '@fastify/auth';
import fastifyAuth from '../plugins/auth.js';
import fastifyCompression from '@fastify/compress';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRoutes from '@fastify/routes';
import fastifyStatic from '@fastify/static';

import LibraryServerConstants from '@thzero/library_server/constants.js';

import injector from '@thzero/library_common/utility/injector.js';

import BootMain from '@thzero/library_server/boot/index.js';

import pluginApiKey from '@thzero/library_server_fastify/plugins/apiKey.js';
import pluginResponseTime from '@thzero/library_server_fastify/plugins/responseTime.js';
import pluginSettings from '@thzero/library_server_fastify/plugins/settings.js';
import pluginUsageMetrics from '@thzero/library_server_fastify/plugins/usageMetrics.js';

import authenticationDefault from '../middleware/authentication.js';
import authorizationDefault from '../middleware/authorization.js';

class FastifyBootMain extends BootMain {
	async _initApp(args, plugins) {
		const __dirname = path.resolve();
		
		// const serverFactory = (handler, opts) => {
		// 	const server = http.createServer((req, res) => {
		// 		handler(req, res)
		// 	});
		  
		// 	return server;
		// };

		let http2 = this._appConfig.get('http2', { enabled: false });
		const http2_enabled = http2 && http2.enabled === 'true' ? true : false;
		this.loggerServiceI.info2(`config.http2.override: ${http2_enabled}`);
		let https = null;
		if (http2_enabled) {
			let http2 = this._appConfig.get('http2', false);
			if (!http2.key)
				throw Error('Invalid key, required by http2');
			if (!http2.cert)
				throw Error('Invalid cert, required by http2');
			https = {
				key: http2.key,
				cert: http2.cert
			}
		}
		  
		// const fastify = Fastify({ serverFactory, logger: true });
		const fastify = Fastify({ 
			http2: http2_enabled,
			https: https,
			logger: true 
		});
		const serverHttp = fastify.server;

		await fastify.register(fastifyRoutes);

		// // https://github.com/koajs/cors
		// app.use(koaCors({
		// 	allowMethods: 'GET,POST,DELETE',
		// 	maxAge : 7200,
		// 	allowHeaders: `${LibraryServerConstants.Headers.AuthKeys.API}, ${LibraryServerConstants.Headers.AuthKeys.AUTH}, ${ServerConstants.Headers.CorrelationId}, Content-Type`,
		// 	credentials: true,
		// 	origin: '*'
		// }));
		// https://github.com/fastify/fastify-cors
		// fastify.register(fastifyCors, { 
		// 	allowMethods: 'GET,POST,DELETE',
		// 	maxAge : 7200,
		// 	allowHeaders: `${LibraryServerConstants.Headers.AuthKeys.API}, ${LibraryServerConstants.Headers.AuthKeys.AUTH}, ${ServerConstants.Headers.CorrelationId}, Content-Type`,
		// 	credentials: true,
		// 	origin: '*'
		// });
		const corsOptionsDefault = this._initCors({
			allowHeaders: [ LibraryServerConstants.Headers.AuthKeys.API, LibraryServerConstants.Headers.AuthKeys.AUTH, LibraryServerConstants.Headers.CorrelationId, 'Content-Type' ],
			credentials: true,
			maxAge : 7200,
			methods: ['GET', 'POST', 'DELETE'],
			origin: '*'
		});
		await fastify.register(fastifyCors, (instance) => {
			return (req, callback) => {
				let corsOptions = corsOptionsDefault;
				callback(null, corsOptions) // callback expects two parameters: error and options
			}
		});
		
		// // https://www.npmjs.com/package/koa-helmet
		// app.use(koaHelmet());
		// https://github.com/fastify/fastify-helmet
		const helmetOptions = this._initHelmet({ 
			// Example disables the `contentSecurityPolicy` middleware but keeps the rest.
			// contentSecurityPolicy: false 
		});
		await fastify.register(
			fastifyHelmet,
			helmetOptions
		);

		const compressionOptions = this._initCompression({ 
			global: true,
			requestEncodings: [ 'br', 'gzip' ]
		});
		await fastify.register(
			fastifyCompression,
			compressionOptions
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
		// await fastify.register(async (instance, opts, done) => {
		// 	// try {
		// 	// 	done();
		// 	// }
		// 	// catch (err) {
		// 	// 	let status = err.status || 500;
		// 	// 	if (err instanceof TokenExpiredError) {
		// 	// 		status = 401;
		// 	// 		response.header['WWW-Authenticate'] = 'Bearer error="invalid_token", error_description="The access token expired"'
		// 	// 	}
		// 	// 	app.emit('error', err, ctx);
		// 	// 	await this.usageMetricsServiceI.register(ctx, err).catch(() => {
		// 	// 		this.loggerServiceI.exception('KoaBootMain', 'start', err);
		// 	// 	});
		// 	// }
		// });

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
		// 	ctx.correlationId = ctx.request.header[LibraryServerConstants.Headers.CorrelationId];
		// 	await next();
		// });
		// fastify.register(async (instance, opts, done) => {
		// 	instance.addHook('onRequest', (request, reply, next) => {
		// 		request.config = this._appConfig;
		// 		request.correlationId = ctx.request.header[LibraryServerConstants.Headers.CorrelationId];
		// 		next();
		// 	});

		// 	done();
		// });
		await fastify.register(pluginSettings, {
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
		await fastify.register(pluginResponseTime, {
			logger: this.loggerServiceI
		});

		// app.use(koaStatic('./public'));
		// https://github.com/fastify/fastify-static
		await fastify.register(fastifyStatic, {
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

		// 	const key = ctx.get(LibraryServerConstants.Headers.AuthKeys.API);
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
	
		// 		const key = request.get(LibraryServerConstants.Headers.AuthKeys.API);
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
		await fastify.register(pluginApiKey, {
			logger: this.loggerServiceI,
			usageMetrics: this.usageMetricsServiceI
		});

		await fastify.register(fastifyAuth);

		const capitalize = (word) => {
			return word[0].toUpperCase() + word.slice(1).toLowerCase();
		};
		
		let item;
		for (let [key, value] of this._initAuthentication(new Map()).entries()) {
			item = value.init(injector);
			fastify.decorate('authentication' + capitalize(key), item.callback);
			fastify.decorate('authenticationMiddleware' + capitalize(key), item.service);
		}
		for (let [key, value] of this._initAuthorization(new Map()).entries()) {
			item = value.init(injector);
			fastify.decorate('authorization' + capitalize(key), item.callback);
			fastify.decorate('authorizationMiddleware' + capitalize(key), item.service);
		}

		this._initPostAuth(fastify);

		this._routes = [];

		this._initPreRoutes(fastify);
				
		console.log('----route.init-----------------------------------');

		for (const pluginRoute of plugins)
			await pluginRoute.initRoutes(this._routes);
		
		await this._initRoutes();
		for (const route of this._routes) {
			console.log(route);
			await route.init(injector, fastify, this._appConfig);
		}

		console.log('----route.init.complete--------------------------');
		console.log();
				
		console.log('----route.listing--------------------------------');

		let methods;
		for (let [key, value] of fastify.routes.entries()) {
			methods = [];
			for (let item of value)
				methods.push(item.method);
			console.log([ key, methods ]);
		}
		
		console.log('----route.listing.complete-----------------------');
		console.log();

		// // usage metrics
		// app.use(async (ctx, next) => {
		// 	await next();
		// 	await this.usageMetricsServiceI.register(ctx).catch((err) => {
		// 		this.loggerServiceI.error('KoaBootMain', 'start', 'usageMetrics', err);
		// 	});
		// });
		await fastify.register(pluginUsageMetrics, {
			logger: this.loggerServiceI,
			usageMetrics: this.usageMetricsServiceI
		});

		return { 
			app: fastify, 
			server: serverHttp, 
			listen: fastify.listen 
		};
    }

	_initAuthentication(map) {
		map.set('default', new authenticationDefault());
		return map;
	}

	_initAuthorization(map) {
		map.set('default', new authorizationDefault());
		return map;
	}

	_initAppListen(app, server, address, port, err) {
		const options = { port: port };
		if (address)
			options.host = address;
		app.listen(options, err);
	}

	async _initAppPost(app, args) {
		this._initPostRoutes(app);
	}

	_initCompression(options) {
		return options;
	}

	_initCors(options) {
		// https://github.com/fastify/fastify-cors
		return options;
	}

	_initHelmet(options) {
		return options;
	}

	_initRoute(route) {
		this._routes.push(route);
	}
}

export default FastifyBootMain;
