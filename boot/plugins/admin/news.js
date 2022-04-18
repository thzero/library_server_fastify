import BaseNewsAdminBootPlugin from '@thzero/library_server/boot/plugins/admin/news';

import adminNewsRoute from '../../../routes/admin/news';

class NewsAdminBootPlugin extends BaseNewsAdminBootPlugin {
	_initRoutesAdminNews() {
		return new adminNewsRoute();
	}
}

export default NewsAdminBootPlugin;
