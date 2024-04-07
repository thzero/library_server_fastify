import LibraryServerConstants from '@thzero/library_server/constants.js';

import BaseRoute from '@thzero/library_server_fastify/routes/index.js';

class UsageMetricsRoute extends BaseRoute {
	constructor(prefix) {
		super(prefix ? prefix : '');
	}

	async init(injector, app, config) {
		await super.init(injector, app, config);
		
		this._inject(app, injector, LibraryServerConstants.InjectorKeys.SERVICE_USAGE_METRIC, LibraryServerConstants.InjectorKeys.SERVICE_USAGE_METRIC);
	}

	_initializeRoutes(router) {
		super._initializeRoutes(router);

		router.post(this._join('/usageMetrics/listing'),
			// eslint-disable-next-line
			async (request, reply) => {
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_USAGE_METRIC].listing(request.correlationId, request.user, request.body)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return this._jsonResponse(reply, response);
			}
		);

		router.post(this._join('/usageMetrics/tag'),
			// eslint-disable-next-line
			async (request, reply) => {
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_USAGE_METRIC].tag(request.correlationId, request.user, request.body)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return this._jsonResponse(reply, response);
			}
		);
	}
}

export default UsageMetricsRoute;
