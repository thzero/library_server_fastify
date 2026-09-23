import LibraryCommonServiceConstants from '@thzero/library_common_service/constants.js';
import LibraryServerConstants from '@thzero/library_server/constants.js';

// require('../utility/string.cjs');
String.isNullOrEmpty = function(value) {
	//return !(typeof value === 'string' && value.length > 0)
	return !value;
}

String.isString = function(value) {
	return (typeof value === "string" || value instanceof String);
}

String.trim = function(value) {
	if (!value || !String.isString(value))
		return value;
	return value.trim();
}

class DefaultAuthenticationMiddleware {
	constructor() {
		this._serviceConfig = null;
		this._serviceLogger = null;
		this._serviceSecurity = null;
	}

	// Whether claims are checked is static config. It used to be read, and logged
	// twice at debug, on every authorized request.
	_claimsCheck() {
		if (this._claimsCheckI === undefined) {
			const auth = this._serviceConfig.get('auth');
			this._claimsCheckI = !!(auth && auth.claims && auth.claims.check);
			this._serviceLogger.debug('middleware', 'authorization', 'auth.claims.check', this._claimsCheckI);
		}
		return this._claimsCheckI;
	}

	init(injector) {
		this._serviceConfig = injector.getService(LibraryCommonServiceConstants.InjectorKeys.SERVICE_CONFIG);
		this._serviceLogger = injector.getService(LibraryCommonServiceConstants.InjectorKeys.SERVICE_LOGGER);
		this._serviceSecurity = injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_SECURITY);
		this._serviceUsageMetrics = injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_USAGE_METRIC);

		return {
			callback: async (request, reply, done, options) => {
				const middleware = request.server.authorizationMiddlewareDefault;
				await middleware.authorization(request, reply, done, options)
			},
			service: this
		}
	}

	async authorization(request, reply, done, options) {
		// `required: false` marks a route as anonymous-friendly - the authentication
		// middleware lets a caller through with no token and therefore no
		// request.user. Authorization only applies once a user is actually present;
		// without this an anonymous caller would be denied on a route that
		// explicitly permits them. Same expression as authentication.js uses.
		const required = options && (options.required !== null) && (options.required !== undefined) ? options.required : true;
		if (!required && !request.user) {
			this._serviceLogger.debug('middleware', 'authorization', 'anonymous.permitted', true, request.correlationId);
			return;
		}

		let logical = this._serviceSecurity.initializeOptionsLogical(request.correlationId, options);
		let roles = this._serviceSecurity.initializeOptionsRoles(request.correlationId, options);
	
		// this._serviceLogger.debug('token', request.token);
		this._serviceLogger.debug('middleware', 'authorization', 'user', request.user, request.correlationId);
		this._serviceLogger.debug('middleware', 'authorization', 'claims', request.claims, request.correlationId);
		this._serviceLogger.debug('middleware', 'authorization', 'roles1', roles, request.correlationId);
		request.roles = [];
		if (roles) {
			// this._serviceLogger.debug('authorization.roles1', roles);
			// this._serviceLogger.debug('authorization.roles1', (typeof roles));
			// this._serviceLogger.debug('authorization.roles1', Array.isArray(roles));
			// this._serviceLogger.debug('authorization.roles1', ((typeof(roles) === 'string') || (roles instanceof String)));
			// if (Array.isArray(roles)) {
			// 	// this._serviceLogger.debug('authorization.roles1a', roles);
			// 	request.roles = roles;
			// }
			// else if ((typeof(roles) === 'string') || (roles instanceof String)) {
			// 	// this._serviceLogger.debug('authorization.roles1b', roles);
			// 	request.roles = roles.split(',');
			// 	request.roles.map(item => item ? item.trim() : item);
			// }
			request.roles = this._serviceSecurity.initializeRoles(request.correlationId, request.roles, roles);
		}
		this._serviceLogger.debug('middleware', 'authorization', 'roles2', request.roles, request.correlationId);
	
		let success = false;
		if (request.roles && Array.isArray(request.roles) && (request.roles.length > 0)) {
			if (this._claimsCheck())
				success = await this._serviceSecurity.authorizationCheckClaims(request.correlationId, request.claims, request.roles, logical);
	
			if (!success)
				success = await this._serviceSecurity.authorizationCheckRoles(request.correlationId, request.user, request.roles, logical);
		}
	
		this._serviceLogger.debug('middleware', 'authorization', 'success', null, request.success, request.correlationId);
		if (success) {
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
				this._serviceLogger.error('middleware', 'authorization', err, null, request.correlationId);
			});
		})();
	
		this._serviceLogger.warn('middleware', 'authorization', 'Unauthorized... authorization unknown', null, request.correlationId);
		// reply.code(401);
		// done(new Error('Unauthorized... authentication unknown')); // not for async
		throw new Error('Unauthorized... authentication unknown');
	}
}

export default DefaultAuthenticationMiddleware;
