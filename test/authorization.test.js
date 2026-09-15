import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import '@thzero/library_common/utility/string.js';
import LibraryCommonConstants from '@thzero/library_common/constants.js';
import LibraryServerConstants from '@thzero/library_server/constants.js';
import BaseSecurityService from '@thzero/library_server/service/baseSecurity.js';
import AuthorizationMiddleware from '../middleware/authorization.js';

const AND = LibraryCommonConstants.Security.logicalAnd;
const AUTH = LibraryServerConstants.Headers.AuthKeys.AUTH;

// admin satisfies everything user does, plus admin itself
const can = (subject, role) => subject === role || (subject === 'admin' && role === 'user');

class TestSecurityService extends BaseSecurityService {
	async validate(correlationId, sub, dom, obj, act) {
		return can(sub, act ? `${obj}:${act}` : obj);
	}
}

const newRequest = (user, headers = {}) => ({
	headers,
	user,
	correlationId: 'cid',
	url: '/x',
	hostname: 'host',
	query: {},
	routeOptions: { url: '/x' }
});

let middleware;
let registered;

beforeEach(() => {
	middleware = new AuthorizationMiddleware();
	middleware._serviceLogger = { debug() {}, warn() {}, error() {}, exception() {} };
	registered = [];
	middleware._serviceUsageMetrics = { async register(payload) { registered.push(payload); } };
	middleware._serviceConfig = { get() { return null; } };

	const security = new TestSecurityService();
	security._logger = middleware._serviceLogger;
	middleware._serviceSecurity = security;
});

describe('authorization', () => {
	it('permits a user holding the required role', async () => {
		await assert.doesNotReject(() =>
			middleware.authorization(newRequest({ roles: ['user'] }), {}, null, { roles: ['user'] }));
	});

	it('denies a user without it', async () => {
		await assert.rejects(() =>
			middleware.authorization(newRequest({ roles: ['guest'] }), {}, null, { roles: ['user'] }),
			/Unauthorized/);
	});

	it('denies an anonymous caller on a route that requires a token', async () => {
		await assert.rejects(() =>
			middleware.authorization(newRequest(undefined), {}, null, { roles: ['user'] }),
			/Unauthorized/);
	});

	// required: false marks a route as anonymous-friendly. The authentication
	// middleware lets a tokenless caller through, so there is no request.user;
	// authorization has to return early rather than deny.
	it('permits an anonymous caller when required is false', async () => {
		await assert.doesNotReject(() =>
			middleware.authorization(newRequest(undefined), {}, null, { required: false, roles: ['user'] }));
	});

	// ...but a caller who does present a token still gets their roles checked.
	it('still enforces roles for an authenticated caller on a required:false route', async () => {
		await assert.doesNotReject(() =>
			middleware.authorization(newRequest({ roles: ['user'] }), {}, null, { required: false, roles: ['user'] }));
		await assert.rejects(() =>
			middleware.authorization(newRequest({ roles: ['guest'] }), {}, null, { required: false, roles: ['user'] }),
			/Unauthorized/);
	});

	// A route that runs authorization but declares no roles denies everyone: the
	// role check is skipped entirely and success stays false. Fail-closed, but it
	// means `authorizationDefault` without a roles list is always a 401.
	it('denies when no roles are declared', async () => {
		await assert.rejects(() =>
			middleware.authorization(newRequest({ roles: ['guest'] }), {}, null, { roles: [] }),
			/Unauthorized/);
	});

	// Regression: initializeOptionsLogical was a tautology that always returned
	// logicalOr, and the check accumulated across the user-roles x required-roles
	// cross product, so a user holding ['admin','user'] was denied a route
	// requiring ['user'].
	it('and: a user with extra roles is not denied', async () => {
		await assert.doesNotReject(() =>
			middleware.authorization(newRequest({ roles: ['admin', 'user'] }), {}, null,
				{ logical: AND, roles: ['user'] }));
	});

	it('and: every required role must be satisfied', async () => {
		await assert.rejects(() =>
			middleware.authorization(newRequest({ roles: ['user'] }), {}, null,
				{ logical: AND, roles: ['admin', 'user'] }),
			/Unauthorized/);
	});

	// The routes set `relation`, which plugins/auth.js uses to combine the
	// middleware chain (authentication AND authorization must both pass). The
	// security service reads `options.logical` for combining ROLES, and nothing in
	// the tree sets it - so the roles-AND path is unreachable from a route today.
	// Pinning that: `relation` alone does not switch roles to AND.
	it('relation does not drive the role combination (only logical does)', async () => {
		// under AND this would be denied; under the effective OR it passes
		await assert.doesNotReject(() =>
			middleware.authorization(newRequest({ roles: ['user'] }), {}, null,
				{ relation: AND, roles: ['admin', 'user'] }));
	});
});

describe('usage metrics payload', () => {
	// Regression: the payload carried request.headers verbatim plus the raw token.
	it('does not carry the Authorization or api key headers', async () => {
		const headers = {
			[AUTH]: 'Bearer SECRET.TOKEN.VALUE',
			[LibraryServerConstants.Headers.AuthKeys.API]: 'ak_live_SECRET',
			'user-agent': 'test-agent'
		};
		const request = newRequest({ roles: ['guest'] }, headers);
		request.token = 'SECRET.TOKEN.VALUE';

		await assert.rejects(() => middleware.authorization(request, {}, null, { roles: ['user'] }));
		await new Promise(resolve => setImmediate(resolve));

		assert.equal(registered.length, 1);
		const blob = JSON.stringify(registered[0]);
		assert.ok(!blob.includes('SECRET.TOKEN.VALUE'), 'bearer token must not be recorded');
		assert.ok(!blob.includes('ak_live_SECRET'), 'api key must not be recorded');
		assert.ok(blob.includes('test-agent'), 'other headers are still kept');
	});
});
