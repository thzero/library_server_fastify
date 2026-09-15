import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import '@thzero/library_common/utility/string.js';
import LibraryServerConstants from '@thzero/library_server/constants.js';
import pluginResponseTime from '../plugins/responseTime.js';
import pluginUsageMetrics from '../plugins/usageMetrics.js';
import pluginApiKey from '../plugins/apiKey.js';

const AUTH = LibraryServerConstants.Headers.AuthKeys.AUTH;
const API = LibraryServerConstants.Headers.AuthKeys.API;

// fastify-plugin wraps the function; the original is on .default or the fn itself.
const unwrap = (plugin) => plugin[Symbol.for('plugin-meta')] ? plugin : plugin;

// Minimal instance that just captures the hooks a plugin registers.
const newInstance = () => {
	const hooks = {};
	return {
		hooks,
		addHook(name, fn) { (hooks[name] ||= []).push(fn); },
		decorateReply() {},
		decorate() {}
	};
};

const newRequest = (headers = {}) => ({
	headers,
	correlationId: 'cid',
	url: '/x',
	hostname: 'host',
	query: {},
	routeOptions: { url: '/x' },
	raw: {},
	req: {}
});

const newReply = () => {
	const reply = { raw: {}, headers: {}, statusCode: null };
	reply.header = (name, value) => { reply.headers[name] = value; return reply; };
	reply.status = (code) => { reply.statusCode = code; return reply; };
	reply.code = reply.status;
	reply.send = () => reply;
	return reply;
};

const load = (plugin, opts) => {
	const instance = newInstance();
	unwrap(plugin)(instance, opts, () => {});
	return instance;
};

describe('responseTime', () => {
	// Regression: the plugin stored process.hrtime() at request start and then
	// formatted that stored value on send, instead of calling
	// process.hrtime(start) to take a delta. The header reported process uptime -
	// measured at ~172,000,000 ms for a request that took ~49 ms.
	it('reports elapsed time, not an absolute reading', async () => {
		const logged = [];
		const instance = load(pluginResponseTime, { logger: { info2: (line) => logged.push(line) } });

		const request = newRequest();
		const reply = newReply();
		await new Promise(resolve => instance.hooks.onRequest[0](request, reply, resolve));
		const started = Date.now();
		while (Date.now() - started < 20) { /* burn ~20ms */ }
		await new Promise(resolve => instance.hooks.onSend[0](request, reply, null, resolve));

		const reported = Number(reply.headers['X-Response-Time']);
		assert.ok(Number.isFinite(reported), 'header must be a number');
		assert.ok(reported >= 15 && reported < 5000,
			`expected roughly the elapsed 20ms, got ${reported}`);
	});

	it('logs the same duration it reports', async () => {
		const logged = [];
		const instance = load(pluginResponseTime, { logger: { info2: (line) => logged.push(line) } });
		const request = newRequest();
		const reply = newReply();
		await new Promise(resolve => instance.hooks.onRequest[0](request, reply, resolve));
		await new Promise(resolve => instance.hooks.onSend[0](request, reply, null, resolve));
		assert.equal(logged.length, 1);
		assert.ok(logged[0].includes(reply.headers['X-Response-Time']));
	});
});

describe('usageMetrics plugin', () => {
	// Regression: this hook is onSend, so it fires on EVERY response - including
	// successful ones, where request.token holds a live bearer token. It was the
	// copy that actually leaked credentials on normal traffic.
	it('strips credentials from the recorded payload', async () => {
		const registered = [];
		const instance = load(pluginUsageMetrics, {
			usageMetrics: { async register(payload) { registered.push(payload); } },
			logger: { error() {} }
		});

		const request = newRequest({
			[AUTH]: 'Bearer SECRET.TOKEN.VALUE',
			[API]: 'ak_live_SECRET',
			'user-agent': 'test-agent'
		});
		request.token = 'SECRET.TOKEN.VALUE';

		await new Promise(resolve => instance.hooks.onSend[0](request, newReply(), null, resolve));
		await new Promise(resolve => setImmediate(resolve));

		assert.equal(registered.length, 1);
		const blob = JSON.stringify(registered[0]);
		assert.ok(!blob.includes('SECRET.TOKEN.VALUE'), 'bearer token must not be recorded');
		assert.ok(!blob.includes('ak_live_SECRET'), 'api key must not be recorded');
		assert.ok(blob.includes('test-agent'), 'other headers are still kept');
	});

	it('records the url and correlationId', async () => {
		const registered = [];
		const instance = load(pluginUsageMetrics, {
			usageMetrics: { async register(payload) { registered.push(payload); } },
			logger: { error() {} }
		});
		await new Promise(resolve => instance.hooks.onSend[0](newRequest(), newReply(), null, resolve));
		await new Promise(resolve => setImmediate(resolve));
		assert.equal(registered[0].url, '/x');
		assert.equal(registered[0].correlationId, 'cid');
	});
});

describe('apiKey plugin', () => {
	const config = (apiKey) => ({ get: () => ({ apiKey }) });

	it('passes a request carrying the configured key', async () => {
		const instance = load(pluginApiKey, { logger: { error() {} }, usageMetrics: { async register() {} } });
		const request = newRequest({ [API]: 'secret-key' });
		request.config = config('secret-key');
		const reply = newReply();
		let passed = false;
		await new Promise(resolve => instance.hooks.onRequest[0](request, reply, () => { passed = true; resolve(); }));
		assert.equal(passed, true);
		assert.equal(reply.statusCode, null);
	});

	it('rejects a request with the wrong key', async () => {
		const registered = [];
		const instance = load(pluginApiKey, {
			logger: { error() {} },
			usageMetrics: { async register(payload) { registered.push(payload); } }
		});
		const request = newRequest({ [API]: 'wrong' });
		request.config = config('secret-key');
		const reply = newReply();
		instance.hooks.onRequest[0](request, reply, () => { throw new Error('should not continue'); });
		await new Promise(resolve => setImmediate(resolve));
		assert.equal(reply.statusCode, 401);
	});

	// Regression: the recorded payload carried request.headers verbatim, which
	// includes the api key the caller just failed to authenticate with.
	it('does not record the rejected key', async () => {
		const registered = [];
		const instance = load(pluginApiKey, {
			logger: { error() {} },
			usageMetrics: { async register(payload) { registered.push(payload); } }
		});
		const request = newRequest({ [API]: 'ak_live_WRONG', 'user-agent': 'test-agent' });
		request.config = config('secret-key');
		instance.hooks.onRequest[0](request, newReply(), () => {});
		await new Promise(resolve => setImmediate(resolve));

		assert.equal(registered.length, 1);
		const blob = JSON.stringify(registered[0]);
		assert.ok(!blob.includes('ak_live_WRONG'), 'the rejected api key must not be recorded');
		assert.ok(blob.includes('test-agent'));
	});
});
