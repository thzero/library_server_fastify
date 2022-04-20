import LibraryConstants from '@thzero/library_server/constants';
import LibraryCommonServiceConstants from '@thzero/library_common_service/constants';

import injector from '@thzero/library_common/utility/injector';

const separator = ': ';

function getAuthToken(request, logger) {
	if (!request)
		return null;
	if (!logger)
		return null;

	const token = request.headers[LibraryConstants.Headers.AuthKeys.AUTH];
	logger.debug('middleware', 'getAuthToken', 'token', token, request.correlationId);
	if (!String.isNullOrEmpty(token)) {
		const split = token.split(LibraryConstants.Headers.AuthKeys.AUTH_BEARER + separator);
		logger.debug('middleware', 'getAuthToken', 'split', split, request.correlationId);
		logger.debug('middleware', 'getAuthToken', 'split.length', split.length, request.correlationId);
		if (split.length > 1)
			return split[1];
	}

	logger.debug('middleware', 'getAuthToken', 'fail', null, request.correlationId);
	return null;
}

export default async (request, reply, done, options) => {
	const logger = injector.getService(LibraryCommonServiceConstants.InjectorKeys.SERVICE_LOGGER);

	const required = options && (options.required !== null) && (options.required !== undefined) ? options.required : true;

	const token = getAuthToken(request, logger);
	logger.debug('middleware', 'authentication', 'token', token, request.correlationId);
	logger.debug('middleware', 'authentication', 'required', required, request.correlationId);
	logger.debug('middleware', 'authentication', 'valid1', (required && !String.isNullOrEmpty(token)), request.correlationId);
	if (required && !String.isNullOrEmpty(token)) {
		const service = injector.getService(LibraryConstants.InjectorKeys.SERVICE_AUTH);
		const results = await service.verifyToken(request.correlationId, token);
		logger.debug('middleware', 'authentication', 'results', results, request.correlationId);
		if (!results || !results.success) {
			logger.warn('middleware', 'authentication', 'Unauthenticated... invalid token', null, request.correlationId);
			ctx.throw(401);
			return;
		}

		request.token = token;
		request.user = results.user;
		request.claims = results.claims;

		// done(); // not for async
		return;
	}
	logger.debug('middleware', 'authentication', 'valid2', !required, request.correlationId);
	if (!required) {
		// done(); // not for async
		return;
	}

	(async () => {
		const usageMetrics = {
			url: request.routerPath,
			correlationId: request.correlationId,
			href: request.url,
			headers: request.headers,
			host: request.hostname,
			hostname: request.hostname,
			querystring: request.query,
			token: request.token
		};
		const serviceUsageMetrics = injector.getService(LibraryConstants.InjectorKeys.SERVICE_USAGE_METRIC);
		await serviceUsageMetrics.register(usageMetrics).catch((err) => {
			// const logger = injector.getService(LibraryCommonServiceConstants.InjectorKeys.SERVICE_LOGGER);
			logger.error('middleware', 'authentication', err, null, request.correlationId);
		});
	})();

	logger.warn('middleware', 'authentication', 'Unauthorized... authentication unknown', null, request.correlationId);
	// reply.code(401);
	// done(new Error('Unauthorized... authentication unknown')); // not for async
	throw new Error('Unauthorized... authentication unknown');
}
