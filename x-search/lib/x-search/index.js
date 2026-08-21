import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { LlmError } from "@deepseek-ai/dsh-llm";
//#region lib/types/xai-x-search.js
/**
* xAI Responses `x_search` client: one dedicated Grok turn with the
* server-side X Search tool, then citations on the assistant message.
* @module @deepseek-ai/dsh-draco-x-search/src/xai-x-search
*/
/** xAI Responses endpoint used with the SuperGrok OAuth bearer. */
const XAI_RESPONSES_URL = "https://api.x.ai/v1/responses";
/** Cheap Settings probe; listing models does not search X. */
const XAI_MODELS_URL = "https://api.x.ai/v1/models";
/** Wire model for the auxiliary search turn. */
const X_SEARCH_MODEL = "grok-4.6";
/** Settings probe budget. */
const X_SEARCH_PROBE_TIMEOUT_MS = 2e4;
/** Handle cap documented by xAI `x_search`. */
const X_SEARCH_MAX_HANDLES = 20;
function speechFailureCode(status) {
	return status === 401 || status === 403 ? "INVALID_CREDENTIAL" : "SERVER";
}
async function readBody(response) {
	return await response.text().catch(() => "");
}
function parseJson(raw) {
	try {
		return JSON.parse(raw);
	} catch (error) {
		return;
	}
}
function asRecord(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return void 0;
	return value;
}
function throwXai(status, payload, raw, label) {
	const record = asRecord(payload);
	const msg = typeof record?.error === "object" && record.error !== null ? JSON.stringify(record.error).slice(0, 300) : typeof record?.message === "string" ? record.message.slice(0, 300) : raw.slice(0, 300);
	throw new LlmError(`draco-x-search: ${label} HTTP ${status}${msg.length > 0 ? `: ${msg}` : ""}`, speechFailureCode(status));
}
/**
* Strip a leading `@` and reject empty handles.
* @param value - raw handle from the tool call.
*/
function normalizeXHandle(value) {
	const trimmed = value.trim().replace(/^@+/, "");
	if (trimmed.length === 0) throw new Error("x_search handle must be a non-empty string");
	return trimmed;
}
/**
* Normalize an optional handle list onto the xAI cap.
* @param values - raw handles, or undefined.
*/
function normalizeXHandles(values) {
	if (values === void 0 || values.length === 0) return void 0;
	const out = values.map(normalizeXHandle);
	if (out.length > 20) throw new Error(`x_search accepts at most 20 handles`);
	return out;
}
/**
* Build the Responses `tools` entry for one X search.
* @param args - already-normalized tool arguments.
*/
function xSearchToolEntry(args) {
	const allowed = normalizeXHandles(args.allowed_x_handles);
	const excluded = normalizeXHandles(args.excluded_x_handles);
	if (allowed !== void 0 && excluded !== void 0) throw new Error("x_search cannot set both allowed_x_handles and excluded_x_handles");
	const entry = { type: "x_search" };
	if (allowed !== void 0) entry.allowed_x_handles = allowed;
	if (excluded !== void 0) entry.excluded_x_handles = excluded;
	const fromDate = args.from_date?.trim();
	const toDate = args.to_date?.trim();
	if (fromDate !== void 0 && fromDate.length > 0) entry.from_date = fromDate;
	if (toDate !== void 0 && toDate.length > 0) entry.to_date = toDate;
	if (args.enable_image_understanding === true) entry.enable_image_understanding = true;
	if (args.enable_video_understanding === true) entry.enable_video_understanding = true;
	return entry;
}
/**
* Build the auxiliary Responses body. The conversation model's query is the
* user text; Grok decides keyword vs semantic search server-side.
* @param args - already-normalized tool arguments.
*/
function xSearchRequestBody(args) {
	return {
		model: X_SEARCH_MODEL,
		stream: false,
		input: [{
			role: "user",
			content: args.query
		}],
		tools: [xSearchToolEntry(args)]
	};
}
function citationSources(payload) {
	const output = asRecord(payload)?.output;
	if (!Array.isArray(output)) return [];
	const seen = /* @__PURE__ */ new Set();
	const sources = [];
	for (const item of output) {
		const record = asRecord(item);
		if (record?.type !== "message") continue;
		const content = record.content;
		if (!Array.isArray(content)) continue;
		for (const block of content) {
			const annotations = asRecord(block)?.annotations;
			if (!Array.isArray(annotations)) continue;
			for (const annotation of annotations) {
				const row = asRecord(annotation);
				if (row?.type !== "url_citation") continue;
				const url = typeof row.url === "string" ? row.url.trim() : "";
				if (!url.startsWith("http") || seen.has(url)) continue;
				seen.add(url);
				const title = typeof row.title === "string" && row.title.length > 0 && !/^\d+$/.test(row.title) ? row.title : void 0;
				sources.push(title === void 0 ? { url } : {
					url,
					title
				});
			}
		}
	}
	return sources;
}
function assistantText(payload) {
	const output = asRecord(payload)?.output;
	if (!Array.isArray(output)) return "";
	const parts = [];
	for (const item of output) {
		const record = asRecord(item);
		if (record?.type !== "message") continue;
		const content = record.content;
		if (!Array.isArray(content)) continue;
		for (const block of content) {
			const part = asRecord(block);
			if (typeof part?.text === "string" && part.text.length > 0) parts.push(part.text);
		}
	}
	return parts.join("\n\n").trim();
}
/**
* Confirm a SuperGrok OAuth bearer can list xAI models. This does not search X.
* @param apiKey - SuperGrok OAuth access token.
* @param signal - cancellation / probe timeout.
*/
async function probeXSearch(apiKey, signal) {
	const response = await fetch(XAI_MODELS_URL, {
		headers: { authorization: `Bearer ${apiKey}` },
		signal: signal ?? null
	});
	const raw = await readBody(response);
	if (!response.ok) throwXai(response.status, parseJson(raw), raw, "models");
}
/**
* Run one Grok turn with server-side `x_search` and collect citations.
* @param apiKey - SuperGrok OAuth access token.
* @param args - already-normalized tool arguments.
* @param signal - cancellation.
*/
async function collectXSearch(apiKey, args, signal) {
	const response = await fetch(XAI_RESPONSES_URL, {
		method: "POST",
		headers: {
			authorization: `Bearer ${apiKey}`,
			"content-type": "application/json"
		},
		body: JSON.stringify(xSearchRequestBody(args)),
		signal: signal ?? null
	});
	const raw = await readBody(response);
	const payload = parseJson(raw);
	if (!response.ok) throwXai(response.status, payload, raw, "responses");
	const sources = citationSources(payload);
	const content = assistantText(payload);
	if (sources.length === 0) throw new LlmError("draco-x-search: x_search returned no X citations", "SERVER");
	return {
		content,
		sources,
		model: X_SEARCH_MODEL
	};
}
//#endregion
//#region lib/types/index.js
/**
* Draco `x_search`: X (Twitter) search via xAI server-side `x_search`.
* Settings live in `draco-x-search` (`provider` plus probe fields). The
* only backend is SuperGrok OAuth (`ctx.xaiOauth`). A ready SuperGrok
* session selects `grok-x-search` and marks the probe `ok`.
* @module @deepseek-ai/dsh-draco-x-search
*/
const name = "draco-x-search";
const inject = ["tools"];
/** Settings namespace owned by this plugin. */
const X_SEARCH_SETTINGS_NAMESPACE = settingsNamespace("draco-x-search");
const ProbeStatus = z.union([
	z.const("idle"),
	z.const("checking"),
	z.const("ok"),
	z.const("fail")
]);
/** Schemastery configuration for the X Search plugin. */
const Config = z.object({
	provider: z.union([z.const("none"), z.const("grok-x-search")]).default("none"),
	xSearchProbe: ProbeStatus.default("idle"),
	xSearchProbeError: z.string().default("")
});
/**
* Format an X search as the model-facing envelope.
* @param value - the canonical search outcome.
*/
function formatXSearchOutput(value) {
	const lines = [];
	if (value.content !== void 0 && value.content.length > 0) lines.push(value.content);
	lines.push(`Searched X via ${value.provider} (${value.model})`);
	for (const source of value.sources) lines.push(source.title === void 0 ? `- ${source.url}` : `- ${source.title}: ${source.url}`);
	return lines.join("\n");
}
/**
* Project one X search into its envelope.
* @param value - the canonical search outcome.
*/
function xSearchContent(value) {
	return [{
		type: "text",
		text: formatXSearchOutput(value)
	}];
}
const TOOLS_MARK = Symbol.for("dsh.draco-x-search.tools");
async function resolveBearer(ctx) {
	const oauth = ctx.get("xaiOauth");
	if (oauth === void 0 || typeof oauth.getBearer !== "function") return void 0;
	const token = await oauth.getBearer();
	return typeof token === "string" && token.length > 0 ? token : void 0;
}
async function syncOauth(ctx, scope) {
	const token = await resolveBearer(ctx);
	const resolved = scope.get();
	if (token !== void 0) {
		const patch = {
			xSearchProbe: "ok",
			xSearchProbeError: ""
		};
		if (resolved.provider === "none") patch.provider = "grok-x-search";
		if (resolved.xSearchProbe === "ok" && (resolved.xSearchProbeError ?? "") === "" && patch.provider === void 0) return;
		await scope.update(patch);
		return;
	}
	if (resolved.xSearchProbe === "ok" || (resolved.xSearchProbeError ?? "") !== "") await scope.update({
		xSearchProbe: "idle",
		xSearchProbeError: ""
	});
}
function valueFromCollected(collected) {
	return {
		...collected.content.length > 0 ? { content: collected.content } : {},
		sources: [...collected.sources],
		provider: "grok-x-search",
		model: collected.model
	};
}
/**
* Register `x_search` once per tools table.
* @param ctx - host context.
* @param config - composition base for the settings namespace.
*/
function apply(ctx, config) {
	let current = config;
	ctx.inject(["settings"], (sctx) => {
		const scope = sctx.settings.register(X_SEARCH_SETTINGS_NAMESPACE, Config, { base: config });
		current = scope.get();
		scope.watch((next) => {
			current = next;
		});
		sctx.on("draco/xai-oauth-ready", () => {
			syncOauth(ctx, scope);
		});
		sctx.on("draco/xai-oauth-ended", () => {
			syncOauth(ctx, scope);
		});
		syncOauth(ctx, scope);
	});
	const tools = ctx.tools;
	if (tools[TOOLS_MARK] === true || ctx.tools.get?.("x_search") !== void 0) return;
	tools[TOOLS_MARK] = true;
	ctx.effect(() => () => {
		delete tools[TOOLS_MARK];
	}, "draco-x-search: shared tools");
	ctx.tools.register(defineTool({
		name: "x_search",
		timeoutMs: 18e4,
		description: "Search X (Twitter) via Grok. SuperGrok login enables grok-x-search. Optional handle and date filters. Returns a short summary plus citeable x.com URLs.",
		parameters: {
			query: {
				type: "string",
				required: true,
				description: "What to search for on X."
			},
			allowed_x_handles: {
				type: "array",
				items: { type: "string" },
				description: `Only these X handles (no @). At most 20. Cannot combine with excluded_x_handles.`
			},
			excluded_x_handles: {
				type: "array",
				items: { type: "string" },
				description: `Exclude these X handles (no @). At most 20. Cannot combine with allowed_x_handles.`
			},
			from_date: {
				type: "string",
				description: "Inclusive start date (ISO-8601)."
			},
			to_date: {
				type: "string",
				description: "Inclusive end date (ISO-8601)."
			},
			enable_image_understanding: {
				type: "boolean",
				description: "Ask Grok to look at images in matching posts."
			},
			enable_video_understanding: {
				type: "boolean",
				description: "Ask Grok to look at videos in matching posts."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					content: { type: "string" },
					sources: {
						type: "array",
						required: true,
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								url: {
									type: "string",
									required: true
								},
								title: { type: "string" }
							}
						}
					},
					provider: {
						type: "string",
						required: true
					},
					model: {
						type: "string",
						required: true
					}
				}
			},
			render: (_args, value) => xSearchContent(value)
		},
		async execute(args, exec) {
			const query = args.query.trim();
			if (query.length === 0) throw new Error("query must be a non-empty string");
			if (current.provider !== "grok-x-search") throw new Error("X search is not configured; sign in with SuperGrok or pick grok-x-search in Settings → Draco-suite");
			const apiKey = await resolveBearer(ctx);
			if (apiKey === void 0) throw new Error("no SuperGrok login; sign in with SuperGrok in Settings → Draco-suite");
			return valueFromCollected(await collectXSearch(apiKey, {
				...args,
				query
			}, exec.signal));
		},
		presentCall(args) {
			return {
				card: "generic",
				title: `Search X: ${args.query}`,
				kind: "other"
			};
		}
	}));
}
//#endregion
export { Config, X_SEARCH_MAX_HANDLES, X_SEARCH_MODEL, X_SEARCH_PROBE_TIMEOUT_MS, X_SEARCH_SETTINGS_NAMESPACE, apply, collectXSearch, formatXSearchOutput, inject, name, normalizeXHandle, normalizeXHandles, probeXSearch, xSearchContent, xSearchRequestBody, xSearchToolEntry };
