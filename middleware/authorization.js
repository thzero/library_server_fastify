import LibraryConstants from '@thzero/library_server/constants';
import LibraryCommonServiceConstants from '@thzero/library_common_service/constants';

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

const logicalAnd = 'and';
const logicalOr = 'or';

class DefaultAuthenticationMiddleware {
	constructor() {
		this._serviceConfig = null;
		this._serviceLogger = null;
		this._serviceSecurity = null;
	}

	init(injector) {
		this._serviceConfig = injector.getService(LibraryCommonServiceConstants.InjectorKeys.SERVICE_CONFIG);
		this._serviceLogger = injector.getService(LibraryCommonServiceConstants.InjectorKeys.SERVICE_LOGGER);
		this._serviceSecurity = injector.getService(LibraryConstants.InjectorKeys.SERVICE_SECURITY);

		return {
			callback: async (request, reply, done, options) => {
				const middleware = request.server.authorizationMiddlewareDefault;
				await middleware.authorization(request, reply, done, options)
			},
			service: this
		}
	}

	async authorization(request, reply, done, options) {
		let logical = logicalOr;
		let roles = [];
		if (options) {
			logical = options.logical;
			if (String.isNullOrEmpty(logical) || (logical !== logicalAnd) || (logical !== logicalOr))
				logical = logicalOr;
			
			if (options.roles && Array.isArray(options.roles) && (options.roles.length > 0))
				roles = options.roles;
		}
	
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
			this._initalizeRoles(request, roles);
		}
		this._serviceLogger.debug('middleware', 'authorization', 'roles2', request.roles, request.correlationId);
	
		let success = false; //(logical === logicalOr ? false : true);
		if (request.roles && Array.isArray(request.roles) && (request.roles.length > 0)) {
			const auth = this._serviceConfig.get('auth');
			if (auth) {
				this._serviceLogger.debug('middleware', 'authorization', 'auth.claims', auth.claims, request.correlationId);
				this._serviceLogger.debug('middleware', 'authorization', 'auth.claims.check', auth.claims.check, request.correlationId);
			}
			if (auth && auth.claims && auth.claims.check)
				success = await this._authorizationCheckClaims(request, (logical === logicalOr ? false : true), logical);
	
			if (!success)
				success = await this._authorizationCheckRoles(request, (logical === logicalOr ? false : true), logical);
		}
	
		this._serviceLogger.debug('middleware', 'authorization', 'success', null, request.success, request.correlationId);
		if (success) {
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
			const serviceUsageMetrics = request.server[LibraryConstants.InjectorKeys.SERVICE_USAGE_METRIC];
			await serviceUsageMetrics.register(usageMetrics).catch((err) => {
				this._serviceLogger.error('middleware', 'authorization', err, null, request.correlationId);
			});
		})();
	
		this._serviceLogger.warn('middleware', 'authorization', 'Unauthorized... authorization unknown', null, request.correlationId);
		// reply.code(401);
		// done(new Error('Unauthorized... authentication unknown')); // not for async
		throw new Error('Unauthorized... authentication unknown');
	}
	
	async _authorizationCheckClaims (request, success, logical) {
		if (!request)
			return false;
		if (!(request.claims && Array.isArray(request.claims)))
			return false;

		let result;
		let roleAct;
		let roleObj;
		let roleParts;
		for (const claim of request.claims) {
			this._serviceLogger.debug('middleware', 'authorization', 'authorization.claim', claim, request.correlationId);

			for (const role of request.roles) {
				this._serviceLogger.debug('middleware', 'authorization', 'role', role, request.correlationId);

				roleParts = role.split('.');
				if (roleParts && roleParts.length < 1)
					success = false;

				roleObj = roleParts[0];
				roleAct = roleParts.length >= 2 ? roleParts[1] : null

				result = await this._serviceSecurity.validate(claim, null, roleObj, roleAct);
				this._serviceLogger.debug('middleware', 'authorization', 'result', result, request.correlationId);
				if (logical === logicalOr)
					success = success || result;
				else
					success = success && result;
			}
		}

		return success;
	}

	async _authorizationCheckRoles (request, success, logical) {
		if (!request)
			return false;

		this._serviceLogger.debug('middleware', '_authorizationCheckRoles', 'user', request.user, request.correlationId);
		if (!(request.user && request.user.roles && Array.isArray(request.user.roles)))
			return false;

		this._serviceLogger.debug('middleware', '_authorizationCheckRoles', 'logical', logical, request.correlationId);

		let result;
		let roleAct;
		let roleObj;
		let roleParts;
		for (const userRole of request.user.roles) {
			this._serviceLogger.debug('middleware', '_authorizationCheckRoles', 'userRole', userRole, request.correlationId);

			for (const role of request.roles) {
				this._serviceLogger.debug('middleware', '_authorizationCheckRoles', 'role', role, request.correlationId);

				roleParts = role.split('.');
				if (roleParts && roleParts.length < 1)
					success = false;

				roleObj = roleParts[0];
				roleAct = roleParts.length >= 2 ? roleParts[1] : null

				result = await this._serviceSecurity.validate(userRole, null, roleObj, roleAct);
				this._serviceLogger.debug('middleware', '_authorizationCheckRoles', 'result', result, request.correlationId);
				if (logical === logicalOr) {
					if (result)
						return result;

					success = false;
				}
				else
					success = success && result;
			}
		}

		return success;
	}

	_initalizeRoles (request, roles) {
		if (Array.isArray(roles)) {
			this._serviceLogger.debug('middleware', '_initalizeRoles', 'roles1a', roles);
			request.roles = roles;
			return;
		}
		
		if ((typeof(roles) === 'string') || (roles instanceof String)) {
			// logger.debug('middleware', '_initalizeRoles', 'roles1b', roles);
			request.roles = roles.split(',');
			request.roles.map(item => item ? item.trim() : item);
			return;
		}
	}
}

// const authorization = (roles, logical) => {
// 	if (String.isNullOrEmpty(logical) || (logical !== logicalAnd) || (logical !== logicalOr))
// 		logical = logicalOr;

export default DefaultAuthenticationMiddleware;
