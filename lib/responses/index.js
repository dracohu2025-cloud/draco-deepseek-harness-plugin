import z from "@deepseek-ai/schemastery";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { CallId, LlmAdapter, LlmError, assertUsableApiKey, attributionHeaders, contentHasImage } from "@deepseek-ai/dsh-llm";
import { EventSourceParserStream } from "eventsource-parser/stream";
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
*
* @module dsh-draco-llm-responses/adapter
*/
/** Modalities this adapter can place on the Responses wire. */
const INPUT_MODALITIES = ["text", "image"];
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
/** Classify an HTTP failure into a harness error code. */
function classifyHttpError(status, body) {
	if (status === 401 || status === 403) return "INVALID_CREDENTIAL";
	if (status === 429) return "RATE_LIMIT";
	if (/context\s*(length|window)/i.test(body) && /exceed/i.test(body)) return "CONTEXT_WINDOW_EXCEEDED";
	return "SERVER";
}
/**
* OpenAI Responses API adapter. Text and reasoning deltas stream as they
* arrive; tool-call block-ends, usage, and finish are deferred to the
* terminal `response.completed` / `response.failed` event.
*/
var ResponsesApiAdapter = class extends LlmAdapter {
	options;
	nextToolIndex = 0;
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
	listModels(provider) {
		const facts = this.options.facts().get(provider);
		if (facts === void 0) return Promise.resolve([]);
		return Promise.resolve(facts.models.map((model) => ({
			provider,
			id: model.id,
			name: model.name ?? model.id,
			...model.description !== void 0 ? { description: model.description } : {},
			inputModalities: [...INPUT_MODALITIES]
		})));
	}
	resolveModel(provider, model) {
		const catalog = this.options.facts().get(provider)?.models.find((entry) => entry.id === model);
		return Promise.resolve({
			provider,
			id: model,
			name: catalog?.name ?? model,
			...catalog?.description !== void 0 ? { description: catalog.description } : {},
			inputModalities: [...INPUT_MODALITIES],
			...catalog?.contextWindow !== void 0 ? { context: { contextWindow: catalog.contextWindow } } : {}
		});
	}
	async *stream(options) {
		const facts = this.options.facts().get(options.provider);
		if (facts === void 0) throw new LlmError(`draco-llm-responses: no provider route ${JSON.stringify(options.provider)}; add it to the providers config`, "NO_ADAPTER");
		let bearer;
		if (facts.auth.kind === "api-key") bearer = await this.options.resolveApiKey(facts.auth.apiKeyEnv, options.provider);
		else {
			const token = await this.options.oauthBearer();
			if (token === void 0) throw new LlmError("draco-llm-responses: no xAI OAuth session; start a login (the Draco web UI shows the verification link) or configure an api-key route", "MISSING_CREDENTIAL");
			bearer = token;
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
		let response;
		try {
			response = await fetch(`${facts.baseURL}/responses`, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					authorization: `Bearer ${bearer}`,
					...attributionHeaders()
				},
				body: JSON.stringify(body),
				signal: options.signal ?? null
			});
		} catch (error) {
			if (options.signal?.aborted) throw new LlmError("draco-llm-responses: request aborted", "ABORTED", { cause: error });
			throw new LlmError(`draco-llm-responses: provider request failed: ${String(error)}`, "TRANSPORT", { cause: error });
		}
		if (!response.ok) {
			const raw = await response.text().catch(() => "");
			let message = `draco-llm-responses: provider returned HTTP ${response.status}`;
			try {
				const parsed = JSON.parse(raw);
				if (parsed.error?.message !== void 0) message += `: ${parsed.error.message}`;
			} catch {}
			throw new LlmError(message, classifyHttpError(response.status, raw));
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
		const toolIndexFor = (callId) => {
			const key = callId ?? "";
			let pending = toolCalls.get(key);
			if (pending === void 0) {
				pending = {
					index: this.nextToolIndex++,
					arguments: ""
				};
				toolCalls.set(key, pending);
			}
			return pending;
		};
		try {
			for await (const data of parseSse(response.body)) {
				let event;
				try {
					event = JSON.parse(data);
				} catch {
					continue;
				}
				if (event.type === "response.output_text.delta" && typeof event.delta === "string" && event.delta.length > 0) {
					if (!openedText) {
						openedText = true;
						yield {
							type: "block-start",
							index: 0,
							blockType: "text"
						};
					}
					text += event.delta;
					yield {
						type: "text-delta",
						index: 0,
						text: event.delta
					};
					continue;
				}
				if (event.type === "response.reasoning_text.delta" && typeof event.delta === "string" && event.delta.length > 0) {
					reasoning += event.delta;
					yield {
						type: "reasoning-delta",
						index: 0,
						text: event.delta
					};
					continue;
				}
				if (event.type === "response.function_call_arguments.delta") {
					const pending = toolIndexFor(event.call_id);
					if (pending.id === void 0 && event.call_id !== void 0) pending.id = event.call_id;
					if (typeof event.delta === "string" && event.delta.length > 0) {
						pending.arguments += event.delta;
						yield {
							type: "tool-call-delta",
							index: pending.index,
							id: CallId(pending.id ?? `call_${pending.index}`),
							argumentsDelta: event.delta
						};
					}
					continue;
				}
				if (event.type === "response.output_item.done" && event.item !== void 0) {
					if (event.item.type === "function_call") {
						sawFunctionCall = true;
						const pending = toolIndexFor(event.item.call_id);
						if (pending.id === void 0 && event.item.call_id !== void 0) pending.id = event.item.call_id;
						if (pending.name === void 0 && event.item.name !== void 0) pending.name = event.item.name;
						if (pending.arguments.length === 0 && typeof event.item.arguments === "string") pending.arguments = event.item.arguments;
					}
					continue;
				}
				if (event.type === "response.completed") {
					sawTerminal = true;
					const usage = event.response?.usage;
					if (usage !== void 0) completedUsage = {
						inputTokens: usage.input_tokens ?? 0,
						outputTokens: usage.output_tokens ?? 0,
						...usage.input_tokens_details?.cached_tokens !== void 0 && usage.input_tokens_details.cached_tokens > 0 ? { cacheReadTokens: usage.input_tokens_details.cached_tokens } : {},
						...usage.output_tokens_details?.reasoning_tokens !== void 0 && usage.output_tokens_details.reasoning_tokens > 0 ? { reasoningTokens: usage.output_tokens_details.reasoning_tokens } : {}
					};
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
			throw error;
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
			index: 0,
			block: {
				type: "text",
				text
			}
		};
		for (const pending of toolCalls.values()) yield {
			type: "block-end",
			index: pending.index,
			block: {
				type: "tool-call",
				id: CallId(pending.id ?? `call_${pending.index}`),
				name: pending.name ?? "",
				arguments: pending.arguments || "{}"
			}
		};
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
	}
};
//#endregion
//#region lib/types/index.js
/**
* OpenAI Responses API adapter for the Draco edition. One plugin instance
* owns a dict of provider profiles keyed by route. Two auth shapes are
* supported per route: `oauth` resolves the bearer through the `xaiOauth`
* service (SuperGrok / X Premium+ subscription, no API key) and `api-key`
* resolves through the credentials seam like the other Draco adapters.
* The wire protocol is the OpenAI Responses API (`POST /v1/responses`,
* SSE event stream), which xAI exposes at `https://api.x.ai/v1`.
* User and nested tool-result images resolve through `ctx.attachments` into
* `input_image` data URLs; listed and unlisted models advertise text plus image.
* @module @deepseek-ai/dsh-draco-llm-responses
*/
const name = "draco-llm-responses";
const inject = ["llm"];
/** Schemastery configuration for the Responses adapter. */
const Config = z.object({
	baseURL: z.string().default("https://api.x.ai/v1"),
	providers: z.dict(z.object({
		displayName: z.string().default(""),
		auth: z.union([z.object({ kind: z.const("oauth") }), z.object({
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
		baseURL: config.baseURL,
		auth: provider.auth.kind === "oauth" ? { kind: "oauth" } : {
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
		oauthBearer: async () => ctx.get("xaiOauth")?.getBearer(),
		resolveAttachments: () => ctx.get("attachments")
	});
	const routes = [...facts().keys()];
	if (routes.length > 0) ctx.llm.registerAdapter(routes, adapter);
}
//#endregion
export { Config, apply, inject, name };
