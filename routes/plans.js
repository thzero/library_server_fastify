import LibraryConstants from '@thzero/library_server/constants.js';

import BaseRoute from './index.js';

class PlansRoute extends BaseRoute {
	constructor(prefix) {
		super(prefix ? prefix : '/plans');

		// this._servicePlans = null;
	}

	async init(injector, app, config) {
		await super.init(injector, app, config);
		// this._servicePlans = injector.getService(LibraryConstants.InjectorKeys.SERVICE_PLANS);
		this._inject(app, injector, LibraryConstants.InjectorKeys.SERVICE_PLANS, LibraryConstants.InjectorKeys.SERVICE_PLANS);
	}

	get id() {
		return 'plans';
	}

	_initializeRoutes(router) {
		router.get(this._join(''),
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_PLANS);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_PLANS].listing(request.correlationId, request.body)).check(request);
				this._jsonResponse(reply, response);
			}
		);
	}

	get _version() {
		return 'v1';
	}
}

export default PlansRoute;
