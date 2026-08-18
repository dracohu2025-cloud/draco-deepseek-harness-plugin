import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
//#region lib/types/jwt.js
/**
* JWT helpers for Codex access tokens. Expiry lives in the JWT `exp` claim;
* the token endpoint does not always return `expires_in`.
* @module @deepseek-ai/dsh-draco-oauth-codex/jwt
*/
/** Decode the middle JWT segment as a JSON object; malformed tokens yield `{}`. */
function decodeJwtClaims(token) {
	const parts = token.split(".");
	const segment = parts[1];
	if (parts.length < 2 || segment === void 0) return {};
	try {
		const payload = segment + "=".repeat((4 - segment.length % 4) % 4);
		const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
		return typeof claims === "object" && claims !== null && !Array.isArray(claims) ? claims : {};
	} catch {
		return {};
	}
}
/**
* Epoch milliseconds at which `token` expires, or `undefined` when the JWT
* has no usable `exp` claim.
* @param token - a Codex access token.
*/
function jwtExpiresAt(token) {
	const exp = decodeJwtClaims(token).exp;
	if (typeof exp !== "number" || !Number.isFinite(exp)) return void 0;
	return exp * 1e3;
}
/**
* Whether `token` is already expired or will expire within `skewMs`.
* Tokens without `exp` are treated as not expiring so a refresh is not
* attempted on a non-JWT bearer.
* @param token - a Codex access token.
* @param skewMs - milliseconds before `exp` at which the token is stale.
*/
function jwtIsExpiring(token, skewMs) {
	const expiresAt = jwtExpiresAt(token);
	if (expiresAt === void 0) return false;
	return Date.now() + Math.max(0, skewMs) >= expiresAt;
}
//#endregion
//#region lib/types/remote.js
/**
* Typert Remote surface of the Codex OAuth session: browser clients mount this
* contribution (generated `./remote` artifact) and drive the device-code
* login without touching the model. The wire namespace is `codexOauthRemote`.
* @module @deepseek-ai/dsh-draco-oauth-codex/remote
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
/** Typert Remote service exposing the Codex OAuth session to browser clients. */
let CodexOauthRemote = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _startLogin_decorators;
	let _status_decorators;
	let _logout_decorators;
	return class CodexOauthRemote extends _classSuper {
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
			super(ctx, "codexOauthRemote");
			this.service = service;
		}
		/** Start a device-code login and return the verification URL for the browser. */
		async startLogin() {
			try {
				const ticket = await this.service.startLogin();
				return {
					status: "awaiting-approval",
					verificationUri: ticket.verificationUri,
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
* OpenAI Codex (ChatGPT) OAuth device-code session plugin. Implements the
* Hermes-verified ChatGPT device-auth flow: request a user code from
* `auth.openai.com`, poll until the user approves at `/codex/device`,
* exchange the authorization code for tokens, persist them under the
* harness home (`$DSH_HOME/draco/codex-oauth.json`), and refresh the
* access token in the background. A persisted or refreshed session announces
* `draco/codex-oauth-ready` the same way a fresh login does, so dependents
* can default their backends on startup. The plugin provides the `codexOauth`
* service; adapter and image-generation plugins resolve bearer tokens
* through it, so no API key is required when a ChatGPT / Codex
* subscription is active.
* @module @deepseek-ai/dsh-draco-oauth-codex
*/
const name = "draco-oauth-codex";
/** OpenAI Codex device-auth endpoints (Hermes-verified constants). */
const ISSUER = "https://auth.openai.com";
const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const USER_CODE_URL = `${ISSUER}/api/accounts/deviceauth/usercode`;
const POLL_URL = `${ISSUER}/api/accounts/deviceauth/token`;
const TOKEN_URL = `${ISSUER}/oauth/token`;
const VERIFICATION_URI = `${ISSUER}/codex/device`;
const REDIRECT_URI = `${ISSUER}/deviceauth/callback`;
/** Refresh two minutes before JWT expiry, matching Hermes. */
const REFRESH_SKEW_MS = 120 * 1e3;
/** Device-code login times out after fifteen minutes. */
const LOGIN_TIMEOUT_MS = 900 * 1e3;
/** Default poll interval when the device endpoint omits one. */
const DEFAULT_POLL_INTERVAL_SEC = 5;
/** Fallback lifetime when a JWT has no `exp` claim. */
const FALLBACK_TTL_MS = 360 * 60 * 1e3;
const TOKENS_FILE = "draco/codex-oauth.json";
/** A failure raised by the OAuth session with a stable code. */
var CodexOauthError = class extends Error {
	code;
	constructor(message, code) {
		super(message);
		this.code = code;
		this.name = "CodexOauthError";
	}
};
/** POST JSON and parse the response, with uniform failure classification. */
async function postJson(url, body, okCodes = [200]) {
	let response;
	try {
		response = await fetch(url, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				accept: "application/json"
			},
			body: JSON.stringify(body)
		});
	} catch (error) {
		throw new CodexOauthError(`Codex OAuth request failed: ${String(error)}`, "TRANSPORT");
	}
	let data;
	try {
		data = await response.json();
	} catch {
		data = void 0;
	}
	if (!okCodes.includes(response.status)) {
		const detail = typeof data === "object" && data !== null ? JSON.stringify(data).slice(0, 300) : await response.text().catch(() => "");
		throw new CodexOauthError(`Codex OAuth endpoint returned HTTP ${response.status}: ${detail}`, "HTTP");
	}
	return {
		status: response.status,
		data
	};
}
/** POST form-encoded JSON and parse the response. */
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
		throw new CodexOauthError(`Codex OAuth request failed: ${String(error)}`, "TRANSPORT");
	}
	let data;
	try {
		data = await response.json();
	} catch {
		data = void 0;
	}
	if (!okCodes.includes(response.status)) {
		const detail = typeof data === "object" && data !== null ? JSON.stringify(data).slice(0, 300) : await response.text().catch(() => "");
		throw new CodexOauthError(`Codex OAuth endpoint returned HTTP ${response.status}: ${detail}`, "HTTP");
	}
	return {
		status: response.status,
		data
	};
}
/** Build persisted tokens from a token-endpoint payload. */
function tokensFromPayload(payload) {
	if (typeof payload.access_token !== "string" || payload.access_token.length === 0) throw new CodexOauthError("Codex token endpoint did not return an access_token", "TOKEN");
	return {
		accessToken: payload.access_token,
		...typeof payload.refresh_token === "string" && payload.refresh_token.length > 0 ? { refreshToken: payload.refresh_token } : {},
		expiresAt: jwtExpiresAt(payload.access_token) ?? Date.now() + FALLBACK_TTL_MS
	};
}
function apply(ctx) {
	let tokens;
	let status = { kind: "idle" };
	let pollAbort;
	/** Render one status line for the /codex-status command and diagnostics. */
	const statusLine = () => {
		switch (status.kind) {
			case "idle": return "Codex OAuth: not logged in. Run /codex-login to start.";
			case "awaiting-approval": {
				const t = status.ticket;
				return `Codex OAuth: waiting for approval. Open ${t.verificationUri} and enter ${t.userCode}.`;
			}
			case "active": return `Codex OAuth: active (token valid until ${new Date(status.expiresAt).toISOString()}).`;
			case "expired": return "Codex OAuth: session expired. Run /codex-login again.";
			case "error": return `Codex OAuth: ${status.message}`;
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
		if (tokens !== void 0) {
			status = {
				kind: "active",
				expiresAt: tokens.expiresAt
			};
			if (!jwtIsExpiring(tokens.accessToken, REFRESH_SKEW_MS) && Date.now() + REFRESH_SKEW_MS < tokens.expiresAt) ctx.emit("draco/codex-oauth-ready", tokens.expiresAt);
		}
		return tokens;
	};
	/** Poll until the user approves, then exchange the authorization code. */
	const pollForToken = async (ticket, signal) => {
		const deadline = Date.now() + Math.max(1e3, ticket.expiresIn * 1e3);
		const intervalMs = Math.max(1e3, ticket.interval * 1e3);
		while (Date.now() < deadline) {
			if (signal.aborted) throw new CodexOauthError("Codex login cancelled", "CANCELLED");
			await new Promise((resolve) => setTimeout(resolve, intervalMs));
			if (signal.aborted) throw new CodexOauthError("Codex login cancelled", "CANCELLED");
			const { status: httpStatus, data } = await postJson(POLL_URL, {
				device_auth_id: ticket.deviceAuthId,
				user_code: ticket.userCode
			}, [
				200,
				403,
				404
			]);
			if (httpStatus !== 200) continue;
			const payload = data;
			const authorizationCode = typeof payload.authorization_code === "string" ? payload.authorization_code : "";
			const codeVerifier = typeof payload.code_verifier === "string" ? payload.code_verifier : "";
			if (authorizationCode.length === 0 || codeVerifier.length === 0) throw new CodexOauthError("Codex device auth missing authorization_code or code_verifier", "DEVICE_CODE");
			return tokensFromPayload((await postForm(TOKEN_URL, {
				grant_type: "authorization_code",
				code: authorizationCode,
				redirect_uri: REDIRECT_URI,
				client_id: CLIENT_ID,
				code_verifier: codeVerifier
			})).data);
		}
		throw new CodexOauthError("Codex login timed out waiting for approval", "TIMEOUT");
	};
	/** Refresh the access token; clears the session on terminal refresh failure. */
	const refreshTokens = async (current) => {
		if (current.refreshToken === void 0 || current.refreshToken.length === 0) return;
		const { data } = await postForm(TOKEN_URL, {
			grant_type: "refresh_token",
			refresh_token: current.refreshToken,
			client_id: CLIENT_ID
		});
		const next = tokensFromPayload(data);
		if (next.refreshToken === void 0) next.refreshToken = current.refreshToken;
		tokens = next;
		writeTokensToDisk(next);
		status = {
			kind: "active",
			expiresAt: next.expiresAt
		};
		ctx.emit("draco/codex-oauth-ready", next.expiresAt);
		return next;
	};
	const service = {
		status: () => status,
		startLogin: async () => {
			if (status.kind === "awaiting-approval") return status.ticket;
			const { data } = await postJson(USER_CODE_URL, { client_id: CLIENT_ID });
			const payload = data;
			const ticket = {
				deviceAuthId: String(payload.device_auth_id ?? ""),
				userCode: String(payload.user_code ?? ""),
				verificationUri: VERIFICATION_URI,
				expiresIn: LOGIN_TIMEOUT_MS / 1e3,
				interval: Number(payload.interval ?? DEFAULT_POLL_INTERVAL_SEC)
			};
			if (ticket.deviceAuthId.length === 0 || ticket.userCode.length === 0) throw new CodexOauthError("Codex device-code response missing required fields", "DEVICE_CODE");
			pollAbort = new AbortController();
			status = {
				kind: "awaiting-approval",
				ticket,
				startedAt: Date.now()
			};
			(async () => {
				try {
					const next = await pollForToken(ticket, pollAbort.signal);
					tokens = next;
					writeTokensToDisk(next);
					status = {
						kind: "active",
						expiresAt: next.expiresAt
					};
					ctx.logger.info("Codex OAuth login approved; bearer token active until %s", new Date(next.expiresAt).toISOString());
					ctx.emit("draco/codex-oauth-ready", next.expiresAt);
				} catch (error) {
					if (error.code === "CANCELLED") {
						status = { kind: "idle" };
						return;
					}
					status = {
						kind: "error",
						message: String(error)
					};
					ctx.logger.warn("Codex OAuth login failed: %s", String(error));
				}
			})();
			return ticket;
		},
		getBearer: async () => {
			const current = loadTokens();
			if (current === void 0) return void 0;
			if (!jwtIsExpiring(current.accessToken, REFRESH_SKEW_MS) && Date.now() + REFRESH_SKEW_MS < current.expiresAt) return current.accessToken;
			try {
				return (await refreshTokens(current))?.accessToken;
			} catch (error) {
				status = {
					kind: "error",
					message: String(error)
				};
				ctx.logger.warn("Codex OAuth refresh failed; re-login required: %s", String(error));
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
			if (jwtIsExpiring(current.accessToken, REFRESH_SKEW_MS) || Date.now() + REFRESH_SKEW_MS >= current.expiresAt) refreshTokens(current).catch((error) => {
				status = {
					kind: "error",
					message: String(error)
				};
			});
		}, 600 * 1e3);
		return () => clearInterval(id);
	}, "draco-oauth-codex: token keeper");
	ctx.provide("codexOauth", service);
	new CodexOauthRemote(ctx, service);
	const commands = ctx.get("commands");
	if (commands !== void 0) {
		commands.register({
			name: "codex-login",
			description: "Start an OpenAI Codex (ChatGPT) OAuth login; open the printed verification URL and enter the code.",
			handler: async () => {
				try {
					const ticket = await service.startLogin();
					return {
						kind: "success",
						text: `Codex OAuth login started. Open ${ticket.verificationUri} in a browser and enter ${ticket.userCode}. The session activates automatically; check /codex-status.`
					};
				} catch (error) {
					return {
						kind: "error",
						text: `Codex OAuth login failed: ${String(error)}`
					};
				}
			}
		});
		commands.register({
			name: "codex-status",
			description: "Show the OpenAI Codex OAuth session state.",
			handler: () => ({
				kind: "success",
				text: statusLine()
			})
		});
	}
}
//#endregion
export { CodexOauthError, apply, name };
