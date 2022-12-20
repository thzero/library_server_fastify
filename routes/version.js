import LibraryConstants from '@thzero/library_server/constants.js';

import BaseRoute from './index.js';

class VersionRoute extends BaseRoute {
	constructor(prefix) {
		super(prefix ? prefix : '');

		// this._serviceVersion = null;
	}

	async init(injector, app, config) {
		await super.init(injector, app, config);
		// this._serviceVersion = injector.getService(LibraryConstants.InjectorKeys.SERVICE_VERSION);
		this._inject(app, injector, LibraryConstants.InjectorKeys.SERVICE_VERSION, LibraryConstants.InjectorKeys.SERVICE_VERSION);
	}

	get id() {
		return 'version';
	}

	_initializeRoutes(router) {
		router.get(this._join('/version'), 
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_VERSION);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_VERSION].version(request.correlationId)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return  this._jsonResponse(reply, response);
			}
		);
	}

	get _version() {
		return 'v1';
	}
}

export default VersionRoute;
