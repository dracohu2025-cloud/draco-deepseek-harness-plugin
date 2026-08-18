import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import z from "@deepseek-ai/schemastery";
import { AttachmentId } from "@deepseek-ai/dsh-attachment";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { LlmError } from "@deepseek-ai/dsh-llm";
import { EventSourceParserStream } from "eventsource-parser/stream";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
//#region lib/types/codex-headers.js
/**
* Cloudflare originator headers required by `chatgpt.com/backend-api/codex`.
* A malformed token omits the account header so the provider still answers
* 401 instead of crashing client construction.
* @module dsh-draco-image-gen/codex-headers
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
//#region lib/types/xai-imagine.js
/**
* xAI Grok Imagine HTTP client: image 2.0 generations and video generations.
* Auth is a SuperGrok OAuth bearer or an `XAI_API_KEY`. Temporary result URLs
* are downloaded immediately; image bytes are returned for the attachment
* store, video bytes for a convenience file under `$DSH_HOME`.
* @module @deepseek-ai/dsh-draco-image-gen/src/xai-imagine
*/
/** Official Imagine image model (Quality Mode / Image 2.0). */
const XAI_IMAGE_MODEL = "grok-imagine-image-2.0";
/** Official Imagine video model. */
const XAI_VIDEO_MODEL = "grok-imagine-video";
/** Default Imagine API base. */
const XAI_IMAGINE_BASE_URL = "https://api.x.ai/v1";
/** Aspect aliases accepted by `image_generate` / `video_generate`. */
const XAI_ASPECTS = {
	landscape: "16:9",
	square: "1:1",
	portrait: "9:16"
};
/**
* Map a tool aspect alias to the Imagine `aspect_ratio` string.
* @param aspect - tool argument, or undefined for square.
*/
function xaiAspectRatio(aspect) {
	if (aspect === "landscape" || aspect === "portrait" || aspect === "square") return XAI_ASPECTS[aspect];
	return XAI_ASPECTS.square;
}
/**
* Collapse Codex's three-tier quality onto Imagine Image 2.0's two tiers.
* @param quality - stored settings quality.
*/
function xaiImageQuality(quality) {
	return quality === "low" ? "low" : "medium";
}
/**
* Detect PNG vs JPEG from magic bytes. Imagine Image 2.0 usually returns JPEG.
* @param bytes - encoded raster.
*/
function detectImageMediaType(bytes) {
	if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return "image/png";
	return "image/jpeg";
}
/**
* Pull the first HTTP URL out of an Imagine JSON body.
* @param payload - parsed response JSON.
*/
function extractImagineUrl(payload) {
	if (typeof payload !== "object" || payload === null) return void 0;
	const record = payload;
	if (typeof record.url === "string" && record.url.startsWith("http")) return record.url;
	const video = record.video;
	if (typeof video === "object" && video !== null) {
		const nested = video.url;
		if (typeof nested === "string" && nested.startsWith("http")) return nested;
	}
	const data = record.data;
	if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
		const first = data[0];
		if (typeof first.url === "string" && first.url.startsWith("http")) return first.url;
	}
}
/**
* Pull a job id used to poll an async Imagine video request.
* @param payload - parsed response JSON.
*/
function extractImagineJobId(payload) {
	if (typeof payload !== "object" || payload === null) return void 0;
	const record = payload;
	for (const key of ["id", "request_id"]) {
		const value = record[key];
		if (typeof value === "string" && value.length > 0) return value;
	}
	const video = record.video;
	if (typeof video === "object" && video !== null) {
		const id = video.id;
		if (typeof id === "string" && id.length > 0) return id;
	}
	const data = record.data;
	if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
		const id = data[0].id;
		if (typeof id === "string" && id.length > 0) return id;
	}
}
/**
* Pull base64 image payload from an Imagine images response.
* @param payload - parsed response JSON.
*/
function extractImagineB64(payload) {
	if (typeof payload !== "object" || payload === null) return void 0;
	const data = payload.data;
	if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== "object" || data[0] === null) return void 0;
	const b64 = data[0].b64_json;
	return typeof b64 === "string" && b64.length > 0 ? b64 : void 0;
}
function imagineHeaders(bearer) {
	return {
		authorization: `Bearer ${bearer}`,
		"content-type": "application/json",
		accept: "application/json",
		"user-agent": "Draco-Harness/draco-imagine"
	};
}
function imagineBaseUrl() {
	const raw = process.env.XAI_BASE_URL;
	if (typeof raw === "string" && raw.trim().length > 0) return raw.trim().replace(/\/+$/, "");
	return XAI_IMAGINE_BASE_URL;
}
async function readJson(response) {
	const text = await response.text();
	if (text.length === 0) return void 0;
	try {
		return JSON.parse(text);
	} catch {
		return { error: text.slice(0, 300) };
	}
}
function throwImagine(status, payload, kind) {
	const detail = typeof payload === "object" && payload !== null ? JSON.stringify(payload).slice(0, 300) : String(payload ?? "").slice(0, 300);
	throw new LlmError(`draco-image-gen: xAI Imagine ${kind} returned HTTP ${status}${detail.length > 0 ? `: ${detail}` : ""}`, status === 401 || status === 403 ? "INVALID_CREDENTIAL" : "SERVER");
}
async function downloadBinary(url, signal) {
	const response = await fetch(url, { signal: signal ?? null });
	if (!response.ok) throw new LlmError(`draco-image-gen: Imagine result download HTTP ${response.status}`, "SERVER");
	return Buffer.from(await response.arrayBuffer());
}
/**
* Generate one Imagine Image 2.0 raster and return its bytes.
* @param bearer - SuperGrok OAuth or API-key bearer.
* @param prompt - text prompt.
* @param aspect - tool aspect alias.
* @param quality - Imagine quality tier.
* @param resolution - Imagine resolution tier.
* @param signal - cancellation.
*/
async function collectXaiImage(bearer, prompt, aspect, quality, resolution, signal) {
	const response = await fetch(`${imagineBaseUrl()}/images/generations`, {
		method: "POST",
		headers: imagineHeaders(bearer),
		body: JSON.stringify({
			model: XAI_IMAGE_MODEL,
			prompt,
			aspect_ratio: xaiAspectRatio(aspect),
			quality,
			resolution,
			response_format: "b64_json"
		}),
		signal: signal ?? null
	});
	const payload = await readJson(response);
	if (!response.ok) throwImagine(response.status, payload, "image");
	const b64 = extractImagineB64(payload);
	if (b64 !== void 0) {
		const bytes = Buffer.from(b64, "base64");
		return {
			bytes,
			mediaType: detectImageMediaType(bytes)
		};
	}
	const url = extractImagineUrl(payload);
	if (url === void 0) throw new LlmError("draco-image-gen: Imagine image response had neither b64_json nor url", "SERVER");
	const bytes = await downloadBinary(url, signal);
	return {
		bytes,
		mediaType: detectImageMediaType(bytes)
	};
}
async function postVideo(bearer, body, signal) {
	const base = imagineBaseUrl();
	const first = await fetch(`${base}/videos/generations`, {
		method: "POST",
		headers: imagineHeaders(bearer),
		body: JSON.stringify(body),
		signal: signal ?? null
	});
	if (first.status !== 404) return {
		status: first.status,
		payload: await readJson(first)
	};
	const second = await fetch(`${base}/videos`, {
		method: "POST",
		headers: imagineHeaders(bearer),
		body: JSON.stringify(body),
		signal: signal ?? null
	});
	return {
		status: second.status,
		payload: await readJson(second)
	};
}
async function getVideoJob(bearer, id, signal) {
	const base = imagineBaseUrl();
	const headers = imagineHeaders(bearer);
	for (const path of [`${base}/videos/generations/${id}`, `${base}/videos/${id}`]) {
		const response = await fetch(path, {
			headers,
			signal: signal ?? null
		});
		if (response.status === 404) continue;
		const payload = await readJson(response);
		if (!response.ok) throwImagine(response.status, payload, "video");
		return payload;
	}
}
function jobFailed(payload) {
	if (typeof payload !== "object" || payload === null) return void 0;
	const status = payload.status;
	if (status === "failed" || status === "error") {
		const error = payload.error;
		return typeof error === "string" ? error : "Imagine video job failed";
	}
}
/**
* Generate one Imagine video and return its bytes. Async jobs are polled
* until a URL appears or `signal` aborts.
* @param bearer - SuperGrok OAuth or API-key bearer.
* @param prompt - text prompt.
* @param aspect - tool aspect alias.
* @param duration - seconds, already clamped by the tool.
* @param signal - cancellation.
*/
async function collectXaiVideo(bearer, prompt, aspect, duration, signal) {
	const { status, payload } = await postVideo(bearer, {
		model: XAI_VIDEO_MODEL,
		prompt,
		duration,
		aspect_ratio: xaiAspectRatio(aspect)
	}, signal);
	if (status < 200 || status >= 300) throwImagine(status, payload, "video");
	const immediate = extractImagineUrl(payload);
	if (immediate !== void 0) return {
		bytes: await downloadBinary(immediate, signal),
		mediaType: "video/mp4"
	};
	const jobId = extractImagineJobId(payload);
	if (jobId === void 0) throw new LlmError("draco-image-gen: Imagine video response had neither url nor job id", "SERVER");
	const deadline = Date.now() + 300 * 1e3;
	while (Date.now() < deadline) {
		if (signal?.aborted) throw new LlmError("draco-image-gen: Imagine video cancelled", "SERVER");
		await new Promise((resolve) => setTimeout(resolve, 2e3));
		const job = await getVideoJob(bearer, jobId, signal);
		if (job === void 0) continue;
		const failed = jobFailed(job);
		if (failed !== void 0) throw new LlmError(`draco-image-gen: ${failed}`, "SERVER");
		const url = extractImagineUrl(job);
		if (url !== void 0) return {
			bytes: await downloadBinary(url, signal),
			mediaType: "video/mp4"
		};
	}
	throw new LlmError("draco-image-gen: Imagine video timed out waiting for a result URL", "SERVER");
}
//#endregion
//#region lib/types/index.js
/**
* Draco media-generation configuration, `image_generate`, and
* `video_generate`. The selected backend lives in the `draco-image-gen`
* settings namespace. Completing a Codex OAuth login defaults an unset
* selection to Codex `gpt-image-2`; completing a SuperGrok login defaults it
* to Grok Imagine Image 2.0. An explicit user choice is left alone. Generated
* rasters are committed through `ctx.attachments` before the tool result is
* appended. Videos are written under `$DSH_HOME/draco/videos/` (the
* attachment store is image-only).
* @module @deepseek-ai/dsh-draco-image-gen
*/
const name = "draco-image-gen";
const inject = ["tools"];
/** Settings namespace owned by this plugin. */
const IMAGE_GEN_SETTINGS_NAMESPACE = settingsNamespace("draco-image-gen");
/** Codex Responses host that invokes the image_generation tool. */
const CODEX_CHAT_MODEL = "gpt-5.6-terra";
/** Codex Responses endpoint. */
const CODEX_BASE_URL = "https://chatgpt.com/backend-api/codex";
/** Wire model id sent to the image_generation tool. */
const CODEX_IMAGE_MODEL = "gpt-image-2";
/** Default quality tier after a first Codex login. */
const CODEX_DEFAULT_QUALITY = "medium";
/** Aspect-ratio presets mapped to Codex image sizes. */
const SIZES = {
	landscape: "1536x1024",
	square: "1024x1024",
	portrait: "1024x1536"
};
/** Schemastery configuration for the image-generation plugin. */
const Config = z.object({
	provider: z.union([
		z.const("none"),
		z.const("openai-codex"),
		z.const("xai-imagine")
	]).default("none"),
	quality: z.union([
		z.const("low"),
		z.const("medium"),
		z.const("high")
	]).default(CODEX_DEFAULT_QUALITY),
	resolution: z.union([z.const("1k"), z.const("2k")]).default("1k")
});
/**
* Re-brand a canonical generated-image outcome into the attachment reference
* an `ImageBlock` carries.
* @param image - the canonical image metadata from the output schema.
*/
function imageRefFromValue(image) {
	return {
		attachmentId: AttachmentId(image.attachmentId),
		mediaType: image.mediaType,
		bytes: image.bytes,
		width: image.width,
		height: image.height,
		...image.name === void 0 ? {} : { name: image.name }
	};
}
/**
* Format a generation as the model-facing envelope beside its image block.
* @param value - the canonical generation outcome.
*/
function formatImageGenerateOutput(value) {
	const model = value.provider === "xai-imagine" ? XAI_IMAGE_MODEL : CODEX_IMAGE_MODEL;
	return `Generated ${value.quality} image via ${value.provider} (${model}) → ${value.path}`;
}
/**
* Format a video generation as the model-facing envelope.
* @param value - the canonical generation outcome.
*/
function formatVideoGenerateOutput(value) {
	return `Generated ${value.duration}s video via ${value.provider} (${value.model}) → ${value.path}`;
}
/**
* Project one canonical generation into its envelope and durable image.
* @param value - the canonical generation outcome.
*/
function imageGenerateContent(value) {
	return [{
		type: "text",
		text: formatImageGenerateOutput(value)
	}, {
		type: "image",
		attachment: imageRefFromValue(value.image)
	}];
}
/**
* Project one video generation into its model-facing envelope.
* @param value - the canonical generation outcome.
*/
function videoGenerateContent(value) {
	return [{
		type: "text",
		text: formatVideoGenerateOutput(value)
	}];
}
const XAI_API_KEY = credentialRef("XAI_API_KEY");
const appliedRoots = /* @__PURE__ */ new WeakSet();
async function resolveXaiBearer(ctx) {
	const oauth = await ctx.get("xaiOauth")?.getBearer();
	if (oauth !== void 0 && oauth.length > 0) return oauth;
	const credentials = ctx.get("credentials");
	if (credentials !== void 0) {
		const hit = await credentials.resolve(XAI_API_KEY);
		if (hit !== void 0 && hit.value.trim().length > 0) return hit.value.trim();
	}
	const env = process.env.XAI_API_KEY;
	return typeof env === "string" && env.trim().length > 0 ? env.trim() : void 0;
}
/** Decode an SSE byte stream into event `data` payloads. */
async function* parseSse(stream) {
	const events = stream.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream());
	for await (const { data } of events) yield data;
}
/** Collect the first base64 image from a Codex Responses image_generation stream. */
async function collectImageB64(bearer, prompt, size, quality, signal) {
	const response = await fetch(`${CODEX_BASE_URL}/responses`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${bearer}`,
			...codexCloudflareHeaders(bearer)
		},
		body: JSON.stringify({
			model: CODEX_CHAT_MODEL,
			store: false,
			stream: true,
			instructions: "You are an assistant that must fulfill image generation requests by using the image_generation tool when provided.",
			input: [{
				type: "message",
				role: "user",
				content: [{
					type: "input_text",
					text: prompt
				}]
			}],
			tools: [{
				type: "image_generation",
				model: CODEX_IMAGE_MODEL,
				size,
				quality,
				output_format: "png",
				background: "opaque",
				partial_images: 1
			}],
			tool_choice: {
				type: "allowed_tools",
				mode: "required",
				tools: [{ type: "image_generation" }]
			}
		}),
		signal: signal ?? null
	});
	if (!response.ok) {
		const raw = await response.text().catch(() => "");
		throw new LlmError(`draco-image-gen: Codex returned HTTP ${response.status}${raw.length > 0 ? `: ${raw.slice(0, 300)}` : ""}`, response.status === 401 || response.status === 403 ? "INVALID_CREDENTIAL" : "SERVER");
	}
	if (response.body === null) throw new LlmError("draco-image-gen: Codex returned an empty body", "SERVER");
	let imageB64;
	for await (const data of parseSse(response.body)) {
		if (data.length === 0 || data === "[DONE]") continue;
		let event;
		try {
			event = JSON.parse(data);
		} catch {
			continue;
		}
		if (event.type === "response.output_item.done" && event.item?.type === "image_generation_call" && typeof event.item.result === "string" && event.item.result.length > 0) imageB64 = event.item.result;
		else if (event.type === "response.image_generation_call.partial_image" && typeof event.partial_image_b64 === "string" && event.partial_image_b64.length > 0) imageB64 = event.partial_image_b64;
	}
	if (imageB64 === void 0) throw new LlmError("draco-image-gen: Codex stream finished without an image", "SERVER");
	return imageB64;
}
function apply(ctx, config) {
	const root = ctx.root ?? ctx;
	if (appliedRoots.has(root)) return;
	appliedRoots.add(root);
	ctx.effect(() => () => {
		appliedRoots.delete(root);
	}, "draco-image-gen: singleton");
	let current = config;
	ctx.inject(["settings"], (sctx) => {
		const scope = sctx.settings.register(IMAGE_GEN_SETTINGS_NAMESPACE, Config, { base: config });
		current = scope.get();
		scope.watch((next) => {
			current = next;
		});
		sctx.on("draco/codex-oauth-ready", () => {
			const resolved = scope.get();
			if (resolved.provider !== "none") return;
			scope.update({
				provider: "openai-codex",
				quality: resolved.quality || "medium"
			}).catch((error) => {
				ctx.logger.warn("draco-image-gen: could not default to Codex gpt-image-2: %s", String(error));
			});
		});
		sctx.on("draco/xai-oauth-ready", () => {
			const resolved = scope.get();
			if (resolved.provider !== "none") return;
			scope.update({
				provider: "xai-imagine",
				quality: resolved.quality || "medium",
				resolution: resolved.resolution || "1k"
			}).catch((error) => {
				ctx.logger.warn("draco-image-gen: could not default to Grok Imagine Image 2.0: %s", String(error));
			});
		});
	});
	ctx.tools.register(defineTool({
		name: "image_generate",
		description: "Generate an image from a text prompt. SuperGrok login defaults to Grok Imagine Image 2.0; Codex login defaults to gpt-image-2. Settings → Models chooses the backend.",
		parameters: {
			prompt: {
				type: "string",
				required: true,
				description: "Text description of the image to generate."
			},
			aspect: {
				type: "string",
				enum: [
					"square",
					"landscape",
					"portrait"
				],
				description: "Aspect ratio. Defaults to square."
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
					quality: {
						type: "string",
						required: true
					},
					prompt: {
						type: "string",
						required: true
					},
					image: {
						type: "object",
						additionalProperties: false,
						required: true,
						properties: {
							attachmentId: {
								type: "string",
								required: true
							},
							mediaType: {
								type: "string",
								enum: ["image/png", "image/jpeg"],
								required: true
							},
							bytes: {
								type: "integer",
								required: true
							},
							width: {
								type: "integer",
								required: true
							},
							height: {
								type: "integer",
								required: true
							},
							name: { type: "string" }
						}
					}
				}
			},
			render: (_args, value) => imageGenerateContent(value)
		},
		async execute(args, exec) {
			const prompt = args.prompt.trim();
			if (prompt.length === 0) throw new Error("prompt must be a non-empty string");
			if (current.provider !== "openai-codex" && current.provider !== "xai-imagine") throw new Error("image generation is not configured; sign in with SuperGrok or Codex, or set image_gen.provider");
			const attachments = ctx.get("attachments");
			if (attachments === void 0) throw new Error("cannot persist a generated image: no attachment service is mounted");
			let bytes;
			let mediaType;
			let provider;
			let stem;
			if (current.provider === "xai-imagine") {
				const bearer = await resolveXaiBearer(ctx);
				if (bearer === void 0) throw new Error("no SuperGrok OAuth session or XAI_API_KEY; run /grok-login or use Settings → Models → Sign in with SuperGrok");
				const collected = await collectXaiImage(bearer, prompt, args.aspect, xaiImageQuality(current.quality), current.resolution, exec.signal);
				bytes = collected.bytes;
				mediaType = collected.mediaType;
				provider = "xai-imagine";
				stem = `grok-imagine-image-${Date.now()}`;
			} else {
				const bearer = await ctx.get("codexOauth")?.getBearer();
				if (bearer === void 0) throw new Error("no OpenAI Codex OAuth session; run /codex-login or use Settings → Models → Sign in with Codex");
				const b64 = await collectImageB64(bearer, prompt, SIZES[args.aspect ?? "square"] ?? SIZES.square, current.quality, exec.signal);
				bytes = Buffer.from(b64, "base64");
				mediaType = detectImageMediaType(bytes);
				provider = "openai-codex";
				stem = `gpt-image-2-${Date.now()}`;
			}
			const name = `${stem}.${mediaType === "image/png" ? "png" : "jpg"}`;
			const path = dshHomePath(join("draco", "images", name));
			mkdirSync(dirname(path), { recursive: true });
			writeFileSync(path, bytes);
			const ref = await attachments.saveImage({
				data: new Uint8Array(bytes),
				mediaType,
				name
			});
			return {
				path,
				provider,
				quality: current.quality,
				prompt,
				image: {
					attachmentId: ref.attachmentId,
					mediaType,
					bytes: ref.bytes,
					width: ref.width,
					height: ref.height,
					...ref.name === void 0 ? {} : { name: ref.name }
				}
			};
		},
		presentCall(args) {
			return {
				card: "generic",
				title: `Generate image: ${args.prompt}`,
				kind: "other"
			};
		}
	}));
	ctx.tools.register(defineTool({
		name: "video_generate",
		description: "Generate a short video from a text prompt using Grok Imagine Video. Requires SuperGrok OAuth or XAI_API_KEY. The MP4 is written under $DSH_HOME/draco/videos/.",
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
				description: "Length in seconds, 1–15. Defaults to 6."
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
					}
				}
			},
			render: (_args, value) => videoGenerateContent(value)
		},
		async execute(args, exec) {
			const prompt = args.prompt.trim();
			if (prompt.length === 0) throw new Error("prompt must be a non-empty string");
			const bearer = await resolveXaiBearer(ctx);
			if (bearer === void 0) throw new Error("no SuperGrok OAuth session or XAI_API_KEY; run /grok-login or use Settings → Models → Sign in with SuperGrok");
			const requested = typeof args.duration === "number" ? args.duration : 6;
			const duration = Math.min(15, Math.max(1, Math.round(requested)));
			const collected = await collectXaiVideo(bearer, prompt, args.aspect ?? "landscape", duration, exec.signal);
			const path = dshHomePath(join("draco", "videos", `grok-imagine-video-${Date.now()}.mp4`));
			mkdirSync(dirname(path), { recursive: true });
			writeFileSync(path, collected.bytes);
			return {
				path,
				provider: "xai-imagine",
				model: XAI_VIDEO_MODEL,
				duration,
				prompt,
				bytes: collected.bytes.length
			};
		},
		presentCall(args) {
			return {
				card: "generic",
				title: `Generate video: ${args.prompt}`,
				kind: "other"
			};
		}
	}));
}
//#endregion
export { CODEX_DEFAULT_QUALITY, CODEX_IMAGE_MODEL, Config, IMAGE_GEN_SETTINGS_NAMESPACE, apply, formatImageGenerateOutput, formatVideoGenerateOutput, imageGenerateContent, imageRefFromValue, inject, name, videoGenerateContent };
