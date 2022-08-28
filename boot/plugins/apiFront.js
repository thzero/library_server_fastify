import BaseApiFrontBootPlugin from '@thzero/library_server/boot/plugins/apiFront.js';

import homeRoute from '../../routes/home.js';
import utilityRoute from '../../routes/utility.js';
import versionRoute from '../../routes/version.js';

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
