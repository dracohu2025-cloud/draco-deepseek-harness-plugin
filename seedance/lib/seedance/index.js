import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import z from "@deepseek-ai/schemastery";
import { AttachmentId } from "@deepseek-ai/dsh-attachment";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { LlmError, normalizeApiKey } from "@deepseek-ai/dsh-llm";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
//#region lib/types/ark-seedance.js
/**
* Volcengine Ark Seedance 2.0 HTTP client: create a contents-generation
* task, poll it, and download the MP4. Auth is `ARK_API_KEY`.
* @module @deepseek-ai/dsh-draco-seedance-gen/src/ark-seedance
*/
/** China Ark contents-generation endpoint. */
const SEEDANCE_TASKS_URL = "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks";
/** Dropdown order: standard, mini, fast. */
const SEEDANCE_MODEL_IDS = [
	"seedance-2-0",
	"seedance-2-0-mini",
	"seedance-2-0-fast"
];
/** Catalog for the three Seedance 2.0 rows. */
const SEEDANCE_MODELS = {
	"seedance-2-0": {
		wire: "doubao-seedance-2-0-260128",
		resolution: "1080p",
		label: "doubao-seedance-2.0 (1080p)"
	},
	"seedance-2-0-mini": {
		wire: "doubao-seedance-2-0-mini-260615",
		resolution: "720p",
		label: "doubao-seedance-2.0-mini (720p)"
	},
	"seedance-2-0-fast": {
		wire: "doubao-seedance-2-0-fast-260128",
		resolution: "720p",
		label: "doubao-seedance-2.0-fast (720p)"
	}
};
/** Settings probe budget. Listing tasks is cheap. */
const SEEDANCE_PROBE_TIMEOUT_MS = 2e4;
/** Poll pause between task GETs. */
const SEEDANCE_POLL_MS = 5e3;
const RATIOS = {
	landscape: "16:9",
	square: "1:1",
	portrait: "9:16"
};
/**
* Clamp a tool duration onto the Seedance 2.0 integer window.
* @param duration - requested seconds, or undefined for the tool default (6).
*/
function clampSeedanceDuration(duration) {
	return Math.min(15, Math.max(4, Math.round(duration === void 0 ? 6 : duration)));
}
/**
* Map a tool aspect alias to Ark `ratio`.
* @param aspect - tool argument, or undefined for landscape.
*/
function seedanceRatio(aspect) {
	if (aspect === "landscape" || aspect === "portrait" || aspect === "square") return RATIOS[aspect];
	return RATIOS.landscape;
}
/**
* True when `id` is one of the three Seedance 2.0 dropdown rows.
* @param id - stored video backend id.
*/
function isSeedanceModelId(id) {
	return id === "seedance-2-0" || id === "seedance-2-0-mini" || id === "seedance-2-0-fast";
}
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
function throwSeedance(status, payload, raw) {
	const record = asRecord(payload);
	const msg = typeof record?.error === "object" && record.error !== null ? JSON.stringify(record.error).slice(0, 300) : typeof record?.message === "string" ? record.message.slice(0, 300) : raw.slice(0, 300);
	throw new LlmError(`draco-seedance-gen: Ark returned HTTP ${status}${msg.length > 0 ? `: ${msg}` : ""}`, speechFailureCode(status));
}
function headers(apiKey) {
	return {
		authorization: `Bearer ${apiKey}`,
		"content-type": "application/json"
	};
}
/**
* Build the Ark create-task body. The first reference is the first frame;
* later references are `reference_image` stills.
* @param model - dropdown id.
* @param prompt - text prompt.
* @param aspect - tool aspect alias.
* @param duration - already clamped seconds.
* @param referenceUris - data URIs or https URLs, empty for text-only.
*/
function seedanceRequestBody(model, prompt, aspect, duration, referenceUris = []) {
	const spec = SEEDANCE_MODELS[model];
	const content = [{
		type: "text",
		text: prompt
	}];
	for (const [index, url] of referenceUris.entries()) content.push({
		type: "image_url",
		image_url: { url },
		role: index === 0 ? "first_frame" : "reference_image"
	});
	return {
		model: spec.wire,
		content,
		duration,
		ratio: seedanceRatio(aspect),
		resolution: spec.resolution,
		generate_audio: false,
		watermark: false
	};
}
function taskIdOf(payload) {
	const record = asRecord(payload);
	return typeof record?.id === "string" && record.id.length > 0 ? record.id : void 0;
}
function taskStatusOf(payload) {
	const record = asRecord(payload);
	return typeof record?.status === "string" ? record.status : void 0;
}
function videoUrlOf(payload) {
	const content = asRecord(asRecord(payload)?.content);
	return typeof content?.video_url === "string" && content.video_url.startsWith("http") ? content.video_url : void 0;
}
function taskErrorOf(payload) {
	const error = asRecord(payload)?.error;
	if (typeof error === "string" && error.length > 0) return error;
	const nested = asRecord(error);
	if (typeof nested?.message === "string" && nested.message.length > 0) return nested.message;
}
async function downloadMp4(url, signal) {
	const response = await fetch(url, { signal: signal ?? null });
	if (!response.ok) throw new LlmError(`draco-seedance-gen: result download HTTP ${response.status}`, "SERVER");
	const bytes = Buffer.from(await response.arrayBuffer());
	if (bytes.length === 0) throw new LlmError("draco-seedance-gen: downloaded an empty MP4", "SERVER");
	return bytes;
}
async function sleep(ms, signal) {
	if (signal?.aborted) {
		const err = /* @__PURE__ */ new Error("aborted");
		err.name = "AbortError";
		throw err;
	}
	await new Promise((resolve, reject) => {
		const timer = setTimeout(resolve, ms);
		const onAbort = () => {
			clearTimeout(timer);
			const err = /* @__PURE__ */ new Error("aborted");
			err.name = "AbortError";
			reject(err);
		};
		signal?.addEventListener("abort", onAbort, { once: true });
	});
}
/**
* Confirm `ARK_API_KEY` can list Ark contents-generation tasks.
* @param apiKey - resolved Ark key.
* @param signal - cancellation / probe timeout.
*/
async function probeSeedance(apiKey, signal) {
	const response = await fetch(`${SEEDANCE_TASKS_URL}?page_size=1`, {
		headers: { authorization: `Bearer ${apiKey}` },
		signal: signal ?? null
	});
	const raw = await readBody(response);
	if (!response.ok) throwSeedance(response.status, parseJson(raw), raw);
}
/**
* Create a Seedance 2.0 task, poll until it succeeds, and download the MP4.
* @param apiKey - resolved Ark key.
* @param model - dropdown id.
* @param prompt - text prompt.
* @param aspect - tool aspect alias.
* @param duration - already clamped seconds.
* @param signal - cancellation.
* @param referenceUris - first-frame then reference stills.
*/
async function collectSeedanceVideo(apiKey, model, prompt, aspect, duration, signal, referenceUris = []) {
	const created = await fetch(SEEDANCE_TASKS_URL, {
		method: "POST",
		headers: headers(apiKey),
		body: JSON.stringify(seedanceRequestBody(model, prompt, aspect, duration, referenceUris)),
		signal: signal ?? null
	});
	const createdRaw = await readBody(created);
	const createdJson = parseJson(createdRaw);
	if (!created.ok) throwSeedance(created.status, createdJson, createdRaw);
	const id = taskIdOf(createdJson);
	if (id === void 0) throw new LlmError("draco-seedance-gen: Ark create returned no task id", "SERVER");
	while (true) {
		const polled = await fetch(`${SEEDANCE_TASKS_URL}/${id}`, {
			headers: { authorization: `Bearer ${apiKey}` },
			signal: signal ?? null
		});
		const polledRaw = await readBody(polled);
		const polledJson = parseJson(polledRaw);
		if (!polled.ok) throwSeedance(polled.status, polledJson, polledRaw);
		const status = taskStatusOf(polledJson);
		if (status === "succeeded" || status === "success") {
			const url = videoUrlOf(polledJson);
			if (url === void 0) throw new LlmError("draco-seedance-gen: succeeded task had no video_url", "SERVER");
			return {
				bytes: await downloadMp4(url, signal),
				mediaType: "video/mp4"
			};
		}
		if (status === "failed" || status === "cancelled" || status === "expired") {
			const detail = taskErrorOf(polledJson);
			throw new LlmError(`draco-seedance-gen: task ${status}${detail !== void 0 ? `: ${detail}` : ""}`, "SERVER");
		}
		await sleep(SEEDANCE_POLL_MS, signal);
	}
}
//#endregion
//#region lib/types/references.js
/**
* Resolve `video_generate.references` into Seedance image URLs.
* Tokens match Imagine: https URL, data URI, session attachment id, local
* path, or `latest`.
* @module @deepseek-ai/dsh-draco-seedance-gen/src/references
*/
/** Shared `video_generate.references` cap (Imagine 1.5 and Seedance). */
const SEEDANCE_MAX_REFERENCES = 7;
const ATTACHMENT_ID = /^sha256:[a-f0-9]{64}$/;
/**
* Detect PNG / JPEG / GIF / WebP from magic bytes.
* @param bytes - encoded raster.
* @returns the matching media type.
* @throws when the bytes are not a supported raster.
*/
function detectRasterMediaType(bytes) {
	if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return "image/png";
	if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
	if (bytes.length >= 6 && bytes.subarray(0, 6).toString("ascii") === "GIF87a") return "image/gif";
	if (bytes.length >= 6 && bytes.subarray(0, 6).toString("ascii") === "GIF89a") return "image/gif";
	if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
	throw new Error("video reference is not a PNG, JPEG, GIF, or WebP image");
}
/**
* Encode raster bytes as a data URI.
* @param bytes - encoded raster.
*/
function dataUriFromRaster(bytes) {
	return `data:${detectRasterMediaType(bytes)};base64,${bytes.toString("base64")}`;
}
function isHttpUrl(token) {
	return token.startsWith("https://") || token.startsWith("http://");
}
function isDataImageUri(token) {
	return token.startsWith("data:image/");
}
function isAttachmentId(token) {
	return ATTACHMENT_ID.test(token);
}
function asImageRef(value) {
	if (typeof value !== "object" || value === null) return void 0;
	const rec = value;
	if (typeof rec.attachmentId !== "string" || !ATTACHMENT_ID.test(rec.attachmentId)) return void 0;
	if (typeof rec.mediaType !== "string" || typeof rec.bytes !== "number") return void 0;
	if (typeof rec.width !== "number" || typeof rec.height !== "number") return void 0;
	return rec;
}
/**
* Collect ImageBlock attachments in session-log order.
* @param events - `exec.agent.session.events`, or any JSON tree that embeds ImageBlocks.
*/
function collectSessionImageRefs(events) {
	if (events === void 0) return [];
	const found = [];
	const visit = (node) => {
		if (Array.isArray(node)) {
			for (const item of node) visit(item);
			return;
		}
		if (typeof node !== "object" || node === null) return;
		const rec = node;
		if (rec.type === "image") {
			const ref = asImageRef(rec.attachment);
			if (ref !== void 0) found.push(ref);
		}
		for (const value of Object.values(rec)) visit(value);
	};
	visit(events);
	return found;
}
function readAttachmentObject(attachmentId) {
	const hex = attachmentId.slice(7);
	const path = dshHomePath("attachments", "v1", "objects", hex.slice(0, 2), hex);
	if (!existsSync(path) || !statSync(path).isFile()) return void 0;
	return readFileSync(path);
}
async function bytesFromRef(ref, attachments, signal) {
	if (attachments !== void 0) {
		const stored = await attachments.readImage(ref, signal);
		return Buffer.from(stored.data);
	}
	const disk = readAttachmentObject(String(ref.attachmentId));
	if (disk === void 0) throw new Error(`video reference attachment ${ref.attachmentId} is not readable`);
	return disk;
}
function requireLatest(refs) {
	const last = refs.at(-1);
	if (last === void 0) throw new Error("no session image is available for references: [\"latest\"]");
	return last;
}
/**
* Turn model-facing reference tokens into Seedance image URLs.
* @param tokens - `video_generate.references`, or undefined for text-only.
* @param attachments - optional durable store for session ImageBlocks.
* @param sessionEvents - optional live session log.
* @param signal - cancellation forwarded to `readImage`.
* @returns data URIs or https URLs, empty when no references were requested.
*/
async function resolveSeedanceReferences(tokens, attachments, sessionEvents, signal) {
	if (tokens === void 0 || tokens.length === 0) return [];
	if (tokens.length > 7) throw new Error(`video_generate accepts at most 7 references`);
	const sessionRefs = collectSessionImageRefs(sessionEvents);
	const urls = [];
	for (const raw of tokens) {
		const token = raw.trim();
		if (token.length === 0) throw new Error("video reference must be a non-empty string");
		if (token === "latest") {
			urls.push(dataUriFromRaster(await bytesFromRef(requireLatest(sessionRefs), attachments, signal)));
			continue;
		}
		if (isHttpUrl(token) || isDataImageUri(token)) {
			urls.push(token);
			continue;
		}
		if (isAttachmentId(token)) {
			const match = sessionRefs.find((ref) => String(ref.attachmentId) === token);
			if (match !== void 0) {
				urls.push(dataUriFromRaster(await bytesFromRef(match, attachments, signal)));
				continue;
			}
			const disk = readAttachmentObject(token);
			if (disk === void 0) throw new Error(`video reference attachment ${token} was not found`);
			urls.push(dataUriFromRaster(disk));
			continue;
		}
		if (existsSync(token) && statSync(token).isFile()) {
			urls.push(dataUriFromRaster(readFileSync(token)));
			continue;
		}
		throw new Error(`video reference is not a path, attachment id, URL, data URI, or "latest": ${token}`);
	}
	return urls;
}
//#endregion
//#region lib/types/index.js
/**
* Draco Seedance 2.0 video backend. Settings live in `draco-seedance-gen`
* (`provider` plus probe fields). The shared `video_generate` tool is
* registered here when SuperGrok/Codex have not already registered it;
* otherwise this plugin only advertises backends on
* `Symbol.for('dsh.draco-video-gen.backends')`.
* @module @deepseek-ai/dsh-draco-seedance-gen
*/
const name = "draco-seedance-gen";
const inject = ["tools"];
/** Settings namespace owned by this plugin. */
const SEEDANCE_GEN_SETTINGS_NAMESPACE = settingsNamespace("draco-seedance-gen");
/** Shared video-backend registry used by `draco-image-gen` and this plugin. */
const VIDEO_BACKENDS = Symbol.for("dsh.draco-video-gen.backends");
const ProbeStatus = z.union([
	z.const("idle"),
	z.const("checking"),
	z.const("ok"),
	z.const("fail")
]);
/** Schemastery configuration for the Seedance plugin. */
const Config = z.object({
	provider: z.union([
		z.const("none"),
		z.const("seedance-2-0"),
		z.const("seedance-2-0-mini"),
		z.const("seedance-2-0-fast")
	]).default("none"),
	seedanceProbe: ProbeStatus.default("idle"),
	seedanceProbeError: z.string().default("")
});
/**
* Format a Seedance generation as the model-facing envelope.
* @param value - the canonical generation outcome.
*/
function formatSeedanceGenerateOutput(value) {
	const refs = value.references.length === 0 ? "" : ` with ${value.references.length} reference${value.references.length === 1 ? "" : "s"}`;
	return `Generated ${value.duration}s video via ${value.provider} (${value.model})${refs} → ${value.path}`;
}
/**
* Re-brand a canonical generated-video outcome into the attachment reference
* a `VideoBlock` carries.
* @param video - the canonical video metadata from the output schema.
*/
function videoRefFromValue(video) {
	return {
		attachmentId: AttachmentId(video.attachmentId),
		mediaType: video.mediaType,
		bytes: video.bytes,
		...video.name === void 0 ? {} : { name: video.name }
	};
}
/**
* Project one Seedance generation into its envelope and durable video.
* @param value - the canonical generation outcome.
*/
function seedanceGenerateContent(value) {
	const blocks = [{
		type: "text",
		text: formatSeedanceGenerateOutput(value)
	}];
	if (value.video !== void 0) blocks.push({
		type: "video",
		attachment: videoRefFromValue(value.video)
	});
	return blocks;
}
function probeFailureMessage(error) {
	if (error instanceof LlmError) return error.message.slice(0, 180);
	if (error instanceof Error) {
		if (error.name === "AbortError") return "probe timed out";
		return error.message.slice(0, 180);
	}
	return String(error).slice(0, 180);
}
const ARK_API_KEY = credentialRef("ARK_API_KEY");
const TOOLS_MARK = Symbol.for("dsh.draco-seedance-gen.tools");
function backendsOf(tools) {
	const bag = tools;
	return bag[VIDEO_BACKENDS] ??= /* @__PURE__ */ new Map();
}
async function resolveSecret(ctx, ref) {
	const credentials = ctx.get("credentials");
	if (credentials !== void 0) {
		const hit = await credentials.resolve(ref);
		if (hit !== void 0) {
			const checked = normalizeApiKey(hit.value);
			if (checked.ok) return checked.value;
		}
	}
	const env = process.env[ref];
	if (typeof env !== "string") return void 0;
	const checked = normalizeApiKey(env);
	return checked.ok ? checked.value : void 0;
}
async function runSeedance(ctx, model, args, exec) {
	const prompt = args.prompt.trim();
	if (prompt.length === 0) throw new Error("prompt must be a non-empty string");
	const apiKey = await resolveSecret(ctx, ARK_API_KEY);
	if (apiKey === void 0) throw new Error("no ARK_API_KEY; save it in Settings → Draco-suite or the environment");
	const duration = clampSeedanceDuration(typeof args.duration === "number" ? args.duration : void 0);
	const references = args.references ?? [];
	const referenceUris = await resolveSeedanceReferences(references, ctx.get("attachments"), exec.agent?.session.events, exec.signal);
	const collected = await collectSeedanceVideo(apiKey, model, prompt, args.aspect, duration, exec.signal, referenceUris);
	const spec = SEEDANCE_MODELS[model];
	const name = `${spec.wire}-${Date.now()}.mp4`;
	const path = dshHomePath(join("draco", "videos", name));
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, collected.bytes);
	const attachments = ctx.get("attachments");
	const saveVideo = attachments !== void 0 && typeof attachments.saveVideo === "function" ? attachments.saveVideo.bind(attachments) : void 0;
	const ref = saveVideo === void 0 ? void 0 : await saveVideo({
		data: new Uint8Array(collected.bytes),
		mediaType: "video/mp4",
		name
	});
	return {
		path,
		provider: model,
		model: spec.wire,
		duration,
		prompt,
		bytes: collected.bytes.length,
		references,
		...ref === void 0 ? {} : { video: {
			attachmentId: ref.attachmentId,
			mediaType: "video/mp4",
			bytes: ref.bytes,
			...ref.name === void 0 ? {} : { name: ref.name }
		} }
	};
}
/**
* Register Seedance backends and, when needed, `video_generate`.
* @param ctx - host context.
* @param config - composition base for the settings namespace.
*/
function apply(ctx, config) {
	let current = config;
	ctx.inject(["settings"], (sctx) => {
		const scope = sctx.settings.register(SEEDANCE_GEN_SETTINGS_NAMESPACE, Config, { base: config });
		current = scope.get();
		const runProbe = async () => {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), SEEDANCE_PROBE_TIMEOUT_MS);
			try {
				const apiKey = await resolveSecret(ctx, ARK_API_KEY);
				if (apiKey === void 0) {
					await scope.update({
						seedanceProbe: "fail",
						seedanceProbeError: "missing ARK_API_KEY"
					});
					return;
				}
				await probeSeedance(apiKey, controller.signal);
				await scope.update({
					seedanceProbe: "ok",
					seedanceProbeError: ""
				});
			} catch (error) {
				await scope.update({
					seedanceProbe: "fail",
					seedanceProbeError: probeFailureMessage(error)
				});
			} finally {
				clearTimeout(timer);
			}
		};
		const considerProbe = (next) => {
			if (isSeedanceModelId(next.provider) && next.seedanceProbe === "checking") runProbe();
		};
		scope.watch((next) => {
			current = next;
			considerProbe(next);
		});
		considerProbe(current);
	});
	const backends = backendsOf(ctx.tools);
	for (const id of SEEDANCE_MODEL_IDS) backends.set(id, (args, exec) => runSeedance(ctx, id, args, exec));
	ctx.effect(() => () => {
		for (const id of SEEDANCE_MODEL_IDS) backends.delete(id);
	}, "draco-seedance-gen: video backends");
	const tools = ctx.tools;
	if (tools[TOOLS_MARK] === true || ctx.tools.get?.("video_generate") !== void 0) return;
	tools[TOOLS_MARK] = true;
	ctx.effect(() => () => {
		delete tools[TOOLS_MARK];
	}, "draco-seedance-gen: shared tools");
	ctx.tools.register(defineTool({
		name: "video_generate",
		timeoutMs: 6e5,
		description: "Generate a short video. Settings → Draco-suite chooses grok-imagine-video-1.5 or doubao-seedance-2.0 / mini / fast. Optional references (up to 7): first image is the Seedance first frame; later images are style references. Pass image_generate paths, sha256 attachment ids, https URLs, data URIs, or \"latest\". The MP4 is written under $DSH_HOME/draco/videos/.",
		parameters: {
			prompt: {
				type: "string",
				required: true,
				description: "Text description of the video to generate."
			},
			aspect: {
				type: "string",
				enum: [
					"square",
					"landscape",
					"portrait"
				],
				description: "Aspect ratio. Defaults to landscape."
			},
			duration: {
				type: "integer",
				description: "Length in seconds. Seedance 2.0 allows 4–15 (default 6)."
			},
			references: {
				type: "array",
				items: { type: "string" },
				description: `Up to 7 reference images. Each item is a prior image_generate path, a sha256 attachment id, an https URL, a data URI, or "latest". The first still is the first frame.`
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					path: {
						type: "string",
						required: true
					},
					provider: {
						type: "string",
						required: true
					},
					model: {
						type: "string",
						required: true
					},
					duration: {
						type: "integer",
						required: true
					},
					prompt: {
						type: "string",
						required: true
					},
					bytes: {
						type: "integer",
						required: true
					},
					references: {
						type: "array",
						required: true,
						items: { type: "string" }
					},
					video: {
						type: "object",
						additionalProperties: false,
						properties: {
							attachmentId: {
								type: "string",
								required: true
							},
							mediaType: {
								type: "string",
								enum: ["video/mp4"],
								required: true
							},
							bytes: {
								type: "integer",
								required: true
							},
							name: { type: "string" }
						}
					}
				}
			},
			render: (_args, value) => seedanceGenerateContent(value)
		},
		async execute(args, exec) {
			if (args.prompt.trim().length === 0) throw new Error("prompt must be a non-empty string");
			if (!isSeedanceModelId(current.provider)) throw new Error("video generation is not configured; pick doubao-seedance-2.0, mini, or fast in Settings → Draco-suite");
			return runSeedance(ctx, current.provider, args, exec);
		},
		presentCall(args) {
			const count = args.references?.length ?? 0;
			return {
				card: "generic",
				title: `Generate video${count === 0 ? "" : ` (${count} ref${count === 1 ? "" : "s"})`}: ${args.prompt}`,
				kind: "other"
			};
		}
	}));
}
//#endregion
export { Config, SEEDANCE_GEN_SETTINGS_NAMESPACE, SEEDANCE_MAX_REFERENCES, SEEDANCE_MODELS, SEEDANCE_MODEL_IDS, VIDEO_BACKENDS, apply, clampSeedanceDuration, formatSeedanceGenerateOutput, inject, isSeedanceModelId, name, seedanceGenerateContent, seedanceRequestBody, videoRefFromValue };
