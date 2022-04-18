import BaseUsersApiBootPlugin from '@thzero/library_server/boot/plugins/users';

import usersRoute from '../../routes/users';

class UsersApiBootPlugin extends BaseUsersApiBootPlugin {
	_initRoutesUsers() {
		return new usersRoute();
	}
}

export default UsersApiBootPlugin;
