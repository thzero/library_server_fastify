import BaseExtendedUsersApiBootPlugin from '@thzero/library_server/boot/plugins/usersExtended';

import plansService from '../../service/plans';

class ExtendedUsersApiBootPlugin extends BaseExtendedUsersApiBootPlugin {
	_initServicesPlans() {
		return new plansService();
	}
}

export default ExtendedUsersApiBootPlugin;
