import fastifyPlugin from 'fastify-plugin';

import LibraryServerConstants from '@thzero/library_server/constants.js';

export default fastifyPlugin((instance, opts, done) => {
	// The configured key does not change while the process runs. It used to be
	// read from config and trimmed on every request that carried an api key.
	// Resolved on first use, from opts.config when the boot passes it and from the
	// request's config otherwise; undefined means not yet resolved.
	let apiKey;
	const resolve = (request) => {
		if (apiKey !== undefined)
			return apiKey;

		const config = opts.config ? opts.config : request.config;
		const auth = config ? config.get('auth') : null;
		apiKey = (auth && auth.apiKey) ? auth.apiKey.trim() : null;
		return apiKey;
	};

	instance.addHook('onRequest', (request, reply, next) => {
		if (request.originalUrl === '/favicon.ico') {
			next();
			return;
		}

		const key = request.headers[LibraryServerConstants.Headers.AuthKeys.API];
		if (!String.isNullOrEmpty(key)) {
			const expected = resolve(request);
			if (expected && key === expected) {
				request.apiKey = key;
				next();
				return;
			}
		}

		(async () => {
			// Strip the credential headers; everything else is kept for diagnostics.
			const {
				[LibraryServerConstants.Headers.AuthKeys.AUTH]: authHeader,
				[LibraryServerConstants.Headers.AuthKeys.API]: apiKeyHeader,
				...headers
			} = request.headers;
			const usageMetrics = {
				url: request.routeOptions.url,
				correlationId: request.correlationId,
				href: request.url,
				headers: headers,
				host: request.hostname,
				hostname: request.hostname,
				querystring: request.query,
				token: String.isNullOrEmpty(request.token) ? null : '[redacted]'
			};
			await opts.usageMetrics.register(usageMetrics).catch((err) => {
				opts.logger.error('FastifyBootMain', 'start', 'usageMetrics', err);
			});
		})();

		// Through the logger, not console.log: that was a synchronous stdout write
		// that any caller with a bad key could trigger at will.
		opts.logger.warn('FastifyBootMain', 'apiKey', 'Unauthorized: api key failure', null, request.correlationId);
		reply.status(401).send();
	});

	done();
});
