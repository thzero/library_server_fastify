import fastifyPlugin from 'fastify-plugin';

import LibraryCommonUtility from '@thzero/library_common/utility/index.js';

import BaseRoute from'@thzero/library_server/routes/index.js';

class FastifyBaseRoute extends BaseRoute {
	_initializeRouter(app, config) {
		return app;
	}

	async _inject(app, injector, key, name) {
		const service = injector.getService(key);
		if (!service)
			throw Error(`Invalid service for '${key}'.`);

		app.register(fastifyPlugin((instance, opts, done) => {
			instance.decorate(opts.name, opts.service);
			done();
		}), {
			name: name,
			service: service
		});
	}

	_join(path) {
		return this._prefix + path; 
	}

	_jsonResponse(reply, json) {
		if (!reply)
			throw Error('Invalid context for response.');
			
		return reply
			.code(200)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send((typeof json === 'string') ? json : LibraryCommonUtility.stringify(json));
	}
}

export default FastifyBaseRoute;
