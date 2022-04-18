import BaseApiFrontBootPlugin from '@thzero/library_server/boot/plugins/apiFront';

import utilityRoute from '../../routes/utility';

class FrontApiBootPlugin extends BaseApiFrontBootPlugin {
	_initRoutesUtility() {
		return new utilityRoute();
	}
}

export default FrontApiBootPlugin;
