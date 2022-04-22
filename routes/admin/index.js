import BaseRoute from '../index';

class AdminBaseRoute extends BaseRoute {
	constructor(urlFragment, role, serviceKey) {
		if (!urlFragment)
			throw Error('Invalid url fragment');

		super(`/admin/${urlFragment}`);

		this._options = {
			role: role,
			serviceKey: serviceKey
		}

		// this._service = null;
	}

	async init(injector, app, config) {
		await super.init(injector, app, config);
		this._inject(app, injector, this._options.serviceKey, this._options.serviceKey);
	}

	_allowsCreate() {
		return true;
	}

	_allowsDelete() {
		return true;
	}

	_allowsUpdate() {
		return true;
	}

	_initializeRoutesCreate(router) {
		const self = this;
		router.post(this._join('/'),
			// authentication(true),
			// authorization([ `${self._options.role}.create` ]),
			{
				preHandler: router.auth([
					router.authenticationDefault,
					router.authorizationDefault
				], 
				{ 
					relation: 'and',
					roles: [ `${self._options.role}.create` ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				const response = (await router[this._options.serviceKey].create(request.correlationId, request.user, request.body)).check(request);
				this._jsonResponse(reply, response);
			}
		);
	}

	_initializeRoutesDelete(router) {
		router.delete(this._join('/:id'),
			// authentication(true),
			// authorization([ `${this._options.role}.delete` ]),
			{
				preHandler: router.auth([
					router.authenticationDefault,
					router.authorizationDefault
				], 
				{ 
					relation: 'and',
					roles: [ `${this._options.role}.delete` ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				const response = (await router[this._options.serviceKey].delete(request.correlationId, request.user, request.params.id)).check(request);
				this._jsonResponse(reply, response);
			}
		);
	}

	_initializeRoutesUpdate(router) {
		router.post(this._join('/:id'),
			// authentication(true),
			// authorization([ `${this._options.role}.update` ]),
			{
				preHandler: router.auth([
					router.authenticationDefault,
					router.authorizationDefault
				], 
				{ 
					relation: 'and',
					roles: [ `${this._options.role}.update` ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				const response = (await router[this._options.serviceKey].update(request.correlationId, request.user, request.params.id, request.body)).check(request);
				this._jsonResponse(reply, response);
			}
		);
	}

	_initializeRoutes(router) {
		if (this._allowsDelete)
			this._initializeRoutesDelete(router);

		router.post(this._join('/search'),
			// authentication(true),
			// authorization([ `${this._options.role}.search` ]),
			{
				preHandler: router.auth([
					router.authenticationDefault,
					router.authorizationDefault
				], 
				{ 
					relation: 'and',
					roles: [ `${this._options.role}.search` ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				const response = (await router[this._options.serviceKey].search(request.correlationId, request.user, request.body)).check(request);
				this._jsonResponse(reply, response);
			}
		);

		if (this._allowsUpdate())
			this._initializeRoutesUpdate(router);

		if (this._allowsCreate())
			this._initializeRoutesCreate(router);

		return router;
	}
}

export default AdminBaseRoute;
