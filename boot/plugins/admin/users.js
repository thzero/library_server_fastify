import BaseUsersAdminBootPlugin from '@thzero/library_server/boot/plugins/admin/users';

import adminUsersRoute from '../../../routes/admin/users'

class UsersAdminBootPlugin extends BaseUsersAdminBootPlugin {
	_initRoutesAdminUsers() {
		return new adminUsersRoute();
	}
}

export default UsersAdminBootPlugin;
