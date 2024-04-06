import LibraryCommonnConstants from '@thzero/library_common/constants.js';
import LibraryServerConstants from '@thzero/library_server/constants.js';

import BaseRoute from './index.js';

class BaseUsersRoute extends BaseRoute {
	constructor(prefix, version) {
		super(prefix ? prefix : '/users');

		// this._serviceUsers = null;
	}

	async init(injector, app, config) {
		await super.init(injector, app, config);
		// this._serviceUsers = injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_USERS);
		this._inject(app, injector, LibraryServerConstants.InjectorKeys.SERVICE_USERS, LibraryServerConstants.InjectorKeys.SERVICE_USERS);
	}

	get id() {
		return 'users';
	}

	_initializeRoutes(router) {
		this._initializeRoutesGamerById(router);
		this._initializeRoutesGamerByTag(router);
		this._initializeRoutesByExternalId(router);
		this._initializeRoutesRefreshSettings(router);
		this._initializeRoutesUpdate(router);
		this._initializeRoutesUpdateSettings(router);
	}

	_initializeRoutesByExternalId(router) {
		return router.get(this._join('/:externalId'),
			// authentication(false),
			// // authorization('user'),
			{
				preHandler: router.auth([
					router.authenticationDefault,
					// router.authorizationDefault
				], 
				{ 
					relation: LibraryCommonnConstants.Security.logicalAnd,
					required: false,
					roles: [ 'user' ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_USERS].fetchByExternalId(request.correlationId, request.params.externalId)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return  this._jsonResponse(reply, response);
			}
		);
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
					relation: LibraryCommonnConstants.Security.logicalAnd,
					required: false,
					roles: [ 'user' ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_USERS].fetchByGamerId(request.correlationId, request.params.gamerId)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return  this._jsonResponse(reply, response);
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
					relation: LibraryCommonnConstants.Security.logicalAnd,
					required: false,
					roles: [ 'user' ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_USERS].fetchByGamerTag(request.correlationId, request.params.gamerTag)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return  this._jsonResponse(reply, response);
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
					relation: LibraryCommonnConstants.Security.logicalAnd,
					roles: [ 'user' ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_USERS].refreshSettings(request.correlationId, request.body)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return  this._jsonResponse(reply, response);
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
					relation: LibraryCommonnConstants.Security.logicalAnd,
					roles: [ 'user' ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_USERS].update(request.correlationId, request.body)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return this._jsonResponse(reply, response);
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
					relation: LibraryCommonnConstants.Security.logicalAnd,
					roles: [ 'user' ]
				}),
			},
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryServerConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryServerConstants.InjectorKeys.SERVICE_USERS].updateSettings(request.correlationId, request.body)).check(request);
				// https://github.com/fastify/fastify-compress/issues/215#issuecomment-1210598312
				return this._jsonResponse(reply, response);
			}
		);
	}
}

export default BaseUsersRoute;
