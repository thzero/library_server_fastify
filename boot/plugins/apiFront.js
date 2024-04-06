import BaseApiFrontBootPlugin from '@thzero/library_server/boot/plugins/apiFront.js';

import homeRoute from '../../routes/home.js';
import usageMetricsRoute from '../../routes/usageMetrics.js';
import utilityRoute from '../../routes/utility.js';
import versionRoute from '../../routes/version.js';

class FrontApiBootPlugin extends BaseApiFrontBootPlugin {
	_initRoutesHome() {
		return new homeRoute();
	}

	_initRoutesUsageMetrics() {
		return new usageMetricsRoute();
	}

	_initRoutesVersion() {
		return new versionRoute();
	}

	_initRoutesUtility() {
		return new utilityRoute();
	}
}

export default FrontApiBootPlugin;
