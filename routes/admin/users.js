import LibraryConstants from '../../constants';

import AdminRoute from './index'

class UsersAdminRoute extends AdminRoute {
	constructor(urlFragment, role, serviceKey) {
		urlFragment = urlFragment ? urlFragment : 'users';
		role = role ? role : 'users';
		serviceKey = serviceKey ? serviceKey : LibraryConstants.InjectorKeys.SERVICE_ADMIN_USERS;
		super(urlFragment, role, serviceKey);
	}

	get id() {
		return 'admin-users';
	}

	_allowsCreate() {
		return false;
	}

	get _version() {
		return 'v1';
	}
}

export default UsersAdminRoute;
