import BaseApiFrontBootPlugin from '@thzero/library_server/boot/plugins/apiFront';

import homeRoute from '../../routes/home';
import utilityRoute from '../../routes/utility';
import versionRoute from '../../routes/version';

class FrontApiBootPlugin extends BaseApiFrontBootPlugin {
	_initRoutesHome() {
		return new homeRoute();
	}

	_initRoutesVersion() {
		return new versionRoute();
	}

	_initRoutesUtility() {
		return new utilityRoute();
	}
}

export default FrontApiBootPlugin;
