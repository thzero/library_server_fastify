import LibraryCommonnConstants from '@thzero/library_common/constants.js';
import LibraryServerConstants from '@thzero/library_server/constants.js';

import BaseRoute from './index.js';

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
			{
				preHandler: router.auth([
					router.authenticationDefault,
					router.authorizationDefault
				],
				{
					relation: LibraryCommonnConstants.Security.logicalAnd,
					roles: [ 'admin' ]
				}),
			},
			 
			async (request, reply) => {
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_USAGE_METRIC].listing(request.correlationId, request.user, request.body)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return this._jsonResponse(reply, response);
			}
		);

		// Deliberately anonymous: no authentication chain, so request.user is
		// undefined here. UsageMetricsService.tag is written for that - it records
		// `user ? user.id : null` - so client telemetry before sign-in still lands.
		router.post(this._join('/usageMetrics/tag'),
			 
			async (request, reply) => {
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_USAGE_METRIC].tag(request.correlationId, request.user, request.body)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return this._jsonResponse(reply, response);
			}
		);
	}
}

export default UsageMetricsRoute;
