import LibraryCommonServiceConstants from '@thzero/library_common_service/constants.js';
import LibraryServerConstants from '@thzero/library_server/constants.js';

const separatorColon = ': ';
const separatorSpace = ' ';

class DefaultAuthenticationMiddleware {
	constructor() {
		this._serviceAuth = null;
		this._serviceLogger = null;
	}

	init(injector) {
		this._serviceAuth = injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_AUTH);
		this._serviceLogger = injector.getService(LibraryCommonServiceConstants.InjectorKeys.SERVICE_LOGGER);
		this._serviceUsageMetrics = injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_USAGE_METRIC);

		return {
			callback: async (request, reply, done, options) => {
				const middleware = request.server.authenticationMiddlewareDefault;
				await middleware.authenticate(request, reply, done, options)
			},
			service: this
		}
	}

	async authenticate(request, reply, done, options) {
		const required = options && (options.required !== null) && (options.required !== undefined) ? options.required : true;
	
		const token = this._getAuthToken(request);
		this._serviceLogger.debug('middleware', 'authentication', 'token', token, request.correlationId);
		this._serviceLogger.debug('middleware', 'authentication', 'required', required, request.correlationId);
		const valid = ((required && !String.isNullOrEmpty(token)) || !required);
		this._serviceLogger.debug('middleware', 'authentication', 'valid', valid, request.correlationId);
		if (valid) {
			if (!String.isNullOrEmpty(token)) {
				const results = await this._serviceAuth.verifyToken(request.correlationId, token);
				this._serviceLogger.debug('middleware', 'authentication', 'results', results, request.correlationId);
				if (!results || !results.success) {
					this._serviceLogger.warn('middleware', 'authentication', 'Unauthenticated... invalid token', null, request.correlationId);
					reply.code(401).send({ error: 'Unauthorized' });
					return;
				}
	
				request.token = token;
				request.user = results.user;
				request.claims = results.claims;
			}
	
			// done(); // not for async
			return;
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
			await this._serviceUsageMetrics.register(usageMetrics).catch((err) => {
				this._serviceLogger.error('middleware', 'authentication', err, null, request.correlationId);
			});
		})();
	
		this._serviceLogger.warn('middleware', 'authentication', 'Unauthorized... authentication unknown', null, request.correlationId);
		// reply.code(401);
		// done(new Error('Unauthorized... authentication unknown')); // not for async
		throw new Error('Unauthorized... authentication unknown');
	}

	_getAuthToken(request) {
		if (!request)
			return null;

		const token = request.headers[LibraryServerConstants.Headers.AuthKeys.AUTH];
		if (String.isString(token)) {
			this._serviceLogger.debug('middleware', 'getAuthToken', 'token', token, request.correlationId);
			// startsWith, not split: split() searches the whole string, so a header of
			// 'Garbage Bearer <token>' split to ['Garbage ', '<token>'] and the token
			// was accepted. The prefix has to be at position 0.
			const value = token.trim();
			let prefix = LibraryServerConstants.Headers.AuthKeys.AUTH_BEARER + separatorColon;
			this._serviceLogger.debug('middleware', 'getAuthToken', 'prefix', prefix, request.correlationId);
			if (!value.startsWith(prefix)) {
				prefix = LibraryServerConstants.Headers.AuthKeys.AUTH_BEARER_LOWER_CASE + separatorColon;
				this._serviceLogger.debug('middleware', 'getAuthToken', 'prefix1', prefix, request.correlationId);
			}
			if (!value.startsWith(prefix)) {
				prefix = LibraryServerConstants.Headers.AuthKeys.AUTH_BEARER_UPPER_CASE + separatorColon;
				this._serviceLogger.debug('middleware', 'getAuthToken', 'prefix1', prefix, request.correlationId);
			}
			if (!value.startsWith(prefix)) {
				prefix = LibraryServerConstants.Headers.AuthKeys.AUTH_BEARER + separatorSpace;
				this._serviceLogger.debug('middleware', 'getAuthToken', 'prefix1', prefix, request.correlationId);
			}
			if (!value.startsWith(prefix)) {
				prefix = LibraryServerConstants.Headers.AuthKeys.AUTH_BEARER_LOWER_CASE + separatorSpace;
				this._serviceLogger.debug('middleware', 'getAuthToken', 'prefix1', prefix, request.correlationId);
			}
			if (!value.startsWith(prefix)) {
				prefix = LibraryServerConstants.Headers.AuthKeys.AUTH_BEARER_UPPER_CASE + separatorSpace;
				this._serviceLogger.debug('middleware', 'getAuthToken', 'prefix1', prefix, request.correlationId);
			}
			if (value.startsWith(prefix))
				return value.substring(prefix.length).trim();
		}
	
		this._serviceLogger.debug('middleware', 'getAuthToken', 'fail', null, request.correlationId);
		return null;
	}
}

export default DefaultAuthenticationMiddleware;
