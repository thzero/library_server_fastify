import BaseApiBootPlugin from '@thzero/library_server/boot/plugins/api';

import homeRoute from '../../routes/home';
import versionRoute from '../../routes/version';

class ApiBootPlugin extends BaseApiBootPlugin {
	_initRoutesHome() {
		return new homeRoute();
	}

	_initRoutesVersion() {
		return new versionRoute();
	}
}

export default ApiBootPlugin;
