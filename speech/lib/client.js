window.__ModuleLoader__.load({
	id: "draco-speech-gen",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region \0dsh-css:/Users/dracohu/REPO/deepseek-harness/packages/draco/draco-speech-gen-ui/src/client/DracoSuiteSection.module.css.mjs
		const css$1 = ".aOg8EW_section{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}.aOg8EW_title{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px}.aOg8EW_intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:14px;line-height:22px}.aOg8EW_cards{flex-direction:column;gap:8px;margin-top:4px;display:flex}";
		const tagId$1 = "draco-speech-gen/DracoSuiteSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "draco-speech-gen";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var DracoSuiteSection_module_css_default = {
			"cards": "aOg8EW_cards",
			"section": "aOg8EW_section",
			"title": "aOg8EW_title",
			"intro": "aOg8EW_intro"
		};
		//#endregion
		//#region lib/types/client/DracoSuiteSection.js
		/**
		* Settings page that hosts Draco login and media cards. Cards arrive through
		* `settings.draco.item`. SuperGrok / Codex UI plugins share this section id.
		*/
		function DracoSuiteSection({ t, renderSlot }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: DracoSuiteSection_module_css_default.section,
				children: [
					(0, react_jsx_runtime.jsx)("h2", {
						className: DracoSuiteSection_module_css_default.title,
						children: t("suite.title")
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: DracoSuiteSection_module_css_default.intro,
						children: t("suite.intro")
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: DracoSuiteSection_module_css_default.cards,
						children: renderSlot("settings.draco.item", {})
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** `draco-speech` namespace dictionaries. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"suite.nav": "Draco-suite",
			"suite.title": "Draco-suite",
			"suite.intro": "火山语音 TTS。需要 API Key。",
			"speech.title": "语音合成",
			"speech.hint": "对话模型选择器不管 TTS。doubao-tts 按原文朗读；seed-audio-1.0 可带语气，但可能添气氛。密钥写入凭据库，也可放环境变量。",
			"speech.off": "关闭",
			"speech.doubao": "doubao-tts",
			"speech.seed": "seed-audio-1.0",
			"speech.unavailable": "设置尚未就绪",
			"speech.seedKey": "SEED_AUDIO_API_KEY",
			"speech.appId": "VOLCENGINE_TTS_APP_ID",
			"speech.token": "VOLCENGINE_TTS_ACCESS_TOKEN",
			"speech.keyPlaceholder": "输入新值以替换已保存的密钥",
			"speech.save": "保存密钥",
			"speech.seedReady": "Seed-Audio 密钥已配置",
			"speech.seedMissing": "需要 SEED_AUDIO_API_KEY",
			"speech.doubaoReady": "Doubao TTS 密钥已配置",
			"speech.doubaoMissing": "需要 VOLCENGINE_TTS_APP_ID 与 VOLCENGINE_TTS_ACCESS_TOKEN"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"suite.nav": "Draco-suite",
			"suite.title": "Draco-suite",
			"suite.intro": "Volcengine speech TTS. This uses API keys.",
			"speech.title": "Speech synthesis",
			"speech.hint": "The chat model selector does not control TTS. doubao-tts reads the text verbatim. seed-audio-1.0 can add delivery, and may add atmosphere. Keys go in the credential store or the environment.",
			"speech.off": "Off",
			"speech.doubao": "doubao-tts",
			"speech.seed": "seed-audio-1.0",
			"speech.unavailable": "Settings are not ready yet",
			"speech.seedKey": "SEED_AUDIO_API_KEY",
			"speech.appId": "VOLCENGINE_TTS_APP_ID",
			"speech.token": "VOLCENGINE_TTS_ACCESS_TOKEN",
			"speech.keyPlaceholder": "Enter a new value to replace the stored key",
			"speech.save": "Save keys",
			"speech.seedReady": "Seed-Audio key configured",
			"speech.seedMissing": "SEED_AUDIO_API_KEY is required",
			"speech.doubaoReady": "Doubao TTS keys configured",
			"speech.doubaoMissing": "VOLCENGINE_TTS_APP_ID and VOLCENGINE_TTS_ACCESS_TOKEN are required"
		};
		/** The namespace key used for locale registration and seat props. */
		const NS = "draco-speech";
		//#endregion
		//#region lib/types/client/draco-suite.js
		const HUB = Symbol.for("dsh.draco-suite.section");
		/** Settings nav / section id. */
		const DRACO_SUITE_SECTION_ID = "draco-suite";
		/** Card slot owned by the Draco-suite section. */
		const DRACO_ITEM_SLOT = "settings.draco.item";
		function hub() {
			const global = globalThis;
			return global[HUB] ??= { mounts: /* @__PURE__ */ new Map() };
		}
		/**
		* Mount the Draco-suite settings section if it is absent.
		* @param ctx - client root context.
		* @param owner - which UI plugin is applying.
		* @returns disposer that re-mounts from a leftover plugin when this one unloads.
		*/
		function installDracoSuite(ctx, owner) {
			const h = hub();
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
					delete global[HUB];
				}
			};
		}
		//#endregion
		//#region lib/types/client/speech-gen-value.js
		/**
		* `draco-speech-gen.provider` picker values.
		*/
		/** Host settings section owned by `draco-speech-gen`. */
		const SPEECH_GEN_NS = "draco-speech-gen";
		/** Slot id for the speech-generation card (duplicate ids throw). */
		const SPEECH_GEN_SEAT_ID = "draco-speech-gen";
		/**
		* Map a Host section onto one speech dropdown value.
		* @param section - last accepted `draco-speech-gen` section, if any.
		* @returns `none` when speech is off or the section is empty.
		*/
		function speechValueOf(section) {
			if (section === void 0) return "none";
			if (section.provider === "doubao-tts" || section.provider === "seed-audio") return section.provider;
			return "none";
		}
		/**
		* Host writes for one speech dropdown value.
		* @param value - selected dropdown row.
		* @returns field writes in mutation order.
		*/
		function speechWritesOf(value) {
			return [["provider", value]];
		}
		/**
		* Dropdown rows.
		* @returns rows in display order, Off first.
		*/
		function speechOptions() {
			return [
				"none",
				"doubao-tts",
				"seed-audio"
			];
		}
		/** Seed-Audio API key reference. */
		const SPEECH_SEED_KEY_REF = "SEED_AUDIO_API_KEY";
		/** Doubao TTS app id reference. */
		const SPEECH_DOUBAO_APP_REF = "VOLCENGINE_TTS_APP_ID";
		/** Doubao TTS access token reference. */
		const SPEECH_DOUBAO_TOKEN_REF = "VOLCENGINE_TTS_ACCESS_TOKEN";
		//#endregion
		//#region \0dsh-css:/Users/dracohu/REPO/deepseek-harness/packages/draco/draco-speech-gen-ui/src/client/SpeechPicker.module.css.mjs
		const css = ".o2ba6G_card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;gap:10px;padding:12px 14px;display:flex}.o2ba6G_head{justify-content:space-between;align-items:center;gap:10px;display:flex}.o2ba6G_identity{align-items:center;gap:6px;min-width:0;display:inline-flex}.o2ba6G_name{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}.o2ba6G_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.o2ba6G_primary{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;align-self:flex-start;padding:4px 10px;font-size:13px;line-height:20px}.o2ba6G_primary:disabled{opacity:.6;cursor:default}.o2ba6G_select{appearance:none;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;max-width:420px;height:32px;font:inherit;color:var(--dsw-alias-label-primary);background-color:var(--dsw-alias-bg-base);cursor:pointer;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-position:right 10px center;background-repeat:no-repeat;background-size:12px 12px;border-radius:8px;padding:0 32px 0 10px;font-size:13px;line-height:20px}.o2ba6G_select:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.o2ba6G_muted{color:var(--dsw-alias-label-secondary);font-size:12px}.o2ba6G_fields{flex-direction:column;gap:8px;display:flex}.o2ba6G_fieldLabel{flex-direction:column;gap:4px;margin:0;display:flex}";
		const tagId = "draco-speech-gen/SpeechPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "draco-speech-gen";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SpeechPicker_module_css_default = {
			"muted": "o2ba6G_muted",
			"primary": "o2ba6G_primary",
			"fields": "o2ba6G_fields",
			"select": "o2ba6G_select",
			"head": "o2ba6G_head",
			"name": "o2ba6G_name",
			"hint": "o2ba6G_hint",
			"card": "o2ba6G_card",
			"identity": "o2ba6G_identity",
			"fieldLabel": "o2ba6G_fieldLabel"
		};
		//#endregion
		//#region lib/types/client/SpeechGenPickerCard.js
		const LABELS = {
			none: "speech.off",
			"doubao-tts": "speech.doubao",
			"seed-audio": "speech.seed"
		};
		/**
		* One Settings → Draco-suite dropdown for Doubao TTS and Seed-Audio, plus
		* optional credential fields. Option labels are the wire model ids.
		*/
		function SpeechGenPickerCard({ t, setValue, saveKeys, useStore }) {
			const ready = useStore((s) => s.ready);
			const value = useStore((s) => s.value);
			const seedConfigured = useStore((s) => s.seedConfigured);
			const doubaoConfigured = useStore((s) => s.doubaoConfigured);
			const [seed, setSeed] = (0, react.useState)("");
			const [appId, setAppId] = (0, react.useState)("");
			const [token, setToken] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const showDoubao = value === "doubao-tts";
			const showSeed = value === "seed-audio";
			const onSave = (persist) => (event) => {
				event.preventDefault();
				setBusy(true);
				persist({
					...seed.trim().length > 0 ? { seed: seed.trim() } : {},
					...appId.trim().length > 0 ? { appId: appId.trim() } : {},
					...token.trim().length > 0 ? { token: token.trim() } : {}
				}).finally(() => {
					setSeed("");
					setAppId("");
					setToken("");
					setBusy(false);
				});
			};
			return (0, react_jsx_runtime.jsxs)("article", {
				className: SpeechPicker_module_css_default.card,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: SpeechPicker_module_css_default.head,
						children: (0, react_jsx_runtime.jsx)("div", {
							className: SpeechPicker_module_css_default.identity,
							children: (0, react_jsx_runtime.jsx)("span", {
								className: SpeechPicker_module_css_default.name,
								children: t("speech.title")
							})
						})
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: SpeechPicker_module_css_default.hint,
						children: t("speech.hint")
					}),
					ready ? (0, react_jsx_runtime.jsx)("select", {
						className: SpeechPicker_module_css_default.select,
						"aria-label": t("speech.title"),
						value,
						onChange: (event) => {
							setValue(event.target.value);
						},
						children: speechOptions().map((row) => (0, react_jsx_runtime.jsx)("option", {
							value: row,
							children: t(LABELS[row])
						}, row))
					}) : (0, react_jsx_runtime.jsx)("p", {
						className: SpeechPicker_module_css_default.muted,
						children: t("speech.unavailable")
					}),
					ready && showDoubao ? (0, react_jsx_runtime.jsx)("p", {
						className: SpeechPicker_module_css_default.muted,
						children: doubaoConfigured ? t("speech.doubaoReady") : t("speech.doubaoMissing")
					}) : null,
					ready && showSeed ? (0, react_jsx_runtime.jsx)("p", {
						className: SpeechPicker_module_css_default.muted,
						children: seedConfigured ? t("speech.seedReady") : t("speech.seedMissing")
					}) : null,
					ready && saveKeys !== void 0 && value !== "none" ? (0, react_jsx_runtime.jsxs)("form", {
						className: SpeechPicker_module_css_default.fields,
						onSubmit: onSave(saveKeys),
						children: [
							showSeed ? (0, react_jsx_runtime.jsxs)("label", {
								className: SpeechPicker_module_css_default.fieldLabel,
								children: [t("speech.seedKey"), (0, react_jsx_runtime.jsx)("input", {
									className: SpeechPicker_module_css_default.select,
									type: "password",
									autoComplete: "off",
									value: seed,
									placeholder: t("speech.keyPlaceholder"),
									"aria-label": t("speech.seedKey"),
									disabled: busy,
									onChange: (event) => {
										setSeed(event.target.value);
									}
								})]
							}) : null,
							showDoubao ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("label", {
								className: SpeechPicker_module_css_default.fieldLabel,
								children: [t("speech.appId"), (0, react_jsx_runtime.jsx)("input", {
									className: SpeechPicker_module_css_default.select,
									type: "password",
									autoComplete: "off",
									value: appId,
									placeholder: t("speech.keyPlaceholder"),
									"aria-label": t("speech.appId"),
									disabled: busy,
									onChange: (event) => {
										setAppId(event.target.value);
									}
								})]
							}), (0, react_jsx_runtime.jsxs)("label", {
								className: SpeechPicker_module_css_default.fieldLabel,
								children: [t("speech.token"), (0, react_jsx_runtime.jsx)("input", {
									className: SpeechPicker_module_css_default.select,
									type: "password",
									autoComplete: "off",
									value: token,
									placeholder: t("speech.keyPlaceholder"),
									"aria-label": t("speech.token"),
									disabled: busy,
									onChange: (event) => {
										setToken(event.target.value);
									}
								})]
							})] }) : null,
							(0, react_jsx_runtime.jsx)("button", {
								className: SpeechPicker_module_css_default.primary,
								type: "submit",
								disabled: busy,
								children: t("speech.save")
							})
						]
					}) : null
				]
			});
		}
		//#endregion
		//#region lib/types/client/speech-gen-store.js
		/**
		* Speech-generation dropdown store: a mirror of `draco-speech-gen.provider`
		* plus whether the Volcengine credentials are configured.
		*/
		/**
		* Declares the speech-generation dropdown state.
		* @returns the store handle.
		*/
		function createSpeechGenPickerStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					ready: false,
					value: "none",
					seedConfigured: false,
					doubaoConfigured: false
				}),
				actions: { sync: (draft, next) => {
					draft.ready = next.ready;
					draft.value = next.value;
					draft.seedConfigured = next.seedConfigured;
					draft.doubaoConfigured = next.doubaoConfigured;
				} }
			});
		}
		//#endregion
		//#region lib/types/client/speech-gen-picker.js
		function credentialsOf(ctx) {
			const getter = ctx.get;
			if (typeof getter !== "function") return void 0;
			return getter.call(ctx, "connection")?.api?.credentials;
		}
		function snapshotOf(scope, seat) {
			const snap = scope.getSnapshot();
			return {
				ready: snap.status === "ready",
				value: speechValueOf(snap.value),
				seedConfigured: seat.seedConfigured,
				doubaoConfigured: seat.doubaoConfigured
			};
		}
		/**
		* Mount the speech-generation card on Settings → Draco-suite.
		* @param ctx - client root context (settings scope + Draco-suite item slot).
		* @returns disposer that withdraws the seat.
		*/
		function installSpeechGenPicker(ctx) {
			const scope = ctx.settingsScope.bind({ namespace: SPEECH_GEN_NS });
			const seat = {
				seedConfigured: false,
				doubaoConfigured: false
			};
			const credentials = credentialsOf(ctx);
			const push = () => {
				seat.bound?.sync(snapshotOf(scope, seat));
			};
			const unsub = scope.subscribe(() => {
				push();
			});
			const refreshKeys = async () => {
				if (credentials === void 0) return;
				try {
					const response = await credentials.describe({ refs: [
						SPEECH_SEED_KEY_REF,
						SPEECH_DOUBAO_APP_REF,
						SPEECH_DOUBAO_TOKEN_REF
					] });
					if (!response.result.ok) return;
					const bag = response.result.value.credentials;
					seat.seedConfigured = bag[SPEECH_SEED_KEY_REF]?.configured === true;
					seat.doubaoConfigured = bag["VOLCENGINE_TTS_APP_ID"]?.configured === true && bag["VOLCENGINE_TTS_ACCESS_TOKEN"]?.configured === true;
					push();
				} catch {}
			};
			const write = (value) => {
				for (const [field, next] of speechWritesOf(value)) scope.set(field, next);
			};
			const saveKeys = credentials === void 0 ? void 0 : async (keys) => {
				if (keys.seed !== void 0) await credentials.set({
					ref: SPEECH_SEED_KEY_REF,
					value: keys.seed
				});
				if (keys.appId !== void 0) await credentials.set({
					ref: SPEECH_DOUBAO_APP_REF,
					value: keys.appId
				});
				if (keys.token !== void 0) await credentials.set({
					ref: SPEECH_DOUBAO_TOKEN_REF,
					value: keys.token
				});
				await refreshKeys();
			};
			const store = createSpeechGenPickerStore();
			const injected = ctx.slots.inject(DRACO_ITEM_SLOT, () => ctx.slots.register({
				name: DRACO_ITEM_SLOT,
				id: SPEECH_GEN_SEAT_ID,
				order: 27,
				locale: NS,
				store,
				inject: (actions) => {
					seat.bound = actions;
					push();
					refreshKeys();
					return {
						setValue: write,
						...saveKeys === void 0 ? {} : { saveKeys }
					};
				}
			}, SpeechGenPickerCard));
			push();
			refreshKeys();
			return () => {
				unsub();
				injected();
			};
		}
		//#endregion
		//#region lib/types/client/index.js
		/** Services required by the browser half. */
		const inject = [
			"slots",
			"locale",
			"connection",
			"settingsScope"
		];
		/**
		* Client plugin body: dictionaries, Draco-suite section, speech card.
		* @param ctx - client root context.
		* @returns disposer unwinding the seat and dictionaries.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "draco-speech-gen-ui: dictionaries");
			const suite = installDracoSuite(ctx, "speech");
			const picker = installSpeechGenPicker(ctx);
			return () => {
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