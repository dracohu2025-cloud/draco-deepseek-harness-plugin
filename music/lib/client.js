window.__ModuleLoader__.load({
	id: "draco-music-gen",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region \0dsh-css:/Users/dracohu/REPO/deepseek-harness/packages/draco/draco-music-gen-ui/src/client/DracoSuiteSection.module.css.mjs
		const css$2 = ".Bhyigq_section{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}.Bhyigq_title{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px}.Bhyigq_intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:14px;line-height:22px}.Bhyigq_cards{flex-direction:column;gap:8px;margin-top:4px;display:flex}";
		const tagId$2 = "draco-music-gen/DracoSuiteSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "draco-music-gen";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var DracoSuiteSection_module_css_default = {
			"section": "Bhyigq_section",
			"title": "Bhyigq_title",
			"intro": "Bhyigq_intro",
			"cards": "Bhyigq_cards"
		};
		//#endregion
		//#region lib/types/client/DracoSuiteSection.js
		/**
		* Settings page that hosts Draco login and media cards. Cards arrive through
		* `settings.draco.item`. SuperGrok / Codex / speech UI plugins share this
		* section id.
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
		/** `draco-music` namespace dictionaries. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"suite.nav": "Draco-suite",
			"suite.title": "Draco-suite",
			"suite.intro": "MiniMax Music 3。需要 API Key。",
			"music.title": "音乐生成",
			"music.hint": "对话模型选择器不管生曲。选 music-3.0，填 MINIMAX_API_KEY（中国大陆还认 MINIMAX_CN_API_KEY），保存并验证。账号需要 MiniMax Token Plan 或历史付费音乐权限。中国大陆 api.minimaxi.com，全球 api.minimax.io。",
			"music.off": "关闭",
			"music.paid": "music-3.0",
			"music.region": "MiniMax 区域",
			"music.regionCn": "中国大陆 (api.minimaxi.com)",
			"music.regionGlobal": "全球 (api.minimax.io)",
			"music.unavailable": "设置尚未就绪",
			"music.apiKey": "MINIMAX_API_KEY",
			"music.keyPlaceholder": "输入新值以替换已保存的密钥",
			"music.save": "保存并验证",
			"music.replace": "更换密钥",
			"music.checking": "正在向 MiniMax 验证密钥（Music 3 生成较慢，通常需要一两分钟）…",
			"music.verifyHint": "已保存密钥的话，点「保存并验证」才会探测。输入框不回显已存值。",
			"music.ready": "Music 3 已就绪",
			"music.missing": "需要 MINIMAX_API_KEY",
			"music.failPrefix": "验证失败：",
			"music.closed": "该 MiniMax 账号没有托管音乐权限。music-3.0 需要 Token Plan 或历史付费；普通 API Key 不够。",
			"row.title": "音乐生成",
			"row.loading": "音频加载中…",
			"row.loadFailed": "音频加载失败，点击重试"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"suite.nav": "Draco-suite",
			"suite.title": "Draco-suite",
			"suite.intro": "MiniMax Music 3. This uses an API key.",
			"music.title": "Music generation",
			"music.hint": "The chat model selector does not control music. Pick music-3.0, save MINIMAX_API_KEY (China also MINIMAX_CN_API_KEY), and verify. The MiniMax account needs a Token Plan or prior paid music. China uses api.minimaxi.com; global uses api.minimax.io.",
			"music.off": "Off",
			"music.paid": "music-3.0",
			"music.region": "MiniMax region",
			"music.regionCn": "China (api.minimaxi.com)",
			"music.regionGlobal": "Global (api.minimax.io)",
			"music.unavailable": "Settings are not ready yet",
			"music.apiKey": "MINIMAX_API_KEY",
			"music.keyPlaceholder": "Enter a new value to replace the stored key",
			"music.save": "Save and verify",
			"music.replace": "Replace keys",
			"music.checking": "Checking the key against MiniMax. Music 3 is slow; this often takes one or two minutes…",
			"music.verifyHint": "A stored key is not shown. Click Save and verify to probe.",
			"music.ready": "Music 3 ready",
			"music.missing": "MINIMAX_API_KEY is required",
			"music.failPrefix": "Check failed: ",
			"music.closed": "This MiniMax account has no hosted music access. music-3.0 needs a Token Plan or prior paid music; a regular API key is not enough.",
			"row.title": "Music",
			"row.loading": "Loading audio…",
			"row.loadFailed": "Audio failed to load; click to retry"
		};
		/** The namespace key used for locale registration and seat props. */
		const NS = "draco-music";
		//#endregion
		//#region lib/types/client/draco-suite.js
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
		//#region lib/types/client/music-gen-value.js
		/**
		* `draco-music-gen.provider` picker values.
		*/
		/** Host settings section owned by `draco-music-gen`. */
		const MUSIC_GEN_NS = "draco-music-gen";
		/**
		* Slot id for the dedicated music card. SuperGrok, Codex, and speech must not
		* register this id; see
		* `.agents/notes/implemented/architecture/2026-08-19-draco-independent-plugin-identities.md`.
		*/
		const MUSIC_GEN_SEAT_ID = "draco-music-card";
		/**
		* Normalize a Host probe field.
		* @param value - stored probe status, if any.
		* @returns `idle` when the field is absent or unknown.
		*/
		function musicProbeOf(value) {
			if (value === "checking" || value === "ok" || value === "fail") return value;
			return "idle";
		}
		/**
		* Map a Host section onto one music dropdown value.
		* @param section - last accepted `draco-music-gen` section, if any.
		* @returns `none` when music is off or the section is empty.
		*/
		function musicValueOf(section) {
			if (section === void 0) return "none";
			if (section.provider === "music-3.0") return section.provider;
			return "none";
		}
		/**
		* Map a Host section onto one MiniMax region.
		* @param section - last accepted `draco-music-gen` section, if any.
		* @returns `cn` when the section is empty or unknown.
		*/
		function musicRegionOf(section) {
			if (section?.region === "global") return "global";
			return "cn";
		}
		/**
		* Host writes for one music dropdown value. Switching backends clears the
		* last probe so the Host re-checks the selected model.
		* @param value - selected dropdown row.
		* @returns field writes in mutation order.
		*/
		function musicWritesOf(value) {
			return [
				["provider", value],
				["probe", "idle"],
				["probeError", ""]
			];
		}
		/**
		* Host writes for one MiniMax region. Switching hosts clears the last probe.
		* @param region - China mainland or global.
		* @returns field writes in mutation order.
		*/
		function musicRegionWritesOf(region) {
			return [
				["region", region],
				["probe", "idle"],
				["probeError", ""]
			];
		}
		/**
		* Dropdown rows.
		* @returns rows in display order, Off first.
		*/
		function musicOptions() {
			return ["none", "music-3.0"];
		}
		/** Primary MiniMax API key reference. */
		const MUSIC_API_KEY_REF = "MINIMAX_API_KEY";
		/** China-only MiniMax API key reference. */
		const MUSIC_CN_API_KEY_REF = "MINIMAX_CN_API_KEY";
		//#endregion
		//#region \0dsh-css:/Users/dracohu/REPO/deepseek-harness/packages/draco/draco-music-gen-ui/src/client/MusicPicker.module.css.mjs
		const css$1 = ".eQU_iq_card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;gap:10px;padding:12px 14px;display:flex}.eQU_iq_head{justify-content:space-between;align-items:center;gap:10px;display:flex}.eQU_iq_identity{align-items:center;gap:6px;min-width:0;display:inline-flex}.eQU_iq_name{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}.eQU_iq_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.eQU_iq_primary{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;align-self:flex-start;padding:4px 10px;font-size:13px;line-height:20px}.eQU_iq_primary:disabled{opacity:.6;cursor:default}.eQU_iq_selectRow{align-items:center;gap:8px;display:flex}.eQU_iq_selectWrap{flex:auto;min-width:0;max-width:420px;position:relative}.eQU_iq_selectWrap .eQU_iq_select{width:100%;max-width:none}.eQU_iq_selectReady{padding-right:44px}.eQU_iq_selectWrap .eQU_iq_dotReady{pointer-events:none;position:absolute;top:50%;right:28px;transform:translateY(-50%)}.eQU_iq_iconBtn{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);width:32px;height:32px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.eQU_iq_iconBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}.eQU_iq_error{color:var(--dsw-alias-state-error-primary);margin:0;font-size:12px;line-height:18px}.eQU_iq_dotReady{background:var(--dsw-alias-state-success-primary);border-radius:50%;flex:none;width:8px;height:8px}.eQU_iq_input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;max-width:420px;height:32px;font:inherit;color:var(--dsw-alias-label-primary);background-color:var(--dsw-alias-bg-base);border-radius:8px;padding:0 10px;font-size:13px;line-height:20px}.eQU_iq_input:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.eQU_iq_input:disabled{opacity:.6}.eQU_iq_select{appearance:none;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;max-width:420px;height:32px;font:inherit;color:var(--dsw-alias-label-primary);background-color:var(--dsw-alias-bg-base);cursor:pointer;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-position:right 10px center;background-repeat:no-repeat;background-size:12px 12px;border-radius:8px;padding:0 32px 0 10px;font-size:13px;line-height:20px}.eQU_iq_select:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.eQU_iq_select:disabled{opacity:.6;cursor:default}.eQU_iq_muted{color:var(--dsw-alias-label-secondary);font-size:12px}.eQU_iq_fields{flex-direction:column;gap:8px;display:flex}.eQU_iq_fieldLabel{flex-direction:column;gap:4px;margin:0;display:flex}";
		const tagId$1 = "draco-music-gen/MusicPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "draco-music-gen";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var MusicPicker_module_css_default = {
			"head": "eQU_iq_head",
			"selectWrap": "eQU_iq_selectWrap",
			"hint": "eQU_iq_hint",
			"input": "eQU_iq_input",
			"primary": "eQU_iq_primary",
			"name": "eQU_iq_name",
			"fieldLabel": "eQU_iq_fieldLabel",
			"muted": "eQU_iq_muted",
			"iconBtn": "eQU_iq_iconBtn",
			"dotReady": "eQU_iq_dotReady",
			"selectRow": "eQU_iq_selectRow",
			"identity": "eQU_iq_identity",
			"fields": "eQU_iq_fields",
			"card": "eQU_iq_card",
			"select": "eQU_iq_select",
			"selectReady": "eQU_iq_selectReady",
			"error": "eQU_iq_error"
		};
		//#endregion
		//#region lib/types/client/MusicGenPickerCard.js
		const LABELS = {
			none: "music.off",
			"music-3.0": "music.paid"
		};
		/**
		* One Settings → Draco-suite dropdown for MiniMax Music 3, plus region and
		* optional credential fields. Option labels are the wire model ids.
		*/
		function MusicGenPickerCard({ t, setValue, setRegion, saveKeys, useStore }) {
			const ready = useStore((s) => s.ready);
			const value = useStore((s) => s.value);
			const region = useStore((s) => s.region);
			const keyConfigured = useStore((s) => s.keyConfigured);
			const probe = useStore((s) => s.probe);
			const probeError = useStore((s) => s.probeError);
			const [apiKey, setApiKey] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [editing, setEditing] = (0, react.useState)(false);
			const [checkedThisVisit, setCheckedThisVisit] = (0, react.useState)(false);
			const active = value !== "none";
			const verified = active && probe === "ok";
			const checking = active && probe === "checking";
			const showFail = active && probe === "fail" && checkedThisVisit;
			const showForm = ready && saveKeys !== void 0 && active && !checking && (editing || !verified);
			(0, react.useEffect)(() => {
				if (verified) setEditing(false);
			}, [verified]);
			(0, react.useEffect)(() => {
				if (checking) setCheckedThisVisit(true);
			}, [checking]);
			const onSave = (persist) => (event) => {
				event.preventDefault();
				setBusy(true);
				persist({ ...apiKey.trim().length > 0 ? { apiKey: apiKey.trim() } : {} }).finally(() => {
					setApiKey("");
					setBusy(false);
				});
			};
			return (0, react_jsx_runtime.jsxs)("article", {
				className: MusicPicker_module_css_default.card,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: MusicPicker_module_css_default.head,
						children: (0, react_jsx_runtime.jsx)("div", {
							className: MusicPicker_module_css_default.identity,
							children: (0, react_jsx_runtime.jsx)("span", {
								className: MusicPicker_module_css_default.name,
								children: t("music.title")
							})
						})
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: MusicPicker_module_css_default.hint,
						children: t("music.hint")
					}),
					ready ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
						className: MusicPicker_module_css_default.selectRow,
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: MusicPicker_module_css_default.selectWrap,
							children: [(0, react_jsx_runtime.jsx)("select", {
								className: verified ? `${MusicPicker_module_css_default.select} ${MusicPicker_module_css_default.selectReady}` : MusicPicker_module_css_default.select,
								"aria-label": t("music.title"),
								value,
								disabled: checking,
								onChange: (event) => {
									setValue(event.target.value);
								},
								children: musicOptions().map((row) => (0, react_jsx_runtime.jsx)("option", {
									value: row,
									children: t(LABELS[row])
								}, row))
							}), verified ? (0, react_jsx_runtime.jsx)("span", {
								className: MusicPicker_module_css_default.dotReady,
								role: "img",
								"aria-label": t("music.ready"),
								title: t("music.ready")
							}) : null]
						}), verified && saveKeys !== void 0 && !editing ? (0, react_jsx_runtime.jsx)("button", {
							className: MusicPicker_module_css_default.iconBtn,
							type: "button",
							"aria-label": t("music.replace"),
							title: t("music.replace"),
							onClick: () => {
								setEditing(true);
							},
							children: (0, react_jsx_runtime.jsx)(KeyIcon, {})
						}) : null]
					}), (0, react_jsx_runtime.jsxs)("select", {
						className: MusicPicker_module_css_default.select,
						"aria-label": t("music.region"),
						value: region,
						disabled: checking,
						onChange: (event) => {
							setRegion(event.target.value);
						},
						children: [(0, react_jsx_runtime.jsx)("option", {
							value: "cn",
							children: t("music.regionCn")
						}), (0, react_jsx_runtime.jsx)("option", {
							value: "global",
							children: t("music.regionGlobal")
						})]
					})] }) : (0, react_jsx_runtime.jsx)("p", {
						className: MusicPicker_module_css_default.muted,
						children: t("music.unavailable")
					}),
					ready && active && !verified ? (0, react_jsx_runtime.jsx)(ProbeStatusLine, {
						t,
						probe: showFail ? "fail" : checking ? "checking" : "idle",
						error: probeError,
						configured: keyConfigured
					}) : null,
					showForm ? (0, react_jsx_runtime.jsxs)("form", {
						className: MusicPicker_module_css_default.fields,
						onSubmit: onSave(saveKeys),
						children: [(0, react_jsx_runtime.jsxs)("label", {
							className: MusicPicker_module_css_default.fieldLabel,
							children: [t("music.apiKey"), (0, react_jsx_runtime.jsx)("input", {
								className: MusicPicker_module_css_default.input,
								type: "password",
								autoComplete: "off",
								value: apiKey,
								placeholder: t("music.keyPlaceholder"),
								"aria-label": t("music.apiKey"),
								disabled: busy || checking,
								onChange: (event) => {
									setApiKey(event.target.value);
								}
							})]
						}), (0, react_jsx_runtime.jsx)("button", {
							className: MusicPicker_module_css_default.primary,
							type: "submit",
							disabled: busy || checking,
							children: t("music.save")
						})]
					}) : null
				]
			});
		}
		function ProbeStatusLine({ t, probe, error, configured }) {
			if (probe === "checking") return (0, react_jsx_runtime.jsx)("p", {
				className: MusicPicker_module_css_default.muted,
				children: t("music.checking")
			});
			if (probe === "fail") return (0, react_jsx_runtime.jsxs)("p", {
				className: MusicPicker_module_css_default.error,
				children: [t("music.failPrefix"), error.includes("MUSIC_API_CLOSED") ? t("music.closed") : error]
			});
			return (0, react_jsx_runtime.jsx)("p", {
				className: MusicPicker_module_css_default.muted,
				children: configured ? t("music.verifyHint") : t("music.missing")
			});
		}
		function KeyIcon() {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("circle", {
					cx: "5.5",
					cy: "5.5",
					r: "3.1",
					stroke: "currentColor",
					strokeWidth: "1.5"
				}), (0, react_jsx_runtime.jsx)("path", {
					d: "M8.2 7.1 14 12.9v1.6h-2.2v-1.5h-1.6v-1.5H8.7L8.2 11",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinejoin: "round"
				})]
			});
		}
		//#endregion
		//#region lib/types/client/music-gen-store.js
		/**
		* Music-generation dropdown store: a mirror of `draco-music-gen.provider`
		* plus whether a MiniMax key is configured.
		*/
		/**
		* Declares the music-generation dropdown state.
		* @returns the store handle.
		*/
		function createMusicGenPickerStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					ready: false,
					value: "none",
					region: "cn",
					keyConfigured: false,
					probe: "idle",
					probeError: ""
				}),
				actions: { sync: (draft, next) => {
					draft.ready = next.ready;
					draft.value = next.value;
					draft.region = next.region;
					draft.keyConfigured = next.keyConfigured;
					draft.probe = next.probe;
					draft.probeError = next.probeError;
				} }
			});
		}
		//#endregion
		//#region lib/types/client/music-gen-picker.js
		const HUB$1 = Symbol.for("dsh.draco-music-card.picker");
		function hub$1() {
			const global = globalThis;
			return global[HUB$1] ??= {};
		}
		function credentialsOf(ctx) {
			const getter = ctx.get;
			if (typeof getter !== "function") return void 0;
			return getter.call(ctx, "connection")?.api?.credentials;
		}
		function snapshotOf(scope, seat) {
			const snap = scope.getSnapshot();
			return {
				ready: snap.status === "ready",
				value: musicValueOf(snap.value),
				region: musicRegionOf(snap.value),
				keyConfigured: seat.keyConfigured,
				probe: musicProbeOf(snap.value?.probe),
				probeError: snap.value?.probeError ?? ""
			};
		}
		/**
		* Mount the music-generation card on Settings → Draco-suite.
		* @param ctx - client root context (settings scope + Draco-suite item slot).
		* @returns disposer that withdraws the seat.
		*/
		function installMusicGenPicker(ctx) {
			const h = hub$1();
			if (h.disposeSeat !== void 0) return () => {};
			const scope = ctx.settingsScope.bind({ namespace: MUSIC_GEN_NS });
			const seat = { keyConfigured: false };
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
					const response = await credentials.describe({ refs: [MUSIC_API_KEY_REF, MUSIC_CN_API_KEY_REF] });
					if (!response.result.ok) return;
					const bag = response.result.value.credentials;
					const region = musicRegionOf(scope.getSnapshot().value);
					seat.keyConfigured = bag["MINIMAX_API_KEY"]?.configured === true || region === "cn" && bag["MINIMAX_CN_API_KEY"]?.configured === true;
					push();
				} catch {}
			};
			const write = (value) => {
				for (const [field, next] of musicWritesOf(value)) scope.set(field, next);
			};
			const writeRegion = (region) => {
				for (const [field, next] of musicRegionWritesOf(region)) scope.set(field, next);
			};
			const saveKeys = credentials === void 0 ? void 0 : async (keys) => {
				if (keys.apiKey !== void 0) await credentials.set({
					ref: MUSIC_API_KEY_REF,
					value: keys.apiKey
				});
				await refreshKeys();
				if (musicValueOf(scope.getSnapshot().value) === "none") return;
				await scope.set("probeError", "");
				await scope.set("probe", "checking");
			};
			const store = createMusicGenPickerStore();
			const injected = ctx.slots.inject(DRACO_ITEM_SLOT, () => ctx.slots.register({
				name: DRACO_ITEM_SLOT,
				id: MUSIC_GEN_SEAT_ID,
				order: 28,
				locale: NS,
				store,
				inject: (actions) => {
					seat.bound = actions;
					push();
					refreshKeys();
					return {
						setValue: write,
						setRegion: writeRegion,
						...saveKeys === void 0 ? {} : { saveKeys }
					};
				}
			}, MusicGenPickerCard));
			h.disposeSeat = injected;
			push();
			refreshKeys();
			return () => {
				unsub();
				injected();
				delete h.disposeSeat;
				delete globalThis[HUB$1];
			};
		}
		//#endregion
		//#region lib/types/client/music-clip.js
		/**
		* Music tool-result clip carried in `output.presentationMeta`.
		* The bytes live on the settled call so the official Web shell can play
		* them without `saveAudio`.
		*/
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
				name: typeof record.name === "string" && record.name.length > 0 ? record.name : "audio.mp3",
				mediaType: record.mediaType,
				data: record.data
			};
		}
		/**
		* Build a browser object URL for one clip.
		* @param clip - persisted MP3.
		* @returns a `blob:` URL the caller must revoke.
		*/
		function blobUrlFromClip(clip) {
			const binary = atob(clip.data);
			const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
			return URL.createObjectURL(new Blob([bytes], { type: clip.mediaType }));
		}
		//#endregion
		//#region \0dsh-css:/Users/dracohu/REPO/deepseek-harness/packages/draco/draco-music-gen-ui/src/client/MusicGenerateRow.module.css.mjs
		const css = ".AXUVPW_root{flex-direction:column;gap:8px;min-width:0;display:flex}.AXUVPW_head{align-items:baseline;gap:8px;min-width:0;display:flex}.AXUVPW_title{color:var(--dsw-alias-label-primary);flex:none;font-size:13px;font-weight:500;line-height:20px}.AXUVPW_summary{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;overflow:hidden}.AXUVPW_player{flex-direction:column;align-items:flex-start;gap:6px;width:100%;max-width:360px;display:flex}.AXUVPW_audio{width:100%;display:block}.AXUVPW_download{color:var(--dsw-alias-label-secondary);text-underline-offset:2px;font-size:12px;line-height:18px;text-decoration:underline}.AXUVPW_loading,.AXUVPW_error{background:var(--dsw-alias-bg-subtle);min-height:40px;color:var(--dsw-alias-label-secondary);font:inherit;border:none;border-radius:8px;align-items:center;padding:0 12px;display:inline-flex}.AXUVPW_error{cursor:pointer;color:var(--dsw-alias-state-danger)}";
		const tagId = "draco-music-gen/MusicGenerateRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "draco-music-gen";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var MusicGenerateRow_module_css_default = {
			"head": "AXUVPW_head",
			"player": "AXUVPW_player",
			"summary": "AXUVPW_summary",
			"loading": "AXUVPW_loading",
			"error": "AXUVPW_error",
			"audio": "AXUVPW_audio",
			"root": "AXUVPW_root",
			"download": "AXUVPW_download",
			"title": "AXUVPW_title"
		};
		//#endregion
		//#region lib/types/client/MusicGenerateRow.js
		/**
		* `music_generate` toolview: plays the MP3 from presentation meta so the
		* official Web tool row does not need `saveAudio` / `AudioBlock`.
		*/
		function musicPreview(argsRaw) {
			try {
				const parsed = JSON.parse(argsRaw);
				if (typeof parsed === "object" && parsed !== null) {
					const prompt = parsed.prompt;
					if (typeof prompt === "string" && prompt.trim().length > 0) return prompt.trim();
				}
			} catch {}
			return argsRaw;
		}
		function MusicClipPlayer({ clip, t }) {
			const [src, setSrc] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(false);
			const [attempt, setAttempt] = (0, react.useState)(0);
			(0, react.useEffect)(() => {
				setError(false);
				setSrc(null);
				try {
					const url = blobUrlFromClip(clip);
					setSrc(url);
					return () => {
						URL.revokeObjectURL(url);
					};
				} catch {
					setError(true);
					return () => {};
				}
			}, [
				clip.data,
				clip.mediaType,
				clip.name,
				attempt
			]);
			if (error) return (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: MusicGenerateRow_module_css_default.error,
				onClick: () => {
					setAttempt((n) => n + 1);
				},
				children: t("row.loadFailed")
			});
			if (src === null) return (0, react_jsx_runtime.jsx)("span", {
				className: MusicGenerateRow_module_css_default.loading,
				children: t("row.loading")
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: MusicGenerateRow_module_css_default.player,
				children: [(0, react_jsx_runtime.jsx)("audio", {
					className: MusicGenerateRow_module_css_default.audio,
					src,
					controls: true,
					preload: "metadata",
					"aria-label": clip.name
				}), (0, react_jsx_runtime.jsx)("a", {
					className: MusicGenerateRow_module_css_default.download,
					href: src,
					download: clip.name,
					children: clip.name
				})]
			});
		}
		/** Compact music row: title, prompt preview, and an always-visible player. */
		function MusicGenerateRow({ block, t }) {
			const settled = "kind" in block;
			const preview = musicPreview((settled ? block.call?.argsRaw : block.argsRaw) ?? "");
			const clip = settled ? clipFromMeta(block.meta) : void 0;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: MusicGenerateRow_module_css_default.root,
				"data-state": settled ? block.isError ? "error" : "ok" : "running",
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: MusicGenerateRow_module_css_default.head,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: MusicGenerateRow_module_css_default.title,
						children: t("row.title")
					}), preview.length > 0 && (0, react_jsx_runtime.jsx)("span", {
						className: MusicGenerateRow_module_css_default.summary,
						children: preview
					})]
				}), clip !== void 0 && (0, react_jsx_runtime.jsx)(MusicClipPlayer, {
					clip,
					t
				})]
			});
		}
		//#endregion
		//#region lib/types/client/music-generate-toolview.js
		const HUB = Symbol.for("dsh.draco-music-card.toolview");
		function hub() {
			const global = globalThis;
			return global[HUB] ??= {};
		}
		/**
		* Mount the music toolview once per browser runtime.
		* @param ctx - client root context.
		* @returns disposer that withdraws the keyed row.
		*/
		function installMusicGenerateToolview(ctx) {
			const h = hub();
			if (h.dispose !== void 0) return () => {};
			const injected = ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
				name: "tool.call.toolview",
				key: "music_generate",
				locale: NS
			}, MusicGenerateRow));
			h.dispose = injected;
			return () => {
				injected();
				delete h.dispose;
				delete globalThis[HUB];
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
		* Client plugin body: dictionaries, Draco-suite section, music card.
		* @param ctx - client root context.
		* @returns disposer unwinding the seat and dictionaries.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "draco-music-gen-ui: dictionaries");
			const suite = installDracoSuite(ctx, "music");
			const picker = installMusicGenPicker(ctx);
			const toolview = installMusicGenerateToolview(ctx);
			return () => {
				toolview();
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