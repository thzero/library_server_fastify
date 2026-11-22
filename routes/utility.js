import LibraryCommonnConstants from '@thzero/library_common/constants.js';
import LibraryCommonServiceConstants from '@thzero/library_common_service/constants.js';
import LibraryServerConstants from '@thzero/library_server/constants.js';

import BaseRoute from './index.js';

class UtilityRoute extends BaseRoute {
	constructor(prefix) {
		super(prefix ? prefix : '/utility');

		this._loggerRequiresAuth = false;
		// this._serviceUtility = null;
	}

	async init(injector, app, config) {
		const serviceConfig = config ?? injector.getService(LibraryCommonServiceConstants.InjectorKeys.SERVICE_CONFIG);
		const auth = serviceConfig ? serviceConfig.get('auth', null) : null;
		this._loggerRequiresAuth = !!(auth && auth.logger && auth.logger.external && (auth.logger.external.required === true));

		await super.init(injector, app, config);

		// this._serviceUtility = injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_UTILITY);
		this._inject(app, injector, LibraryServerConstants.InjectorKeys.SERVICE_UTILITY, LibraryServerConstants.InjectorKeys.SERVICE_UTILITY);
	}

	get id() {
		return 'utility';
	}

	_initializeRoutes(router) {
		router.get(this._join('/initialize'),
			 
			async (request, reply) => {
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_UTILITY].initialize(request.correlationId)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return this._jsonResponse(reply, response);
			}
		);

		router.post(this._join('/logger'),
			// authentication(false),
			// // authorization('utility'),
			this._loggerRequiresAuth ? {
				preHandler: router.auth([
					router.authenticationDefault,
					// router.authorizationDefault
				], 
				{
					relation: LibraryCommonnConstants.Security.logicalAnd,
					required: true,
					roles: [ 'utility' ]
				}),
			} : {},
			 
			async (request, reply) => {
				// const service = this._injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_UTILITY);
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_UTILITY].logger(request.correlationId, request.body)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return  this._jsonResponse(reply, response);
			}
		);
		
		router.get(this._join('/openSource'),
			 
			async (request, reply) => {
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_UTILITY].openSource(request.correlationId)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return this._jsonResponse(reply, response);
			}
		);
	}

	get _version() {
		return 'v1';
	}
}

export default UtilityRoute;
