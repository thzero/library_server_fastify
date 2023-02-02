import LibraryServerConstants from '@thzero/library_server/constants.js';

import BaseRoute from './index.js';

class BaseNewsRoute extends BaseRoute {
	constructor(prefix, version) {
		super(prefix ? prefix : '/news');

		// this._serviceNews = null;
	}

	async init(injector, app, config) {
		await super.init(injector, app, config);
		// this._serviceNews = injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_NEWS);
		this._inject(app, injector, LibraryServerConstants.InjectorKeys.SERVICE_NEWS, LibraryServerConstants.InjectorKeys.SERVICE_NEWS);
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
				// const service = this._injector.getService(ServerConstants.InjectorKeys.SERVICE_NEWS);
				const response = (await router[ServerConstants.InjectorKeys.SERVICE_NEWS].latest(request.correlationId, request.user, parseInt(request.params.date))).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return  this._jsonResponse(reply, response);
			});
	}
}

export default BaseNewsRoute;
