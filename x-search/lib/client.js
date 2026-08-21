window.__ModuleLoader__.load({
	id: "draco-x-search",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region \0dsh-css:/Users/dracohu/REPO/deepseek-harness/packages/draco/draco-x-search-ui/src/client/DracoSuiteSection.module.css.mjs
		const css$1 = ".GSLRma_section{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}.GSLRma_title{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px}.GSLRma_intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:14px;line-height:22px}.GSLRma_cards{flex-direction:column;gap:8px;margin-top:4px;display:flex}";
		const tagId$1 = "draco-x-search/DracoSuiteSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "draco-x-search";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var DracoSuiteSection_module_css_default = {
			"cards": "GSLRma_cards",
			"title": "GSLRma_title",
			"intro": "GSLRma_intro",
			"section": "GSLRma_section"
		};
		//#endregion
		//#region lib/types/client/DracoSuiteSection.js
		/**
		* Settings page that hosts Draco login and media cards. Cards arrive through
		* `settings.draco.item`.
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
		/** `draco-x-search` namespace dictionaries. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"suite.nav": "Draco-suite",
			"suite.title": "Draco-suite",
			"suite.intro": "Grok X Search。使用 SuperGrok 登录，或 XAI_API_KEY。",
			"xsearch.title": "X Search",
			"xsearch.hint": "在 X 上搜索帖子。使用已登录的 SuperGrok，或粘贴 XAI_API_KEY。关闭下拉仍显示 grok-x-search。不是网页搜索。",
			"xsearch.off": "关闭",
			"xsearch.grok": "grok-x-search",
			"xsearch.unavailable": "设置尚未就绪",
			"xsearch.apiKey": "XAI_API_KEY",
			"xsearch.keyPlaceholder": "留空则使用 SuperGrok 登录；输入新值以保存 API Key",
			"xsearch.save": "保存并验证",
			"xsearch.replace": "更换密钥",
			"xsearch.checking": "正在向 xAI 验证凭据…",
			"xsearch.ready": "X Search 已就绪",
			"xsearch.missing": "需要 SuperGrok 登录或 XAI_API_KEY",
			"xsearch.failPrefix": "验证失败："
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"suite.nav": "Draco-suite",
			"suite.title": "Draco-suite",
			"suite.intro": "Grok X Search. SuperGrok login, or XAI_API_KEY.",
			"xsearch.title": "X Search",
			"xsearch.hint": "Search posts on X. Uses a SuperGrok login, or paste XAI_API_KEY. The closed dropdown still shows grok-x-search. This is not web search.",
			"xsearch.off": "Off",
			"xsearch.grok": "grok-x-search",
			"xsearch.unavailable": "Settings are not ready yet",
			"xsearch.apiKey": "XAI_API_KEY",
			"xsearch.keyPlaceholder": "Leave empty to use SuperGrok login; enter a value to store an API key",
			"xsearch.save": "Save and verify",
			"xsearch.replace": "Replace keys",
			"xsearch.checking": "Checking credentials against xAI…",
			"xsearch.ready": "X Search ready",
			"xsearch.missing": "SuperGrok login or XAI_API_KEY is required",
			"xsearch.failPrefix": "Check failed: "
		};
		/** The namespace key used for locale registration and seat props. */
		const NS = "draco-x-search";
		//#endregion
		//#region lib/types/client/draco-suite.js
		const HUB$1 = Symbol.for("dsh.draco-suite.section");
		/** Settings nav / section id. */
		const DRACO_SUITE_SECTION_ID = "draco-suite";
		/** Card slot owned by the Draco-suite section. */
		const DRACO_ITEM_SLOT = "settings.draco.item";
		function hub$1() {
			const global = globalThis;
			return global[HUB$1] ??= { mounts: /* @__PURE__ */ new Map() };
		}
		/**
		* Mount the Draco-suite settings section if it is absent.
		* @param ctx - client root context.
		* @param owner - which UI plugin is applying.
		* @returns disposer that re-mounts from a leftover plugin when this one unloads.
		*/
		function installDracoSuite(ctx, owner) {
			const h = hub$1();
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
					delete global[HUB$1];
				}
			};
		}
		//#endregion
		//#region lib/types/client/x-search-value.js
		/**
		* `draco-x-search.provider` picker values.
		*/
		/** Host settings section owned by `draco-x-search`. */
		const X_SEARCH_NS = "draco-x-search";
		/**
		* Slot id for the dedicated X Search card. SuperGrok and Codex must not
		* register this id.
		*/
		const X_SEARCH_SEAT_ID = "draco-x-search-card";
		/** XAI API key reference. */
		const X_SEARCH_KEY_REF = "XAI_API_KEY";
		/**
		* Normalize a Host probe field.
		* @param value - stored probe status, if any.
		*/
		function xSearchProbeOf(value) {
			if (value === "checking" || value === "ok" || value === "fail") return value;
			return "idle";
		}
		/**
		* Map a Host section onto one dropdown value.
		* @param section - last accepted `draco-x-search` section, if any.
		*/
		function xSearchValueOf(section) {
			if (section === void 0) return "none";
			if (section.provider === "grok-x-search") return "grok-x-search";
			return "none";
		}
		/**
		* Host writes for one dropdown value.
		* @param value - selected dropdown row.
		*/
		function xSearchWritesOf(value) {
			return [["provider", value]];
		}
		/**
		* Dropdown rows.
		*/
		function xSearchOptions() {
			return ["none", "grok-x-search"];
		}
		//#endregion
		//#region \0dsh-css:/Users/dracohu/REPO/deepseek-harness/packages/draco/draco-x-search-ui/src/client/XSearchPicker.module.css.mjs
		const css = ".MZ62nW_card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;gap:10px;padding:12px 14px;display:flex}.MZ62nW_head{justify-content:space-between;align-items:center;gap:10px;display:flex}.MZ62nW_identity{align-items:center;gap:6px;min-width:0;display:inline-flex}.MZ62nW_name{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}.MZ62nW_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.MZ62nW_primary{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;align-self:flex-start;padding:4px 10px;font-size:13px;line-height:20px}.MZ62nW_primary:disabled{opacity:.6;cursor:default}.MZ62nW_selectRow{align-items:center;gap:8px;display:flex}.MZ62nW_selectWrap{flex:auto;min-width:0;max-width:420px;position:relative}.MZ62nW_selectWrap .MZ62nW_select{width:100%;max-width:none}.MZ62nW_selectReady{padding-right:44px}.MZ62nW_selectWrap .MZ62nW_dotReady{pointer-events:none;position:absolute;top:50%;right:28px;transform:translateY(-50%)}.MZ62nW_iconBtn{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);width:32px;height:32px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.MZ62nW_iconBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}.MZ62nW_error{color:var(--dsw-alias-state-error-primary);margin:0;font-size:12px;line-height:18px}.MZ62nW_dotReady{background:var(--dsw-alias-state-success-primary);border-radius:50%;flex:none;width:8px;height:8px}.MZ62nW_input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;max-width:420px;height:32px;font:inherit;color:var(--dsw-alias-label-primary);background-color:var(--dsw-alias-bg-base);border-radius:8px;padding:0 10px;font-size:13px;line-height:20px}.MZ62nW_input:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.MZ62nW_input:disabled{opacity:.6}.MZ62nW_select{appearance:none;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;max-width:420px;height:32px;font:inherit;color:var(--dsw-alias-label-primary);background-color:var(--dsw-alias-bg-base);cursor:pointer;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-position:right 10px center;background-repeat:no-repeat;background-size:12px 12px;border-radius:8px;padding:0 32px 0 10px;font-size:13px;line-height:20px}.MZ62nW_select:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.MZ62nW_select:disabled{opacity:.6;cursor:default}.MZ62nW_muted{color:var(--dsw-alias-label-secondary);font-size:12px}.MZ62nW_fields{flex-direction:column;gap:8px;display:flex}.MZ62nW_fieldLabel{flex-direction:column;gap:4px;margin:0;display:flex}";
		const tagId = "draco-x-search/XSearchPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "draco-x-search";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var XSearchPicker_module_css_default = {
			"dotReady": "MZ62nW_dotReady",
			"selectWrap": "MZ62nW_selectWrap",
			"hint": "MZ62nW_hint",
			"card": "MZ62nW_card",
			"muted": "MZ62nW_muted",
			"fieldLabel": "MZ62nW_fieldLabel",
			"name": "MZ62nW_name",
			"selectRow": "MZ62nW_selectRow",
			"input": "MZ62nW_input",
			"error": "MZ62nW_error",
			"selectReady": "MZ62nW_selectReady",
			"fields": "MZ62nW_fields",
			"head": "MZ62nW_head",
			"primary": "MZ62nW_primary",
			"select": "MZ62nW_select",
			"identity": "MZ62nW_identity",
			"iconBtn": "MZ62nW_iconBtn"
		};
		//#endregion
		//#region lib/types/client/XSearchPickerCard.js
		const LABELS = {
			none: "xsearch.off",
			"grok-x-search": "xsearch.grok"
		};
		/**
		* One Settings → Draco-suite dropdown for grok-x-search, plus an optional
		* XAI_API_KEY field. SuperGrok login is enough; the key is a fallback.
		*/
		function XSearchPickerCard({ t, setValue, saveKeys, useStore }) {
			const ready = useStore((s) => s.ready);
			const value = useStore((s) => s.value);
			const keyConfigured = useStore((s) => s.keyConfigured);
			const probe = useStore((s) => s.probe);
			const probeError = useStore((s) => s.probeError);
			const [xai, setXai] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [editing, setEditing] = (0, react.useState)(false);
			const showGrok = value === "grok-x-search";
			const verified = showGrok && probe === "ok";
			const checking = showGrok && probe === "checking";
			const showForm = ready && saveKeys !== void 0 && showGrok && !checking && (editing || !verified);
			(0, react.useEffect)(() => {
				if (verified) setEditing(false);
			}, [verified]);
			const onSave = (persist) => (event) => {
				event.preventDefault();
				setBusy(true);
				persist({ ...xai.trim().length > 0 ? { xai: xai.trim() } : {} }).finally(() => {
					setXai("");
					setBusy(false);
				});
			};
			return (0, react_jsx_runtime.jsxs)("article", {
				className: XSearchPicker_module_css_default.card,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: XSearchPicker_module_css_default.head,
						children: (0, react_jsx_runtime.jsx)("div", {
							className: XSearchPicker_module_css_default.identity,
							children: (0, react_jsx_runtime.jsx)("span", {
								className: XSearchPicker_module_css_default.name,
								children: t("xsearch.title")
							})
						})
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: XSearchPicker_module_css_default.hint,
						children: t("xsearch.hint")
					}),
					ready ? (0, react_jsx_runtime.jsxs)("div", {
						className: XSearchPicker_module_css_default.selectRow,
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: XSearchPicker_module_css_default.selectWrap,
							children: [(0, react_jsx_runtime.jsx)("select", {
								className: verified ? `${XSearchPicker_module_css_default.select} ${XSearchPicker_module_css_default.selectReady}` : XSearchPicker_module_css_default.select,
								"aria-label": t("xsearch.title"),
								value,
								disabled: checking,
								onChange: (event) => {
									setValue(event.target.value);
								},
								children: xSearchOptions().map((row) => (0, react_jsx_runtime.jsx)("option", {
									value: row,
									children: t(LABELS[row])
								}, row))
							}), verified ? (0, react_jsx_runtime.jsx)("span", {
								className: XSearchPicker_module_css_default.dotReady,
								role: "img",
								"aria-label": t("xsearch.ready"),
								title: t("xsearch.ready")
							}) : null]
						}), verified && saveKeys !== void 0 && !editing ? (0, react_jsx_runtime.jsx)("button", {
							className: XSearchPicker_module_css_default.iconBtn,
							type: "button",
							"aria-label": t("xsearch.replace"),
							title: t("xsearch.replace"),
							onClick: () => {
								setEditing(true);
							},
							children: (0, react_jsx_runtime.jsx)(KeyIcon, {})
						}) : null]
					}) : (0, react_jsx_runtime.jsx)("p", {
						className: XSearchPicker_module_css_default.muted,
						children: t("xsearch.unavailable")
					}),
					ready && showGrok ? (0, react_jsx_runtime.jsx)(ProbeStatusLine, {
						t,
						probe,
						error: probeError,
						configured: keyConfigured
					}) : null,
					showForm ? (0, react_jsx_runtime.jsxs)("form", {
						className: XSearchPicker_module_css_default.fields,
						onSubmit: onSave(saveKeys),
						children: [(0, react_jsx_runtime.jsxs)("label", {
							className: XSearchPicker_module_css_default.fieldLabel,
							children: [t("xsearch.apiKey"), (0, react_jsx_runtime.jsx)("input", {
								className: XSearchPicker_module_css_default.input,
								type: "password",
								autoComplete: "off",
								value: xai,
								placeholder: t("xsearch.keyPlaceholder"),
								"aria-label": t("xsearch.apiKey"),
								disabled: busy || checking,
								onChange: (event) => {
									setXai(event.target.value);
								}
							})]
						}), (0, react_jsx_runtime.jsx)("button", {
							className: XSearchPicker_module_css_default.primary,
							type: "submit",
							disabled: busy || checking,
							children: t("xsearch.save")
						})]
					}) : null
				]
			});
		}
		function ProbeStatusLine({ t, probe, error, configured }) {
			if (probe === "ok") return null;
			if (probe === "checking") return (0, react_jsx_runtime.jsx)("p", {
				className: XSearchPicker_module_css_default.muted,
				children: t("xsearch.checking")
			});
			if (probe === "fail") return (0, react_jsx_runtime.jsxs)("p", {
				className: XSearchPicker_module_css_default.error,
				children: [t("xsearch.failPrefix"), error]
			});
			return (0, react_jsx_runtime.jsx)("p", {
				className: XSearchPicker_module_css_default.muted,
				children: configured ? t("xsearch.checking") : t("xsearch.missing")
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
		//#region lib/types/client/x-search-store.js
		/**
		* X Search dropdown store: a mirror of `draco-x-search.provider` plus
		* whether `XAI_API_KEY` is configured.
		*/
		/**
		* Declares the X Search dropdown state.
		* @returns the store handle.
		*/
		function createXSearchPickerStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					ready: false,
					value: "none",
					keyConfigured: false,
					probe: "idle",
					probeError: ""
				}),
				actions: { sync: (draft, next) => {
					draft.ready = next.ready;
					draft.value = next.value;
					draft.keyConfigured = next.keyConfigured;
					draft.probe = next.probe;
					draft.probeError = next.probeError;
				} }
			});
		}
		//#endregion
		//#region lib/types/client/x-search-picker.js
		const HUB = Symbol.for("dsh.draco-x-search-card.picker");
		function hub() {
			const global = globalThis;
			return global[HUB] ??= {};
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
				value: xSearchValueOf(snap.value),
				keyConfigured: seat.keyConfigured,
				probe: xSearchProbeOf(snap.value?.xSearchProbe),
				probeError: snap.value?.xSearchProbeError ?? ""
			};
		}
		/**
		* Mount the X Search card on Settings → Draco-suite.
		* @param ctx - client root context (settings scope + Draco-suite item slot).
		* @returns disposer that withdraws the seat.
		*/
		function installXSearchPicker(ctx) {
			const h = hub();
			if (h.disposeSeat !== void 0) return () => {};
			const scope = ctx.settingsScope.bind({ namespace: X_SEARCH_NS });
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
					const response = await credentials.describe({ refs: [X_SEARCH_KEY_REF] });
					if (!response.result.ok) return;
					seat.keyConfigured = response.result.value.credentials[X_SEARCH_KEY_REF]?.configured === true;
					push();
				} catch {}
			};
			const write = (value) => {
				for (const [field, next] of xSearchWritesOf(value)) scope.set(field, next);
			};
			const saveKeys = credentials === void 0 ? void 0 : async (keys) => {
				if (keys.xai !== void 0) await credentials.set({
					ref: X_SEARCH_KEY_REF,
					value: keys.xai
				});
				await refreshKeys();
				await scope.set("xSearchProbeError", "");
				await scope.set("xSearchProbe", "checking");
			};
			const store = createXSearchPickerStore();
			const injected = ctx.slots.inject(DRACO_ITEM_SLOT, () => ctx.slots.register({
				name: DRACO_ITEM_SLOT,
				id: X_SEARCH_SEAT_ID,
				order: 28,
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
			}, XSearchPickerCard));
			h.disposeSeat = injected;
			push();
			refreshKeys();
			return () => {
				unsub();
				injected();
				delete h.disposeSeat;
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
		* Client plugin body: dictionaries, Draco-suite section, X Search card.
		* @param ctx - client root context.
		* @returns disposer unwinding the seat and dictionaries.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "draco-x-search-ui: dictionaries");
			const suite = installDracoSuite(ctx, "x-search");
			const picker = installXSearchPicker(ctx);
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