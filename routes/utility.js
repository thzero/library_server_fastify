import LibraryConstants from '@thzero/library_server/constants';

import Utility from '@thzero/library_common/utility';

import BaseRoute from './index';

class UtilityRoute extends BaseRoute {
	constructor(prefix) {
		super(prefix ? prefix : '/utility');

		// this._serviceUtility = null;
	}

	async init(injector, app, config) {
		await super.init(injector, app, config);
		// this._serviceUtility = injector.getService(LibraryConstants.InjectorKeys.SERVICE_UTILITY);
		this._inject(app, injector, LibraryConstants.InjectorKeys.SERVICE_UTILITY, LibraryConstants.InjectorKeys.SERVICE_UTILITY);
	}

	get id() {
		return 'utility';
	}

	_initializeRoutes(router) {
		router.post('/logger',
			// authentication(false),
			// // authorization('utility'),
			{
				preHandler: router.auth([
					router.authenticationDefault,
					// router.authorizationDefault
				], 
				{ 
					relation: 'and',
					required: false,
					roles: [ 'utility' ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_UTILITY);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_UTILITY].logger(request.correlationId, request.body)).check(request);
				this._jsonResponse(reply, response);
			}
		);
	}

	get _version() {
		return 'v1';
	}
}

export default UtilityRoute;
