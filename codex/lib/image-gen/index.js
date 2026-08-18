import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import z from "@deepseek-ai/schemastery";
import { AttachmentId } from "@deepseek-ai/dsh-attachment";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { LlmError } from "@deepseek-ai/dsh-llm";
import { EventSourceParserStream } from "eventsource-parser/stream";
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
//#region lib/types/index.js
/**
* Draco image-generation configuration and `image_generate` tool. The
* selected backend lives in the `draco-image-gen` settings namespace.
* Completing an OpenAI Codex OAuth login defaults an unset selection to
* Codex `gpt-image-2` (medium quality); an explicit user choice is left
* alone. Generation itself goes through the Codex Responses
* `image_generation` tool when that backend is selected. The PNG is committed
* through `ctx.attachments` before the tool result is appended, so the
* session log carries a durable `ImageBlock` rather than only a filesystem path.
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
	provider: z.union([z.const("none"), z.const("openai-codex")]).default("none"),
	quality: z.union([
		z.const("low"),
		z.const("medium"),
		z.const("high")
	]).default(CODEX_DEFAULT_QUALITY)
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
	return `Generated ${value.quality} image via ${value.provider} (${CODEX_IMAGE_MODEL}) → ${value.path}`;
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
	});
	ctx.tools.register(defineTool({
		name: "image_generate",
		description: "Generate an image from a text prompt using the configured image-generation backend. After a Codex OAuth login the default backend is OpenAI Codex gpt-image-2.",
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
								enum: ["image/png"],
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
			if (current.provider !== "openai-codex") throw new Error("image generation is not configured; sign in with OpenAI Codex or set image_gen.provider to openai-codex");
			const attachments = ctx.get("attachments");
			if (attachments === void 0) throw new Error("cannot persist a generated image: no attachment service is mounted");
			const bearer = await ctx.get("codexOauth")?.getBearer();
			if (bearer === void 0) throw new Error("no OpenAI Codex OAuth session; run /codex-login or use Settings → Models → Sign in with Codex");
			const b64 = await collectImageB64(bearer, prompt, SIZES[args.aspect ?? "square"] ?? SIZES.square, current.quality, exec.signal);
			const bytes = Buffer.from(b64, "base64");
			const name = `gpt-image-2-${Date.now()}.png`;
			const path = dshHomePath(join("draco", "images", name));
			mkdirSync(dirname(path), { recursive: true });
			writeFileSync(path, bytes);
			const ref = await attachments.saveImage({
				data: new Uint8Array(bytes),
				mediaType: "image/png",
				name
			});
			return {
				path,
				provider: "openai-codex",
				quality: current.quality,
				prompt,
				image: {
					attachmentId: ref.attachmentId,
					mediaType: "image/png",
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
}
//#endregion
export { CODEX_DEFAULT_QUALITY, CODEX_IMAGE_MODEL, Config, IMAGE_GEN_SETTINGS_NAMESPACE, apply, formatImageGenerateOutput, imageGenerateContent, imageRefFromValue, inject, name };
