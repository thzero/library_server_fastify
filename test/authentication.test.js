import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import '@thzero/library_common/utility/string.js';
import LibraryServerConstants from '@thzero/library_server/constants.js';
import AuthenticationMiddleware from '../middleware/authentication.js';

const AUTH = LibraryServerConstants.Headers.AuthKeys.AUTH;

const newRequest = (headers = {}) => ({
	headers,
	correlationId: 'cid',
	url: '/x',
	hostname: 'host',
	query: {},
	routeOptions: { url: '/x' }
});

const newReply = () => {
	const reply = { statusCode: null, payload: null };
	reply.code = (code) => { reply.statusCode = code; return reply; };
	reply.send = (payload) => { reply.payload = payload; return reply; };
	return reply;
};

let middleware;
let registered;

beforeEach(() => {
	middleware = new AuthenticationMiddleware();
	middleware._serviceLogger = { debug() {}, warn() {}, error() {}, exception() {} };
	registered = [];
	middleware._serviceUsageMetrics = { async register(payload) { registered.push(payload); } };
	middleware._serviceAuth = {
		async verifyToken(correlationId, token) {
			return token === 'good'
				? { success: true, user: { id: 'u1', roles: ['user'] }, claims: ['user'] }
				: { success: false };
		}
	};
});

describe('_getAuthToken', () => {
	const token = (value) => middleware._getAuthToken(newRequest(value === undefined ? {} : { [AUTH]: value }));

	it('accepts every prefix the constants declare', () => {
		for (const header of ['Bearer abc', 'bearer abc', 'BEARER abc', 'Bearer: abc', 'bearer: abc', 'BEARER: abc'])
			assert.equal(token(header), 'abc', header);
	});

	// Regression: the parser used split(prefix), which searches the whole string
	// rather than testing a prefix, so a header merely containing 'Bearer ' parsed.
	it('rejects a prefix that is not at the start', () => {
		assert.equal(token('Garbage Bearer abc'), null);
		assert.equal(token('NotBearer abc'), null);
	});

	// Regression: split[1] discarded everything after the second segment, so a
	// token containing the prefix again was silently truncated.
	it('does not truncate a token containing the prefix again', () => {
		assert.equal(token('Bearer aBearer b'), 'aBearer b');
	});

	it('trims surrounding whitespace', () => {
		assert.equal(token('  Bearer   abc  '), 'abc');
	});

	it('returns null for a missing, empty or non-string header', () => {
		assert.equal(token(undefined), null);
		assert.equal(token('abc'), null, 'no prefix at all');
		assert.equal(token('Bearer '), null, 'prefix with no token');
		assert.equal(token(123), null, 'non-string header');
		assert.equal(token(['Bearer a']), null, 'array header');
	});

	// Regression: the guard was `!== null && !== undefined`, which admits a
	// non-string and then throws on .split.
	it('does not throw on a non-string header', () => {
		assert.doesNotThrow(() => token(123));
		assert.doesNotThrow(() => token({}));
	});

	it('returns null for a missing request', () => {
		assert.equal(middleware._getAuthToken(null), null);
	});
});

describe('authenticate', () => {
	it('accepts a valid token and attaches the user', async () => {
		const request = newRequest({ [AUTH]: 'Bearer good' });
		await middleware.authenticate(request, newReply(), null, { roles: ['user'] });
		assert.equal(request.token, 'good');
		assert.deepEqual(request.user, { id: 'u1', roles: ['user'] });
		assert.deepEqual(request.claims, ['user']);
	});

	it('replies 401 for a token the auth service rejects', async () => {
		const reply = newReply();
		await middleware.authenticate(newRequest({ [AUTH]: 'Bearer bad' }), reply, null, {});
		assert.equal(reply.statusCode, 401);
	});

	it('throws when a token is required and none is present', async () => {
		await assert.rejects(() => middleware.authenticate(newRequest(), newReply(), null, {}),
			/Unauthorized/);
	});

	// required: false marks a route as anonymous-friendly.
	it('passes an anonymous caller through when required is false', async () => {
		const request = newRequest();
		await assert.doesNotReject(() => middleware.authenticate(request, newReply(), null, { required: false }));
		assert.equal(request.user, undefined, 'no user is attached');
	});

	it('still validates a token that is supplied on a required:false route', async () => {
		const reply = newReply();
		await middleware.authenticate(newRequest({ [AUTH]: 'Bearer bad' }), reply, null, { required: false });
		assert.equal(reply.statusCode, 401);
	});
});

describe('usage metrics payload', () => {
	// Regression: the payload carried request.headers verbatim - which includes
	// Authorization and x-api-key - plus the raw bearer token.
	it('does not carry the Authorization or api key headers', async () => {
		// An unparseable Authorization header reaches the metrics path (no token was
		// found, so authentication fails) while the raw credential is still sitting
		// in request.headers - which is exactly the case that used to leak it.
		const headers = {
			[AUTH]: 'Garbage SECRET.TOKEN.VALUE',
			[LibraryServerConstants.Headers.AuthKeys.API]: 'ak_live_SECRET',
			'user-agent': 'test-agent'
		};
		await assert.rejects(() => middleware.authenticate(newRequest(headers), newReply(), null, {}));
		await new Promise(resolve => setImmediate(resolve));

		assert.equal(registered.length, 1);
		const blob = JSON.stringify(registered[0]);
		assert.ok(!blob.includes('SECRET.TOKEN.VALUE'), 'bearer token must not be recorded');
		assert.ok(!blob.includes('ak_live_SECRET'), 'api key must not be recorded');
		assert.ok(blob.includes('test-agent'), 'other headers are still useful and kept');
	});
});
