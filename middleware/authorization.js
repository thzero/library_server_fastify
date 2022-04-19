import LibraryConstants from '@thzero/library_server/constants';
import LibraryCommonServiceConstants from '@thzero/library_common_service/constants';

import injector from '@thzero/library_common/utility/injector';

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

const authorizationCheckClaims = async (request, success, logical, security, logger) => {
	if (!request)
		return false;
	if (!(request.claims && Array.isArray(request.claims)))
		return false;

	let result;
	let roleAct;
	let roleObj;
	let roleParts;
	for (const claim of request.claims) {
		logger.debug('middleware', 'authorization', 'authorization.claim', claim, request.correlationId);

		for (const role of request.roles) {
			logger.debug('middleware', 'authorization', 'role', role, request.correlationId);

			roleParts = role.split('.');
			if (roleParts && roleParts.length < 1)
				success = false;

			roleObj = roleParts[0];
			roleAct = roleParts.length >= 2 ? roleParts[1] : null

			result = await security.validate(claim, null, roleObj, roleAct);
			logger.debug('middleware', 'authorization', 'result', result, request.correlationId);
			if (logical === logicalOr)
				success = success || result;
			else
				success = success && result;
		}
	}

	return success;
}

const authorizationCheckRoles = async (request, success, logical, security, logger) => {
	if (!request)
		return false;

	logger.debug('middleware', 'authorizationCheckRoles', 'user', request.user, request.correlationId);
	if (!(request.user && request.user.roles && Array.isArray(request.user.roles)))
		return false;

	logger.debug('middleware', 'authorizationCheckRoles', 'logical', logical, request.correlationId);

	let result;
	let roleAct;
	let roleObj;
	let roleParts;
	for (const userRole of request.user.roles) {
		logger.debug('middleware', 'authorizationCheckRoles', 'userRole', userRole, request.correlationId);

		for (const role of request.roles) {
			logger.debug('middleware', 'authorizationCheckRoles', 'role', role, request.correlationId);

			roleParts = role.split('.');
			if (roleParts && roleParts.length < 1)
				success = false;

			roleObj = roleParts[0];
			roleAct = roleParts.length >= 2 ? roleParts[1] : null

			result = await security.validate(userRole, null, roleObj, roleAct);
			logger.debug('middleware', 'authorizationCheckRoles', 'result', result, request.correlationId);
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

const initalizeRoles = (request, roles, logger) => {
	if (Array.isArray(roles)) {
		// logger.debug('middleware', 'initalizeRoles', 'roles1a', roles);
		request.roles = roles;
	}
	else if ((typeof(roles) === 'string') || (roles instanceof String)) {
		// logger.debug('middleware', 'initalizeRoles', 'roles1b', roles);
		request.roles = roles.split(',');
		request.roles.map(item => item ? item.trim() : item);
	}
}

// const authorization = (roles, logical) => {
// 	if (String.isNullOrEmpty(logical) || (logical !== logicalAnd) || (logical !== logicalOr))
// 		logical = logicalOr;

export default async (request, reply, done, options) => {
	let logical = logicalOr;
	let roles = [];
	if (options) {
		logical = options.logical;
		if (String.isNullOrEmpty(logical) || (logical !== logicalAnd) || (logical !== logicalOr))
			logical = logicalOr;
		
		if (options.roles && Array.isArray(options.roles) && (options.roles.length > 0))
			roles = options.roles;
	}

	const config = injector.getService(LibraryCommonServiceConstants.InjectorKeys.SERVICE_CONFIG);
	const logger = injector.getService(LibraryCommonServiceConstants.InjectorKeys.SERVICE_LOGGER);
	const security = injector.getService(LibraryConstants.InjectorKeys.SERVICE_SECURITY);

	// logger.debug('token', request.token);
	logger.debug('middleware', 'authorization', 'user', request.user, request.correlationId);
	logger.debug('middleware', 'authorization', 'claims', request.claims, request.correlationId);
	logger.debug('middleware', 'authorization', 'roles1', roles, request.correlationId);
	request.roles = [];
	if (roles) {
		// logger.debug('authorization.roles1', roles);
		// logger.debug('authorization.roles1', (typeof roles));
		// logger.debug('authorization.roles1', Array.isArray(roles));
		// logger.debug('authorization.roles1', ((typeof(roles) === 'string') || (roles instanceof String)));
		// if (Array.isArray(roles)) {
		// 	// logger.debug('authorization.roles1a', roles);
		// 	request.roles = roles;
		// }
		// else if ((typeof(roles) === 'string') || (roles instanceof String)) {
		// 	// logger.debug('authorization.roles1b', roles);
		// 	request.roles = roles.split(',');
		// 	request.roles.map(item => item ? item.trim() : item);
		// }
		initalizeRoles(request, roles, logger);
	}
	logger.debug('middleware', 'authorization', 'roles2', request.roles, request.correlationId);

	let success = false; //(logical === logicalOr ? false : true);
	if (request.roles && Array.isArray(request.roles) && (request.roles.length > 0)) {
		const auth = config.get('auth');
		if (auth) {
			logger.debug('middleware', 'authorization', 'auth.claims', auth.claims, request.correlationId);
			logger.debug('middleware', 'authorization', 'auth.claims.check', auth.claims.check, request.correlationId);
		}
		if (auth && auth.claims && auth.claims.check)
			success = await authorizationCheckClaims(request, (logical === logicalOr ? false : true), logical, security, logger);

		if (!success)
			success = await authorizationCheckRoles(request, (logical === logicalOr ? false : true), logical, security, logger);
	}

	logger.debug('middleware', 'authorization', 'success', null, request.success, request.correlationId);
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
		const serviceUsageMetrics = injector.getService(LibraryConstants.InjectorKeys.SERVICE_USAGE_METRIC);
		await serviceUsageMetrics.register(usageMetrics).catch((err) => {
			// const logger = injector.getService(LibraryCommonServiceConstants.InjectorKeys.SERVICE_LOGGER);
			logger.error('middleware', 'authorization', err, null, request.correlationId);
		});
	})();

	logger.warn('middleware', 'authorization', 'Unauthorized... authorization unknown', null, request.correlationId);
	// reply.code(401);
	// done(new Error('Unauthorized... authentication unknown')); // not for async
	throw new Error('Unauthorized... authentication unknown');
}
