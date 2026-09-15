import fastifyPlugin from 'fastify-plugin';

import LibraryServerConstants from '@thzero/library_server/constants.js';

export default fastifyPlugin((instance, opts, done) => {
	instance.addHook('onSend', (request, reply, payload, next) => {
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
				opts.logger.error('usageMetrics', 'start', 'usageMetrics', err);
			});
		})();

		next();
	});

	done();
});