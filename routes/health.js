import LibraryCommonnConstants from '@thzero/library_common/constants.js';
import LibraryServerConstants from '@thzero/library_server/constants.js';

import BaseRoute from './index.js';

class HealthRoute extends BaseRoute {
	constructor(prefix) {
		super(prefix ? prefix : '');
	}

	get id() {
		return 'health';
	}

	async init(injector, app, config) {
		await super.init(injector, app, config);
		// this._serviceHealth = injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_HEALTH);
		this._inject(app, injector, LibraryServerConstants.InjectorKeys.SERVICE_HEALTH, LibraryServerConstants.InjectorKeys.SERVICE_HEALTH);
	}

	get id() {
		return 'plans';
	}

	_initializeRoutes(router) {
		router.get(this._join(''),
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_HEALTH);
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_HEALTH].health(request.correlationId)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return  this._jsonResponse(reply, response);
			}
		);
	}

	get _version() {
		return 'v1';
	}
}

export default HomHealthRouteeRoute;
