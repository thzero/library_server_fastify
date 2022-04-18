import koaBody from 'koa-body';

import LibraryConstants from '../constants';

import Utility from '@thzero/library_common/utility';

import BaseRoute from './index';

import authentication from '../middleware/authentication';
import authorization from '../middleware/authorization';

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
		return router.get('/gamerId/:gamerId',
			// authentication(false),
			// // authorization('user'),
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_USERS].fetchByGamerId(request.correlationId, request.params.gamerId)).check(request);
				this._jsonResponse(reply, Utility.stringify(response));
			}
		);
	}

	_initializeRoutesGamerByTag(router) {
		return router.get('/gamerTag/:gamerTag',
			// authentication(false),
			// // authorization('user'),
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_USERS].fetchByGamerTag(request.correlationId, request.params.gamerTag)).check(request);
				this._jsonResponse(reply, Utility.stringify(response));
			}
		);
	}

	_initializeRoutesRefreshSettings(router) {
		return router.post('/refresh/settings',
			// authentication(true),
			// authorization('user'),
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_USERS].refreshSettings(request.correlationId, request.body)).check(request);
				this._jsonResponse(reply, Utility.stringify(response));
			}
		);
	}

	_initializeRoutesUpdate(router) {
		return router.post('/update',
			// authentication(true),
			// authorization('user'),
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_USERS].update(request.correlationId, request.body)).check(request);
				this._jsonResponse(reply, Utility.stringify(response));
			}
		);
	}

	_initializeRoutesUpdateSettings(router) {
		return router.post('/update/settings',
			// authentication(true),
			// authorization('user'),
			// eslint-disable-next-line
			async (request, reply) => {
				// const service = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_USERS);
				const response = (await router[LibraryConstants.InjectorKeys.SERVICE_USERS].updateSettings(request.correlationId, request.body)).check(request);
				this._jsonResponse(reply, Utility.stringify(response));
			}
		);
	}
}

export default BaseUsersRoute;
