import LibraryConstants from '@thzero/library_server/constants';

import Utility from '@thzero/library_common/utility';

import BaseRoute from './index';

class BaseNewsRoute extends BaseRoute {
	constructor(prefix, version) {
		super(prefix ? prefix : '/news');

		// this._serviceNews = null;
	}

	async init(injector, app, config) {
		await super.init(injector, app, config);
		// this._serviceNews = injector.getService(LibraryConstants.InjectorKeys.SERVICE_NEWS);
		this._inject(app, injector, LibraryConstants.InjectorKeys.SERVICE_NEWS, LibraryConstants.InjectorKeys.SERVICE_NEWS);
	}

	get id() {
		return 'news';
	}

	_initializeRoutes(router) {
		router.get(this._join('/latest/:date'), 
			// authentication(false),
			{
				preHandler: router.auth([
					router.authenticationDefault,
					// router.authorizationDefault
				], 
				{ 
					relation: 'and',
					required: false,
					roles: [ 'news' ]
				}),
			},
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_NEWS);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_NEWS].latest(request.correlationId, request.user, parseInt(request.params.date))).check(request);
				this._jsonResponse(reply, response);
			});
	}
}

export default BaseNewsRoute;
