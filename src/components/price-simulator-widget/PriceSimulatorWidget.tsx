import { useEffect, useRef } from "react";

function PriceSimulatorWidget() {
    const containerRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current || !containerRef.current) return;
        initialized.current = true;

        const root = containerRef.current;

        const CONFIG = {
            enableAdminControls: true,
            persistOffers: false,
            persistKey: "future_price_sim_offers_v1",
            maxOffers: 10,
        };

        const MEETING_SEGMENTS = [
            { key: "no_meet", label: "ללא פגישות", min: 94, max: 168 },
            { key: "year", label: "פגישה שנתית", min: 168, max: 321 },
            { key: "half", label: "פגישה חצי שנתית", min: 322, max: 563 },
            { key: "qtr", label: "פגישה רבעונית", min: 564, max: 792 },
            { key: "month", label: "פגישה חודשית", min: 793, max: 1652 },
        ];

        const COMPLEXITY = [
            { label: "תיק בסיסי", at: 0.125 },
            { label: "תיק רגיל", at: 0.375 },
            { label: "תיק מורכב", at: 0.625 },
            { label: "תיק מורכב מאוד", at: 0.875 },
        ];

        interface Offer {
            id: string;
            rawMeeting: string;
            complexity: string;
            min: number;
            max: number;
            price: number;
            recommended: boolean;
        }

        const state = {
            meetingPos: 0.12,
            complexityPos: 0.55,
            offers: [] as Offer[],
            selectedOfferId: null as string | null,
        };

        function clamp(n: number, a: number, b: number) {
            const x = Number(n);
            if (!Number.isFinite(x)) return a;
            return Math.min(Math.max(x, a), b);
        }

        function fmtILS(n: number) {
            const v = Number.isFinite(n) ? n : 0;
            try {
                return new Intl.NumberFormat("he-IL", {
                    style: "currency",
                    currency: "ILS",
                    maximumFractionDigits: 0,
                }).format(v);
            } catch {
                return "₪" + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
        }

        function meetingIdxFromPos(pos: number) {
            const p = clamp(pos, 0, 1);
            const n = MEETING_SEGMENTS.length;
            return clamp(Math.floor(p * n), 0, n - 1);
        }

        function nearestComplexIdx(pos: number) {
            const p = clamp(pos, 0, 1);
            let best = 0,
                bestD = 1e9;
            for (let i = 0; i < COMPLEXITY.length; i++) {
                const d = Math.abs(p - COMPLEXITY[i].at);
                if (d < bestD) {
                    bestD = d;
                    best = i;
                }
            }
            return best;
        }

        function calcPrice() {
            const mIdx = meetingIdxFromPos(state.meetingPos);
            const seg = MEETING_SEGMENTS[mIdx];
            const t = clamp(state.complexityPos, 0, 1);
            return Math.round(seg.min + (seg.max - seg.min) * t);
        }

        function setRailProgress(elRail: HTMLElement | null, pos01: number) {
            const p = clamp(pos01, 0, 1);
            if (elRail) elRail.style.setProperty("--progress", String(p));
        }

        function uid() {
            return "of_" + Math.random().toString(36).slice(2) + "_" + Date.now().toString(36);
        }

        function meetingText(label: string) {
            if (label === "ללא פגישות") return "ללא פגישות";
            return "עם " + label;
        }

        function serviceLine(meetingLabel: string, complexityLabel: string) {
            return "לתיק " + (complexityLabel || "") + " " + meetingText(meetingLabel || "");
        }

        function offerFromCurrent(): Offer {
            const mIdx = meetingIdxFromPos(state.meetingPos);
            const cIdx = nearestComplexIdx(state.complexityPos);
            const seg = MEETING_SEGMENTS[mIdx];
            return {
                id: uid(),
                rawMeeting: seg.label,
                complexity: COMPLEXITY[cIdx].label,
                min: seg.min,
                max: seg.max,
                price: calcPrice(),
                recommended: false,
            };
        }

        function saveOffers() {
            if (!CONFIG.persistOffers) return;
            try {
                localStorage.setItem(
                    CONFIG.persistKey,
                    JSON.stringify({
                        offers: state.offers,
                        selectedOfferId: state.selectedOfferId,
                    })
                );
            } catch {
                // ignore
            }
        }

        function addOffer() {
            if (state.offers.length >= CONFIG.maxOffers) return;
            const o = offerFromCurrent();
            const existingIdx = state.offers.findIndex((x) => x.rawMeeting === o.rawMeeting);
            if (existingIdx >= 0) {
                const keepRec = !!state.offers[existingIdx].recommended;
                state.offers[existingIdx] = {
                    ...o,
                    id: state.offers[existingIdx].id,
                    recommended: keepRec,
                };
                if (!state.selectedOfferId) state.selectedOfferId = state.offers[existingIdx].id;
            } else {
                state.offers.push(o);
                if (!state.selectedOfferId) state.selectedOfferId = o.id;
            }
            saveOffers();
            renderOffers();
        }

        function toggleRecommended(id: string) {
            const idx = state.offers.findIndex((o) => o.id === id);
            if (idx < 0) return;
            state.offers[idx].recommended = !state.offers[idx].recommended;
            saveOffers();
            renderOffers();
        }

        function removeOffer(id: string) {
            const idx = state.offers.findIndex((o) => o.id === id);
            if (idx < 0) return;
            state.offers.splice(idx, 1);
            if (state.selectedOfferId === id) {
                state.selectedOfferId = state.offers[0] ? state.offers[0].id : null;
            }
            saveOffers();
            renderOffers();
        }

        function selectOffer(id: string) {
            if (!state.offers.some((o) => o.id === id)) return;
            state.selectedOfferId = id;
            saveOffers();
            renderOffers();
        }

        function iconTrash() {
            return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 9v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v8M14 11v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
        }

        function iconCheck() {
            return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        }

        function build() {
            root.innerHTML = `
                <div class="psStack">
                    <div class="psCard">
                        <div class="psSegTop">
                            <div class="psSegLabel">סוג הליווי</div>
                            <div class="psSegValue" id="psMeetingValue"></div>
                        </div>
                        <div class="psRail" id="psMeetingRail">
                            <div class="psTrack"></div>
                            <div class="psFill"></div>
                            <div class="psKnob"></div>
                            <input class="psRailInput" id="psMeeting" type="range" min="0" max="1000" step="1" value="120" aria-label="סוג הליווי"/>
                        </div>
                        <div class="psChipsRow" id="psMeetingChips">
                            ${MEETING_SEGMENTS.map(
                                (c, i) =>
                                    `<button class="psChip" type="button" data-action="setMeeting" data-idx="${i}">${c.label}</button>`
                            ).join("")}
                        </div>
                    </div>
                    <div class="psCard">
                        <div class="psSegTop">
                            <div class="psSegLabel">מורכבות התיק</div>
                            <div class="psSegValue" id="psComplexValue"></div>
                        </div>
                        <div class="psRail" id="psComplexRail">
                            <div class="psTrack"></div>
                            <div class="psFill"></div>
                            <div class="psKnob"></div>
                            <input class="psRailInput" id="psComplex" type="range" min="0" max="1000" step="1" value="550" aria-label="מורכבות התיק"/>
                        </div>
                        <div class="psChipsRow" id="psComplexChips">
                            ${COMPLEXITY.map(
                                (c, i) =>
                                    `<button class="psChip" type="button" data-action="setComplex" data-idx="${i}">${c.label}</button>`
                            ).join("")}
                        </div>
                    </div>
                    <div class="psSummaryGrid">
                        <div class="psSummaryCard">
                            <div class="psSummaryHeader">
                                <h3 class="psHeaderTitle">העלות החודשית</h3>
                                <div class="psHeaderMeta">כולל מעמ</div>
                            </div>
                            <div class="psSummaryRow">
                                <div class="psPriceAmount" id="psPrice"></div>
                                <button class="psAddGhost" type="button" data-action="addOffer">הוספה להצעה +</button>
                            </div>
                        </div>
                    </div>
                    <div class="psOffersWrap">
                        <div class="psOffersTitle">ההצעה לליווי המתמשך</div>
                        <div class="psOffersGrid" id="psOffersGrid"></div>
                    </div>
                </div>
            `;
        }

        function syncUI() {
            const meetingRail = root.querySelector("#psMeetingRail") as HTMLElement;
            const complexRail = root.querySelector("#psComplexRail") as HTMLElement;
            setRailProgress(meetingRail, state.meetingPos);
            setRailProgress(complexRail, state.complexityPos);

            const meetingInput = root.querySelector("#psMeeting") as HTMLInputElement;
            const complexInput = root.querySelector("#psComplex") as HTMLInputElement;
            if (meetingInput) meetingInput.value = String(Math.round(clamp(state.meetingPos, 0, 1) * 1000));
            if (complexInput) complexInput.value = String(Math.round(clamp(state.complexityPos, 0, 1) * 1000));

            const mIdx = meetingIdxFromPos(state.meetingPos);
            const cIdx = nearestComplexIdx(state.complexityPos);

            const meetingValue = root.querySelector("#psMeetingValue");
            if (meetingValue) meetingValue.textContent = MEETING_SEGMENTS[mIdx].label;

            const complexValue = root.querySelector("#psComplexValue");
            if (complexValue) complexValue.textContent = COMPLEXITY[cIdx].label;

            const meetWrap = root.querySelector("#psMeetingChips");
            if (meetWrap) {
                meetWrap.querySelectorAll(".psChip").forEach((btn) => {
                    const idx = Number(btn.getAttribute("data-idx"));
                    btn.classList.toggle("active", idx === mIdx);
                });
            }

            const compWrap = root.querySelector("#psComplexChips");
            if (compWrap) {
                compWrap.querySelectorAll(".psChip").forEach((btn) => {
                    const idx = Number(btn.getAttribute("data-idx"));
                    btn.classList.toggle("active", idx === cIdx);
                });
            }

            const priceEl = root.querySelector("#psPrice");
            if (priceEl) priceEl.textContent = fmtILS(calcPrice());
        }

        function renderOffers() {
            const grid = root.querySelector("#psOffersGrid");
            if (!grid) return;
            if (!state.offers.length) {
                grid.innerHTML = `<div class="psEmptyHint">לחץ על כפתור ההוספה כדי ליצור אפשרויות לבחירה.</div>`;
                return;
            }
            grid.innerHTML = state.offers
                .map((o) => {
                    const selected = state.selectedOfferId === o.id;
                    const selClass = selected ? "selected" : "";
                    const recClass = o.recommended ? "recommended" : "";
                    const sub = serviceLine(o.rawMeeting, o.complexity);
                    const actions = CONFIG.enableAdminControls
                        ? `<div class="psOfferActions">
                            <button class="psIconBtn ok" type="button" data-action="toggleRec" data-id="${o.id}" aria-label="המלצה">${iconCheck()}</button>
                            <button class="psIconBtn danger" type="button" data-action="removeOffer" data-id="${o.id}" aria-label="מחיקה">${iconTrash()}</button>
                        </div>`
                        : `<div></div>`;
                    return `
                        <div class="psOfferRow ${selClass} ${recClass}" data-action="selectOffer" data-id="${o.id}">
                            <div class="psOfferMainCol"><div class="psOfferMain">ליווי מתמשך</div></div>
                            <div class="psOfferSubWrap">
                                <div class="psOfferSubCol">${sub}</div>
                                <span class="psRecInline">ההמלצה שלי</span>
                            </div>
                            <div class="psOfferPriceCol">בעלות של <span class="psMoney">${fmtILS(o.price)}</span> בחודש</div>
                            ${actions}
                        </div>`;
                })
                .join("");
        }

        function setMeetingByIdx(idx: number) {
            const i = clamp(idx, 0, MEETING_SEGMENTS.length - 1);
            const n = MEETING_SEGMENTS.length;
            state.meetingPos = clamp((i + 0.5) / n, 0.01, 0.99);
            syncUI();
        }

        function setComplexByIdx(idx: number) {
            const i = clamp(idx, 0, COMPLEXITY.length - 1);
            state.complexityPos = clamp(COMPLEXITY[i].at, 0, 1);
            syncUI();
        }

        root.addEventListener("input", (e) => {
            const t = e.target;
            if (!(t instanceof HTMLInputElement)) return;
            if (t.id === "psMeeting") {
                state.meetingPos = clamp(Number(t.value) / 1000, 0.01, 0.99);
                syncUI();
                return;
            }
            if (t.id === "psComplex") {
                state.complexityPos = clamp(Number(t.value) / 1000, 0, 1);
                syncUI();
                return;
            }
        });

        root.addEventListener("click", (e) => {
            const t = e.target;
            if (!(t instanceof Element)) return;
            const add = t.closest('[data-action="addOffer"]');
            if (add) {
                addOffer();
                return;
            }
            const m = t.closest('[data-action="setMeeting"]');
            if (m) {
                const idx = Number(m.getAttribute("data-idx"));
                if (Number.isInteger(idx)) setMeetingByIdx(idx);
                return;
            }
            const c = t.closest('[data-action="setComplex"]');
            if (c) {
                const idx = Number(c.getAttribute("data-idx"));
                if (Number.isInteger(idx)) setComplexByIdx(idx);
                return;
            }
            const rec = t.closest('[data-action="toggleRec"]');
            if (rec) {
                const id = rec.getAttribute("data-id");
                if (id) toggleRecommended(String(id));
                return;
            }
            const rm = t.closest('[data-action="removeOffer"]');
            if (rm) {
                const id = rm.getAttribute("data-id");
                if (id) removeOffer(String(id));
                return;
            }
            const sel = t.closest('[data-action="selectOffer"]');
            if (sel) {
                const id = sel.getAttribute("data-id");
                if (id) selectOffer(String(id));
                return;
            }
        });

        build();
        syncUI();
        renderOffers();
    }, []);

    return <div id="futurePriceSimulatorWidget" dir="rtl" ref={containerRef}></div>;
}

export default PriceSimulatorWidget;
