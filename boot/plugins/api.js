import BaseApiBootPlugin from '@thzero/library_server/boot/plugins/api.js';

import homeRoute from '../../routes/home.js';
import usageMetricsRoute from '../../routes/usageMetrics.js';
import versionRoute from '../../routes/version.js';

class ApiBootPlugin extends BaseApiBootPlugin {
	_initRoutesHome() {
		return new homeRoute();
	}

	_initRoutesUsageMetrics() {
		return new usageMetricsRoute();
	}

	_initRoutesVersion() {
		return new versionRoute();
	}
}

export default ApiBootPlugin;
