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
		await super.init(injector, app, config);

		const serviceConfig = injector.getService(LibraryCommonServiceConstants.InjectorKeys.SERVICE_CONFIG);
		// this._serviceUtility = injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_UTILITY);
		this._inject(app, injector, LibraryServerConstants.InjectorKeys.SERVICE_UTILITY, LibraryServerConstants.InjectorKeys.SERVICE_UTILITY);

		const auth = serviceConfig.get('auth');
		if (auth) {
			const temp = auth.logger && auth.logger.external.required && auth.logger.external.required ? auth.logger.external.required : false;
			this._loggerRequiresAuth = temp;
		}
	}

	get id() {
		return 'utility';
	}

	_initializeRoutes(router) {
		router.get(this._join('/initialize'),
			// eslint-disable-next-line
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
					required: false,
					roles: [ 'utility' ]
				}),
			} : {},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_UTILITY);
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_UTILITY].logger(request.correlationId, request.body)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return  this._jsonResponse(reply, response);
			}
		);
		
		router.get(this._join('/openSource'),
			// eslint-disable-next-line
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
