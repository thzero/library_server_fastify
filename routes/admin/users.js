import LibraryServerConstants from '@thzero/library_server/constants.js';

import AdminRoute from './index.js';

class UsersAdminRoute extends AdminRoute {
	constructor(urlFragment, role, serviceKey) {
		urlFragment = urlFragment ? urlFragment : 'users';
		role = role ? role : 'users';
		serviceKey = serviceKey ? serviceKey : LibraryServerConstants.InjectorKeys.SERVICE_ADMIN_USERS;
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
