import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { LlmError, normalizeApiKey } from "@deepseek-ai/dsh-llm";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
//#region lib/types/volc-tts.js
/**
* Volcengine speech HTTP clients used by `speech_generate`.
* `doubao-tts` is classic OpenSpeech v1 (exact wording). `seed-audio` is
* Seed-Audio 1.0 v3 create (expressive prompt + speaker lock).
* @module @deepseek-ai/dsh-draco-speech-gen/src/volc-tts
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
	const bytes = Buffer.from(data, "base64");
	return bytes.length > 0 ? bytes : void 0;
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
	if (!response.ok) throw new LlmError(`draco-speech-gen: Doubao TTS returned HTTP ${response.status}${raw.length > 0 ? `: ${raw.slice(0, 300)}` : ""}`, speechFailureCode(response.status));
	const bytes = extractDoubaoAudio(parseJson(raw));
	if (bytes === void 0) throw new LlmError(`draco-speech-gen: Doubao TTS returned no audio${raw.length > 0 ? `: ${raw.slice(0, 300)}` : ""}`, "SERVER");
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
	if (!response.ok) throw new LlmError(`draco-speech-gen: Seed-Audio returned HTTP ${response.status}${raw.length > 0 ? `: ${raw.slice(0, 300)}` : ""}`, speechFailureCode(response.status));
	const extracted = extractSeedAudio(parseJson(raw));
	let bytes;
	if (extracted.audioB64 !== void 0) {
		const decoded = Buffer.from(extracted.audioB64, "base64");
		if (decoded.length > 0) bytes = decoded;
	}
	if (bytes === void 0 && extracted.url !== void 0) {
		const download = await fetch(extracted.url, { signal: signal ?? null });
		if (!download.ok) throw new LlmError(`draco-speech-gen: Seed-Audio audio URL returned HTTP ${download.status}`, speechFailureCode(download.status));
		bytes = Buffer.from(await download.arrayBuffer());
	}
	if (bytes === void 0 || bytes.length === 0) throw new LlmError(`draco-speech-gen: Seed-Audio returned no audio${raw.length > 0 ? `: ${raw.slice(0, 300)}` : ""}`, "SERVER");
	return {
		bytes,
		...extracted.durationSeconds === void 0 ? {} : { durationSeconds: extracted.durationSeconds }
	};
}
/** Host aborts a Settings probe after this many milliseconds. */
const SPEECH_PROBE_TIMEOUT_MS = 2e4;
/**
* Verify Doubao TTS credentials with a one-character synthesis. The bytes are
* discarded — Settings only cares whether the HTTP call succeeds.
* @param appId - Volcengine TTS app id.
* @param token - Volcengine TTS access token.
* @param signal - abort for the in-flight fetch.
*/
async function probeDoubaoTts(appId, token, signal) {
	await collectDoubaoTts(appId, token, "测", DEFAULT_SPEECH_VOICE, 1, signal);
}
/**
* Verify a Seed-Audio API key with a one-character synthesis. The bytes are
* discarded — Settings only cares whether the HTTP call succeeds.
* @param apiKey - `X-Api-Key` from the speech console.
* @param signal - abort for the in-flight fetch.
*/
async function probeSeedAudio(apiKey, signal) {
	await collectSeedAudio(apiKey, buildSeedAudioPrompt("测"), DEFAULT_SPEECH_VOICE, signal);
}
//#endregion
//#region lib/types/index.js
/**
* Draco `speech_generate`: Volcengine Doubao TTS and Seed-Audio 1.0.
* The backend lives in the `draco-speech-gen` settings namespace (`provider`).
* The user picks Doubao TTS or Seed-Audio in Settings → Draco-suite. MP3s are
* written under `$DSH_HOME/draco/audio/`.
* @module @deepseek-ai/dsh-draco-speech-gen
*/
const name = "draco-speech-gen";
const inject = ["tools"];
/** Settings namespace owned by this plugin. */
const SPEECH_GEN_SETTINGS_NAMESPACE = settingsNamespace("draco-speech-gen");
const ProbeStatus = z.union([
	z.const("idle"),
	z.const("checking"),
	z.const("ok"),
	z.const("fail")
]);
/** Schemastery configuration for the speech-generation plugin. */
const Config = z.object({
	provider: z.union([
		z.const("none"),
		z.const("doubao-tts"),
		z.const("seed-audio")
	]).default("none"),
	doubaoProbe: ProbeStatus.default("idle"),
	seedProbe: ProbeStatus.default("idle"),
	doubaoProbeError: z.string().default(""),
	seedProbeError: z.string().default("")
});
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
function probeFailureMessage(error) {
	if (error instanceof LlmError) return error.message.slice(0, 180);
	if (error instanceof Error) {
		if (error.name === "AbortError") return "probe timed out";
		return error.message.slice(0, 180);
	}
	return String(error).slice(0, 180);
}
const SEED_AUDIO_API_KEY = credentialRef("SEED_AUDIO_API_KEY");
const VOLCENGINE_TTS_APP_ID = credentialRef("VOLCENGINE_TTS_APP_ID");
const VOLCENGINE_TTS_ACCESS_TOKEN = credentialRef("VOLCENGINE_TTS_ACCESS_TOKEN");
const TOOLS_MARK = Symbol.for("dsh.draco-speech-gen.tools");
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
/**
* Register `speech_generate` once per tools table.
* @param ctx - host context.
* @param config - composition base for the settings namespace.
*/
function apply(ctx, config) {
	const tools = ctx.tools;
	if (tools[TOOLS_MARK] === true || ctx.tools.get?.("speech_generate") !== void 0) return;
	tools[TOOLS_MARK] = true;
	ctx.effect(() => () => {
		delete tools[TOOLS_MARK];
	}, "draco-speech-gen: shared tools");
	let current = config;
	ctx.inject(["settings"], (sctx) => {
		const scope = sctx.settings.register(SPEECH_GEN_SETTINGS_NAMESPACE, Config, { base: config });
		current = scope.get();
		const runProbe = async (backend) => {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), SPEECH_PROBE_TIMEOUT_MS);
			try {
				if (backend === "doubao-tts") {
					const appId = await resolveSecret(ctx, VOLCENGINE_TTS_APP_ID);
					const token = await resolveSecret(ctx, VOLCENGINE_TTS_ACCESS_TOKEN);
					if (appId === void 0 || token === void 0) {
						await scope.update({
							doubaoProbe: "fail",
							doubaoProbeError: "missing VOLCENGINE_TTS_APP_ID or VOLCENGINE_TTS_ACCESS_TOKEN"
						});
						return;
					}
					await probeDoubaoTts(appId, token, controller.signal);
					await scope.update({
						doubaoProbe: "ok",
						doubaoProbeError: ""
					});
					return;
				}
				const apiKey = await resolveSecret(ctx, SEED_AUDIO_API_KEY);
				if (apiKey === void 0) {
					await scope.update({
						seedProbe: "fail",
						seedProbeError: "missing SEED_AUDIO_API_KEY"
					});
					return;
				}
				await probeSeedAudio(apiKey, controller.signal);
				await scope.update({
					seedProbe: "ok",
					seedProbeError: ""
				});
			} catch (error) {
				const message = probeFailureMessage(error);
				if (backend === "doubao-tts") await scope.update({
					doubaoProbe: "fail",
					doubaoProbeError: message
				});
				else await scope.update({
					seedProbe: "fail",
					seedProbeError: message
				});
			} finally {
				clearTimeout(timer);
			}
		};
		const considerProbe = (next) => {
			if (next.provider === "doubao-tts" && next.doubaoProbe === "checking") runProbe("doubao-tts");
			if (next.provider === "seed-audio" && next.seedProbe === "checking") runProbe("seed-audio");
		};
		scope.watch((next) => {
			current = next;
			considerProbe(next);
		});
		considerProbe(current);
	});
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
			const backend = current.provider === "doubao-tts" || current.provider === "seed-audio" ? current.provider : "none";
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
export { Config, SPEECH_GEN_SETTINGS_NAMESPACE, apply, formatSpeechGenerateOutput, inject, name, speechGenerateContent };
