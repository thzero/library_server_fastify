import BaseNewsAdminBootPlugin from '@thzero/library_server/boot/plugins/admin/news.js';

import adminNewsRoute from '../../../routes/admin/news.js';

class NewsAdminBootPlugin extends BaseNewsAdminBootPlugin {
	_initRoutesAdminNews() {
		return new adminNewsRoute();
	}
}

export default NewsAdminBootPlugin;
