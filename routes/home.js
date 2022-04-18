import BaseRoute from './index';

class HomeRoute extends BaseRoute {
	constructor(prefix) {
		super(prefix ? prefix : '');
	}

	get id() {
		return 'home';
	}

	_initializeRoutes(router) {
		// eslint-disable-next-linethis._prefix
		router.get(this._join('/'), (request, reply) => {
			reply.status(401).send();
		});
	}

	get _ignoreApi() {
		return true;
	}

	get _version() {
		return '';
	}
}

export default HomeRoute;
