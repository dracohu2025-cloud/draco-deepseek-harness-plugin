window.__ModuleLoader__.load({
	id: "draco-seedance-gen",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region \0dsh-css:/Users/dracohu/REPO/deepseek-harness/packages/draco/draco-seedance-gen-ui/src/client/DracoSuiteSection.module.css.mjs
		const css$2 = ".zP3u-a_section{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}.zP3u-a_title{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px}.zP3u-a_intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:14px;line-height:22px}.zP3u-a_cards{flex-direction:column;gap:8px;margin-top:4px;display:flex}";
		const tagId$2 = "draco-seedance-gen/DracoSuiteSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "draco-seedance-gen";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var DracoSuiteSection_module_css_default = {
			"cards": "zP3u-a_cards",
			"section": "zP3u-a_section",
			"title": "zP3u-a_title",
			"intro": "zP3u-a_intro"
		};
		//#endregion
		//#region src/client/DracoSuiteSection.tsx
		/**
		* Settings page that hosts Draco login and media cards. Cards arrive through
		* `settings.draco.item`. SuperGrok / Codex / speech UI plugins share this section id.
		*/
		function DracoSuiteSection({ t, renderSlot }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: DracoSuiteSection_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: DracoSuiteSection_module_css_default.title,
						children: t("suite.title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: DracoSuiteSection_module_css_default.intro,
						children: t("suite.intro")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: DracoSuiteSection_module_css_default.cards,
						children: renderSlot("settings.draco.item", {})
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `draco-seedance` namespace dictionaries. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"suite.nav": "Draco-suite",
			"suite.title": "Draco-suite",
			"suite.intro": "火山方舟 Seedance 2.0 生视频。需要 ARK_API_KEY。",
			"video.title": "生视频模型",
			"video.hint": "对话模型选择器不管生视频。Seedance 2.0 / mini / fast 需要 ARK_API_KEY。关闭下拉仍显示完整型号。",
			"video.off": "关闭",
			"video.imagine": "grok-imagine-video-1.5",
			"video.seedance20": "doubao-seedance-2.0 (1080p)",
			"video.seedanceMini": "doubao-seedance-2.0-mini (720p)",
			"video.seedanceFast": "doubao-seedance-2.0-fast (720p)",
			"video.unavailable": "设置尚未就绪",
			"video.ready": "生视频已就绪",
			"row.videoTitle": "生成视频",
			"row.videoLoading": "视频加载中…",
			"row.videoFailed": "视频加载失败，点击重试",
			"video.arkKey": "ARK_API_KEY",
			"video.keyPlaceholder": "输入新值以替换已保存的密钥",
			"video.save": "保存并验证",
			"video.replace": "更换密钥",
			"video.checking": "正在向火山方舟验证 ARK_API_KEY…",
			"video.seedanceReady": "Seedance 已就绪",
			"video.seedanceMissing": "需要 ARK_API_KEY",
			"video.failPrefix": "验证失败："
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"suite.nav": "Draco-suite",
			"suite.title": "Draco-suite",
			"suite.intro": "Volcengine Ark Seedance 2.0 video. This uses ARK_API_KEY.",
			"video.title": "Video generation",
			"video.hint": "The chat model selector does not control video generation. Seedance 2.0 / mini / fast need ARK_API_KEY. The closed dropdown still shows the full model id.",
			"video.off": "Off",
			"video.imagine": "grok-imagine-video-1.5",
			"video.seedance20": "doubao-seedance-2.0 (1080p)",
			"video.seedanceMini": "doubao-seedance-2.0-mini (720p)",
			"video.seedanceFast": "doubao-seedance-2.0-fast (720p)",
			"video.unavailable": "Settings are not ready yet",
			"video.ready": "Video generation ready",
			"row.videoTitle": "Generated video",
			"row.videoLoading": "Loading video…",
			"row.videoFailed": "Video failed to load; click to retry",
			"video.arkKey": "ARK_API_KEY",
			"video.keyPlaceholder": "Enter a new value to replace the stored key",
			"video.save": "Save and verify",
			"video.replace": "Replace keys",
			"video.checking": "Checking ARK_API_KEY against Volcengine Ark…",
			"video.seedanceReady": "Seedance ready",
			"video.seedanceMissing": "ARK_API_KEY is required",
			"video.failPrefix": "Check failed: "
		};
		/** The namespace key used for locale registration and seat props. */
		const NS = "draco-seedance";
		//#endregion
		//#region src/client/draco-suite.ts
		const HUB$2 = Symbol.for("dsh.draco-suite.section");
		/** Settings nav / section id. */
		const DRACO_SUITE_SECTION_ID = "draco-suite";
		/** Card slot owned by the Draco-suite section. */
		const DRACO_ITEM_SLOT = "settings.draco.item";
		function hub$2() {
			const global = globalThis;
			return global[HUB$2] ??= { mounts: /* @__PURE__ */ new Map() };
		}
		/**
		* Mount the Draco-suite settings section if it is absent.
		* @param ctx - client root context.
		* @param owner - which UI plugin is applying.
		* @returns disposer that re-mounts from a leftover plugin when this one unloads.
		*/
		function installDracoSuite(ctx, owner) {
			const h = hub$2();
			const mount = () => {
				if (h.dispose !== void 0) return;
				const t = ctx.locale.bind(NS);
				h.dispose = ctx.slots.inject("settings.section", () => ctx.slots.register({
					name: "settings.section",
					id: DRACO_SUITE_SECTION_ID,
					order: 25,
					label: () => t("suite.nav"),
					locale: NS,
					children: { [DRACO_ITEM_SLOT]: {
						kind: "list",
						scope: "root"
					} }
				}, DracoSuiteSection));
				h.owner = owner;
			};
			h.mounts.set(owner, mount);
			mount();
			return () => {
				h.mounts.delete(owner);
				if (h.owner === owner) {
					h.dispose?.();
					delete h.dispose;
					delete h.owner;
					const leftover = h.mounts.keys().next().value;
					if (leftover !== void 0) h.mounts.get(leftover)?.();
				}
				if (h.mounts.size === 0) {
					const global = globalThis;
					delete global[HUB$2];
				}
			};
		}
		//#endregion
		//#region src/client/video-generate-content.ts
		/**
		* Collect video attachments from a settled tool result, including a nested
		* `tool-result` wrapper when the Host still has that envelope.
		* @param content - `ToolResultNode.content`.
		* @returns video attachments in log order.
		*/
		function videosFromContent(content) {
			const videos = [];
			for (const item of content) {
				if (typeof item !== "object" || item === null) continue;
				const block = item;
				if (block.type === "video" && typeof block.attachment === "object" && block.attachment !== null) {
					const attachment = block.attachment;
					if (typeof attachment.attachmentId === "string" && typeof attachment.mediaType === "string") videos.push({
						attachmentId: attachment.attachmentId,
						mediaType: attachment.mediaType,
						...typeof attachment.name === "string" && attachment.name.length > 0 ? { name: attachment.name } : {}
					});
				}
				if (block.type === "tool-result" && Array.isArray(block.content)) videos.push(...videosFromContent(block.content));
			}
			return videos;
		}
		/**
		* Prompt text from `video_generate` arguments, for the collapsed row.
		* @param argsRaw - JSON arguments, possibly truncated while streaming.
		* @returns the prompt, or the raw string when JSON is incomplete.
		*/
		function promptFromArgs(argsRaw) {
			try {
				const parsed = JSON.parse(argsRaw);
				if (typeof parsed === "object" && parsed !== null) {
					const prompt = parsed.prompt;
					if (typeof prompt === "string" && prompt.trim().length > 0) return prompt.trim();
				}
			} catch {}
			return argsRaw;
		}
		/**
		* Build a browser object URL for one decoded attachment.
		* @param mediaType - video media type.
		* @param data - decoded bytes from `session.readAttachment`.
		* @returns a `blob:` URL the caller must revoke.
		*/
		function blobUrlFromBytes(mediaType, data) {
			const copy = new Uint8Array(data.byteLength);
			copy.set(data);
			return URL.createObjectURL(new Blob([copy], { type: mediaType }));
		}
		/**
		* Read a clip from a settled tool result's presentation meta.
		* @param meta - `tool/result` meta, or undefined while the call is running.
		* @returns the clip, or undefined when meta is absent or malformed.
		*/
		function clipFromMeta(meta) {
			if (typeof meta !== "object" || meta === null) return void 0;
			const clip = meta.clip;
			if (typeof clip !== "object" || clip === null) return void 0;
			const record = clip;
			if (typeof record.data !== "string" || record.data.length === 0) return void 0;
			if (typeof record.mediaType !== "string" || record.mediaType.length === 0) return void 0;
			return {
				name: typeof record.name === "string" && record.name.length > 0 ? record.name : "video.mp4",
				mediaType: record.mediaType,
				data: record.data
			};
		}
		/**
		* Build a browser object URL for one clip.
		* @param clip - persisted MP4.
		* @returns a `blob:` URL the caller must revoke.
		*/
		function blobUrlFromClip(clip) {
			const binary = atob(clip.data);
			const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
			return URL.createObjectURL(new Blob([bytes], { type: clip.mediaType }));
		}
		//#endregion
		//#region \0dsh-css:/Users/dracohu/REPO/deepseek-harness/packages/draco/draco-seedance-gen-ui/src/client/VideoGenerateRow.module.css.mjs
		const css$1 = ".yqdn-a_root{flex-direction:column;gap:8px;min-width:0;display:flex}.yqdn-a_head{align-items:baseline;gap:8px;min-width:0;display:flex}.yqdn-a_title{color:var(--dsw-alias-label-primary);flex:none;font-size:13px;font-weight:500;line-height:20px}.yqdn-a_summary{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;overflow:hidden}.yqdn-a_player{flex-direction:column;align-items:flex-start;gap:6px;width:100%;max-width:360px;display:flex}.yqdn-a_video{background:var(--dsw-alias-bg-subtle);border-radius:8px;width:100%;max-height:240px;display:block}.yqdn-a_download{color:var(--dsw-alias-label-secondary);text-underline-offset:2px;font-size:12px;line-height:18px;text-decoration:underline}.yqdn-a_loading,.yqdn-a_error{background:var(--dsw-alias-bg-subtle);min-height:40px;color:var(--dsw-alias-label-secondary);font:inherit;border:none;border-radius:8px;align-items:center;padding:0 12px;display:inline-flex}.yqdn-a_error{cursor:pointer;color:var(--dsw-alias-state-danger)}";
		const tagId$1 = "draco-seedance-gen/VideoGenerateRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "draco-seedance-gen";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var VideoGenerateRow_module_css_default = {
			"summary": "yqdn-a_summary",
			"head": "yqdn-a_head",
			"title": "yqdn-a_title",
			"root": "yqdn-a_root",
			"player": "yqdn-a_player",
			"download": "yqdn-a_download",
			"error": "yqdn-a_error",
			"video": "yqdn-a_video",
			"loading": "yqdn-a_loading"
		};
		//#endregion
		//#region src/client/VideoGenerateRow.tsx
		/**
		* `video_generate` toolview: plays the durable VideoBlock on official Web,
		* which otherwise dumps video blocks as JSON.
		*/
		function VideoPlayer({ attachmentId, name, loadVideo, t }) {
			const [src, setSrc] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(false);
			const [attempt, setAttempt] = (0, react.useState)(0);
			const loadRef = (0, react.useRef)(loadVideo);
			loadRef.current = loadVideo;
			const label = name ?? t("row.videoTitle");
			(0, react.useEffect)(() => {
				let revoked;
				let cancelled = false;
				setError(false);
				setSrc(null);
				loadRef.current(attachmentId).then((url) => {
					if (cancelled) {
						URL.revokeObjectURL(url);
						return;
					}
					revoked = url;
					setSrc(url);
				}, () => {
					if (!cancelled) setError(true);
				});
				return () => {
					cancelled = true;
					if (revoked !== void 0) URL.revokeObjectURL(revoked);
				};
			}, [attachmentId, attempt]);
			if (error) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: VideoGenerateRow_module_css_default.error,
				onClick: () => {
					setAttempt((n) => n + 1);
				},
				children: t("row.videoFailed")
			});
			if (src === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: VideoGenerateRow_module_css_default.loading,
				children: t("row.videoLoading")
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: VideoGenerateRow_module_css_default.player,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("video", {
					className: VideoGenerateRow_module_css_default.video,
					src,
					controls: true,
					playsInline: true,
					preload: "metadata",
					"aria-label": label
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
					className: VideoGenerateRow_module_css_default.download,
					href: src,
					download: name ?? "video.mp4",
					children: label
				})]
			});
		}
		function ClipPlayer({ name, mediaType, data, t }) {
			const [src, setSrc] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(false);
			const [attempt, setAttempt] = (0, react.useState)(0);
			(0, react.useEffect)(() => {
				setError(false);
				setSrc(null);
				try {
					const url = blobUrlFromClip({
						name,
						mediaType,
						data
					});
					setSrc(url);
					return () => {
						URL.revokeObjectURL(url);
					};
				} catch {
					setError(true);
					return () => {};
				}
			}, [
				name,
				mediaType,
				data,
				attempt
			]);
			if (error) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: VideoGenerateRow_module_css_default.error,
				onClick: () => {
					setAttempt((n) => n + 1);
				},
				children: t("row.videoFailed")
			});
			if (src === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: VideoGenerateRow_module_css_default.loading,
				children: t("row.videoLoading")
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: VideoGenerateRow_module_css_default.player,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("video", {
					className: VideoGenerateRow_module_css_default.video,
					src,
					controls: true,
					playsInline: true,
					preload: "metadata",
					"aria-label": name
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
					className: VideoGenerateRow_module_css_default.download,
					href: src,
					download: name,
					children: name
				})]
			});
		}
		/** Compact video row: title, prompt preview, and an in-row player. */
		function VideoGenerateRow({ block, t, loadVideo }) {
			const settled = "kind" in block;
			const preview = promptFromArgs((settled ? block.call?.argsRaw : block.argsRaw) ?? "");
			const videos = settled ? videosFromContent(block.content) : [];
			const clip = settled && videos.length === 0 ? clipFromMeta(block.meta) : void 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: VideoGenerateRow_module_css_default.root,
				"data-state": settled ? block.isError ? "error" : "ok" : "running",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: VideoGenerateRow_module_css_default.head,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: VideoGenerateRow_module_css_default.title,
							children: t("row.videoTitle")
						}), preview.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: VideoGenerateRow_module_css_default.summary,
							children: preview
						})]
					}),
					videos.map((video) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VideoPlayer, {
						attachmentId: video.attachmentId,
						...video.name === void 0 ? {} : { name: video.name },
						loadVideo,
						t
					}, video.attachmentId)),
					clip !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ClipPlayer, {
						name: clip.name,
						mediaType: clip.mediaType,
						data: clip.data,
						t
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/video-generate-toolview.tsx
		const HUB$1 = Symbol.for("dsh.draco-video-gen.toolview");
		function hub$1() {
			const global = globalThis;
			return global[HUB$1] ??= {};
		}
		/**
		* Resolve one session attachment into a browser object URL.
		* @param ctx - client root (sessions service).
		* @param sessionId - owning conversation.
		* @param attachmentId - opaque id from the VideoBlock.
		* @returns a `blob:` URL the caller must revoke.
		*/
		async function loadVideoAttachment(ctx, sessionId, attachmentId) {
			const session = ctx.get("sessions")?.binding(sessionId)?.session;
			if (session === void 0) throw new Error("video_generate: session is not available");
			const result = await session.readAttachment(attachmentId);
			if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
			return blobUrlFromBytes(result.value.attachment.mediaType, result.value.data);
		}
		/**
		* Mount the video_generate toolview once per browser runtime.
		* @param ctx - client root context.
		* @returns disposer that withdraws the keyed row.
		*/
		function installVideoGenerateToolview(ctx) {
			const h = hub$1();
			if (h.dispose !== void 0) return () => {};
			function BoundRow(props) {
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VideoGenerateRow, {
					block: props.block,
					t: props.t,
					loadVideo: (attachmentId) => loadVideoAttachment(ctx, String(props.sessionId), attachmentId)
				});
			}
			const injected = ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
				name: "tool.call.toolview",
				key: "video_generate",
				locale: NS
			}, BoundRow));
			h.dispose = injected;
			return () => {
				injected();
				delete h.dispose;
				delete globalThis[HUB$1];
			};
		}
		//#endregion
		//#region src/client/video-gen-value.ts
		/** Slot id for the single video-generation card (duplicate ids throw). */
		const VIDEO_GEN_SEAT_ID = "draco-video-gen";
		/** Host settings section owned by `@deepseek-ai/dsh-draco-image-gen`. */
		const IMAGE_GEN_NS = "draco-image-gen";
		/** Host settings section owned by `draco-seedance-gen`. */
		const SEEDANCE_GEN_NS = "draco-seedance-gen";
		/** Ark key reference. */
		const SEEDANCE_ARK_KEY_REF = "ARK_API_KEY";
		/**
		* True when the dropdown row is a Seedance 2.0 model.
		* @param value - selected row.
		*/
		function isSeedanceValue(value) {
			return value === "seedance-2-0" || value === "seedance-2-0-mini" || value === "seedance-2-0-fast";
		}
		/**
		* Normalize a Host probe field.
		* @param value - stored probe status, if any.
		*/
		function seedanceProbeOf(value) {
			if (value === "checking" || value === "ok" || value === "fail") return value;
			return "idle";
		}
		/**
		* Map a Host image-gen section onto one video dropdown value.
		* @param section - last accepted `draco-image-gen` section, if any.
		*/
		function videoValueOf(section) {
			if (section === void 0) return "none";
			if (section.videoProvider === "xai-imagine") return "imagine";
			if (section.videoProvider === "seedance-2-0") return "seedance-2-0";
			if (section.videoProvider === "seedance-2-0-mini") return "seedance-2-0-mini";
			if (section.videoProvider === "seedance-2-0-fast") return "seedance-2-0-fast";
			return "none";
		}
		/**
		* Map a Host Seedance section onto one video dropdown value.
		* @param section - last accepted `draco-seedance-gen` section, if any.
		*/
		function seedanceValueOf(section) {
			if (section === void 0) return "none";
			if (section.provider === "seedance-2-0" || section.provider === "seedance-2-0-mini" || section.provider === "seedance-2-0-fast") return section.provider;
			return "none";
		}
		/**
		* Host writes for `draco-image-gen.videoProvider`.
		* @param value - selected dropdown row.
		*/
		function videoWritesOf(value) {
			switch (value) {
				case "none": return [["videoProvider", "none"]];
				case "imagine": return [["videoProvider", "xai-imagine"]];
				case "seedance-2-0": return [["videoProvider", "seedance-2-0"]];
				case "seedance-2-0-mini": return [["videoProvider", "seedance-2-0-mini"]];
				case "seedance-2-0-fast": return [["videoProvider", "seedance-2-0-fast"]];
			}
		}
		/**
		* Host writes for `draco-seedance-gen.provider`.
		* @param value - selected dropdown row.
		*/
		function seedanceWritesOf(value) {
			if (isSeedanceValue(value)) return [["provider", value]];
			return [["provider", "none"]];
		}
		/**
		* Dropdown rows for the loaded video backends, plus the current value's family.
		* @param available - backends whose UI plugin is loaded.
		* @param value - current Host-backed value.
		*/
		function videoOptionsFor(available, value) {
			const rows = ["none"];
			if (available.imagine || value === "imagine") rows.push("imagine");
			if (available.seedance || isSeedanceValue(value)) rows.push("seedance-2-0", "seedance-2-0-mini", "seedance-2-0-fast");
			return rows;
		}
		/**
		* True when the selected video row can run. Imagine uses SuperGrok OAuth
		* (plugin loaded). Seedance needs a successful Ark probe. Off never lights.
		* @param available - backends whose UI plugin is loaded.
		* @param value - current dropdown value.
		* @param seedanceProbe - last Ark probe for Seedance.
		*/
		function videoReadyOf(available, value, seedanceProbe) {
			if (value === "imagine") return available.imagine;
			if (isSeedanceValue(value)) return available.seedance && seedanceProbe === "ok";
			return false;
		}
		//#endregion
		//#region \0dsh-css:/Users/dracohu/REPO/deepseek-harness/packages/draco/draco-seedance-gen-ui/src/client/VideoPicker.module.css.mjs
		const css = ".gQucAW_card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;gap:10px;padding:12px 14px;display:flex}.gQucAW_head{justify-content:space-between;align-items:center;gap:10px;display:flex}.gQucAW_identity{align-items:center;gap:6px;min-width:0;display:inline-flex}.gQucAW_name{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}.gQucAW_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.gQucAW_primary{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;align-self:flex-start;padding:4px 10px;font-size:13px;line-height:20px}.gQucAW_primary:disabled{opacity:.6;cursor:default}.gQucAW_selectRow{align-items:center;gap:8px;display:flex}.gQucAW_selectWrap{flex:auto;min-width:0;max-width:420px;position:relative}.gQucAW_selectWrap .gQucAW_select{width:100%;max-width:none}.gQucAW_selectReady{padding-right:44px}.gQucAW_selectWrap .gQucAW_dotReady{pointer-events:none;position:absolute;top:50%;right:28px;transform:translateY(-50%)}.gQucAW_iconBtn{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);width:32px;height:32px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.gQucAW_iconBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}.gQucAW_error{color:var(--dsw-alias-state-error-primary);margin:0;font-size:12px;line-height:18px}.gQucAW_dotReady{background:var(--dsw-alias-state-success-primary);border-radius:50%;flex:none;width:8px;height:8px}.gQucAW_input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;max-width:420px;height:32px;font:inherit;color:var(--dsw-alias-label-primary);background-color:var(--dsw-alias-bg-base);border-radius:8px;padding:0 10px;font-size:13px;line-height:20px}.gQucAW_input:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.gQucAW_input:disabled{opacity:.6}.gQucAW_select{appearance:none;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;max-width:420px;height:32px;font:inherit;color:var(--dsw-alias-label-primary);background-color:var(--dsw-alias-bg-base);cursor:pointer;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-position:right 10px center;background-repeat:no-repeat;background-size:12px 12px;border-radius:8px;padding:0 32px 0 10px;font-size:13px;line-height:20px}.gQucAW_select:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.gQucAW_select:disabled{opacity:.6;cursor:default}.gQucAW_muted{color:var(--dsw-alias-label-secondary);font-size:12px}.gQucAW_fields{flex-direction:column;gap:8px;display:flex}.gQucAW_fieldLabel{flex-direction:column;gap:4px;margin:0;display:flex}";
		const tagId = "draco-seedance-gen/VideoPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "draco-seedance-gen";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var VideoPicker_module_css_default = {
			"card": "gQucAW_card",
			"name": "gQucAW_name",
			"muted": "gQucAW_muted",
			"identity": "gQucAW_identity",
			"hint": "gQucAW_hint",
			"primary": "gQucAW_primary",
			"dotReady": "gQucAW_dotReady",
			"input": "gQucAW_input",
			"select": "gQucAW_select",
			"selectWrap": "gQucAW_selectWrap",
			"selectRow": "gQucAW_selectRow",
			"selectReady": "gQucAW_selectReady",
			"error": "gQucAW_error",
			"fields": "gQucAW_fields",
			"fieldLabel": "gQucAW_fieldLabel",
			"iconBtn": "gQucAW_iconBtn",
			"head": "gQucAW_head"
		};
		//#endregion
		//#region src/client/VideoGenPickerCard.tsx
		const LABELS = {
			none: "video.off",
			imagine: "video.imagine",
			"seedance-2-0": "video.seedance20",
			"seedance-2-0-mini": "video.seedanceMini",
			"seedance-2-0-fast": "video.seedanceFast"
		};
		/**
		* One Settings → Draco-suite dropdown for every installed video backend.
		* Option labels are the full model id so the closed select still names it.
		* Seedance rows reveal an ARK_API_KEY field and a Save-and-verify probe.
		*/
		function VideoGenPickerCard({ t, setValue, saveKeys, useStore }) {
			const ready = useStore((s) => s.ready);
			const available = useStore((s) => s.available);
			const value = useStore((s) => s.value);
			const seedanceConfigured = useStore((s) => s.seedanceConfigured);
			const seedanceProbe = useStore((s) => s.seedanceProbe);
			const seedanceProbeError = useStore((s) => s.seedanceProbeError);
			const [ark, setArk] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [editing, setEditing] = (0, react.useState)(false);
			const showSeedance = isSeedanceValue(value);
			const seedanceVerified = showSeedance && seedanceProbe === "ok";
			const verified = videoReadyOf(available, value, seedanceProbe);
			const checking = showSeedance && seedanceProbe === "checking";
			const showForm = ready && available.seedance && saveKeys !== void 0 && showSeedance && !checking && (editing || !seedanceVerified);
			(0, react.useEffect)(() => {
				if (seedanceVerified) setEditing(false);
			}, [seedanceVerified]);
			const onSave = (persist) => (event) => {
				event.preventDefault();
				setBusy(true);
				persist({ ...ark.trim().length > 0 ? { ark: ark.trim() } : {} }).finally(() => {
					setArk("");
					setBusy(false);
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
				className: VideoPicker_module_css_default.card,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: VideoPicker_module_css_default.head,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: VideoPicker_module_css_default.identity,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: VideoPicker_module_css_default.name,
								children: t("video.title")
							})
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: VideoPicker_module_css_default.hint,
						children: t("video.hint")
					}),
					ready ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: VideoPicker_module_css_default.selectRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: VideoPicker_module_css_default.selectWrap,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
								className: verified ? `${VideoPicker_module_css_default.select} ${VideoPicker_module_css_default.selectReady}` : VideoPicker_module_css_default.select,
								"aria-label": t("video.title"),
								value,
								disabled: checking,
								onChange: (event) => {
									setValue(event.target.value);
								},
								children: videoOptionsFor(available, value).map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: row,
									children: t(LABELS[row])
								}, row))
							}), verified ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: VideoPicker_module_css_default.dotReady,
								role: "img",
								"aria-label": t("video.ready"),
								title: t("video.ready")
							}) : null]
						}), seedanceVerified && available.seedance && saveKeys !== void 0 && !editing ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: VideoPicker_module_css_default.iconBtn,
							type: "button",
							"aria-label": t("video.replace"),
							title: t("video.replace"),
							onClick: () => {
								setEditing(true);
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(KeyIcon, {})
						}) : null]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: VideoPicker_module_css_default.muted,
						children: t("video.unavailable")
					}),
					ready && showSeedance ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProbeStatusLine, {
						t,
						probe: seedanceProbe,
						error: seedanceProbeError,
						configured: seedanceConfigured
					}) : null,
					showForm ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
						className: VideoPicker_module_css_default.fields,
						onSubmit: onSave(saveKeys),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: VideoPicker_module_css_default.fieldLabel,
							children: [t("video.arkKey"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: VideoPicker_module_css_default.input,
								type: "password",
								autoComplete: "off",
								value: ark,
								placeholder: t("video.keyPlaceholder"),
								"aria-label": t("video.arkKey"),
								disabled: busy || checking,
								onChange: (event) => {
									setArk(event.target.value);
								}
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: VideoPicker_module_css_default.primary,
							type: "submit",
							disabled: busy || checking,
							children: t("video.save")
						})]
					}) : null
				]
			});
		}
		function ProbeStatusLine({ t, probe, error, configured }) {
			if (probe === "ok") return null;
			if (probe === "checking") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: VideoPicker_module_css_default.muted,
				children: t("video.checking")
			});
			if (probe === "fail") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
				className: VideoPicker_module_css_default.error,
				children: [t("video.failPrefix"), error]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: VideoPicker_module_css_default.muted,
				children: configured ? t("video.checking") : t("video.seedanceMissing")
			});
		}
		function KeyIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					cx: "5.5",
					cy: "5.5",
					r: "3.1",
					stroke: "currentColor",
					strokeWidth: "1.5"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M8.2 7.1 14 12.9v1.6h-2.2v-1.5h-1.6v-1.5H8.7L8.2 11",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinejoin: "round"
				})]
			});
		}
		//#endregion
		//#region src/client/video-gen-store.ts
		/**
		* Video-generation dropdown store: a mirror of `draco-image-gen.videoProvider`
		* plus which UI plugins have advertised a video backend.
		*/
		/**
		* Declares the video-generation dropdown state.
		* @returns the store handle.
		*/
		function createVideoGenPickerStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					ready: false,
					available: {
						imagine: false,
						seedance: false
					},
					value: "none",
					seedanceConfigured: false,
					seedanceProbe: "idle",
					seedanceProbeError: ""
				}),
				actions: { sync: (draft, next) => {
					draft.ready = next.ready;
					draft.available = next.available;
					draft.value = next.value;
					draft.seedanceConfigured = next.seedanceConfigured;
					draft.seedanceProbe = next.seedanceProbe;
					draft.seedanceProbeError = next.seedanceProbeError;
				} }
			});
		}
		//#endregion
		//#region src/client/video-gen-picker.ts
		const HUB = Symbol.for("dsh.draco-video-gen.picker");
		function hub() {
			const global = globalThis;
			return global[HUB] ??= {
				backends: /* @__PURE__ */ new Set(),
				writers: /* @__PURE__ */ new Map(),
				mounts: /* @__PURE__ */ new Map(),
				refreshers: /* @__PURE__ */ new Set(),
				seedanceConfigured: false,
				seedanceProbe: "idle",
				seedanceProbeError: ""
			};
		}
		function credentialsOf(ctx) {
			const getter = ctx.get;
			if (typeof getter !== "function") return void 0;
			return getter.call(ctx, "connection")?.api?.credentials;
		}
		function combinedValue(image, seedance) {
			const fromImage = videoValueOf(image);
			if (fromImage !== "none") return fromImage;
			return seedanceValueOf(seedance);
		}
		function snapshotOf(imageScope, seedanceScope) {
			const h = hub();
			const image = imageScope.getSnapshot();
			const seedance = seedanceScope.getSnapshot();
			return {
				ready: image.status === "ready" || seedance.status === "ready",
				available: {
					imagine: h.backends.has("imagine"),
					seedance: h.backends.has("seedance")
				},
				value: combinedValue(image.value, seedance.value),
				seedanceConfigured: h.seedanceConfigured,
				seedanceProbe: seedanceProbeOf(seedance.value?.seedanceProbe) === "idle" ? h.seedanceProbe : seedanceProbeOf(seedance.value?.seedanceProbe),
				seedanceProbeError: seedance.value?.seedanceProbeError ?? h.seedanceProbeError
			};
		}
		function refreshAll() {
			for (const fn of hub().refreshers) fn();
		}
		function ownerOf(value) {
			if (value === "imagine") return "imagine";
			if (isSeedanceValue(value)) return "seedance";
		}
		/**
		* Advertise Seedance and mount the shared dropdown if it is absent.
		* @param ctx - client root context.
		* @returns disposer that withdraws Seedance and remounts if Imagine remains.
		*/
		function installVideoGenPicker(ctx) {
			const h = hub();
			const imageScope = ctx.settingsScope.bind({ namespace: IMAGE_GEN_NS });
			const seedanceScope = ctx.settingsScope.bind({ namespace: SEEDANCE_GEN_NS });
			const credentials = credentialsOf(ctx);
			const backend = "seedance";
			const push = () => {
				const snap = snapshotOf(imageScope, seedanceScope);
				h.seedanceProbe = snap.seedanceProbe;
				h.seedanceProbeError = snap.seedanceProbeError;
				h.bound?.sync(snap);
				refreshAll();
			};
			const unsubImage = imageScope.subscribe(() => {
				push();
			});
			const unsubSeedance = seedanceScope.subscribe(() => {
				push();
			});
			const refreshKeys = async () => {
				if (credentials === void 0) return;
				try {
					const response = await credentials.describe({ refs: [SEEDANCE_ARK_KEY_REF] });
					if (!response.result.ok) return;
					h.seedanceConfigured = response.result.value.credentials[SEEDANCE_ARK_KEY_REF]?.configured === true;
					push();
				} catch {}
			};
			const write = (value) => {
				if (imageScope.getSnapshot().status === "ready") for (const [field, next] of videoWritesOf(value)) imageScope.set(field, next);
				for (const [field, next] of seedanceWritesOf(value)) seedanceScope.set(field, next);
			};
			h.saveKeys = async (keys) => {
				if (credentials === void 0) return;
				if (keys.ark !== void 0) await credentials.set({
					ref: SEEDANCE_ARK_KEY_REF,
					value: keys.ark
				});
				await refreshKeys();
				await seedanceScope.set("seedanceProbeError", "");
				await seedanceScope.set("seedanceProbe", "checking");
			};
			const mount = () => {
				if (h.disposeSeat !== void 0) return;
				const store = createVideoGenPickerStore();
				h.disposeSeat = ctx.slots.inject(DRACO_ITEM_SLOT, () => ctx.slots.register({
					name: DRACO_ITEM_SLOT,
					id: VIDEO_GEN_SEAT_ID,
					order: 26,
					locale: NS,
					store,
					inject: (actions) => {
						h.bound = actions;
						push();
						refreshKeys();
						return {
							setValue: (value) => {
								if (value === "none") {
									for (const writer of h.writers.values()) writer(value);
									return;
								}
								const owner = ownerOf(value);
								((owner !== void 0 ? h.writers.get(owner) : void 0) ?? h.writers.values().next().value)?.(value);
							},
							saveKeys: (keys) => {
								const fn = hub().saveKeys;
								if (fn === void 0) return Promise.resolve();
								return fn(keys);
							}
						};
					}
				}, VideoGenPickerCard));
				h.owner = backend;
			};
			const refresh = () => {
				const snap = snapshotOf(imageScope, seedanceScope);
				h.bound?.sync(snap);
			};
			h.backends.add(backend);
			h.writers.set(backend, write);
			h.mounts.set(backend, mount);
			h.refreshers.add(refresh);
			mount();
			push();
			refreshKeys();
			return () => {
				unsubImage();
				unsubSeedance();
				h.backends.delete(backend);
				h.writers.delete(backend);
				h.mounts.delete(backend);
				h.refreshers.delete(refresh);
				delete h.saveKeys;
				if (h.owner === backend) {
					h.disposeSeat?.();
					delete h.disposeSeat;
					delete h.bound;
					delete h.owner;
					const leftover = h.backends.values().next().value;
					if (leftover !== void 0) h.mounts.get(leftover)?.();
				} else refreshAll();
				if (h.backends.size === 0) {
					const global = globalThis;
					delete global[HUB];
				}
			};
		}
		//#endregion
		//#region src/client/index.ts
		/** Services required by the browser half. */
		const inject = [
			"slots",
			"locale",
			"connection",
			"settingsScope"
		];
		/**
		* Client plugin body: dictionaries, Draco-suite section, video rows.
		* @param ctx - client root context.
		* @returns disposer unwinding the seat and dictionaries.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "draco-seedance-gen-ui: dictionaries");
			const suite = installDracoSuite(ctx, "seedance");
			const picker = installVideoGenPicker(ctx);
			const videoRow = installVideoGenerateToolview(ctx);
			return () => {
				videoRow();
				picker();
				suite();
			};
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map