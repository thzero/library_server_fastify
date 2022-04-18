import LibraryConstants from '../constants';

import Utility from '@thzero/library_common/utility';

import BaseRoute from './index';

import authentication from '../middleware/authentication';

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
		// authentication(false),
		router.get(this._join('/latest/:date'), 
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_NEWS);
				// const response = (await service.latest(ctx.correlationId, ctx.state.user, parseInt(ctx.params.date))).check(ctx);
				const response = (await request.serviceNews.latest(request.correlationId, request.user, parseInt(request.params.date))).check(request);
				this._jsonResponse(reply, Utility.stringify(response));
			});
	}
}

export default BaseNewsRoute;
