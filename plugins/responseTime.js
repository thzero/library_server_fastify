// https://github.com/lolo32/fastify-response-time
import fastifyPlugin from 'fastify-plugin';

const symbolRequestTime = Symbol('RequestTimer');
const symbolServerTiming = Symbol('ServerTiming');

/**
 *
 * @param {string} name
 * @param {number|string} duration
 * @param {string} description
 * @return {string}
 */
const genTick = (name, duration, description) => {
	let val = name;
	// Parse duration. If could not be converted to float, does not add it
	duration = parseFloat(duration);
	if (!isNaN(duration)) {
		val += `;dur=${duration}`;
	}
	// Parse the description. If empty, doest not add it. If string with space, double quote value
	if ('string' === typeof description) {
		val += `;desc=${description.includes(' ') ? `'${description}'` : description}`;
	}

	return val;
};

/**
 * Decorators
 *
 * @param {fastify} instance
 * @param {function} instance.decorateReply
 * @param {Object} opts
 * @param {function} next
 */
export default fastifyPlugin((instance, opts, done) => {
	// Check the options, and corrects with the default values if inadequate
	if (isNaN(opts.digits) || 0 > opts.digits) {
		opts.digits = 2;
	}
	opts.header = opts.header || 'X-Response-Time';

	// Hook to be triggered on request (start time)
	instance.addHook('onRequest', (request, reply, next) => {
		// Store the start timer in nanoseconds resolution
		// istanbul ignore next
		if (request.raw && reply.raw) {
			// support fastify >= v2
			request.raw[symbolRequestTime] = process.hrtime();
			reply.raw[symbolServerTiming] = {};
		} 
		else if (request.req && reply.res) {
			// support fastify >= v2
			request.req[symbolRequestTime] = process.hrtime();
			reply.res[symbolServerTiming] = {};
		} 
		else {
			request[symbolRequestTime] = process.hrtime();
			reply[symbolServerTiming] = {};
		}

		next();
	});

	// Hook to be triggered just before response to be send
	instance.addHook('onSend', (request, reply, payload, next) => {
		const headers = [];

		// check if Server-Timing need to be added
		const serverTiming = (reply.raw ? reply.raw[symbolServerTiming] : reply.res[symbolServerTiming]);
		if (serverTiming) {
			for (const name of Object.keys(serverTiming)) {
				headers.push(serverTiming[name]);
			}
			if (headers.length) {
				reply.header('Server-Timing', headers.join(','));
			}
		}

		// Calculate the duration, in nanoseconds …
		const hrDuration = (request.raw ? request.raw[symbolRequestTime] : request.req[symbolRequestTime]);
		if (hrDuration) {
			// … convert it to milliseconds …
			const duration = (hrDuration[0] * 1e3 + hrDuration[1] / 1e6).toFixed(opts.digits);
			// … add the header to the response
			reply.header(opts.header, duration);

			opts.logger.info2(`${request.method} ${request.url} - ${duration}`);
		}

		next();
	});

	// Can be used to add custom timing information
	instance.decorateReply('setServerTiming', function (name, duration, description) {
		// Reference to the res object storing values …
		const serverTiming = this.res[symbolServerTiming];
		// … return if value already exists (all subsequent occurrences MUST be ignored without signaling an error) …
		if (serverTiming.hasOwnProperty(name)) {
			return false;
		}
		// … add the value the the list to send later
		serverTiming[name] = genTick(name, duration, description);
		// … return true, the value was added to the list
		return true;
	});

	done();
});
// Not before 0.31 (onSend hook added to this version)
// }, '>= 0.31');