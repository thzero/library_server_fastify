import LibraryServerConstants from '@thzero/library_server/constants.js';

import AdminRoute from './index.js';

class NewsAdminRoute extends AdminRoute {
	constructor(urlFragment, role, serviceKey) {
		urlFragment = urlFragment ? urlFragment : 'news';
		role = role ? role : 'news';
		serviceKey = serviceKey ? serviceKey : LibraryServerConstants.InjectorKeys.SERVICE_ADMIN_NEWS;
		super(urlFragment, role, serviceKey);
	}

	get id() {
		return 'admin-news';
	}

	get _version() {
		return 'v1';
	}
}

export default NewsAdminRoute;
