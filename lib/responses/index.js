import z from "@deepseek-ai/schemastery";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { CONTEXT_WINDOW_EXCEEDED_CODE, CallId, LlmAdapter, LlmError, assertUsableApiKey, attributionHeaders, contentHasImage, isContextWindowExceededError } from "@deepseek-ai/dsh-llm";
import { MAX_TIMER_DELAY_MS, idleWatchdog, timeoutOf } from "@deepseek-ai/dsh-timeout";
import { EventSourceParserStream } from "eventsource-parser/stream";
//#region lib/types/codex-headers.js
/**
* Cloudflare originator headers required by `chatgpt.com/backend-api/codex`.
* Hermes pins `originator: codex_cli_rs` and extracts `ChatGPT-Account-ID`
* from the OAuth JWT; a malformed token omits the account header so the
* provider still answers 401 instead of crashing client construction.
* @module dsh-draco-llm-responses/codex-headers
*/
/** Headers that keep Codex Responses requests off the Cloudflare challenge path. */
function codexCloudflareHeaders(accessToken) {
	const headers = {
		"User-Agent": "codex_cli_rs/0.0.0 (Draco Harness)",
		originator: "codex_cli_rs"
	};
	const parts = accessToken.split(".");
	const segment = parts[1];
	if (parts.length < 2 || segment === void 0) return headers;
	try {
		const payload = segment + "=".repeat((4 - segment.length % 4) % 4);
		const accountId = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))["https://api.openai.com/auth"]?.chatgpt_account_id;
		if (typeof accountId === "string" && accountId.length > 0) headers["ChatGPT-Account-ID"] = accountId;
	} catch {}
	return headers;
}
//#endregion
//#region lib/types/catalog.js
/**
* Advisory model catalogs for Responses routes. The selector shows these
* entries; {@link ResponsesApiAdapter.resolveModel} still accepts an
* unlisted id. Codex live discovery is filtered to the GPT-5.6 Sol/Terra/Luna
* family; xAI advertises only `grok-4.6`.
* @module @deepseek-ai/dsh-draco-llm-responses/catalog
*/
/** Selector-visible Codex ids: GPT-5.6 Sol / Terra / Luna only. */
const DEFAULT_CODEX_MODELS = [
	"gpt-5.6-sol",
	"gpt-5.6-terra",
	"gpt-5.6-luna"
];
/** Display names for known slugs; unknown ids keep the wire id. */
const KNOWN_NAMES = {
	"gpt-5.6-sol": "GPT-5.6 Sol",
	"gpt-5.6-terra": "GPT-5.6 Terra",
	"gpt-5.6-luna": "GPT-5.6 Luna",
	"gpt-5.5": "GPT-5.5",
	"gpt-5.4-mini": "GPT-5.4 Mini",
	"gpt-5.4": "GPT-5.4",
	"gpt-5.3-codex": "GPT-5.3 Codex",
	"gpt-5.2-codex": "GPT-5.2 Codex",
	"gpt-5.1-codex-max": "GPT-5.1 Codex Max",
	"gpt-5.1-codex-mini": "GPT-5.1 Codex Mini",
	"grok-4.6": "Grok 4.6"
};
/** Selector label for one wire model id. */
function catalogName(id) {
	return KNOWN_NAMES[id] ?? id;
}
const SELECTABLE_CODEX_IDS = new Set(DEFAULT_CODEX_MODELS);
/**
* Keep only the selector-visible GPT-5.6 family from a live `/models` listing.
* @param ids - slugs returned by {@link parseCodexModelsListing}.
*/
function selectCodexCatalog(ids) {
	return ids.filter((id) => SELECTABLE_CODEX_IDS.has(id));
}
/**
* Visible, API-supported slugs from a Codex `/models` payload, ordered by
* `priority` then slug. Hidden or `supported_in_api: false` entries drop.
* @param payload - JSON body of `GET …/codex/models`.
*/
function parseCodexModelsListing(payload) {
	const entries = typeof payload === "object" && payload !== null && !Array.isArray(payload) ? payload.models : void 0;
	if (!Array.isArray(entries)) return [];
	const sortable = [];
	for (const item of entries) {
		if (typeof item !== "object" || item === null) continue;
		const row = item;
		if (typeof row.slug !== "string" || row.slug.trim().length === 0) continue;
		if (row.supported_in_api === false) continue;
		const visibility = typeof row.visibility === "string" ? row.visibility.trim().toLowerCase() : "";
		if (visibility === "hide" || visibility === "hidden") continue;
		const slug = row.slug.trim();
		const rank = typeof row.priority === "number" && Number.isFinite(row.priority) ? row.priority : 1e4;
		sortable.push({
			rank,
			slug
		});
	}
	sortable.sort((a, b) => a.rank - b.rank || a.slug.localeCompare(b.slug));
	const seen = /* @__PURE__ */ new Set();
	const ordered = [];
	for (const { slug } of sortable) {
		if (seen.has(slug)) continue;
		seen.add(slug);
		ordered.push(slug);
	}
	return ordered;
}
/**
* Live Codex catalog when a bearer is available; otherwise `undefined` so
* the configured fallback stays on screen.
* @param baseURL - Codex Responses base (`…/codex`).
* @param bearer - ChatGPT access token.
*/
async function fetchCodexModels(baseURL, bearer) {
	let response;
	try {
		response = await fetch(`${baseURL.replace(/\/$/, "")}/models?client_version=1.0.0`, { headers: {
			accept: "application/json",
			authorization: `Bearer ${bearer}`,
			...codexCloudflareHeaders(bearer)
		} });
	} catch {
		return;
	}
	if (response.status !== 200) return void 0;
	let payload;
	try {
		payload = await response.json();
	} catch {
		return;
	}
	const ids = parseCodexModelsListing(payload);
	return ids.length > 0 ? ids : void 0;
}
//#endregion
//#region lib/types/adapter.js
/**
* `ResponsesApiAdapter`: fetch + SSE against an OpenAI Responses API endpoint
* (`POST /responses`), emitting harness StreamChunks. Text and reasoning
* deltas stream as they arrive; tool-call accumulation, block-ends, usage,
* and finish are deferred to the terminal event so no chunk follows the
* terminal finish. Tool-call blocks are keyed by their `call_id` because the
* Responses wire does not guarantee a numeric index on argument deltas.
* User and nested tool-result images resolve through the durable attachment
* service into `input_image` data URLs; assistant image output is rejected.
* HTTP 400 bodies that name a maximum context length or window classify as
* `CONTEXT_WINDOW_EXCEEDED` so overflow compaction can retry; other 400s stay
* `INVALID_REQUEST`. Text, reasoning, and tool-call blocks share one
* per-request index counter so parallel tool calls do not collide with text.
* One stream read may idle at most `streamIdleTimeoutMs` before the watchdog
* fails the request with `TIMEOUT`; unexpected transport failures classify as
* `TRANSPORT` so the caller's retry policy can engage.
*
* @module dsh-draco-llm-responses/adapter
*/
var __addDisposableResource = function(env, value, async) {
	if (value !== null && value !== void 0) {
		if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
		var dispose, inner;
		if (async) {
			if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
			dispose = value[Symbol.asyncDispose];
		}
		if (dispose === void 0) {
			if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
			dispose = value[Symbol.dispose];
			if (async) inner = dispose;
		}
		if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
		if (inner) dispose = function() {
			try {
				inner.call(this);
			} catch (e) {
				return Promise.reject(e);
			}
		};
		env.stack.push({
			value,
			dispose,
			async
		});
	} else if (async) env.stack.push({ async: true });
	return value;
};
var __disposeResources = (function(SuppressedError) {
	return function(env) {
		function fail(e) {
			env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
			env.hasError = true;
		}
		var r, s = 0;
		function next() {
			while (r = env.stack.pop()) try {
				if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
				if (r.dispose) {
					var result = r.dispose.call(r.value);
					if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
						fail(e);
						return next();
					});
				} else s |= 1;
			} catch (e) {
				fail(e);
			}
			if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
			if (env.hasError) throw env.error;
		}
		return next();
	};
})(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
	var e = new Error(message);
	return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
/** Modalities this adapter can place on the Responses wire. */
const INPUT_MODALITIES = ["text", "image"];
/** Default maximum provider idle time while one stream read is outstanding. */
const DEFAULT_STREAM_IDLE_TIMEOUT_MS = 3e5;
/** Abort-reason code attached by the stream idle watchdog. */
const STREAM_IDLE_TIMEOUT_CODE = "LLM_STREAM_IDLE_TIMEOUT";
/** xAI image-understanding accepts JPEG and PNG only. */
const XAI_IMAGE_MEDIA_TYPES = new Set(["image/jpeg", "image/png"]);
/** Join the text blocks of a message. */
function flattenText(blocks) {
	return blocks.filter((block) => block.type === "text").map((block) => block.text).join("");
}
/** Require the attachment store before any image walk can proceed. */
function requireAttachments(attachments) {
	if (attachments === void 0) throw new LlmError("The Draco Responses adapter requires the durable attachment service for image content.", "UNSUPPORTED_CONTENT");
}
/**
* Recursively convert text and durable image blocks into Responses content
* parts. Plugin-added block types are skipped; assistant image output is not
* representable on this wire and is rejected by the caller.
*/
async function contentParts(blocks, attachments) {
	const parts = [];
	for (const block of blocks) switch (block.type) {
		case "text":
			if (block.text.length > 0) parts.push({
				type: "input_text",
				text: block.text
			});
			break;
		case "image": {
			const stored = await attachments.readImage(block.attachment);
			if (!XAI_IMAGE_MEDIA_TYPES.has(stored.ref.mediaType)) throw new LlmError(`The Draco Responses adapter cannot send ${stored.ref.mediaType} image content to xAI.`, "UNSUPPORTED_CONTENT");
			parts.push({
				type: "input_image",
				image_url: `data:${stored.ref.mediaType};base64,${Buffer.from(stored.data).toString("base64")}`,
				detail: "high"
			});
			break;
		}
		case "tool-result":
			parts.push(...await contentParts(block.content, attachments));
			break;
		default: break;
	}
	return parts;
}
/** Serialize one tool result, using content parts only when it carries an image. */
async function serializeToolResult(result, attachments) {
	if (contentHasImage(result.content)) {
		requireAttachments(attachments);
		const parts = await contentParts(result.content, attachments);
		return {
			type: "function_call_output",
			call_id: result.toolCallId,
			output: parts.length > 0 ? parts : "(no output)"
		};
	}
	return {
		type: "function_call_output",
		call_id: result.toolCallId,
		output: flattenText(result.content) || "(no output)"
	};
}
/**
* Serialize the conversation into Responses API input items. Text-only user
* content stays a string so existing text turns keep their wire form; an
* image anywhere in user or nested tool-result content becomes `input_image`
* data URLs. Assistant image output and in-history system images are rejected.
*/
async function serializeInput(messages, attachments) {
	const items = [];
	for (const message of messages) {
		if (message.role === "system") {
			if (contentHasImage(message.content)) throw new LlmError("The Draco Responses adapter cannot represent an image in an in-history system message.", "UNSUPPORTED_CONTENT");
			continue;
		}
		if (message.role === "user") {
			const toolResults = message.content.filter((block) => block.type === "tool-result");
			const regular = message.content.filter((block) => block.type !== "tool-result");
			if (contentHasImage(regular)) {
				requireAttachments(attachments);
				const parts = await contentParts(regular, attachments);
				if (parts.length > 0 || toolResults.length === 0) items.push({
					role: "user",
					content: parts
				});
			} else {
				const text = flattenText(regular);
				if (text.length > 0 || toolResults.length === 0) items.push({
					role: "user",
					content: text
				});
			}
			for (const result of toolResults) items.push(await serializeToolResult(result, attachments));
			continue;
		}
		if (contentHasImage(message.content)) throw new LlmError("The Draco Responses adapter cannot represent structured assistant image output.", "UNSUPPORTED_CONTENT");
		const text = flattenText(message.content);
		items.push({
			role: "assistant",
			content: text
		});
		for (const block of message.content) if (block.type === "tool-call") items.push({
			type: "function_call",
			call_id: block.id,
			name: block.name,
			arguments: block.arguments
		});
	}
	return items;
}
/** Serialize harness tool schemas into the Responses `tools` wire shape. */
function serializeTools(tools) {
	if (tools === void 0 || tools.length === 0) return void 0;
	return tools.map((tool) => ({
		type: "function",
		name: tool.name,
		description: tool.description,
		parameters: tool.parameters
	}));
}
/** Decode an SSE byte stream into event `data` payloads. */
async function* parseSse(stream) {
	const events = stream.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream());
	for await (const { data } of events) yield data;
}
/** Pull a provider error string out of OpenAI- or xAI-shaped JSON, else the raw body. */
function providerErrorDetail(raw) {
	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed.error === "string" && parsed.error.length > 0) return parsed.error;
		if (typeof parsed.error === "object" && parsed.error !== null) {
			const detail = [
				parsed.error.code,
				parsed.error.type,
				parsed.error.message
			].filter((part) => typeof part === "string" && part.length > 0).join(" ");
			if (detail.length > 0) return detail;
		}
		if (typeof parsed.message === "string" && parsed.message.length > 0) return parsed.message;
	} catch {}
	return raw;
}
/**
* Map a Responses `usage` object onto the harness disjoint buckets.
* `input_tokens` is the full prompt (cached included); subtract the cached
* detail so `pressureFrom` can sum the buckets back to the provider prompt.
*/
function usageFromResponses(usage) {
	const totalInput = usage.input_tokens ?? 0;
	const cached = usage.input_tokens_details?.cached_tokens ?? 0;
	const reasoning = usage.output_tokens_details?.reasoning_tokens ?? 0;
	return {
		inputTokens: Math.max(0, totalInput - cached),
		outputTokens: usage.output_tokens ?? 0,
		...cached > 0 ? { cacheReadTokens: cached } : {},
		...reasoning > 0 ? { reasoningTokens: reasoning } : {}
	};
}
/** Classify an HTTP failure into a harness error code. */
function classifyHttpError(status, body) {
	const detail = providerErrorDetail(body);
	if (status === 401 || status === 403) return "INVALID_CREDENTIAL";
	if (status === 429) return "RATE_LIMIT";
	if (isContextWindowExceededError(detail) || isContextWindowExceededError(body)) return CONTEXT_WINDOW_EXCEEDED_CODE;
	if (status === 400) return "INVALID_REQUEST";
	return "SERVER";
}
/**
* OpenAI Responses API adapter. Text and reasoning deltas stream as they
* arrive; tool-call block-ends, usage, and finish are deferred to the
* terminal `response.completed` / `response.failed` event.
*/
var ResponsesApiAdapter = class extends LlmAdapter {
	options;
	constructor(options) {
		super();
		this.options = options;
	}
	providerInfo(provider) {
		return {
			id: provider,
			name: this.options.facts().get(provider)?.displayName ?? provider
		};
	}
	async listModels(provider) {
		const facts = this.options.facts().get(provider);
		if (facts === void 0) return [];
		return ((facts.auth.kind === "oauth" && facts.auth.session === "codex" ? await this.liveCodexCatalog(facts) : void 0) ?? facts.models).map((model) => ({
			provider,
			id: model.id,
			name: model.name ?? model.id,
			...model.description !== void 0 ? { description: model.description } : {},
			inputModalities: [...INPUT_MODALITIES]
		}));
	}
	/** Live Codex `/models` listing when a bearer exists; otherwise `undefined`. */
	async liveCodexCatalog(facts) {
		if (facts.auth.kind !== "oauth") return void 0;
		const bearer = await this.options.oauthBearer(facts.auth.session);
		if (bearer === void 0) return void 0;
		const ids = await fetchCodexModels(facts.baseURL, bearer);
		if (ids === void 0) return void 0;
		const selected = selectCodexCatalog(ids);
		if (selected.length === 0) return void 0;
		return selected.map((id) => {
			const configured = facts.models.find((entry) => entry.id === id);
			return {
				id,
				name: configured?.name ?? catalogName(id),
				...configured?.contextWindow === void 0 ? {} : { contextWindow: configured.contextWindow }
			};
		});
	}
	resolveModel(provider, model) {
		const facts = this.options.facts().get(provider);
		const catalog = facts?.models.find((entry) => entry.id === model);
		const xai = facts !== void 0 && (facts.auth.kind !== "oauth" || facts.auth.session === "xai");
		const codex = facts !== void 0 && facts.auth.kind === "oauth" && facts.auth.session === "codex";
		const contextWindow = catalog?.contextWindow ?? (xai ? 5e5 : void 0) ?? (codex ? 105e4 : void 0);
		return Promise.resolve({
			provider,
			id: model,
			name: catalog?.name ?? model,
			...catalog?.description !== void 0 ? { description: catalog.description } : {},
			inputModalities: [...INPUT_MODALITIES],
			...contextWindow !== void 0 ? { context: { contextWindow } } : {}
		});
	}
	async *stream(options) {
		const env_1 = {
			stack: [],
			error: void 0,
			hasError: false
		};
		try {
			const facts = this.options.facts().get(options.provider);
			if (facts === void 0) throw new LlmError(`draco-llm-responses: no provider route ${JSON.stringify(options.provider)}; add it to the providers config`, "NO_ADAPTER");
			let bearer;
			let extraHeaders = {};
			if (facts.auth.kind === "api-key") bearer = await this.options.resolveApiKey(facts.auth.apiKeyEnv, options.provider);
			else {
				const session = facts.auth.session;
				const token = await this.options.oauthBearer(session);
				if (token === void 0) throw new LlmError(session === "codex" ? "draco-llm-responses: no OpenAI Codex OAuth session; start a login (the Draco web UI shows the verification link) or configure an api-key route" : "draco-llm-responses: no xAI OAuth session; start a login (the Draco web UI shows the verification link) or configure an api-key route", "MISSING_CREDENTIAL");
				bearer = token;
				extraHeaders = this.options.oauthHeaders?.(session, bearer) ?? {};
			}
			const attachments = options.messages.some((message) => contentHasImage(message.content)) ? this.options.resolveAttachments?.() : void 0;
			const input = await serializeInput(options.messages, attachments);
			const tools = serializeTools(options.tools);
			const body = {
				model: options.model,
				input,
				stream: true,
				...options.system !== void 0 && options.system.length > 0 ? { instructions: options.system } : {},
				...tools !== void 0 ? { tools } : {},
				...options.temperature !== void 0 ? { temperature: options.temperature } : {},
				...options.maxTokens !== void 0 ? { max_output_tokens: options.maxTokens } : {}
			};
			const consumer = new AbortController();
			const watchdog = __addDisposableResource(env_1, idleWatchdog(options.signal === void 0 ? consumer.signal : AbortSignal.any([options.signal, consumer.signal]), this.options.streamIdleTimeoutMs, STREAM_IDLE_TIMEOUT_CODE), false);
			let response;
			try {
				response = await fetch(`${facts.baseURL}/responses`, {
					method: "POST",
					headers: {
						"content-type": "application/json",
						authorization: `Bearer ${bearer}`,
						...extraHeaders,
						...attributionHeaders()
					},
					body: JSON.stringify(body),
					signal: watchdog.signal
				});
			} catch (error) {
				if (options.signal?.aborted) throw new LlmError("draco-llm-responses: request aborted", "ABORTED", { cause: error });
				throw new LlmError(`draco-llm-responses: provider request failed: ${String(error)}`, "TRANSPORT", { cause: error });
			}
			if (!response.ok) {
				const raw = await response.text().catch(() => "");
				const detail = providerErrorDetail(raw);
				throw new LlmError(detail.length > 0 && detail !== `HTTP ${response.status}` ? `draco-llm-responses: provider returned HTTP ${response.status}: ${detail}` : `draco-llm-responses: provider returned HTTP ${response.status}`, classifyHttpError(response.status, raw));
			}
			if (response.body === null) throw new LlmError("draco-llm-responses: provider returned an empty body", "EMPTY_RESPONSE");
			let text = "";
			let reasoning = "";
			const toolCalls = /* @__PURE__ */ new Map();
			let completedUsage;
			let terminalError;
			let sawFunctionCall = false;
			let sawTerminal = false;
			let openedText = false;
			let nextBlockIndex = 0;
			let textIndex = 0;
			let reasoningIndex = 0;
			const toolIndexFor = (callId) => {
				let pending = toolCalls.get(callId);
				if (pending === void 0) {
					pending = {
						index: nextBlockIndex++,
						id: callId,
						arguments: ""
					};
					toolCalls.set(callId, pending);
				}
				return pending;
			};
			const applyFunctionCallItem = (item) => {
				if (typeof item.call_id !== "string" || item.call_id.length === 0) return;
				sawFunctionCall = true;
				const pending = toolIndexFor(item.call_id);
				if (typeof item.name === "string" && item.name.length > 0) pending.name = item.name;
				if (pending.arguments.length === 0 && typeof item.arguments === "string") pending.arguments = item.arguments;
			};
			const iterator = parseSse(response.body)[Symbol.asyncIterator]();
			let exhausted = false;
			try {
				while (true) {
					const result = await watchdog.next(iterator);
					if (result.done) {
						exhausted = true;
						break;
					}
					const data = result.value;
					let event;
					try {
						event = JSON.parse(data);
					} catch {
						continue;
					}
					if (event.type === "response.output_text.delta" && typeof event.delta === "string" && event.delta.length > 0) {
						if (!openedText) {
							openedText = true;
							textIndex = nextBlockIndex++;
							yield {
								type: "block-start",
								index: textIndex,
								blockType: "text"
							};
						}
						text += event.delta;
						yield {
							type: "text-delta",
							index: textIndex,
							text: event.delta
						};
						continue;
					}
					if (event.type === "response.reasoning_text.delta" && typeof event.delta === "string" && event.delta.length > 0) {
						if (reasoning.length === 0) reasoningIndex = nextBlockIndex++;
						reasoning += event.delta;
						yield {
							type: "reasoning-delta",
							index: reasoningIndex,
							text: event.delta
						};
						continue;
					}
					if (event.type === "response.function_call_arguments.delta") {
						if (typeof event.call_id !== "string" || event.call_id.length === 0) continue;
						const pending = toolIndexFor(event.call_id);
						if (typeof event.delta === "string" && event.delta.length > 0) {
							pending.arguments += event.delta;
							yield {
								type: "tool-call-delta",
								index: pending.index,
								id: CallId(pending.id ?? event.call_id),
								argumentsDelta: event.delta
							};
						}
						continue;
					}
					if ((event.type === "response.output_item.added" || event.type === "response.output_item.done") && event.item?.type === "function_call") {
						applyFunctionCallItem(event.item);
						continue;
					}
					if (event.type === "response.completed") {
						sawTerminal = true;
						const usage = event.response?.usage;
						if (usage !== void 0) completedUsage = usageFromResponses(usage);
						break;
					}
					if (event.type === "response.failed") {
						sawTerminal = true;
						terminalError = event.response?.error?.message ?? "draco-llm-responses: provider failed the response";
						break;
					}
					if (event.type === "response.incomplete") {
						sawTerminal = true;
						terminalError = "draco-llm-responses: provider response incomplete";
						break;
					}
					if (event.type === "error") {
						terminalError = event.error?.message ?? "draco-llm-responses: provider stream error";
						break;
					}
				}
			} catch (error) {
				if (timeoutOf(watchdog.signal, STREAM_IDLE_TIMEOUT_CODE) !== void 0) throw new LlmError(`draco-llm-responses: provider stream idle timeout after ${this.options.streamIdleTimeoutMs}ms`, "TIMEOUT", { cause: error });
				if (options.signal?.aborted) {
					yield {
						type: "finish",
						reason: {
							kind: "aborted",
							failure: {
								message: "draco-llm-responses: stream aborted",
								code: "ABORTED"
							}
						}
					};
					return;
				}
				if (error instanceof LlmError) throw error;
				throw new LlmError(`draco-llm-responses: provider stream failed: ${String(error)}`, "TRANSPORT", { cause: error });
			} finally {
				consumer.abort("draco-llm-responses: stream consumer stopped");
				if (!exhausted && iterator.return !== void 0) try {
					await iterator.return(void 0);
				} catch (_abortedTransportTeardown) {}
			}
			if (options.signal?.aborted) {
				yield {
					type: "finish",
					reason: {
						kind: "aborted",
						failure: {
							message: "draco-llm-responses: stream aborted",
							code: "ABORTED"
						}
					}
				};
				return;
			}
			if (terminalError !== void 0) {
				yield {
					type: "finish",
					reason: {
						kind: "error",
						failure: {
							message: terminalError,
							code: "SERVER"
						}
					}
				};
				return;
			}
			if (!sawTerminal && text.length === 0 && toolCalls.size === 0) throw new LlmError("draco-llm-responses: stream ended without a terminal event", "STREAM_CLOSED");
			if (openedText && text.length > 0) yield {
				type: "block-end",
				index: textIndex,
				block: {
					type: "text",
					text
				}
			};
			for (const pending of toolCalls.values()) {
				if (pending.name === void 0 || pending.name.length === 0) continue;
				yield {
					type: "block-end",
					index: pending.index,
					block: {
						type: "tool-call",
						id: CallId(pending.id ?? `call_${pending.index}`),
						name: pending.name,
						arguments: pending.arguments || "{}"
					}
				};
			}
			if (completedUsage !== void 0) yield {
				type: "usage",
				usage: completedUsage
			};
			yield {
				type: "finish",
				reason: sawFunctionCall ? { kind: "tool-calls" } : terminalError !== void 0 ? {
					kind: "error",
					failure: {
						message: terminalError,
						code: "SERVER"
					}
				} : { kind: "stop" }
			};
		} catch (e_1) {
			env_1.error = e_1;
			env_1.hasError = true;
		} finally {
			__disposeResources(env_1);
		}
	}
};
//#endregion
//#region lib/types/index.js
/**
* OpenAI Responses API adapter for the Draco edition. One plugin instance
* owns a dict of provider profiles keyed by route. Two auth shapes are
* supported per route: `oauth` resolves the bearer through a named session
* (`xai` → SuperGrok, `codex` → ChatGPT/Codex) and `api-key` resolves
* through the credentials seam. The wire protocol is the OpenAI Responses
* API (`POST /responses`, SSE). A route may override `baseURL`; the plugin
* default is the xAI API. User and nested tool-result images resolve through
* `ctx.attachments` into `input_image` data URLs; listed and unlisted models
* advertise text plus image.
* @module @deepseek-ai/dsh-draco-llm-responses
*/
const name = "draco-llm-responses";
const inject = ["llm"];
/** Schemastery configuration for the Responses adapter. */
const Config = z.object({
	baseURL: z.string().default("https://api.x.ai/v1"),
	streamIdleTimeoutMs: z.number().min(Number.MIN_VALUE).max(MAX_TIMER_DELAY_MS).default(DEFAULT_STREAM_IDLE_TIMEOUT_MS),
	providers: z.dict(z.object({
		displayName: z.string().default(""),
		baseURL: z.string(),
		auth: z.union([z.object({
			kind: z.const("oauth"),
			session: z.union([z.const("xai"), z.const("codex")]).default("xai")
		}), z.object({
			kind: z.const("api-key"),
			apiKeyEnv: z.string().role("credential-ref")
		})]),
		models: z.array(z.object({
			id: z.string(),
			name: z.string(),
			description: z.string(),
			contextWindow: z.number()
		})).default([])
	})).default({})
});
/** The one explicit resolve step from raw config to validated route facts. */
function resolveRouteFacts(config) {
	const map = /* @__PURE__ */ new Map();
	for (const [route, provider] of Object.entries(config.providers)) map.set(route, {
		displayName: provider.displayName || route,
		baseURL: provider.baseURL || config.baseURL,
		auth: provider.auth.kind === "oauth" ? {
			kind: "oauth",
			session: provider.auth.session ?? "xai"
		} : {
			kind: "api-key",
			apiKeyEnv: credentialRef(provider.auth.apiKeyEnv)
		},
		models: provider.models.map((model) => ({ ...model }))
	});
	return map;
}
function apply(ctx, config) {
	const facts = () => resolveRouteFacts(config);
	const resolveApiKey = async (ref, route) => {
		const credentials = ctx.get("credentials");
		if (credentials !== void 0) {
			const hit = await credentials.resolve(ref);
			if (hit !== void 0) return assertUsableApiKey(hit.value, "draco-llm-responses", ref);
		}
		throw new LlmError(`draco-llm-responses: no API key for provider route "${route}"; store ${ref} through the credentials service, or export it in the launching environment`, "MISSING_CREDENTIAL");
	};
	const adapter = new ResponsesApiAdapter({
		facts,
		resolveApiKey,
		streamIdleTimeoutMs: config.streamIdleTimeoutMs ?? 3e5,
		oauthBearer: async (session) => session === "codex" ? ctx.get("codexOauth")?.getBearer() : ctx.get("xaiOauth")?.getBearer(),
		oauthHeaders: (session, bearer) => session === "codex" ? codexCloudflareHeaders(bearer) : {},
		resolveAttachments: () => ctx.get("attachments")
	});
	const routes = [...facts().keys()];
	if (routes.length > 0) ctx.llm.registerAdapter(routes, adapter);
}
//#endregion
export { Config, apply, inject, name };
