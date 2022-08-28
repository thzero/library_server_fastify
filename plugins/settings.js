import fastifyPlugin from 'fastify-plugin';

import LibraryConstants from '@thzero/library_server/constants.js';

export default fastifyPlugin((instance, opts, done) => {
	instance.addHook('onRequest', (request, reply, next) => {
		request.config = opts.config;
		request.correlationId = request.headers[LibraryConstants.Headers.CorrelationId];
		next();
	});

	done();
});