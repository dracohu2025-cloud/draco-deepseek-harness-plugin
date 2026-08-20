import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { LlmError, normalizeApiKey } from "@deepseek-ai/dsh-llm";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { AttachmentId } from "@deepseek-ai/dsh-attachment";
//#region lib/types/minimax-music.js
/**
* MiniMax Music 3 HTTP client used by `music_generate`.
* @module @deepseek-ai/dsh-draco-music-gen/src/minimax-music
*/
/** Paid Music 3.0 model id. */
const MUSIC_3_MODEL = "music-3.0";
/** Free-tier Music 3.0 model id. */
const MUSIC_3_FREE_MODEL = "music-3.0-free";
/** Settings probe abort for Music 3 (generation is slow). */
const MUSIC_PROBE_TIMEOUT_MS = 18e4;
/** Instrumental probe prompt: short, no vocals. */
const MUSIC_PROBE_PROMPT = "short ambient drone, no vocals, under ten seconds";
/**
* Stable probe/tool error when MiniMax returns HTTP 410 or `base_resp` 2153.
* As of 2026-08-20, free music APIs are discontinued and paid music APIs refuse
* new accounts; existing Token Plan / paying customers can still call `music-3.0`.
*/
const MUSIC_API_CLOSED_MESSAGE = "MUSIC_API_CLOSED: this MiniMax account has no hosted music access (Token Plan or prior paid music required)";
/** China mainland OpenAPI host. */
const MINIMAX_CN_HOST = "https://api.minimaxi.com";
/** Global OpenAPI host. */
const MINIMAX_GLOBAL_HOST = "https://api.minimax.io";
/**
* OpenAPI host for one MiniMax region.
* @param region - China mainland or global.
* @returns the region host without a trailing slash.
*/
function hostOf(region) {
	return region === "global" ? MINIMAX_GLOBAL_HOST : MINIMAX_CN_HOST;
}
/**
* Collect one MiniMax Music 3 MP3.
* @param apiKey - MiniMax API key.
* @param region - China mainland or global host.
* @param request - generation fields.
* @param signal - abort for the create and download fetches.
* @returns MP3 bytes and an optional duration in seconds.
*/
async function collectMinimaxMusic(apiKey, region, request, signal) {
	const body = {
		model: request.model,
		prompt: request.prompt,
		is_instrumental: request.instrumental,
		lyrics_optimizer: request.lyricsOptimizer,
		audio_setting: {
			sample_rate: 44100,
			bitrate: 256e3,
			format: "mp3"
		},
		output_format: "url"
	};
	if (!request.instrumental && !request.lyricsOptimizer && request.lyrics !== void 0) body.lyrics = request.lyrics;
	const response = await fetch(`${hostOf(region)}/v1/music_generation`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(body),
		signal
	});
	const raw = await response.text();
	const parsed = parseJson(raw);
	if (!response.ok) {
		if (musicApiClosed(response.status, parsed, raw)) throw new LlmError(`draco-music-gen: ${MUSIC_API_CLOSED_MESSAGE}`, "INVALID_REQUEST");
		const msg = minimaxStatusMsg(parsed);
		throw new LlmError(`draco-music-gen: MiniMax returned HTTP ${response.status}${msg !== void 0 ? `: ${msg}` : raw.length > 0 ? `: ${raw.slice(0, 300)}` : ""}`, "INVALID_REQUEST");
	}
	if (parsed === void 0) throw new LlmError("draco-music-gen: MiniMax returned non-JSON", "INVALID_REQUEST");
	const root = parsed !== null && typeof parsed === "object" ? parsed : {};
	const base = baseResp(parsed);
	const code = base.status_code;
	if (code !== 0 && code !== void 0) {
		if (musicApiClosed(response.status, parsed, raw)) throw new LlmError(`draco-music-gen: ${MUSIC_API_CLOSED_MESSAGE}`, "INVALID_REQUEST");
		throw new LlmError(`draco-music-gen: ${typeof base.status_msg === "string" ? base.status_msg : "MiniMax music failed"}`, "INVALID_REQUEST");
	}
	const data = root.data !== null && typeof root.data === "object" ? root.data : {};
	const extra = root.extra_info !== null && typeof root.extra_info === "object" ? root.extra_info : data.extra_info !== null && typeof data.extra_info === "object" ? data.extra_info : {};
	const audio = pickAudio(root, data);
	if (audio === void 0) throw new LlmError(`draco-music-gen: MiniMax returned no audio: ${raw.slice(0, 300)}`, "INVALID_REQUEST");
	const bytes = audio.kind === "url" ? await downloadAudio(audio.value, signal) : decodeHexAudio(audio.value);
	const durationMs = typeof extra.music_duration === "number" ? extra.music_duration : void 0;
	return {
		bytes,
		...durationMs === void 0 ? {} : { durationSeconds: durationMs / 1e3 }
	};
}
/**
* Probe Music 3 with a short instrumental create.
* @param apiKey - MiniMax API key.
* @param region - China mainland or global host.
* @param model - selected Music 3 model.
* @param signal - abort for the probe.
* @returns when the create returns audio; throws on HTTP or MiniMax errors.
*/
async function probeMinimaxMusic(apiKey, region, model, signal) {
	await collectMinimaxMusic(apiKey, region, {
		model,
		prompt: MUSIC_PROBE_PROMPT,
		instrumental: true,
		lyricsOptimizer: false
	}, signal);
}
function parseJson(raw) {
	try {
		return JSON.parse(raw);
	} catch {
		return;
	}
}
function baseResp(parsed) {
	if (parsed === null || typeof parsed !== "object") return {};
	const root = parsed;
	return root.base_resp !== null && typeof root.base_resp === "object" ? root.base_resp : {};
}
function minimaxStatusMsg(parsed) {
	const msg = baseResp(parsed).status_msg;
	return typeof msg === "string" && msg.length > 0 ? msg : void 0;
}
/**
* True when MiniMax refused the hosted music API for this account.
* HTTP 410 and `base_resp.status_code` 2153 are the documented 2026-08-20
* closure. The status text is matched as a fallback.
* @param status - HTTP status of the music_generation response.
* @param parsed - JSON body when parse succeeded.
* @param raw - response text used when JSON is absent.
* @returns true when this account cannot use hosted MiniMax music.
*/
function musicApiClosed(status, parsed, raw) {
	if (status === 410) return true;
	if (baseResp(parsed).status_code === 2153) return true;
	const text = `${minimaxStatusMsg(parsed) ?? ""} ${raw}`;
	return /no longer available to new users/i.test(text) || /不再面向新用户/.test(text);
}
function pickAudio(root, data) {
	const candidates = [
		data.audio,
		data.audio_url,
		root.audio,
		root.audio_url
	];
	for (const value of candidates) {
		if (typeof value !== "string" || value.length === 0) continue;
		if (value.startsWith("http://") || value.startsWith("https://")) return {
			kind: "url",
			value
		};
		if (/^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0) return {
			kind: "hex",
			value
		};
	}
}
async function downloadAudio(url, signal) {
	const response = await fetch(url, { signal });
	if (!response.ok) throw new LlmError(`draco-music-gen: MiniMax audio URL returned HTTP ${response.status}`, "INVALID_REQUEST");
	return Buffer.from(await response.arrayBuffer());
}
function decodeHexAudio(hex) {
	return Buffer.from(hex, "hex");
}
//#endregion
//#region lib/types/index.js
/**
* Draco `music_generate`: MiniMax Music 3.0 and Music 3.0-free.
* The backend lives in the `draco-music-gen` settings namespace (`provider`).
* The user picks a Music 3 model in Settings → Draco-suite. MP3s are
* written under `$DSH_HOME/draco/music/`.
* @module @deepseek-ai/dsh-draco-music-gen
*/
const name = "draco-music-gen";
const inject = ["tools"];
/** Settings namespace owned by this plugin. */
const MUSIC_GEN_SETTINGS_NAMESPACE = settingsNamespace("draco-music-gen");
/** Largest MP3 that `presentationMeta` will embed for the official Web player. */
const MAX_MUSIC_CLIP_BYTES = 4 * 1024 * 1024;
const ProbeStatus = z.union([
	z.const("idle"),
	z.const("checking"),
	z.const("ok"),
	z.const("fail")
]);
/** Schemastery configuration for the music-generation plugin. */
const Config = z.object({
	provider: z.union([
		z.const("none"),
		z.const("music-3.0"),
		z.const("music-3.0-free")
	]).default("none"),
	region: z.union([z.const("cn"), z.const("global")]).default("cn"),
	probe: ProbeStatus.default("idle"),
	probeError: z.string().default("")
});
/**
* Format a music generation as the model-facing envelope.
* @param value - the canonical generation outcome.
* @returns a short path envelope.
*/
function formatMusicGenerateOutput(value) {
	return `Generated${value.durationSeconds === void 0 ? "" : ` ${value.durationSeconds}s`} ${value.instrumental ? "instrumental" : "song"} via ${value.provider} (${value.model}) → ${value.path}`;
}
/**
* Re-brand a canonical generated-audio outcome into the attachment reference
* an `AudioBlock` carries.
* @param audio - the canonical audio metadata from the output schema.
* @returns the branded attachment reference.
*/
function audioRefFromValue(audio) {
	return {
		attachmentId: AttachmentId(audio.attachmentId),
		mediaType: audio.mediaType,
		bytes: audio.bytes,
		...audio.name === void 0 ? {} : { name: audio.name }
	};
}
/**
* Project one music generation into its envelope and durable audio.
* @param value - the canonical generation outcome.
* @returns the path envelope, plus an `AudioBlock` when `saveAudio` ran.
*/
function musicGenerateContent(value) {
	const blocks = [{
		type: "text",
		text: formatMusicGenerateOutput(value)
	}];
	if (value.audio !== void 0) blocks.push({
		type: "audio",
		attachment: audioRefFromValue(value.audio)
	});
	return blocks;
}
/**
* Persist a bounded MP3 on `tool/result` so the music toolview can play it on a
* host that has no `saveAudio`.
* @param value - the canonical generation outcome.
* @returns presentation meta, or an empty object when the file is too large.
*/
function musicGenerateMeta(value) {
	const data = readFileSync(value.path);
	if (data.byteLength === 0 || data.byteLength > 4194304) return {};
	return { clip: {
		name: basename(value.path),
		mediaType: "audio/mpeg",
		bytes: data.byteLength,
		data: data.toString("base64")
	} };
}
function probeFailureMessage(error) {
	if (error instanceof LlmError) return error.message.slice(0, 180);
	if (error instanceof Error) {
		if (error.name === "AbortError") return "probe timed out";
		return error.message.slice(0, 180);
	}
	return String(error).slice(0, 180);
}
const MINIMAX_API_KEY = credentialRef("MINIMAX_API_KEY");
const MINIMAX_CN_API_KEY = credentialRef("MINIMAX_CN_API_KEY");
const TOOLS_MARK = Symbol.for("dsh.draco-music-gen.tools");
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
async function resolveMinimaxKey(ctx, region) {
	const primary = await resolveSecret(ctx, MINIMAX_API_KEY);
	if (primary !== void 0) return primary;
	if (region === "cn") return resolveSecret(ctx, MINIMAX_CN_API_KEY);
}
/**
* Register `music_generate` once per tools table.
* @param ctx - host context.
* @param config - composition base for the settings namespace.
*/
function apply(ctx, config) {
	const tools = ctx.tools;
	if (tools[TOOLS_MARK] === true || ctx.tools.get?.("music_generate") !== void 0) return;
	tools[TOOLS_MARK] = true;
	ctx.effect(() => () => {
		delete tools[TOOLS_MARK];
	}, "draco-music-gen: shared tools");
	let current = config;
	ctx.inject(["settings"], (sctx) => {
		const scope = sctx.settings.register(MUSIC_GEN_SETTINGS_NAMESPACE, Config, { base: config });
		current = scope.get();
		const runProbe = async () => {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), MUSIC_PROBE_TIMEOUT_MS);
			try {
				const backend = current.provider;
				if (backend !== "music-3.0") {
					await scope.update({
						probe: "fail",
						probeError: "pick music-3.0"
					});
					return;
				}
				const apiKey = await resolveMinimaxKey(ctx, current.region);
				if (apiKey === void 0) {
					await scope.update({
						probe: "fail",
						probeError: current.region === "cn" ? "missing MINIMAX_API_KEY or MINIMAX_CN_API_KEY" : "missing MINIMAX_API_KEY"
					});
					return;
				}
				await probeMinimaxMusic(apiKey, current.region, backend, controller.signal);
				await scope.update({
					probe: "ok",
					probeError: ""
				});
			} catch (error) {
				await scope.update({
					probe: "fail",
					probeError: probeFailureMessage(error)
				});
			} finally {
				clearTimeout(timer);
			}
		};
		const considerProbe = (next) => {
			if (next.probe === "checking") runProbe();
		};
		scope.watch((next) => {
			current = next;
			considerProbe(next);
		});
		considerProbe(current);
	});
	ctx.tools.register(defineTool({
		name: "music_generate",
		timeoutMs: 6e5,
		description: "Generate a song or instrumental with MiniMax Music 3. Settings → Draco-suite enables music-3.0 (Token Plan or prior paid music) and the MiniMax region. Pass prompt plus lyrics, or instrumental=true with a prompt, or lyricsOptimizer=true to have MiniMax write lyrics from the prompt. The MP3 is written under $DSH_HOME/draco/music/. Credential: MINIMAX_API_KEY (China also accepts MINIMAX_CN_API_KEY).",
		parameters: {
			prompt: {
				type: "string",
				required: true,
				description: "Style, mood, vocals, instruments, and scene. Required. 1–2000 characters."
			},
			lyrics: {
				type: "string",
				description: "Song lyrics with structure tags such as [Verse] and [Chorus]. Required unless instrumental or lyricsOptimizer is true. 1–3500 characters."
			},
			instrumental: {
				type: "boolean",
				description: "True for a track with no vocals. lyrics is ignored. Defaults to false."
			},
			lyricsOptimizer: {
				type: "boolean",
				description: "True to have MiniMax write lyrics from prompt. Ignored when instrumental is true. Defaults to false."
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
					region: {
						type: "string",
						required: true
					},
					prompt: {
						type: "string",
						required: true
					},
					lyrics: { type: "string" },
					instrumental: {
						type: "boolean",
						required: true
					},
					bytes: {
						type: "integer",
						required: true
					},
					durationSeconds: { type: "number" },
					audio: {
						type: "object",
						additionalProperties: false,
						properties: {
							attachmentId: {
								type: "string",
								required: true
							},
							mediaType: {
								type: "string",
								enum: ["audio/mpeg"],
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
			render: (_args, value) => musicGenerateContent(value),
			presentationMeta: (_args, value) => musicGenerateMeta(value)
		},
		async execute(args, exec) {
			const prompt = args.prompt.trim();
			if (prompt.length === 0) throw new Error("prompt must be a non-empty string");
			if (prompt.length > 2e3) throw new Error("prompt must be at most 2000 characters");
			const backend = current.provider === "music-3.0" ? "music-3.0" : "none";
			if (backend === "none") throw new Error("music generation is not configured; pick music-3.0 in Settings → Draco-suite");
			const instrumental = args.instrumental === true;
			const lyricsOptimizer = !instrumental && args.lyricsOptimizer === true;
			const lyrics = typeof args.lyrics === "string" ? args.lyrics.trim() : "";
			if (!instrumental && !lyricsOptimizer) {
				if (lyrics.length === 0) throw new Error("lyrics is required unless instrumental or lyricsOptimizer is true");
				if (lyrics.length > 3500) throw new Error("lyrics must be at most 3500 characters");
			}
			const apiKey = await resolveMinimaxKey(ctx, current.region);
			if (apiKey === void 0) throw new Error(current.region === "cn" ? "no MINIMAX_API_KEY or MINIMAX_CN_API_KEY; save MINIMAX_API_KEY in Settings → Draco-suite or the environment" : "no MINIMAX_API_KEY; save it in Settings → Draco-suite or the environment");
			const collected = await collectMinimaxMusic(apiKey, current.region, {
				model: backend,
				prompt,
				...instrumental || lyricsOptimizer || lyrics.length === 0 ? {} : { lyrics },
				instrumental,
				lyricsOptimizer
			}, exec.signal);
			const fileName = `${backend}-${Date.now()}.mp3`;
			const path = dshHomePath(join("draco", "music", fileName));
			mkdirSync(dirname(path), { recursive: true });
			writeFileSync(path, collected.bytes);
			const attachments = ctx.get("attachments");
			const saveAudio = attachments !== void 0 && typeof attachments.saveAudio === "function" ? attachments.saveAudio.bind(attachments) : void 0;
			const ref = saveAudio === void 0 ? void 0 : await saveAudio({
				data: new Uint8Array(collected.bytes),
				mediaType: "audio/mpeg",
				name: fileName
			});
			return {
				path,
				provider: backend,
				model: backend,
				region: current.region,
				prompt,
				instrumental,
				bytes: collected.bytes.length,
				...instrumental || lyrics.length === 0 ? {} : { lyrics },
				...collected.durationSeconds === void 0 ? {} : { durationSeconds: collected.durationSeconds },
				...ref === void 0 ? {} : { audio: {
					attachmentId: ref.attachmentId,
					mediaType: "audio/mpeg",
					bytes: ref.bytes,
					...ref.name === void 0 ? {} : { name: ref.name }
				} }
			};
		},
		presentCall(args) {
			return {
				card: "generic",
				title: `Generate music: ${args.prompt.trim().slice(0, 48)}`,
				kind: "other"
			};
		}
	}));
}
//#endregion
export { Config, MAX_MUSIC_CLIP_BYTES, MUSIC_3_FREE_MODEL, MUSIC_3_MODEL, MUSIC_API_CLOSED_MESSAGE, MUSIC_GEN_SETTINGS_NAMESPACE, MUSIC_PROBE_TIMEOUT_MS, apply, audioRefFromValue, formatMusicGenerateOutput, hostOf, inject, musicGenerateContent, musicGenerateMeta, name };
