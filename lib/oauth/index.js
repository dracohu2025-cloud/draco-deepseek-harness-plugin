import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
//#region lib/types/remote.js
/**
* Typert Remote surface of the xAI OAuth session: browser clients mount this
* contribution (generated `./remote` artifact) and drive the device-code
* login without touching the model. The wire namespace is `xaiOauthRemote`.
* @module @deepseek-ai/dsh-draco-oauth-xai/remote
*/
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) if (kind === "field") initializers.unshift(_);
		else descriptor[key] = _;
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
/** Typert Remote service exposing the xAI OAuth session to browser clients. */
let XaiOauthRemote = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _startLogin_decorators;
	let _status_decorators;
	let _logout_decorators;
	return class XaiOauthRemote extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_startLogin_decorators = [Remote];
			_status_decorators = [Remote];
			_logout_decorators = [Remote];
			__esDecorate(this, null, _startLogin_decorators, {
				kind: "method",
				name: "startLogin",
				static: false,
				private: false,
				access: {
					has: (obj) => "startLogin" in obj,
					get: (obj) => obj.startLogin
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _status_decorators, {
				kind: "method",
				name: "status",
				static: false,
				private: false,
				access: {
					has: (obj) => "status" in obj,
					get: (obj) => obj.status
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _logout_decorators, {
				kind: "method",
				name: "logout",
				static: false,
				private: false,
				access: {
					has: (obj) => "logout" in obj,
					get: (obj) => obj.logout
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		service = __runInitializers(this, _instanceExtraInitializers);
		constructor(ctx, service) {
			super(ctx, "xaiOauthRemote");
			this.service = service;
		}
		/** Start a device-code login and return the verification URL for the browser. */
		async startLogin() {
			try {
				const ticket = await this.service.startLogin();
				return {
					status: "awaiting-approval",
					verificationUriComplete: ticket.verificationUriComplete,
					userCode: ticket.userCode
				};
			} catch (error) {
				return {
					status: "error",
					error: String(error)
				};
			}
		}
		/** Current session state, client-safe. */
		status() {
			const state = this.service.status();
			switch (state.kind) {
				case "awaiting-approval": return {
					kind: "awaiting-approval",
					verificationUri: state.ticket.verificationUri,
					verificationUriComplete: state.ticket.verificationUriComplete,
					userCode: state.ticket.userCode,
					expiresIn: state.ticket.expiresIn,
					startedAt: state.startedAt
				};
				case "active": return {
					kind: "active",
					expiresAt: state.expiresAt
				};
				case "error": return {
					kind: "error",
					message: state.message
				};
				default: return state;
			}
		}
		/** Forget the stored session. */
		logout() {
			this.service.logout();
		}
	};
})();
//#endregion
//#region lib/types/index.js
/**
* xAI (SuperGrok) OAuth device-code session plugin. Implements the flow
* Hermes Agent documents for xAI Grok OAuth: request a device code from
* `auth.x.ai`, print the verification URL and user code, poll the token
* endpoint until the user approves in a browser, persist the tokens under
* the harness home (`$DSH_HOME/draco/xai-oauth.json`), and refresh the
* access token in the background. The plugin provides the `xaiOauth`
* service; adapter plugins resolve bearer tokens through it, so no API key
* is required when a SuperGrok or X Premium+ subscription is active.
* @module @deepseek-ai/dsh-draco-oauth-xai
*/
const name = "draco-oauth-xai";
/** xAI OAuth issuer and device-code endpoints (Hermes-verified constants). */
const ISSUER = "https://auth.x.ai";
const CLIENT_ID = "b1a00492-073a-47ea-816f-4c329264a828";
const SCOPE = "openid profile email offline_access grok-cli:access api:access";
const DEVICE_CODE_URL = `${ISSUER}/oauth2/device/code`;
const DISCOVERY_URL = `${ISSUER}/.well-known/openid-configuration`;
/** xAI access tokens live about six hours; refresh one hour early. */
const REFRESH_SKEW_MS = 3600 * 1e3;
/** Cap the token-poll interval at five seconds. */
const POLL_INTERVAL_CAP_MS = 5e3;
const TOKENS_FILE = "draco/xai-oauth.json";
/** A failure raised by the OAuth session with a stable code. */
var XaiOauthError = class extends Error {
	code;
	constructor(message, code) {
		super(message);
		this.code = code;
		this.name = "XaiOauthError";
	}
};
/** POST form-encoded JSON and parse the response, with uniform failure classification. */
async function postForm(url, body, okCodes = [200]) {
	let response;
	try {
		response = await fetch(url, {
			method: "POST",
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				accept: "application/json"
			},
			body: new URLSearchParams(body)
		});
	} catch (error) {
		throw new XaiOauthError(`xAI OAuth request failed: ${String(error)}`, "TRANSPORT");
	}
	let data;
	try {
		data = await response.json();
	} catch {
		data = void 0;
	}
	if (!okCodes.includes(response.status)) {
		const detail = typeof data === "object" && data !== null ? JSON.stringify(data).slice(0, 300) : await response.text().catch(() => "");
		throw new XaiOauthError(`xAI OAuth endpoint returned HTTP ${response.status}: ${detail}`, "HTTP");
	}
	return {
		status: response.status,
		data
	};
}
/** Discover the token endpoint from the OIDC metadata document. */
async function discoverTokenEndpoint() {
	let response;
	try {
		response = await fetch(DISCOVERY_URL, { headers: { accept: "application/json" } });
	} catch (error) {
		throw new XaiOauthError(`xAI OIDC discovery failed: ${String(error)}`, "TRANSPORT");
	}
	if (response.status !== 200) throw new XaiOauthError(`xAI OIDC discovery returned HTTP ${response.status}`, "HTTP");
	const payload = await response.json();
	if (typeof payload.token_endpoint !== "string" || payload.token_endpoint.length === 0) throw new XaiOauthError("xAI OIDC discovery missing token_endpoint", "DISCOVERY");
	return payload.token_endpoint;
}
function apply(ctx) {
	let tokens;
	let status = { kind: "idle" };
	let pollAbort;
	/** Render one status line for the /grok-status command and diagnostics. */
	const statusLine = () => {
		switch (status.kind) {
			case "idle": return "xAI OAuth: not logged in. Run /grok-login to start.";
			case "awaiting-approval": {
				const t = status.ticket;
				return `xAI OAuth: waiting for approval. Open ${t.verificationUriComplete} and approve (code ${t.userCode}).`;
			}
			case "active": return `xAI OAuth: active (token valid until ${new Date(status.expiresAt).toISOString()}).`;
			case "expired": return "xAI OAuth: session expired. Run /grok-login again.";
			case "error": return `xAI OAuth: ${status.message}`;
		}
	};
	const readTokensFromDisk = () => {
		try {
			const raw = readFileSync(dshHomePath(TOKENS_FILE), "utf8");
			const parsed = JSON.parse(raw);
			if (typeof parsed.accessToken !== "string" || parsed.accessToken.length === 0) return void 0;
			return parsed;
		} catch {
			return;
		}
	};
	const writeTokensToDisk = (next) => {
		const path = dshHomePath(TOKENS_FILE);
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, JSON.stringify(next, void 0, 2) + "\n", { mode: 384 });
	};
	const loadTokens = () => {
		if (tokens !== void 0) return tokens;
		tokens = readTokensFromDisk();
		if (tokens !== void 0) status = {
			kind: "active",
			expiresAt: tokens.expiresAt
		};
		return tokens;
	};
	/** Exchange a device code for tokens by polling until approval or expiry. */
	const pollForToken = async (ticket, tokenEndpoint, signal) => {
		const deadline = Date.now() + Math.max(1e3, ticket.expiresIn * 1e3);
		let intervalMs = Math.max(1e3, Math.min(ticket.interval * 1e3, POLL_INTERVAL_CAP_MS));
		while (Date.now() < deadline) {
			if (signal.aborted) throw new XaiOauthError("xAI login cancelled", "CANCELLED");
			const { data } = await postForm(tokenEndpoint, {
				grant_type: "urn:ietf:params:oauth:grant-type:device_code",
				client_id: CLIENT_ID,
				device_code: ticket.deviceCode
			}, [200, 400]);
			const payload = data;
			if (typeof payload.access_token === "string" && payload.access_token.length > 0) {
				const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : 360 * 60;
				return {
					accessToken: payload.access_token,
					...typeof payload.refresh_token === "string" && payload.refresh_token.length > 0 ? { refreshToken: payload.refresh_token } : {},
					expiresAt: Date.now() + expiresIn * 1e3
				};
			}
			switch (payload.error) {
				case "authorization_pending": break;
				case "slow_down":
					intervalMs = Math.min(intervalMs + 1e3, 3e4);
					break;
				case "access_denied": throw new XaiOauthError("xAI login denied by the user", "DENIED");
				case "expired_token": throw new XaiOauthError("xAI device code expired; start a new login", "EXPIRED");
				default: throw new XaiOauthError(`xAI token endpoint: ${String(payload.error ?? "unknown error")}`, "TOKEN");
			}
			await new Promise((resolve) => setTimeout(resolve, intervalMs));
		}
		throw new XaiOauthError("xAI login timed out waiting for approval", "TIMEOUT");
	};
	/** Refresh the access token; clears the session on terminal refresh failure. */
	const refreshTokens = async (current) => {
		if (current.refreshToken === void 0 || current.refreshToken.length === 0) return;
		const { data } = await postForm(await discoverTokenEndpoint(), {
			grant_type: "refresh_token",
			client_id: CLIENT_ID,
			refresh_token: current.refreshToken
		});
		const payload = data;
		if (typeof payload.access_token !== "string" || payload.access_token.length === 0) return;
		const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : 360 * 60;
		const next = {
			accessToken: payload.access_token,
			...typeof payload.refresh_token === "string" && payload.refresh_token.length > 0 ? { refreshToken: payload.refresh_token } : {},
			expiresAt: Date.now() + expiresIn * 1e3
		};
		tokens = next;
		writeTokensToDisk(next);
		status = {
			kind: "active",
			expiresAt: next.expiresAt
		};
		return next;
	};
	const service = {
		status: () => status,
		startLogin: async () => {
			if (status.kind === "awaiting-approval") return status.ticket;
			const { data } = await postForm(DEVICE_CODE_URL, {
				client_id: CLIENT_ID,
				scope: SCOPE
			});
			const payload = data;
			const ticket = {
				deviceCode: String(payload.device_code ?? ""),
				userCode: String(payload.user_code ?? ""),
				verificationUri: String(payload.verification_uri ?? ""),
				verificationUriComplete: String(payload.verification_uri_complete ?? ""),
				expiresIn: Number(payload.expires_in ?? 0),
				interval: Number(payload.interval ?? 5)
			};
			if (ticket.deviceCode.length === 0 || ticket.verificationUri.length === 0) throw new XaiOauthError("xAI device-code response missing required fields", "DEVICE_CODE");
			pollAbort = new AbortController();
			status = {
				kind: "awaiting-approval",
				ticket,
				startedAt: Date.now()
			};
			(async () => {
				try {
					const next = await pollForToken(ticket, await discoverTokenEndpoint(), pollAbort.signal);
					tokens = next;
					writeTokensToDisk(next);
					status = {
						kind: "active",
						expiresAt: next.expiresAt
					};
					ctx.logger.info("xAI OAuth login approved; bearer token active until %s", new Date(next.expiresAt).toISOString());
				} catch (error) {
					if (error.code === "CANCELLED") {
						status = { kind: "idle" };
						return;
					}
					status = {
						kind: "error",
						message: String(error)
					};
					ctx.logger.warn("xAI OAuth login failed: %s", String(error));
				}
			})();
			return ticket;
		},
		getBearer: async () => {
			const current = loadTokens();
			if (current === void 0) return void 0;
			if (Date.now() + REFRESH_SKEW_MS < current.expiresAt) return current.accessToken;
			try {
				return (await refreshTokens(current))?.accessToken;
			} catch (error) {
				status = {
					kind: "error",
					message: String(error)
				};
				ctx.logger.warn("xAI OAuth refresh failed; re-login required: %s", String(error));
				return;
			}
		},
		logout: () => {
			pollAbort?.abort();
			tokens = void 0;
			status = { kind: "idle" };
			try {
				writeFileSync(dshHomePath(TOKENS_FILE), "", { mode: 384 });
			} catch {}
		}
	};
	ctx.effect(() => {
		const id = setInterval(() => {
			const current = loadTokens();
			if (current === void 0) return;
			if (Date.now() + REFRESH_SKEW_MS >= current.expiresAt) refreshTokens(current).catch((error) => {
				status = {
					kind: "error",
					message: String(error)
				};
			});
		}, 600 * 1e3);
		return () => clearInterval(id);
	}, "draco-oauth-xai: token keeper");
	ctx.provide("xaiOauth", service);
	new XaiOauthRemote(ctx, service);
	const commands = ctx.get("commands");
	if (commands !== void 0) {
		commands.register({
			name: "grok-login",
			description: "Start an xAI (SuperGrok) OAuth login; open the printed verification URL and approve.",
			handler: async () => {
				try {
					const ticket = await service.startLogin();
					return {
						kind: "success",
						text: `xAI OAuth login started. Open ${ticket.verificationUriComplete} in a browser (user code ${ticket.userCode}) and approve. The session activates automatically; check /grok-status.`
					};
				} catch (error) {
					return {
						kind: "error",
						text: `xAI OAuth login failed: ${String(error)}`
					};
				}
			}
		});
		commands.register({
			name: "grok-status",
			description: "Show the xAI (SuperGrok) OAuth session state.",
			handler: () => ({
				kind: "success",
				text: statusLine()
			})
		});
	}
}
//#endregion
export { XaiOauthError, apply, name };
