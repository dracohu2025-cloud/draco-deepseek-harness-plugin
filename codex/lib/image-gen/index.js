import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import z from "@deepseek-ai/schemastery";
import { AttachmentId } from "@deepseek-ai/dsh-attachment";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { LlmError, normalizeApiKey } from "@deepseek-ai/dsh-llm";
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
/** Official Imagine video model (1.5). */
const XAI_VIDEO_MODEL = "grok-imagine-video-1.5";
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
* Build the Imagine Video 1.5 POST body. Reference-to-video is capped at 720p.
* @param prompt - text prompt.
* @param aspect - tool aspect alias.
* @param duration - seconds, already clamped by the tool.
* @param referenceUrls - Imagine `reference_images[].url` values, or empty.
*/
function xaiVideoRequestBody(prompt, aspect, duration, referenceUrls = []) {
	const body = {
		model: XAI_VIDEO_MODEL,
		prompt,
		duration,
		aspect_ratio: xaiAspectRatio(aspect)
	};
	if (referenceUrls.length > 0) {
		body.reference_images = referenceUrls.map((url) => ({ url }));
		body.resolution = "720p";
	}
	return body;
}
/**
* Generate one Imagine video and return its bytes. Async jobs are polled
* until a URL appears or `signal` aborts.
* @param bearer - SuperGrok OAuth or API-key bearer.
* @param prompt - text prompt.
* @param aspect - tool aspect alias.
* @param duration - seconds, already clamped by the tool.
* @param signal - cancellation.
* @param referenceUrls - Imagine reference URLs or data URIs.
*/
async function collectXaiVideo(bearer, prompt, aspect, duration, signal, referenceUrls = []) {
	const { status, payload } = await postVideo(bearer, xaiVideoRequestBody(prompt, aspect, duration, referenceUrls), signal);
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
* Encode raster bytes as an Imagine data URI.
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
* Turn model-facing reference tokens into Imagine `reference_images[].url` values.
* @param tokens - `video_generate.references`, or undefined for text-only.
* @param attachments - optional durable store for session ImageBlocks.
* @param sessionEvents - optional live session log.
* @param signal - cancellation forwarded to `readImage`.
* @returns data URIs or https URLs, empty when no references were requested.
*/
async function resolveVideoReferences(tokens, attachments, sessionEvents, signal) {
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
//#region lib/types/volc-tts.js
/**
* Volcengine speech HTTP clients used by `speech_generate`.
* `doubao-tts` is classic OpenSpeech v1 (exact wording). `seed-audio` is
* Seed-Audio 1.0 v3 create (expressive prompt + speaker lock).
* @module @deepseek-ai/dsh-draco-image-gen/src/volc-tts
*/
/** Classic Doubao TTS 2.0 endpoint. */
const DOUBAO_TTS_URL = "https://openspeech.bytedance.com/api/v1/tts";
/** Seed-Audio 1.0 create endpoint. */
const SEED_AUDIO_URL = "https://openspeech.bytedance.com/api/v3/tts/create";
/** Wire model id for Seed-Audio 1.0. */
const SEED_AUDIO_MODEL = "seed-audio-1.0";
/** Default speaker / voice_type used when the tool call names none. */
const DEFAULT_SPEECH_VOICE = "zh_female_vv_uranus_bigtts";
/** Seed-Audio `text_prompt` ceiling from the Volcengine docs. */
const SEED_AUDIO_PROMPT_MAX_CHARS = 3e3;
/**
* Wrap spoken text as a Seed-Audio `text_prompt`. A style prefix is optional
* scene direction; the model must still read `text` and not invent extra words.
* @param text - words to speak.
* @param style - optional scene / emotion direction.
* @returns the prompt posted as `text_prompt`.
*/
function buildSeedAudioPrompt(text, style) {
	const spoken = text.trim();
	const lead = style?.trim();
	const body = `请用自然清晰的普通话朗读以下内容，不要添加额外的字词：\n「${spoken}」`;
	return lead === void 0 || lead.length === 0 ? body : `${lead}\n\n${body}`;
}
/**
* Classify an HTTP status for a Volcengine speech call.
* @param status - HTTP status.
*/
function speechFailureCode(status) {
	return status === 401 || status === 403 ? "INVALID_CREDENTIAL" : "SERVER";
}
async function readBody(response) {
	return await response.text().catch(() => "");
}
function parseJson(raw) {
	try {
		return JSON.parse(raw);
	} catch {
		return;
	}
}
function asRecord(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return void 0;
	return value;
}
function optionalNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
/**
* Decode classic Doubao TTS v1 JSON (`data` is base64 MP3).
* @param payload - parsed response body.
*/
function extractDoubaoAudio(payload) {
	const record = asRecord(payload);
	if (record === void 0) return void 0;
	const data = record.data;
	if (typeof data !== "string" || data.length === 0) return void 0;
	try {
		const bytes = Buffer.from(data, "base64");
		return bytes.length > 0 ? bytes : void 0;
	} catch {
		return;
	}
}
/**
* Read Seed-Audio JSON: inline base64 `audio`, else a temporary `url`.
* @param payload - parsed response body.
*/
function extractSeedAudio(payload) {
	const record = asRecord(payload);
	if (record === void 0) return {};
	const audio = record.audio;
	const url = record.url;
	const duration = optionalNumber(record.original_duration) ?? optionalNumber(record.duration);
	return {
		...typeof audio === "string" && audio.length > 0 ? { audioB64: audio } : {},
		...typeof url === "string" && url.startsWith("http") ? { url } : {},
		...duration === void 0 ? {} : { durationSeconds: duration }
	};
}
/**
* Synthesize exact wording through classic Doubao TTS 2.0.
* @param appId - Volcengine TTS app id.
* @param token - Volcengine TTS access token.
* @param text - words to speak; posted as `request.text`.
* @param voice - `audio.voice_type`.
* @param speed - `audio.speed_ratio`.
* @param signal - abort for the in-flight fetch.
*/
async function collectDoubaoTts(appId, token, text, voice, speed, signal) {
	const response = await fetch(DOUBAO_TTS_URL, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer;${token}`
		},
		body: JSON.stringify({
			app: {
				appid: appId,
				token,
				cluster: "volcano_tts"
			},
			user: { uid: "draco" },
			audio: {
				voice_type: voice,
				encoding: "mp3",
				speed_ratio: speed,
				sample_rate: 48e3
			},
			request: {
				reqid: `dsh-${Date.now()}`,
				text,
				operation: "query"
			}
		}),
		signal: signal ?? null
	});
	const raw = await readBody(response);
	if (!response.ok) throw new LlmError(`draco-image-gen: Doubao TTS returned HTTP ${response.status}${raw.length > 0 ? `: ${raw.slice(0, 300)}` : ""}`, speechFailureCode(response.status));
	const bytes = extractDoubaoAudio(parseJson(raw));
	if (bytes === void 0) throw new LlmError(`draco-image-gen: Doubao TTS returned no audio${raw.length > 0 ? `: ${raw.slice(0, 300)}` : ""}`, "SERVER");
	return { bytes };
}
/**
* Synthesize expressive speech through Seed-Audio 1.0.
* @param apiKey - `X-Api-Key` from the speech console (`SEED_AUDIO_API_KEY`).
* @param prompt - `text_prompt` already wrapped by {@link buildSeedAudioPrompt}.
* @param voice - `references[0].speaker`.
* @param signal - abort for the in-flight fetch and optional URL download.
*/
async function collectSeedAudio(apiKey, prompt, voice, signal) {
	if (prompt.length > 3e3) throw new Error(`seed-audio text_prompt exceeds ${SEED_AUDIO_PROMPT_MAX_CHARS} characters`);
	const response = await fetch(SEED_AUDIO_URL, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-api-key": apiKey
		},
		body: JSON.stringify({
			model: SEED_AUDIO_MODEL,
			text_prompt: prompt,
			references: [{ speaker: voice }],
			audio_config: {
				format: "mp3",
				sample_rate: 48e3,
				enable_subtitle: true
			},
			watermark: {}
		}),
		signal: signal ?? null
	});
	const raw = await readBody(response);
	if (!response.ok) throw new LlmError(`draco-image-gen: Seed-Audio returned HTTP ${response.status}${raw.length > 0 ? `: ${raw.slice(0, 300)}` : ""}`, speechFailureCode(response.status));
	const extracted = extractSeedAudio(parseJson(raw));
	let bytes;
	if (extracted.audioB64 !== void 0) try {
		const decoded = Buffer.from(extracted.audioB64, "base64");
		if (decoded.length > 0) bytes = decoded;
	} catch {
		bytes = void 0;
	}
	if (bytes === void 0 && extracted.url !== void 0) {
		const download = await fetch(extracted.url, { signal: signal ?? null });
		if (!download.ok) throw new LlmError(`draco-image-gen: Seed-Audio audio URL returned HTTP ${download.status}`, speechFailureCode(download.status));
		bytes = Buffer.from(await download.arrayBuffer());
	}
	if (bytes === void 0 || bytes.length === 0) throw new LlmError(`draco-image-gen: Seed-Audio returned no audio${raw.length > 0 ? `: ${raw.slice(0, 300)}` : ""}`, "SERVER");
	return {
		bytes,
		...extracted.durationSeconds === void 0 ? {} : { durationSeconds: extracted.durationSeconds }
	};
}
//#endregion
//#region lib/types/index.js
/**
* Draco media-generation configuration, `image_generate`, `video_generate`,
* and `speech_generate`. Image, video, and speech backends live in the
* `draco-image-gen` settings namespace (`provider`, `videoProvider`,
* `speechProvider`). Completing a Codex OAuth login defaults an unset image
* backend to Codex `gpt-image-2`; completing a SuperGrok login defaults an
* unset image backend to Grok Imagine Image 2.0 and an unset video backend to
* Imagine Video 1.5. Speech is never defaulted from OAuth: the user picks
* Doubao TTS or Seed-Audio in Settings → Draco-suite. An explicit choice is
* left alone. Generated rasters are committed through `ctx.attachments`
* before the tool result is appended. Videos are written under
* `$DSH_HOME/draco/videos/`. Speech MP3s are written under
* `$DSH_HOME/draco/audio/`.
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
/** Schemastery configuration for the media-generation plugin. */
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
	resolution: z.union([z.const("1k"), z.const("2k")]).default("1k"),
	videoProvider: z.union([z.const("none"), z.const("xai-imagine")]).default("none"),
	speechProvider: z.union([
		z.const("none"),
		z.const("doubao-tts"),
		z.const("seed-audio")
	]).default("none")
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
	const refs = value.references.length === 0 ? "" : ` with ${value.references.length} reference${value.references.length === 1 ? "" : "s"}`;
	return `Generated ${value.duration}s video via ${value.provider} (${value.model})${refs} → ${value.path}`;
}
/**
* Format a speech generation as the model-facing envelope.
* @param value - the canonical generation outcome.
*/
function formatSpeechGenerateOutput(value) {
	return `Generated${value.durationSeconds === void 0 ? "" : ` ${value.durationSeconds}s`} speech via ${value.provider} (${value.model}, ${value.voice}) → ${value.path}`;
}
/**
* Project one speech generation into its model-facing envelope.
* There is no durable audio attachment type yet, so the path is the identity.
* @param value - the canonical generation outcome.
*/
function speechGenerateContent(value) {
	return [{
		type: "text",
		text: formatSpeechGenerateOutput(value)
	}];
}
const SEED_AUDIO_API_KEY = credentialRef("SEED_AUDIO_API_KEY");
const VOLCENGINE_TTS_APP_ID = credentialRef("VOLCENGINE_TTS_APP_ID");
const VOLCENGINE_TTS_ACCESS_TOKEN = credentialRef("VOLCENGINE_TTS_ACCESS_TOKEN");
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
* Project one video generation into its envelope and durable video.
* @param value - the canonical generation outcome.
*/
function videoGenerateContent(value) {
	const blocks = [{
		type: "text",
		text: formatVideoGenerateOutput(value)
	}];
	if (value.video !== void 0) blocks.push({
		type: "video",
		attachment: videoRefFromValue(value.video)
	});
	return blocks;
}
const XAI_API_KEY = credentialRef("XAI_API_KEY");
/** Shared across the SuperGrok and Codex package copies of this file. */
const TOOLS_MARK = Symbol.for("dsh.draco-image-gen.tools");
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
	const tools = ctx.tools;
	if (tools[TOOLS_MARK] === true || ctx.tools.get?.("image_generate") !== void 0) return;
	tools[TOOLS_MARK] = true;
	ctx.effect(() => () => {
		delete tools[TOOLS_MARK];
	}, "draco-image-gen: shared tools");
	let current = config;
	ctx.inject(["settings"], (sctx) => {
		const scope = sctx.settings.register(IMAGE_GEN_SETTINGS_NAMESPACE, Config, { base: config });
		current = scope.get();
		scope.watch((next) => {
			current = next;
		});
		const bearerReady = async (name) => {
			const token = await ctx.get(name)?.getBearer();
			return typeof token === "string" && token.length > 0;
		};
		sctx.on("draco/codex-oauth-ready", () => {
			const resolved = scope.get();
			if (resolved.provider !== "none") return;
			return bearerReady("xaiOauth").then((grokReady) => {
				if (grokReady) return;
				return scope.update({
					provider: "openai-codex",
					quality: resolved.quality || "medium"
				});
			}).catch((error) => {
				ctx.logger.warn("draco-image-gen: could not default to Codex gpt-image-2: %s", String(error));
			});
		});
		sctx.on("draco/xai-oauth-ready", () => {
			const resolved = scope.get();
			return bearerReady("codexOauth").then((codexReady) => {
				const patch = {};
				if (resolved.provider === "none" && !codexReady) {
					patch.provider = "xai-imagine";
					patch.quality = resolved.quality || "medium";
					patch.resolution = resolved.resolution || "1k";
				}
				if (resolved.videoProvider === "none") patch.videoProvider = "xai-imagine";
				if (Object.keys(patch).length === 0) return;
				return scope.update(patch);
			}).catch((error) => {
				ctx.logger.warn("draco-image-gen: could not default SuperGrok media backends: %s", String(error));
			});
		});
	});
	ctx.tools.register(defineTool({
		name: "image_generate",
		description: "Generate an image from a text prompt. SuperGrok login defaults to Grok Imagine Image 2.0; Codex login defaults to gpt-image-2. Settings → Draco-suite chooses the backend.",
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
				if (bearer === void 0) throw new Error("no SuperGrok OAuth session or XAI_API_KEY; run /grok-login or use Settings → Draco-suite → Sign in with SuperGrok");
				const collected = await collectXaiImage(bearer, prompt, args.aspect, xaiImageQuality(current.quality), current.resolution, exec.signal);
				bytes = collected.bytes;
				mediaType = collected.mediaType;
				provider = "xai-imagine";
				stem = `grok-imagine-image-${Date.now()}`;
			} else {
				const bearer = await ctx.get("codexOauth")?.getBearer();
				if (bearer === void 0) throw new Error("no OpenAI Codex OAuth session; run /codex-login or use Settings → Draco-suite → Sign in with Codex");
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
		description: "Generate a short video with grok-imagine-video-1.5. Optional references (up to 7) guide subject and style; they are not the first frame. Pass image_generate paths, sha256 attachment ids, https URLs, data URIs, or \"latest\" for the most recent session image. Settings → Draco-suite chooses the backend. The MP4 is written under $DSH_HOME/draco/videos/.",
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
			},
			references: {
				type: "array",
				items: { type: "string" },
				description: `Up to 7 reference images. Each item is a prior image_generate path, a sha256 attachment id, an https URL, a data URI, or "latest".`
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
			render: (_args, value) => videoGenerateContent(value)
		},
		async execute(args, exec) {
			const prompt = args.prompt.trim();
			if (prompt.length === 0) throw new Error("prompt must be a non-empty string");
			if (current.videoProvider !== "xai-imagine") throw new Error("video generation is not configured; pick a backend in Settings → Draco-suite");
			const bearer = await resolveXaiBearer(ctx);
			if (bearer === void 0) throw new Error("no SuperGrok OAuth session or XAI_API_KEY; run /grok-login or use Settings → Draco-suite → Sign in with SuperGrok");
			const requested = typeof args.duration === "number" ? args.duration : 6;
			const duration = Math.min(15, Math.max(1, Math.round(requested)));
			const references = args.references ?? [];
			const sessionEvents = exec.agent?.session.events;
			const referenceUrls = await resolveVideoReferences(references, ctx.get("attachments"), sessionEvents, exec.signal);
			const attachments = ctx.get("attachments");
			const saveVideo = attachments !== void 0 && typeof attachments.saveVideo === "function" ? attachments.saveVideo.bind(attachments) : void 0;
			const collected = await collectXaiVideo(bearer, prompt, args.aspect ?? "landscape", duration, exec.signal, referenceUrls);
			const name = `grok-imagine-video-1.5-${Date.now()}.mp4`;
			const path = dshHomePath(join("draco", "videos", name));
			mkdirSync(dirname(path), { recursive: true });
			writeFileSync(path, collected.bytes);
			const ref = saveVideo === void 0 ? void 0 : await saveVideo({
				data: new Uint8Array(collected.bytes),
				mediaType: "video/mp4",
				name
			});
			return {
				path,
				provider: "xai-imagine",
				model: XAI_VIDEO_MODEL,
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
	ctx.tools.register(defineTool({
		name: "speech_generate",
		timeoutMs: 3e5,
		description: "Synthesize speech from text. Settings → Draco-suite chooses doubao-tts (exact wording) or seed-audio-1.0 (expressive, may add atmosphere). The MP3 is written under $DSH_HOME/draco/audio/. Credentials: VOLCENGINE_TTS_APP_ID + VOLCENGINE_TTS_ACCESS_TOKEN for doubao-tts, SEED_AUDIO_API_KEY for seed-audio.",
		parameters: {
			text: {
				type: "string",
				required: true,
				description: "Words to speak. doubao-tts reads this verbatim. seed-audio wraps it in a speak-exactly instruction."
			},
			style: {
				type: "string",
				description: "Optional scene or emotion direction for seed-audio only. Ignored by doubao-tts."
			},
			voice: {
				type: "string",
				description: `Speaker / voice_type. Defaults to ${DEFAULT_SPEECH_VOICE}.`
			},
			speed: {
				type: "number",
				description: "doubao-tts speed_ratio, 0.5–2. Defaults to 1. Ignored by seed-audio."
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
					voice: {
						type: "string",
						required: true
					},
					text: {
						type: "string",
						required: true
					},
					bytes: {
						type: "integer",
						required: true
					},
					durationSeconds: { type: "number" }
				}
			},
			render: (_args, value) => speechGenerateContent(value)
		},
		async execute(args, exec) {
			const text = args.text.trim();
			if (text.length === 0) throw new Error("text must be a non-empty string");
			const backend = current.speechProvider === "doubao-tts" || current.speechProvider === "seed-audio" ? current.speechProvider : "none";
			if (backend === "none") throw new Error("speech generation is not configured; pick doubao-tts or seed-audio in Settings → Draco-suite");
			const voice = typeof args.voice === "string" && args.voice.trim().length > 0 ? args.voice.trim() : DEFAULT_SPEECH_VOICE;
			let collected;
			let model;
			if (backend === "doubao-tts") {
				const appId = await resolveSecret(ctx, VOLCENGINE_TTS_APP_ID);
				const token = await resolveSecret(ctx, VOLCENGINE_TTS_ACCESS_TOKEN);
				if (appId === void 0 || token === void 0) throw new Error("no VOLCENGINE_TTS_APP_ID or VOLCENGINE_TTS_ACCESS_TOKEN; save them in Settings → Draco-suite or the environment");
				const requested = typeof args.speed === "number" ? args.speed : 1;
				collected = await collectDoubaoTts(appId, token, text, voice, Math.min(2, Math.max(.5, requested)), exec.signal);
				model = "volcano_tts";
			} else {
				const apiKey = await resolveSecret(ctx, SEED_AUDIO_API_KEY);
				if (apiKey === void 0) throw new Error("no SEED_AUDIO_API_KEY; save it in Settings → Draco-suite or the environment");
				collected = await collectSeedAudio(apiKey, buildSeedAudioPrompt(text, args.style), voice, exec.signal);
				model = SEED_AUDIO_MODEL;
			}
			const path = dshHomePath(join("draco", "audio", `${backend}-${Date.now()}.mp3`));
			mkdirSync(dirname(path), { recursive: true });
			writeFileSync(path, collected.bytes);
			return {
				path,
				provider: backend,
				model,
				voice,
				text,
				bytes: collected.bytes.length,
				...collected.durationSeconds === void 0 ? {} : { durationSeconds: collected.durationSeconds }
			};
		},
		presentCall(args) {
			return {
				card: "generic",
				title: `Generate speech: ${args.text.trim().slice(0, 48)}`,
				kind: "other"
			};
		}
	}));
}
//#endregion
export { CODEX_DEFAULT_QUALITY, CODEX_IMAGE_MODEL, Config, IMAGE_GEN_SETTINGS_NAMESPACE, apply, formatImageGenerateOutput, formatSpeechGenerateOutput, formatVideoGenerateOutput, imageGenerateContent, imageRefFromValue, inject, name, speechGenerateContent, videoGenerateContent, videoRefFromValue };
