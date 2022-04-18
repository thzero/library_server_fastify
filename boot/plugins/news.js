import BaseNewsApiBootPlugin from '@thzero/library_server/boot/plugins/news';

import newsRoute from '../../routes/news';

class NewsApiBootPlugin extends BaseNewsApiBootPlugin {
	_initRoutesNews() {
		return new newsRoute();
	}
}

export default NewsApiBootPlugin;
