import fastifyPlugin from 'fastify-plugin';

export default fastifyPlugin((instance, opts, done) => {
	instance.addHook('onSend', (request, reply, payload, next) => {
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
				opts.logger.error('usageMetrics', 'start', 'usageMetrics', err);
			});
		})();

		next();
	});

	done();
});