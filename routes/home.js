import LibraryCommonnConstants from '@thzero/library_common/constants.js';
import LibraryServerConstants from '@thzero/library_server/constants.js';

import BaseRoute from './index.js';

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
			reply.status(494).send();
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
