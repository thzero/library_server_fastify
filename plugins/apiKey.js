import fastifyPlugin from 'fastify-plugin';

import LibraryServerConstants from '@thzero/library_server/constants.js';

export default fastifyPlugin((instance, opts, done) => {
	instance.addHook('onRequest', (request, reply, next) => {
		if (request.originalUrl === '/favicon.ico') {
			next();
			return;
		}

		const key = request.headers[LibraryServerConstants.Headers.AuthKeys.API];
		// opts.logger.debug('KoaBootMain', 'start', 'auth-api-token.key', key);
		if (!String.isNullOrEmpty(key)) {
			const auth = request.config.get('auth');
			if (auth) {
				let apiKey = auth.apiKey;
				apiKey = apiKey ? apiKey.trim() : apiKey;
				// this.loggerServiceI.debug('KoaBootMain', 'start', 'auth-api-token.apiKey', apiKey);
				// this.loggerServiceI.debug('KoaBootMain', 'start', 'auth-api-token.key===apiKey', (key === apiKey));
				if (key === apiKey) {
					request.apiKey = key;
					next();
					return;
				}
			}
		}

		(async () => {
			const usageMetrics = {
				url: request.routeOptions.url,
				correlationId: request.correlationId,
				href: request.url,
				headers: request.headers,
				host: request.hostname,
				hostname: request.hostname,
				querystring: request.query,
				token: request.token
			};
			await opts.usageMetrics.register(usageMetrics).catch((err) => {
				opts.logger.error('FastifyBootMain', 'start', 'usageMetrics', err);
			});
		})();

		console.log('Unauthorized... auth-api-token failure');
		reply.status(401).send();
	});

	done();
});