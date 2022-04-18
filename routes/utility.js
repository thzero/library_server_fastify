import koaBody from 'koa-body';

import LibraryConstants from '../constants';

import Utility from '@thzero/library_common/utility';

import BaseRoute from './index';

import authentication from '../middleware/authentication';
// import authorization from '../middleware/authorization';

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
			authentication(false),
			// authorization('utility'),
			// eslint-disable-next-line,
			koaBody({
				text: false,
			}),
			async (ctx, next) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_UTILITY);
				// const response = (await service.logger(ctx.correlationId, ctx.request.body)).check(ctx);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_UTILITY].logger(request.correlationI, request.body)).check(request);
				this._jsonResponse(reply, Utility.stringify(response));
			}
		);
	}

	get _version() {
		return 'v1';
	}
}

export default UtilityRoute;
