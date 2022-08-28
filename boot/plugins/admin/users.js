import BaseUsersAdminBootPlugin from '@thzero/library_server/boot/plugins/admin/users.js';

import adminUsersRoute from '../../../routes/admin/users.js'

class UsersAdminBootPlugin extends BaseUsersAdminBootPlugin {
	_initRoutesAdminUsers() {
		return new adminUsersRoute();
	}
}

export default UsersAdminBootPlugin;
