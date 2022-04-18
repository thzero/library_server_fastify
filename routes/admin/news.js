import LibraryConstants from '../../constants';

import AdminRoute from './index'

class NewsAdminRoute extends AdminRoute {
	constructor(urlFragment, role, serviceKey) {
		urlFragment = urlFragment ? urlFragment : 'news';
		role = role ? role : 'news';
		serviceKey = serviceKey ? serviceKey : LibraryConstants.InjectorKeys.SERVICE_ADMIN_NEWS;
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
