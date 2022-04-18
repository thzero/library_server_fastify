import koaBody from 'koa-body';

import Utility from '@thzero/library_common/utility';

import BaseRoute from '../index';

import authentication from '../../middleware/authentication';
import authorization from '../../middleware/authorization';

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

	async init(injector, config) {
		const router = await super.init(injector, config);
		router.service = injector.getService(this._options.serviceKey);
		// this._service = injector.getService(this._options.serviceKey);
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
		router.post('/',
			authentication(true),
			authorization([ `${self._options.role}.create` ]),
			koaBody({
				text: false,
			}),
			// eslint-disable-next-line
			async (ctx, next) => {
				// const service = this._injector.getService(this._options.serviceKey);
				// const response = (await router.service.create(ctx.correlationId, ctx.state.user, ctx.request.body)).check(ctx);
				const response = (await ctx.router.service.create(ctx.correlationId, ctx.state.user, ctx.request.body)).check(ctx);
				this._jsonResponse(ctx, Utility.stringify(response));
			}
		);
	}

	_initializeRoutesDelete(router) {
		const self = this;
		router.delete('/:id',
			authentication(true),
			authorization([ `${self._options.role}.delete` ]),
			// eslint-disable-next-line
			async (ctx, next) => {
				// const service = this._injector.getService(this._options.serviceKey);
				// const response = (await service.delete(ctx.correlationId, ctx.state.user, ctx.params.id)).check(ctx);
				const response = (await ctx.router.service.delete(ctx.correlationId, ctx.state.user, ctx.params.id)).check(ctx);
				this._jsonResponse(ctx, Utility.stringify(response));
			}
		);
	}

	_initializeRoutesUpdate(router) {
		const self = this;
		router.post('/:id',
			authentication(true),
			authorization([ `${self._options.role}.update` ]),
			koaBody({
				text: false,
			}),
			// eslint-disable-next-line
			async (ctx, next) => {
				// const service = this._injector.getService(this._options.serviceKey);
				// const response = (await service.update(ctx.correlationId, ctx.state.user, ctx.params.id, ctx.request.body)).check(ctx);
				const response = (await ctx.router.service.update(ctx.correlationId, ctx.state.user, ctx.params.id, ctx.request.body)).check(ctx);
				this._jsonResponse(ctx, Utility.stringify(response));
			}
		);
	}

	_initializeRoutes(router) {
		if (this._allowsDelete)
			this._initializeRoutesDelete(router);

		router.post('/search',
			authentication(true),
			authorization([ `${this._options.role}.search` ]),
			koaBody({
				text: false,
			}),
			// eslint-disable-next-line
			async (ctx, next) => {
				// const service = this._injector.getService(this._options.serviceKey);
				// const response = (await service.search(ctx.correlationId, ctx.state.user, ctx.request.body)).check(ctx);
				const response = (await ctx.router.service.search(ctx.correlationId, ctx.state.user, ctx.request.body)).check(ctx);
				this._jsonResponse(ctx, Utility.stringify(response));
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
