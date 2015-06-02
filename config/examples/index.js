module.exports = {
	LISTEN_PORT: 8000,
// Host address to listen on. Use null for localhost
	LISTEN_HOST: null,
// Debuging mode. Do not use in production
	DEBUG: true,
// Secure tripcode encryption salt
	SECURE_SALT: "LALALALALALALALA", /* [A-Za-z0-9./]{16} */
// Relative path to serve websocket connections
	SOCKET_PATH: '/hana',
/*
 Absolute URL for client connections. Defaults to SOCKET_PATH. Only set this, if
 you are serving websockets from a different root address.
 */
	SOCKET_URL: null,
// Honour X-Forwarded-For HTTP headers for client IP determination
	TRUST_X_FORWARDED_FOR: true,
/*
 Use internal HTTP server to serve these resources.It is recommended to serve
 the www directory with a dedicated webserver, like nginx, and set MEDIAURL
 in imager/config.js to the served directory's address.
 */
	SERVE_STATIC_FILES: true,
	SERVE_IMAGES: true,
// Not preferred; use nginx (or other's) gzipping
	GZIP: true,
/*
 Enable usage of the websocket protocol (otherwise only emulation). Disabling
 this increases connection speed, if behind restrictive proxies.
 */
	USE_WEBSOCKETS: true,

	REDIS_PORT: 6379,
	READ_ONLY: false,

	BOARDS: ['moe', 'gar', 'meta', 'archive', 'staff'],
	DEFAULT_BOARD: 'moe',
	READ_ONLY_BOARDS: ['archive', 'graveyard'],
// Add links to the navigator menu to custom URLs
	PSUEDO_BOARDS: [
		['g', 'https://google.com']
	],
	STAFF_BOARD: 'staff',

// Language settings. You can easily map more. See ./lang/
	LANGS: ['en_GB', 'pt_BR', 'es_ES'],
	DEFAULT_LANG: 'en_GB',

// Thread creation cooldown for the same IP in seconds
	THREAD_THROTTLE: 60,
// Posting speed throttling settings
	SHORT_TERM_LIMIT: 2000,
	LONG_TERM_LIMIT: 2000*20*12,
	NEW_POST_WORTH: 50,
	IMAGE_WORTH: 50,

// Per board thread expiry time. Set in seconds.
	THREAD_EXPIRY: {
		moe: 3600 * 24 * 7,
		gar: 3600 * 24 * 7,
		meta: 3600 * 24 * 7
	},
// Archive expired threads
	ARCHIVE: false,
/*
 Permanently delete threads instead of archiving them. Existing archives will
 not be removed.
 Note: scripts/clean.js is not needed with this option enabled
 */
	VOLATILE: false,

/*
 Doushio uses Mozilla's Persona system for moderator authentication.
 Set login emails here. Loging in can be done by either going to the /login/
 board or typing "misaki" into the email field.
 */
	ADMIN_PERSONAS: ['lalc@doushio.com'],
	MODERATOR_PERSONAS: ['mod@doushio.com'],
// URL to pass to Mozilla's servers.
	PERSONA_AUDIENCE: 'http://example.com:80',
	LOGIN_COOKIE_DOMAIN: 'example.com',
	LOGIN_SESSION_TIME: 60*60*24*14,
// Translate IP's into more human-readable mnemonics
	IP_MNEMONIC: true,
// Enable staff to assign custom tags to poster IPs
	IP_TAGGING: true,

// r/a/dio integration (https://r-a-d.io)
	RADIO: false,
// Missle Launcher
	PYU: false
};

// Source the other config files
require('underscore').extend(module.exports,
	require('./imager'),
	require('./report')
);
