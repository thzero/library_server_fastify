import BaseUsersApiBootPlugin from '@thzero/library_server/boot/plugins/users.js';

import usersRoute from '../../routes/users.js';

class UsersApiBootPlugin extends BaseUsersApiBootPlugin {
	_initRoutesUsers() {
		return new usersRoute();
	}
}

export default UsersApiBootPlugin;
