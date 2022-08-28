import BaseNewsApiBootPlugin from '@thzero/library_server/boot/plugins/news.js';

import newsRoute from '../../routes/news.js';

class NewsApiBootPlugin extends BaseNewsApiBootPlugin {
	_initRoutesNews() {
		return new newsRoute();
	}
}

export default NewsApiBootPlugin;
