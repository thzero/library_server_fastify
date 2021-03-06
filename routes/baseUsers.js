import LibraryConstants from '@thzero/library_server/constants';

import Utility from '@thzero/library_common/utility';

import BaseRoute from './index';

class BaseUsersRoute extends BaseRoute {
	constructor(prefix, version) {
		super(prefix ? prefix : '/users');

		// this._serviceUsers = null;
	}

	async init(injector, app, config) {
		await super.init(injector, app, config);
		// this._serviceUsers = injector.getService(LibraryConstants.InjectorKeys.SERVICE_USERS);
		this._inject(app, injector, LibraryConstants.InjectorKeys.SERVICE_USERS, LibraryConstants.InjectorKeys.SERVICE_USERS);
	}

	get id() {
		return 'users';
	}

	_initializeRoutes(router) {
		this._initializeRoutesGamerById(router);
		this._initializeRoutesGamerByTag(router);
		this._initializeRoutesRefreshSettings(router);
		this._initializeRoutesUpdate(router);
		this._initializeRoutesUpdateSettings(router);
	}

	_initializeRoutesGamerById(router) {
		return router.get(this._join('/gamerId/:gamerId'),
			// authentication(false),
			// // authorization('user'),
			{
				preHandler: router.auth([
					router.authenticationDefault,
					// router.authorizationDefault
				], 
				{ 
					relation: 'and',
					required: false,
					roles: [ 'user' ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_USERS].fetchByGamerId(request.correlationId, request.params.gamerId)).check(request);
				this._jsonResponse(reply, response);
			}
		);
	}

	_initializeRoutesGamerByTag(router) {
		return router.get(this._join('/gamerTag/:gamerTag'),
			// authentication(false),
			// // authorization('user'),
			{
				preHandler: router.auth([
					router.authenticationDefault,
					// router.authorizationDefault
				], 
				{ 
					relation: 'and',
					required: false,
					roles: [ 'user' ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_USERS].fetchByGamerTag(request.correlationId, request.params.gamerTag)).check(request);
				this._jsonResponse(reply, response);
			}
		);
	}

	_initializeRoutesRefreshSettings(router) {
		return router.post(this._join('/refresh/settings'),
			// authentication(true),
			// authorization('user'),
			{
				preHandler: router.auth([
					router.authenticationDefault,
					router.authorizationDefault
				], 
				{ 
					relation: 'and',
					roles: [ 'user' ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_USERS].refreshSettings(request.correlationId, request.body)).check(request);
				this._jsonResponse(reply, response);
			}
		);
	}

	_initializeRoutesUpdate(router) {
		return router.post(this._join('/update'),
			// authentication(true),
			// authorization('user'),
			{
				preHandler: router.auth([
					router.authenticationDefault,
					// router.authorizationDefault
				], 
				{ 
					relation: 'and',
					roles: [ 'user' ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_USERS].update(request.correlationId, request.body)).check(request);
				this._jsonResponse(reply, response);
			}
		);
	}

	_initializeRoutesUpdateSettings(router) {
		return router.post(this._join('/update/settings'),
			// authentication(true),
			// authorization('user'),
			{
				preHandler: router.auth([
					router.authenticationDefault,
					router.authorizationDefault
				], 
				{ 
					relation: 'and',
					roles: [ 'user' ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_USERS].updateSettings(request.correlationId, request.body)).check(request);
				this._jsonResponse(reply, response);
			}
		);
	}
}

export default BaseUsersRoute;
