/*
===========================================================
BSLSK DIVISION-9 DATABASE
blackjack.js

Hidden minigame: "TWENTY-ONE" (BSLSK Leisure Systems).

Unlocked by typing DefinitlyOfficeWork while logged in. The
command is deliberately NOT in 'help' for regular accounts
(it only appears in the admin command list, like the other
puzzle commands). Its three pieces are leaked by Helios inside
the "Recovered Chatlog - Records Annex" entry in database.js.

HOW IT HOOKS INTO terminal.js:

  - execute() calls blackjackIntercept(text) first. It returns
    true if the game consumed the command, false if the
    terminal should handle it as normal.
  - logout() calls blackjackReset() so a session never leaks
    between accounts.
  - printNode() (terminal.js) lets this file drop DOM panels
    into the same print queue as typed lines, so ordering stays
    correct.

FLOW:

  IDLE    -> nothing happens, terminal behaves normally
  MENU    -> menu shown. ONLY 'start game' / 'commands' / 'quit'
             are caught; everything else still goes to the
             terminal, so the player can keep browsing
  PLAYER  -> hand in progress (hit / stand / quit)
  DEALER  -> dealer is drawing (input locked briefly)
  BETWEEN -> hand finished (newgame / bet <n> / quit)
  OVER    -> out of chips (newgame / quit)

SCORING (all of it lives in memory only - a page reload wipes
it, by design):

  SCORE      = total chips WON this run (losses don't subtract)
  HIGH SCORE = best SCORE of any run since the page loaded
  plus hands won / lost / pushed, blackjacks, busts, biggest win

TABLE RULES:

  - 6-deck shoe, reshuffled once ~25% remains
  - Dealer hits on 16 or less, stands on every 17 (soft too)
  - Dealer peeks for blackjack on an Ace or ten-value upcard
  - Blackjack pays 3:2 (rounded down), push returns the wager
  - Player automatically stands on 21
  - No split / double / insurance (kept simple on purpose)

TWEAKING: all the numbers worth changing are in the CONFIG
block right below.
===========================================================
*/

(function(){

"use strict";


/* ===========================================================
   CONFIG
   =========================================================== */

const OPEN_COMMAND   = "definitlyofficework";   // lowercase - input is lowercased before comparing

const STARTING_CHIPS = 50;
const DEFAULT_BET    = 5;

const DECKS          = 6;
const CUT_FRACTION   = 0.25;     // reshuffle when this much of the shoe is left
const DEALER_STANDS  = 17;       // dealer draws below this, stands at or above

const SCORE_BLACKJACK = 21;      // bonus points for a blackjack
const SCORE_LOSS      = 5;       // points lost on a lost hand

const DEALER_DELAY   = 850;      // ms between dealer actions


/* ===========================================================
   CARDS
   =========================================================== */

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

const CARD_W = 7;
const CARD_H = 5;


function rand(n){

    if(window.crypto && window.crypto.getRandomValues){

        const a = new Uint32Array(1);

        window.crypto.getRandomValues(a);

        return a[0] % n;

    }

    return Math.floor(Math.random() * n);

}


function buildShoe(){

    const cards = [];

    for(let d=0; d<DECKS; d++){

        SUITS.forEach(s=>{

            RANKS.forEach(r=>{

                cards.push({ r, s });

            });

        });

    }

    // Fisher-Yates
    for(let i=cards.length-1; i>0; i--){

        const j = rand(i+1);

        const tmp = cards[i];

        cards[i] = cards[j];

        cards[j] = tmp;

    }

    return cards;

}


function cardValue(card){

    if(card.r === "A") return 11;

    if(card.r === "10" || card.r === "J" || card.r === "Q" || card.r === "K") return 10;

    return parseInt(card.r, 10);

}


// Best total for a hand: aces count 11 unless that would bust.
function handInfo(cards){

    let sum = 0;
    let aces = 0;

    cards.forEach(c=>{

        if(c.r === "A"){ aces++; sum += 1; }

        else sum += cardValue(c);

    });

    let soft = false;

    if(aces > 0 && sum + 10 <= 21){

        sum += 10;

        soft = true;

    }

    return {

        total: sum,

        soft,

        bust: sum > 21,

        blackjack: cards.length === 2 && sum === 21

    };

}


/* ===========================================================
   STATE
   =========================================================== */

let state = "IDLE";       // IDLE | MENU | PLAYER | DEALER | BETWEEN | OVER
let busy  = false;        // true while an animation/dealer turn is running
let epoch = 0;            // bumped on reset so stale async flows bail out

let shoe = [];

let run  = null;          // current run (chips, score, stats...)
let hand = null;          // current hand (cards, result...)

// Session-wide best. Lives only in memory -> resets on page reload.
let best = { score:0, won:0, lost:0, blackjacks:0, hands:0 };

let liveActions = null;   // the one actions row that's currently clickable
let currentRefs = null;   // refs of the most recent table panel


function newRun(){

    return {

        chips: STARTING_CHIPS,
        bet: DEFAULT_BET,

        score: 0,

        hands: 0,
        won: 0,
        lost: 0,
        pushed: 0,
        blackjacks: 0,
        busts: 0,
        dealerBusts: 0,
        biggestWin: 0,
        chipsWon: 0,
        cards: 0,

        recorded: false,
        newRecord: false

    };

}


// Returns true if this run set a new session high score.
function recordRun(){

    if(!run || run.recorded) return false;

    run.recorded = true;

    if(run.score > best.score){

        run.newRecord = true;

        best = {

            score: run.score,
            won: run.won,
            lost: run.lost,
            blackjacks: run.blackjacks,
            hands: run.hands

        };

        return true;

    }

    return false;

}


function highScore(){

    return Math.max(best.score, run ? run.score : 0);

}


/* ===========================================================
   SMALL HELPERS
   =========================================================== */

function html(str){

    const t = document.createElement("template");

    t.innerHTML = str.trim();

    return t.content.firstElementChild;

}


function refsOf(root){

    const refs = { root };

    root.querySelectorAll("[data-r]").forEach(el=>{

        refs[el.dataset.r] = el;

    });

    return refs;

}


function pad2(n){

    return String(n).padStart(2, "0");

}


function fmtDelta(n){

    if(n > 0) return "+" + n;

    if(n < 0) return "−" + Math.abs(n);

    return "±0";

}


function scrollFeed(){

    feed.scrollTop = feed.scrollHeight;

}


function sfx(name){

    if(typeof playSound === "function") playSound(name);

}


function say(text, type){

    return printLine(text, type || "system");

}


function warn(text){

    sfx("error");

    return printLine(text, "warning");

}


// Marks the previous clickable row as spent and registers a new
// one, so old panels in the scrollback can't be clicked.
function registerActions(el){

    if(liveActions && liveActions !== el){

        liveActions.classList.add("spent");

    }

    liveActions = el;

}


/* ===========================================================
   ASCII CARD RENDERING

   Cards are drawn into a character grid, then converted to
   HTML. Suit glyphs get a fixed 1ch-wide box so a fallback font
   with different glyph widths can't knock the columns out of
   alignment.

   Mobile: measureCols() works out how many monospace columns
   actually fit in the panel. If a hand is too wide, the cards
   overlap like a fanned hand (each earlier card shows just its
   left edge + rank) instead of wrapping or overflowing.
   =========================================================== */

function makeGrid(w, h){

    const g = [];

    for(let y=0; y<h; y++){

        const row = [];

        for(let x=0; x<w; x++){

            row.push({ c:" ", k:"", s:false });

        }

        g.push(row);

    }

    return g;

}


function put(g, x, y, str, k, isSuit){

    for(let i=0; i<str.length; i++){

        if(g[y] && g[y][x+i]){

            g[y][x+i] = { c:str[i], k:(k || ""), s:!!isSuit };

        }

    }

}


function drawCard(g, x, card, faceDown){

    put(g, x, 0, "┌─────┐");

    put(g, x, 4, "└─────┘");

    if(faceDown){

        put(g, x, 1, "│▒░▒░▒│", "d");

        put(g, x, 2, "│░▒░▒░│", "d");

        put(g, x, 3, "│▒░▒░▒│", "d");

        return;

    }

    const red = (card.s === "♥" || card.s === "♦");

    const k = red ? "r" : "";

    put(g, x, 1, "│     │");
    put(g, x, 2, "│     │");
    put(g, x, 3, "│     │");

    put(g, x + 1, 1, card.r, k);

    put(g, x + 3, 2, card.s, k, true);

    put(g, x + 6 - card.r.length, 3, card.r, k);

}


function buildGrid(cards, hideIndex, cols){

    const n = cards.length;

    const fullWidth = n * CARD_W + (n - 1);

    let step = CARD_W + 1;

    if(n > 1 && fullWidth > cols){

        step = Math.max(3, Math.floor((cols - CARD_W) / (n - 1)));

        step = Math.min(step, CARD_W + 1);

    }

    const width = (n - 1) * step + CARD_W;

    const g = makeGrid(width, CARD_H);

    cards.forEach((card, i)=>{

        drawCard(g, i * step, card, i === hideIndex);

    });

    return g;

}


function gridToHTML(g){

    return g.map(row=>{

        let out = "";
        let runK = null;
        let buf = "";

        const flush = ()=>{

            if(buf){

                out += runK ? `<span class="bj-${runK}">${buf}</span>` : buf;

                buf = "";

            }

        };

        row.forEach(cell=>{

            if(cell.s){

                flush();

                runK = null;

                out += `<span class="bj-s${cell.k ? " bj-" + cell.k : ""}">${cell.c}</span>`;

                return;

            }

            if(cell.k !== runK){

                flush();

                runK = cell.k;

            }

            buf += cell.c;

        });

        flush();

        return out;

    }).join("\n");

}


// How many monospace columns fit in this wrapper right now.
function measureCols(wrapper){

    const probe = document.createElement("span");

    probe.className = "bj-pre bj-probe";

    probe.textContent = "MMMMMMMMMMMMMMMMMMMM";

    wrapper.appendChild(probe);

    const cw = probe.getBoundingClientRect().width / 20;

    wrapper.removeChild(probe);

    const w = wrapper.clientWidth;

    if(!cw || !w) return 40;

    return Math.max(CARD_W, Math.floor(w / cw) - 1);

}


/* ===========================================================
   HUD (chips / bet / score / high score)

   A slim status bar between the output and the input that
   stays visible for the whole run, so chips and score are
   always on screen no matter how far the table has scrolled.
   =========================================================== */

const hud = html(`

<div id="bj-hud" class="hidden">

    <div class="bj-hud-group">
        <span class="bj-hud-label">CHIPS</span>
        <span class="bj-tray" data-h="tray"></span>
        <span class="bj-hud-num" data-h="chips">0</span>
    </div>

    <div class="bj-hud-group">
        <span class="bj-hud-label">BET</span>
        <span class="bj-hud-num" data-h="bet">0</span>
    </div>

    <div class="bj-hud-group">
        <span class="bj-hud-label">SCORE</span>
        <span class="bj-hud-num" data-h="score">0</span>
    </div>

    <div class="bj-hud-group">
        <span class="bj-hud-label">HIGH</span>
        <span class="bj-hud-num" data-h="high">0</span>
    </div>

</div>

`);

const hudEl = {};

hud.querySelectorAll("[data-h]").forEach(el=>{ hudEl[el.dataset.h] = el; });

let hudPrev = null;

(function mountHud(){

    const footer = document.getElementById("terminal-input");

    if(footer && footer.parentNode){

        footer.parentNode.insertBefore(hud, footer);

    }

})();


// One ● per 5 chips, • for a remainder. Capped so it can't
// overflow a phone screen.
function trayString(chips){

    if(chips <= 0) return "○";

    const full = Math.floor(chips / 5);

    const MAX = 16;

    let s = "●".repeat(Math.min(full, MAX));

    if(full > MAX) return s + "+";

    if(chips % 5 > 0) s += "•";

    return s;

}


function flash(el, dir){

    el.classList.remove("bj-flash-up", "bj-flash-down");

    void el.offsetWidth;   // restart the animation

    el.classList.add(dir === "up" ? "bj-flash-up" : "bj-flash-down");

}


function renderHUD(){

    if(!run){

        hud.classList.add("hidden");

        hudPrev = null;

        return;

    }

    hud.classList.remove("hidden");

    const now = {

        chips: run.chips,
        bet: run.bet,
        score: run.score,
        high: highScore()

    };

    hudEl.chips.textContent = now.chips;
    hudEl.bet.textContent   = now.bet;
    hudEl.score.textContent = now.score;
    hudEl.high.textContent  = now.high;

    hudEl.tray.textContent = trayString(now.chips);

    hudEl.tray.classList.toggle("low", now.chips <= 10);

    if(hudPrev){

        if(now.chips > hudPrev.chips){ flash(hudEl.chips, "up"); flash(hudEl.tray, "up"); }

        if(now.chips < hudPrev.chips){ flash(hudEl.chips, "down"); flash(hudEl.tray, "down"); }

        if(now.score > hudPrev.score) flash(hudEl.score, "up");

        if(now.high  > hudPrev.high)  flash(hudEl.high, "up");

    }

    hudPrev = now;

}


/* ===========================================================
   PANELS
   =========================================================== */

function setActions(container, list){

    const key = list.map(b=>b.cmd).join("|");

    if(container.dataset.sig === key) return;

    container.dataset.sig = key;

    container.innerHTML = "";

    list.forEach(b=>{

        const btn = document.createElement("button");

        btn.type = "button";

        btn.className = "bj-btn" + (b.alt ? " alt" : "");

        btn.textContent = b.label;

        // Keep focus in the command input so the phone keyboard
        // doesn't collapse every time a button is tapped.
        btn.addEventListener("mousedown", e=>e.preventDefault());

        btn.addEventListener("click", ()=>{

            if(container.classList.contains("spent")) return;

            if(busy) return;

            submit(b.cmd);

        });

        container.appendChild(btn);

    });

}


// Echoes the command like it was typed, then runs it.
async function submit(cmd){

    if(typeof registerActivity === "function") registerActivity();

    await printLine(`${currentUser}@DATABASE:> ${cmd}`, "system");

    if(!handleInput(cmd)) execute(cmd);

    input.focus();

}


const TABLE_HTML = `

<div class="bj-panel bj-table">

    <div class="bj-head">
        <span class="bj-title">TWENTY-ONE</span>
        <span class="bj-tag" data-r="tag"></span>
    </div>

    <div class="bj-body">

        <div class="bj-row-label">
            <span>DEALER</span>
            <span class="bj-total" data-r="dtotal"></span>
        </div>

        <div class="bj-cards" data-r="dwrap"><pre class="bj-pre" data-r="dcards"></pre></div>

        <div class="bj-row-label">
            <span>YOU</span>
            <span class="bj-total" data-r="ptotal"></span>
        </div>

        <div class="bj-cards" data-r="pwrap"><pre class="bj-pre" data-r="pcards"></pre></div>

        <div class="bj-status" data-r="status">
            <span data-r="statusText"></span>
            <span class="bj-delta" data-r="delta"></span>
        </div>

        <div class="bj-actions" data-r="actions"></div>

        <div class="bj-foot" data-r="foot"></div>

    </div>

</div>

`;


function totalLabel(cards, hideHole){

    if(hideHole) return { text:`SHOWING ${cards[0].r}`, cls:"" };

    const i = handInfo(cards);

    if(i.blackjack) return { text:"BLACKJACK", cls:"ok" };

    if(i.bust) return { text:`BUST ${i.total}`, cls:"bust" };

    return { text:`${i.total}${i.soft ? " SOFT" : ""}`, cls:"" };

}


function actionsForState(){

    if(state === "PLAYER"){

        return [

            { label:"HIT",   cmd:"hit" },
            { label:"STAND", cmd:"stand" },
            { label:"QUIT",  cmd:"quit", alt:true }

        ];

    }

    if(state === "BETWEEN" || state === "OVER"){

        return [

            { label:"NEW GAME", cmd:"newgame" },
            { label:"QUIT",     cmd:"quit", alt:true }

        ];

    }

    return [];

}


function paintTable(refs){

    if(!hand || !run) return;

    const hideHole = hand.holeHidden;

    const dcols = measureCols(refs.dwrap);

    refs.dcards.innerHTML = gridToHTML(buildGrid(hand.dealer, hideHole ? 1 : -1, dcols));

    refs.pcards.innerHTML = gridToHTML(buildGrid(hand.player, -1, measureCols(refs.pwrap)));

    const dl = totalLabel(hand.dealer, hideHole);
    const pl = totalLabel(hand.player, false);

    refs.dtotal.textContent = dl.text;
    refs.dtotal.className = "bj-total " + dl.cls;

    refs.ptotal.textContent = pl.text;
    refs.ptotal.className = "bj-total " + pl.cls;

    refs.tag.textContent = `HAND ${pad2(run.hands)} // WAGER ${hand.wager}`;

    const r = hand.result;

    refs.status.className = "bj-status" + (r ? " " + r.kind : "");

    refs.statusText.textContent = r ? r.text : (hand.status || "");

    refs.status.classList.toggle("empty", !refs.statusText.textContent);

    refs.delta.textContent = r ? fmtDelta(r.net) : "";

    setActions(refs.actions, actionsForState());

    if(state === "BETWEEN"){

        const rr = hand.result;

        const bits = [`cards +${rr.cardPts}`];

        if(rr.kind === "win")  bits.push(`win +${rr.net}`);
        if(rr.bj)              bits.push(`blackjack +${SCORE_BLACKJACK}`);
        if(rr.kind === "lose") bits.push(`loss −${SCORE_LOSS}`);

        refs.foot.innerHTML =
            `<b>SCORE ${fmtDelta(rr.pts)}</b> (${bits.join(" · ")})<br>` +
            `Next wager: <b>${run.bet}</b>. Type <em>bet &lt;amount&gt;</em> to change it.`;

    }

    else{

        refs.foot.textContent =
            `W ${run.won} · L ${run.lost} · PUSH ${run.pushed} · BLACKJACKS ${run.blackjacks}`;

    }

    scrollFeed();

}


async function showTable(){

    const root = html(TABLE_HTML);

    const refs = refsOf(root);

    await printNode(root);

    currentRefs = refs;

    registerActions(refs.actions);

    paintTable(refs);

    return refs;

}


/* ----- menu / commands / report panels ----- */

function statsHTML(r){

    const rows = [

        ["SCORE",             r.score],
        ["CHIPS REMAINING",   r.chips],
        ["CHIPS WON",         r.chipsWon],
        ["CARDS PLAYED",      r.cards],
        ["HANDS PLAYED",      r.hands],
        ["HANDS WON",         r.won],
        ["HANDS LOST",        r.lost],
        ["PUSHES",            r.pushed],
        ["BLACKJACKS",        r.blackjacks],
        ["BUSTS",             r.busts],
        ["DEALER BUSTS",      r.dealerBusts],
        ["LARGEST WIN",       r.biggestWin]

    ];

    return `

    <div class="bj-stats">

        ${rows.map(([k,v])=>`<div class="bj-stat"><span>${k}</span><b>${v}</b></div>`).join("")}

        <div class="bj-stat wide"><span>SESSION HIGH SCORE</span><b>${Math.max(best.score, r.score)}</b></div>

    </div>

    `;

}


async function showMenu(){

    const root = html(`

    <div class="bj-panel bj-menu">

        <div class="bj-head">
            <span class="bj-title">BSLSK LEISURE SYSTEMS</span>
            <span class="bj-tag">EMPLOYEE ENGAGEMENT SUITE // MOD-21</span>
        </div>

        <div class="bj-body">

            <div class="bj-big">TWENTY-ONE</div>

            <div class="bj-sub">WORKPLACE WELLNESS MODULE &nbsp;·&nbsp; BUILD 1.0.3 (LEGACY)</div>

            <p class="bj-copy">
                Short, structured breaks are associated with improved associate morale.
                This module is provided at no cost to eligible personnel and has been
                approved for off-hours use by Compliance.
            </p>

            <div class="bj-actions" data-r="actions"></div>

            <div class="bj-foot">
                Type <em>start game</em> to begin, or <em>commands</em> for rules and controls.
                Anything else and the terminal carries on as normal.
            </div>

            <div class="bj-fine">
                Usage may be logged. Chips hold no monetary value. Management accepts no
                responsibility for lost chips, lost hours, or lost operatives.
                This module is scheduled for decommission (ticket #4471, status: AWAITING
                REVIEW since [REDACTED]).
            </div>

        </div>

    </div>

    `);

    const refs = refsOf(root);

    setActions(refs.actions, [

        { label:"START GAME", cmd:"start game" },
        { label:"COMMANDS",   cmd:"commands", alt:true }

    ]);

    await printNode(root);

    registerActions(refs.actions);

    scrollFeed();

}


async function showCommands(withStart){

    const cmd = (name, desc)=>

        `<div class="bj-cmd"><b>${name}</b><span>${desc}</span></div>`;

    const root = html(`

    <div class="bj-panel bj-help">

        <div class="bj-head">
            <span class="bj-title">TWENTY-ONE // OPERATING MANUAL</span>
            <span class="bj-tag">REV. 2</span>
        </div>

        <div class="bj-body">

            <div class="bj-section">CONTROLS</div>

            ${cmd("hit",        "take another card")}
            ${cmd("stand",      "keep your hand, dealer plays")}
            ${cmd("newgame",    "deal the next hand (or restart after game over)")}
            ${cmd("bet &lt;n&gt;",   "set your wager between hands (or  bet max)")}
            ${cmd("quit",       "leave the table and return to the terminal")}

            <div class="bj-section">HOW TO PLAY</div>

            <p class="bj-copy">
                Get closer to 21 than the dealer without going over. Number cards are
                worth their face value, J / Q / K are worth 10, and an Ace is worth
                1 or 11, whichever suits the hand.
            </p>

            <p class="bj-copy">
                You and the dealer each get two cards; one of the dealer's stays face
                down. Hit to draw, stand to stop. Go over 21 and you bust.
            </p>

            <div class="bj-section">TABLE RULES</div>

            ${cmd("BLACKJACK", "an Ace plus a ten-value card on the deal. Pays 3:2")}
            ${cmd("DEALER",    "must hit on 16 or less, stands on every 17")}
            ${cmd("PUSH",      "same total as the dealer. Your wager is returned")}
            ${cmd("21",        "you stand automatically")}
            ${cmd("LIMITS",    "no split, double down, or insurance at this table")}

            <div class="bj-section">SCORING</div>

            <p class="bj-copy">
                You start with ${STARTING_CHIPS} chips and a score of 0. Score is separate from
                chips and never changes your balance. Every card you play scores its value
                (2-10, face cards 10, Ace 11). A win adds the chips won, a blackjack adds
                ${SCORE_BLACKJACK}, and a loss costs ${SCORE_LOSS}. Hands won, lost, blackjacks and busts
                are tracked too. Run out of chips and the session ends. Your high score is
                kept until the terminal is reloaded.
            </p>

            ${withStart ? `<div class="bj-actions" data-r="actions"></div>` : ``}

        </div>

    </div>

    `);

    const refs = refsOf(root);

    if(withStart && refs.actions){

        setActions(refs.actions, [

            { label:"START GAME", cmd:"start game" }

        ]);

    }

    await printNode(root);

    if(withStart && refs.actions) registerActions(refs.actions);

    scrollFeed();

}


async function showReport(title, tag, lines, extraHTML){

    recordRun();

    const root = html(`

    <div class="bj-panel bj-report">

        <div class="bj-head">
            <span class="bj-title">${title}</span>
            <span class="bj-tag">${tag}</span>
        </div>

        <div class="bj-body">

            ${lines.map(l=>`<p class="bj-copy">${l}</p>`).join("")}

            ${run.newRecord ? `<div class="bj-newrec">★ NEW SESSION HIGH SCORE ★</div>` : ``}

            ${statsHTML(run)}

            ${extraHTML || ""}

        </div>

    </div>

    `);

    await printNode(root);

    scrollFeed();

    return run.newRecord;

}


async function showGameOver(){

    const root = html(`

    <div class="bj-panel bj-over">

        <div class="bj-head">
            <span class="bj-title">SESSION TERMINATED</span>
            <span class="bj-tag">INSUFFICIENT FUNDS</span>
        </div>

        <div class="bj-body">

            <div class="bj-big lose">GAME OVER</div>

            <p class="bj-copy">
                Your chip balance has reached zero. In accordance with Leisure Policy 4.2,
                this balance has been reconciled. Please do not contact Accounts.
            </p>

            <div class="bj-final">
                <div><span>FINAL SCORE</span><b data-r="fscore"></b></div>
                <div class="hi"><span>SESSION HIGH SCORE</span><b data-r="fhigh"></b></div>
            </div>

            <div data-r="rec"></div>

            <div data-r="stats"></div>

            <div class="bj-actions" data-r="actions"></div>

            <div class="bj-foot">
                Type <em>newgame</em> for a fresh ${STARTING_CHIPS} chips (score resets, high score stays), or <em>quit</em>.
            </div>

        </div>

    </div>

    `);

    const refs = refsOf(root);

    // finishHand() already recorded this run when the chips hit zero.
    recordRun();

    refs.rec.innerHTML = run.newRecord ? `<div class="bj-newrec">★ NEW SESSION HIGH SCORE ★</div>` : ``;

    refs.stats.innerHTML = statsHTML(run);

    refs.fscore.textContent = run.score;

    refs.fhigh.textContent = Math.max(best.score, run.score);

    setActions(refs.actions, actionsForState());

    await printNode(root);

    registerActions(refs.actions);

    scrollFeed();

}


/* ===========================================================
   GAME FLOW
   =========================================================== */

async function openMenu(){

    state = "MENU";

    sfx("success");

    await showMenu();

}


async function startRun(){

    busy = true;

    const e = epoch;

    try{

        run = newRun();

        shoe = buildShoe();

        state = "BETWEEN";

        hudPrev = null;

        renderHUD();

        await say(`// TABLE OPEN  ·  ${DECKS}-DECK SHOE  ·  DEALER STANDS ON ${DEALER_STANDS}  ·  ${STARTING_CHIPS} CHIPS ISSUED`);

        if(e !== epoch) return;

        await dealHand();

    }

    finally{

        if(e === epoch) busy = false;

    }

}


async function dealHand(){

    busy = true;

    const e = epoch;

    try{

        if(shoe.length < DECKS * 52 * CUT_FRACTION){

            shoe = buildShoe();

            await say("// CUT CARD REACHED  ·  SHOE RESHUFFLED");

            if(e !== epoch) return;

        }

        if(run.bet > run.chips){

            run.bet = run.chips;

            await say(`// WAGER ADJUSTED TO ${run.bet} (REMAINING CHIPS)`, "warning");

            if(e !== epoch) return;

        }

        run.chips -= run.bet;

        run.hands++;

        hand = {

            player: [draw(), draw()],
            dealer: [draw(), draw()],

            holeHidden: true,

            wager: run.bet,

            result: null,

            status: ""

        };

        state = "PLAYER";

        hand.status = "YOUR MOVE // HIT OR STAND";

        renderHUD();

        const refs = await showTable();

        if(e !== epoch) return;

        const p = handInfo(hand.player);
        const d = handInfo(hand.dealer);

        const dealerPeeks = cardValue(hand.dealer[0]) >= 10;

        if(p.blackjack || (dealerPeeks && d.blackjack)){

            state = "DEALER";

            hand.status = "CHECKING DEALER'S HOLE CARD...";

            paintTable(refs);

            await sleep(DEALER_DELAY + 250);

            if(e !== epoch) return;

            await finishHand(refs);

        }

    }

    finally{

        if(e === epoch) busy = false;

    }

}


function draw(){

    if(shoe.length === 0) shoe = buildShoe();

    return shoe.pop();

}


// Works out the outcome of a finished hand.
// `payout` is what goes back into the bankroll (the wager was
// already taken at the deal); `net` is the profit/loss shown.
function settle(){

    const p = handInfo(hand.player);
    const d = handInfo(hand.dealer);

    const w = hand.wager;

    if(p.blackjack && d.blackjack){

        return { kind:"push", net:0, payout:w, text:"PUSH // DOUBLE BLACKJACK" };

    }

    if(p.blackjack){

        const win = Math.floor(w * 1.5);

        return { kind:"win", net:win, payout:w + win, text:"BLACKJACK // PAID 3:2", bj:true };

    }

    if(d.blackjack){

        return { kind:"lose", net:-w, payout:0, text:"DEALER BLACKJACK" };

    }

    if(p.bust){

        return { kind:"lose", net:-w, payout:0, text:`BUST // OVER 21`, bust:true };

    }

    if(d.bust){

        return { kind:"win", net:w, payout:w * 2, text:"DEALER BUSTS // YOU WIN", dealerBust:true };

    }

    if(p.total > d.total){

        return { kind:"win", net:w, payout:w * 2, text:`YOU WIN // ${p.total} OVER ${d.total}` };

    }

    if(p.total < d.total){

        return { kind:"lose", net:-w, payout:0, text:`DEALER WINS // ${d.total} OVER ${p.total}` };

    }

    return { kind:"push", net:0, payout:w, text:`PUSH // WAGER RETURNED` };

}


async function finishHand(refs){

    const e = epoch;

    hand.holeHidden = false;

    const r = settle();

    hand.result = r;

    run.chips += r.payout;

    if(r.kind === "win"){

        run.won++;

        run.chipsWon += r.net;

        run.biggestWin = Math.max(run.biggestWin, r.net);

        if(r.bj) run.blackjacks++;

        if(r.dealerBust) run.dealerBusts++;

    }

    else if(r.kind === "lose"){

        run.lost++;

        if(r.bust) run.busts++;

    }

    else{

        run.pushed++;

    }

    // SCORE (points only - never touches chips):
    //   + value of every card you played (2-10 face, J/Q/K 10, Ace 11)
    //   + chips won on a winning hand
    //   + 21 for a blackjack
    //   - 5 for a loss
    const cardPts = hand.player.reduce((n, c)=> n + cardValue(c), 0);

    let pts = cardPts;

    if(r.kind === "win")  pts += r.net;
    if(r.bj)              pts += SCORE_BLACKJACK;
    if(r.kind === "lose") pts -= SCORE_LOSS;

    run.cards += hand.player.length;

    run.score += pts;

    r.pts = pts;
    r.cardPts = cardPts;

    const broke = run.chips <= 0;

    state = broke ? "OVER" : "BETWEEN";

    if(broke) recordRun();

    paintTable(refs);

    renderHUD();

    if(r.bj) sfx("loginsuccess");

    else if(r.kind === "win") sfx("success");

    else if(r.kind === "lose") sfx("error");

    if(broke){

        await sleep(1100);

        if(e !== epoch) return;

        sfx("loginerror");

        await showGameOver();

    }

}


async function doHit(){

    busy = true;

    const e = epoch;

    try{

        hand.player.push(draw());

        const p = handInfo(hand.player);

        if(p.bust){

            state = "DEALER";

            hand.status = "";

            const refs = await showTable();

            if(e !== epoch) return;

            await sleep(600);

            if(e !== epoch) return;

            await finishHand(refs);

            return;

        }

        if(p.total === 21){

            state = "DEALER";

            hand.status = "21 // STANDING AUTOMATICALLY";

            const refs = await showTable();

            if(e !== epoch) return;

            await sleep(DEALER_DELAY);

            if(e !== epoch) return;

            await dealerPlay(refs);

            return;

        }

        hand.status = "YOUR MOVE // HIT OR STAND";

        await showTable();

    }

    finally{

        if(e === epoch) busy = false;

    }

}


async function doStand(){

    busy = true;

    const e = epoch;

    try{

        state = "DEALER";

        hand.status = "YOU STAND ON " + handInfo(hand.player).total;

        const refs = await showTable();

        if(e !== epoch) return;

        await sleep(DEALER_DELAY);

        if(e !== epoch) return;

        await dealerPlay(refs);

    }

    finally{

        if(e === epoch) busy = false;

    }

}


// Casino dealer: reveal the hole card, hit on 16 or less,
// stand on 17 or more (soft 17 included).
async function dealerPlay(refs){

    const e = epoch;

    hand.holeHidden = false;

    hand.status = "DEALER REVEALS HOLE CARD";

    paintTable(refs);

    await sleep(DEALER_DELAY);

    if(e !== epoch) return;

    while(handInfo(hand.dealer).total < DEALER_STANDS){

        hand.status = `DEALER HAS ${handInfo(hand.dealer).total} // MUST HIT`;

        paintTable(refs);

        await sleep(DEALER_DELAY);

        if(e !== epoch) return;

        hand.dealer.push(draw());

        paintTable(refs);

        await sleep(DEALER_DELAY);

        if(e !== epoch) return;

    }

    const d = handInfo(hand.dealer);

    if(!d.bust){

        hand.status = `DEALER STANDS ON ${d.total}`;

        paintTable(refs);

        await sleep(DEALER_DELAY - 250);

        if(e !== epoch) return;

    }

    await finishHand(refs);

}


async function doNewGame(){

    if(state === "OVER"){

        busy = true;

        const e = epoch;

        try{

            run = newRun();

            shoe = buildShoe();

            state = "BETWEEN";

            hudPrev = null;

            renderHUD();

            await say(`// NEW SESSION  ·  ${STARTING_CHIPS} CHIPS ISSUED  ·  HIGH SCORE RETAINED`);

            if(e !== epoch) return;

            await dealHand();

        }

        finally{

            if(e === epoch) busy = false;

        }

        return;

    }

    await dealHand();

}


async function doQuit(){

    busy = true;

    const e = epoch;

    try{

        const forfeited = (state === "PLAYER") ? hand.wager : 0;

        const lines = [];

        if(forfeited){

            lines.push(`Hand in progress. Your wager of ${forfeited} chips has been forfeited.`);

        }

        else if(state !== "OVER"){

            lines.push(`Final balance: ${run.chips} chips (non-redeemable).`);

        }

        lines.push("Returning you to the database terminal. This break was not logged.");

        const wasRecord = await showReport("BREAK ENDED", "SESSION SUMMARY", lines);

        if(e !== epoch) return;

        resetGameState();

        renderHUD();

        sfx(wasRecord ? "loginsuccess" : "success");

    }

    finally{

        if(e === epoch) busy = false;

    }

}


function resetGameState(){

    state = "IDLE";

    run = null;

    hand = null;

    currentRefs = null;

    if(liveActions) liveActions.classList.add("spent");

    liveActions = null;

}


// Called by logout() in terminal.js.
function reset(){

    epoch++;

    busy = false;

    resetGameState();

    renderHUD();

}


function doBet(arg){

    if(state !== "BETWEEN"){

        if(state === "OVER") return warn("SESSION OVER // TYPE newgame TO RESTART");

        return warn("HAND IN PROGRESS // WAGERS CAN ONLY CHANGE BETWEEN HANDS");

    }

    let n;

    if(arg === "max" || arg === "all"){

        n = run.chips;

    }

    else if(/^\d+$/.test(arg || "")){

        n = parseInt(arg, 10);

    }

    else{

        return warn(`USAGE: bet <1-${run.chips}>  (or  bet max)`);

    }

    if(n < 1) return warn("MINIMUM WAGER IS 1 CHIP");

    if(n > run.chips) return warn(`INSUFFICIENT CHIPS // MAXIMUM WAGER IS ${run.chips}`);

    run.bet = n;

    renderHUD();

    sfx("success");

    return say(`// NEXT WAGER SET TO ${n} CHIP${n === 1 ? "" : "S"}${n === run.chips ? "  ·  ALL IN" : ""}`, "success");

}


/* ===========================================================
   INPUT ROUTING

   Returns true when the game handled the command, false when
   the normal terminal should handle it.
   =========================================================== */

function handleInput(text){

    const cmd = text.trim().toLowerCase().replace(/\s+/g, " ");

    const parts = cmd.split(" ");

    const word = parts[0];


    // Opening the menu. Same login gate as the other hidden
    // commands - logged out, it's just an unknown command.
    if(cmd === OPEN_COMMAND){

        if(!isLoggedIn) return false;

        if(state === "IDLE" || state === "MENU"){

            openMenu();

        }

        else{

            warn("MODULE ALREADY RUNNING // TYPE commands FOR CONTROLS");

        }

        return true;

    }


    if(state === "IDLE") return false;


    // Always the terminal's business, in any state.
    if(["mute","unmute","whoami","logout"].includes(word)) return false;


    /* ----- menu: only catch our own words ----- */

    if(state === "MENU"){

        if(cmd === "start game" || cmd === "start"){

            startRun();

            return true;

        }

        if(cmd === "commands" || cmd === "rules"){

            showCommands(true);

            return true;

        }

        if(cmd === "quit" || cmd === "exit"){

            state = "IDLE";

            if(liveActions) liveActions.classList.add("spent");

            liveActions = null;

            say("// MODULE CLOSED");

            return true;

        }

        return false;

    }


    /* ----- in a run: the game owns the prompt ----- */

    if(busy){

        say("// DEALER IS PLAYING  ·  PLEASE STAND BY", "warning");

        return true;

    }

    if(cmd === "hit" || cmd === "h"){

        if(state !== "PLAYER") return noHand();

        doHit();

        return true;

    }

    if(cmd === "stand" || cmd === "s" || cmd === "stay"){

        if(state !== "PLAYER") return noHand();

        doStand();

        return true;

    }

    if(cmd === "newgame" || cmd === "new game" || cmd === "new" || cmd === "n" || cmd === "deal"){

        if(state === "PLAYER"){

            warn("HAND IN PROGRESS // HIT OR STAND (OR quit TO LEAVE THE TABLE)");

            return true;

        }

        doNewGame();

        return true;

    }

    if(cmd === "quit" || cmd === "q" || cmd === "exit" || cmd === "leave"){

        doQuit();

        return true;

    }

    if(word === "bet" || word === "b"){

        doBet(parts[1]);

        return true;

    }

    if(cmd === "commands" || cmd === "rules" || cmd === "help" || cmd === "?"){

        showCommands(false);

        return true;

    }

    if(cmd === "clear"){

        feed.innerHTML = "";

        liveActions = null;

        if(state === "PLAYER" || state === "BETWEEN") showTable();

        else if(state === "OVER") showGameOver();

        return true;

    }

    if(cmd === "start game" || cmd === "start" || cmd === OPEN_COMMAND){

        warn("SESSION ALREADY ACTIVE");

        return true;

    }

    warn("UNRECOGNISED INPUT // hit · stand · quit · newgame · bet <n> · commands");

    return true;

}


function noHand(){

    if(state === "OVER"){

        warn("SESSION OVER // TYPE newgame OR quit");

    }

    else{

        warn("NO ACTIVE HAND // TYPE newgame");

    }

    return true;

}


window.blackjackIntercept = handleInput;

window.blackjackReset = reset;

})();
