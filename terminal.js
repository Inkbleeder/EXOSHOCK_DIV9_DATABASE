/*
===========================================================
BSLSK DIVISION-9 DATABASE
terminal.js

Handles:
- Terminal boot
- Login system
- Commands
- Loading animations
- Database access
===========================================================
*/


let isLoggedIn = false;
let isAdmin = false;
let clearanceLevel = 0;
let currentUser = "GUEST";
let isMuted = false;


const feed = document.getElementById("terminal-output");
const input = document.getElementById("command-input");
const status = document.getElementById("connection-status");
const tabHint = document.getElementById("tab-hint");


/*
===========================================================
AUDIO

Drop your .wav files into an /audio folder next to
index.html, using these filenames (or change the paths
below to match whatever you name them).

Volume for each sound is controlled by SOUND_VOLUME below -
edit any number there (0 = silent, 1 = full volume) to
balance the mix to your taste.

  audio/startup.wav        -> plays once when the terminal boots
  audio/keypress.wav       -> plays once per keystroke
  audio/error.wav          -> general errors (unknown command,
                              file not found, must-login)
  audio/loginerror.wav     -> failed login (wrong user/pass)
  audio/ambience.wav       -> looping background track
  audio/loginsuccess.wav   -> successful login (any account:
                              DIV9_GUEST, ADMIN, or BASILISK)
  audio/success.wav        -> general success sound - plays on
                              whoami, database, read (opening a
                              file or listing a category),
                              logout, and the secret credits
                              command. Any future successful
                              command uses this one too, unless
                              you give it its own entry above.
===========================================================
*/

const SOUND_FILES = {

    startup:        "audio/startup.wav",
    keypress:       "audio/keypress.wav",
    error:          "audio/error.wav",
    loginerror:     "audio/loginerror.wav",
    ambience:       "audio/ambience.wav",
    loginsuccess:   "audio/loginsuccess.wav",
    success:        "audio/success.wav",
    idle:           "audio/idle.wav"

};

const SOUND_VOLUME = {

    startup:        1,
    keypress:       0.6,
    error:          1,
    loginerror:     1,
    ambience:       0.25,
    loginsuccess:   1,
    success:        1,
    idle:           1

};

const sounds = {};

Object.keys(SOUND_FILES).forEach(name=>{

    let el = document.getElementById(name.replace(/_/g,"-"));

    el.src = SOUND_FILES[name];

    el.volume = SOUND_VOLUME[name] !== undefined ? SOUND_VOLUME[name] : 1;

    sounds[name] = el;

});


// If a wav file is missing, misnamed, or in a format the
// browser can't decode, log which one so it's easy to spot
// instead of failing completely silently.
Object.keys(sounds).forEach(name=>{

    sounds[name].addEventListener("error", ()=>{

        console.warn(

            `[audio] "${name}" failed to load - check that ` +
            `${SOUND_FILES[name]} exists and is a valid wav file.`

        );

    });

});


function playSound(name){

    if(isMuted) return;

    let sound = sounds[name];

    if(!sound) return;

    try{

        sound.currentTime = 0;

        // play() returns a promise that rejects if the browser
        // blocks autoplay (e.g. before the user has interacted
        // with the page yet) - catch it so it fails silently
        // instead of throwing console errors.
        sound.play().catch(()=>{});

    }

    catch(err){

        // Some browsers throw synchronously if the audio isn't
        // loaded/seekable yet. Fall back to just calling play()
        // without resetting currentTime rather than aborting.
        sound.play().catch(()=>{});

    }

}



/*
===========================================================
MUTE / UNMUTE

Sets the native .muted flag on every <audio> element (rather
than just gating playSound()), so anything already looping -
ambience, the idle track - goes silent or comes back
immediately without needing to restart. Works with or
without being logged in, same as 'clear'.
===========================================================
*/

function setMuted(muted){

    isMuted = muted;

    Object.values(sounds).forEach(sound=>{

        sound.muted = isMuted;

    });

}


function muteCommand(){

    if(isMuted){

        printLine(
        "SOUND ALREADY MUTED",
        "warning"
        );

        return;

    }

    setMuted(true);

    printLine(
    "SOUND MUTED",
    "system"
    );

}


function unmuteCommand(){

    if(!isMuted){

        printLine(
        "SOUND ALREADY UNMUTED",
        "warning"
        );

        return;

    }

    setMuted(false);

    playSound("success");

    printLine(
    "SOUND UNMUTED",
    "success"
    );

}



/*
===========================================================
BACKGROUND AMBIENCE

A quiet looping track that starts on the user's first
interaction with the page (browsers block audio from
autoplaying before that). Volume is set via SOUND_VOLUME
above ("ambience" key).
===========================================================
*/

let ambienceStarted = false;

sounds.ambience.loop = true;
sounds.idle.loop = true;


function startAmbience(){

    if(ambienceStarted) return;

    ambienceStarted = true;

    sounds.ambience.play().catch(()=>{

        // Autoplay still blocked (rare) - try again on the
        // next interaction instead of giving up permanently.
        ambienceStarted = false;

    });

}



let idleAudioUnlocked = false;


function unlockIdleAudio(){

    if(idleAudioUnlocked) return;

    idleAudioUnlocked = true;

    // Mobile browsers only allow audio playback that's triggered
    // directly by a user gesture, or by an element that's already
    // been "blessed" by one earlier in the page's lifetime. The
    // idle track normally only ever plays from the setInterval
    // check way below, with no gesture behind it at all - which is
    // exactly why it worked from "forceidle" (typing a command is
    // itself a gesture) but silently failed to make a sound on the
    // natural idle timeout on phones. Playing (and immediately
    // pausing) it here, during the same first tap/keypress that
    // unlocks ambience, blesses the element so the later
    // gesture-less play() call works.
    //
    // Force it silent for the bless itself (restoring whatever the
    // real mute state actually was afterward) so there's never a
    // chance of an audible blip from the brief play()->pause()
    // round trip, regardless of how long that actually takes.
    let wasMuted = sounds.idle.muted;

    sounds.idle.muted = true;

    sounds.idle.play().then(()=>{

        sounds.idle.pause();

        sounds.idle.currentTime = 0;

        sounds.idle.muted = wasMuted;

    }).catch(()=>{

        // Blocked anyway (rare) - let it try again next gesture.
        sounds.idle.muted = wasMuted;

        idleAudioUnlocked = false;

    });

}



/*
===========================================================
CREDITS COMMAND

Listed in "help" for every logged-in account (see
LOGGED_IN_HELP below) - no longer a hidden puzzle command.
Change CREDITS_COMMAND to rename it, and edit the
CREDITS_TEXT array with your contributors. (If this goes
back to being a hidden/puzzle command later, just delete its
entry from LOGGED_IN_HELP below and it'll behave exactly
like "manifest" used to - still fully working, just
unlisted and no longer tab-completable.)
===========================================================
*/

const CREDITS_COMMAND = "manifest";

/*
===========================================================
ADMIN-ONLY COMMANDS

Every command name listed here automatically shows up in
the 'help' output, but only when isAdmin is true. Add a
new admin-only OR hidden/puzzle command by: 1) adding its
name here (plus a one-line flavor description in
ADMIN_COMMAND_DESCRIPTIONS below), and 2) adding its case +
function like forceidle below.

Note: this list includes puzzle/ARG commands like "petrify"
and "debug" too. They're still fully hidden from every other
account's help and still gated exactly as before - listing
them here only helps *you* (the real admin) find and test
every command that exists, in one place.
===========================================================
*/

const ADMIN_ONLY_COMMANDS = [ "forceidle", "petrify", "debug", "finality", "definitelyofficework" ];

const ADMIN_COMMAND_DESCRIPTIONS = {

    forceidle: "trigger the idle banner immediately (testing)",
    petrify: "??? unknown signal",
    debug: "??? unknown signal",
    finality: "??? unknown signal",
    definitelyofficework: "unlisted recreational module (break room)"

};


/*
===========================================================
HELP REGISTRY

The single source of truth for what 'help' displays AND for
what Tab-completion offers when completing a bare command
name (see availableCommandWords() near autoComplete()) - so
the two can never drift out of sync. Each usage string's
first word is the actual typable command; anything after
that is just the argument hint shown in help.
===========================================================
*/

const GUEST_HELP = [

    { usage: "login <username> <password>", description: "authenticate with the system" },
    { usage: "mute", description: "silence all audio" },
    { usage: "unmute", description: "restore audio" },
    { usage: "clear", description: "wipe the screen" }

];

const LOGGED_IN_HELP = [

    { usage: "database", description: "list every category you can access" },
    { usage: "read <entry / category / subcategory>", description: "open a file, or list a category/subcategory" },
    { usage: "search <term>", description: "search titles and file contents" },
    { usage: "whoami", description: "show current session identity" },
    { usage: "mute", description: "silence all audio" },
    { usage: "unmute", description: "restore audio" },
    { usage: "logout", description: "end session" },
    { usage: "clear", description: "wipe the screen" },
    { usage: CREDITS_COMMAND, description: "show project credits" }

];

const CREDITS_TEXT = [

    "// DIVISION-9 ARCHIVE - CONTRIBUTOR MANIFEST",

    "",

    "Lead Developer   :  Ink",

    "Writing / Lore   :  Shephard42",

    "Sound design     :  Sketchy, Nimblebear",

    "Additional Thanks:  RonWhiskey, Scott, NickB",

    "",

    "// end of file"

];


/*
===========================================================
ACCOUNT THEMES

Applies a CSS class to <body> matching the account that's
logged in, so style.css can give each account its own
color scheme. See the "theme-*" classes in style.css.
===========================================================
*/

function applyTheme(user){

    document.body.classList.remove(

        "theme-div9guest",

        "theme-div9admin",

        "theme-admin",

        "theme-basilisk"

    );

    if(user === "DIV9_GUEST"){

        document.body.classList.add("theme-div9guest");

    }

    else if(user === "DIV9_ADMIN"){

        document.body.classList.add("theme-div9admin");

    }

    else if(user === "ADMIN"){

        document.body.classList.add("theme-admin");

    }

    else if(user === "BASILISK"){

        document.body.classList.add("theme-basilisk");

    }

}



/*
===========================================================
BOOT SEQUENCE
===========================================================
*/

window.onload = () => {

    document.getElementById("terminal").style.visibility = "visible";

    input.disabled = true;

    bootSequence();

};



async function bootSequence(){

    playSound("startup");

    await printLine("BSLSK DIVISION-9 DATABASE", "boot");
    await printLine("--------------------------------", "system");

    await loading("Initializing security modules");

    await loading("Checking archive integrity");

    await loading("Connecting to local database");

    await printLine("");

await printLine(
    "CONNECTION ESTABLISHED",
    "success"
);

await printLine(
    "RESTRICTED TERMINAL ACCESS",
    "warning"
);

await printLine("");

await printLine(
    "Guest Credentials",
    "warning"
);

await printLine(
    "Username : div9",
    "system"
);

await printLine(
    "Password : exo248",
    "system"
);

await printLine("");

await printLine(
    "Type 'login <username> <password>'",
    "system"
);

    status.innerText = "ONLINE";
    status.className = "success";


    input.disabled = false;
    input.focus();

}



/*
===========================================================
OUTPUT
===========================================================
*/


/*
===========================================================
TYPEWRITER SETTINGS
===========================================================
*/

const TYPE_SPEED = 12; // milliseconds per character

let printQueue = [];
let isPrinting = false;
let fastForward = false;


// Optional 3rd arg: a search term to highlight (reverse-video style,
// see .hl in style.css) once the line finishes typing out. Leave it
// null/omitted for every normal line - only search() uses this.
function printLine(text, type="", highlightTerm=null){

    return new Promise(resolve=>{

        printQueue.push({ kind:"line", text, type, highlightTerm, resolve });

        if(!isPrinting){

            processQueue();

        }

    });

}


// A bordered "command box" for help output - a bold header line
// (the usage string) with a smaller description underneath, visually
// separated from the next command by its own border. Renders
// instantly (no per-character typing - a box doesn't really lend
// itself to that) but still goes through the same shared queue, so
// it still appears in the correct order relative to any printLine()
// calls around it.
function printCommandBox(usage, description, className=""){

    return new Promise(resolve=>{

        printQueue.push({ kind:"box", usage, description, className, resolve });

        if(!isPrinting){

            processQueue();

        }

    });

}


// Drops an already-built DOM node (e.g. the blackjack table) into the
// feed through the same queue as everything else, so it always lands
// in the correct order relative to typed lines.
function printNode(node){

    return new Promise(resolve=>{

        printQueue.push({ kind:"node", node, resolve });

        if(!isPrinting){

            processQueue();

        }

    });

}


async function processQueue(){

    isPrinting = true;

    while(printQueue.length > 0){

        let item = printQueue.shift();


        if(item.kind === "node"){

            feed.appendChild(item.node);

            feed.scrollTop = feed.scrollHeight;

            item.resolve();

            continue;

        }


        if(item.kind === "box"){

            let box = document.createElement("div");

            box.className = "help-entry"
                + (item.className ? " " + item.className : "");

            let header = document.createElement("div");

            header.className = "help-entry-title";

            header.textContent = item.usage;

            box.appendChild(header);


            let desc = document.createElement("div");

            desc.className = "help-entry-desc";

            desc.textContent = item.description;

            box.appendChild(desc);


            feed.appendChild(box);

            feed.scrollTop = feed.scrollHeight;

            item.resolve();

            continue;

        }


        let line = document.createElement("div");

        line.className = item.type;

        feed.appendChild(line);


        // The actual text lives in its own text node so the
        // block cursor (a separate element) can sit right
        // after it without being wiped out every time the
        // text node is updated.
        let textNode = document.createTextNode("");

        line.appendChild(textNode);


        let blockCursor = document.createElement("span");

        blockCursor.className = "cursor";

        line.appendChild(blockCursor);


        for(let i=0; i<=item.text.length; i++){

            if(fastForward){

                textNode.textContent = item.text;

                break;

            }

            textNode.textContent = item.text.slice(0,i);

            feed.scrollTop = feed.scrollHeight;

            await sleep(TYPE_SPEED);

        }

        feed.scrollTop = feed.scrollHeight;


        // Line is finished printing - drop the block cursor,
        // it only marks the line currently being written.
        line.removeChild(blockCursor);


        // If this line has a highlight term, swap the plain text
        // node for the highlighted HTML version now that typing is
        // done - the typewriter effect plays out normally and then
        // the matched text "lights up" right at the end.
        if(item.highlightTerm){

            line.innerHTML = highlightHTML(item.text, item.highlightTerm);

        }


        item.resolve();

    }

    isPrinting = false;

    fastForward = false;

}



/*
===========================================================
HIGHLIGHT HELPERS

Used by printLine()'s highlightTerm option (currently just
search()). Escapes the line's text manually and wraps every
case-insensitive occurrence of the term in <span class="hl">,
rather than using a regex, so a search term containing regex
special characters (parentheses, etc.) can't break anything.
===========================================================
*/

function escapeHTML(text){

    return text

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;");

}


function highlightHTML(text, term){

    if(!term) return escapeHTML(text);

    let lowerText = text.toLowerCase();

    let lowerTerm = term.toLowerCase();

    if(lowerTerm === "") return escapeHTML(text);


    let result = "";

    let i = 0;

    while(i < text.length){

        let idx = lowerText.indexOf(lowerTerm, i);

        if(idx === -1){

            result += escapeHTML(text.slice(i));

            break;

        }

        result += escapeHTML(text.slice(i, idx));

        result +=
            `<span class="hl">`
            + escapeHTML(text.slice(idx, idx + term.length))
            + `</span>`;

        i = idx + term.length;

    }

    return result;

}




async function loading(text){

    let line=document.createElement("div");

    line.className="system";

    feed.appendChild(line);


    let bar="";

    for(let i=0;i<=10;i++){

        bar =
        "["+
        "█".repeat(i)+
        "░".repeat(10-i)
        +"]";


        line.innerText =
        text+" "+bar;


        await sleep(100);

    }


}



function sleep(ms){

    return new Promise(resolve=>setTimeout(resolve,ms));

}



/*
===========================================================
INPUT HANDLING
===========================================================
*/


let commandHistory = [];
let historyIndex = -1;

let tabMatches = [];
let tabIndex = -1;
let tabBase = null;
let tabPrefix = "read ";


input.addEventListener(
"keydown",
async function(event){


    startAmbience();

    unlockIdleAudio();

    registerActivity();


    // Any keypress while text is still typing out instantly
    // completes everything currently queued, instead of making
    // the user wait for the animation to finish.
    if(isPrinting){

        fastForward = true;

        if(event.key === "Enter"){

            // Don't let the same Enter press that skipped the
            // animation also submit whatever's in the input box.
            event.preventDefault();

            return;

        }

    }


    if(event.key === "ArrowUp"){

        event.preventDefault();

        tabBase = null;

        clearTabHint();

        if(commandHistory.length === 0) return;

        historyIndex = Math.max(historyIndex - 1, 0);

        this.value = commandHistory[historyIndex];

        this.setSelectionRange(this.value.length, this.value.length);

        return;

    }


    if(event.key === "ArrowDown"){

        event.preventDefault();

        tabBase = null;

        clearTabHint();

        if(commandHistory.length === 0) return;

        historyIndex = Math.min(historyIndex + 1, commandHistory.length);

        this.value = commandHistory[historyIndex] || "";

        this.setSelectionRange(this.value.length, this.value.length);

        return;

    }


    if(event.key === "Tab"){

        event.preventDefault();

        autoComplete(this);

        return;

    }


    if(event.key !== "Enter"){

        playSound("keypress");

        // Any other key cancels an in-progress tab-cycle, so the
        // next Tab press starts a fresh match from what's typed.
        tabBase = null;

        clearTabHint();

        return;

    }


    let commandLine=this.value.trim();


    if(commandLine==="")
        return;


    await printLine(
        `${currentUser}@DATABASE:> ${commandLine}`,
        "system"
    );


    commandHistory.push(commandLine);

    historyIndex = commandHistory.length;

    tabBase = null;

    clearTabHint();


    this.value="";


    execute(commandLine);


});




/*
===========================================================
TAB COMPLETION

Three completion modes, picked from the input's current shape:

  1. Still typing the command word itself (no space yet, e.g.
     "sea") - completes against every command actually
     available in the current login/admin state (see
     availableCommandWords() - built from the same
     GUEST_HELP / LOGGED_IN_HELP / ADMIN_ONLY_COMMANDS
     registry "help" uses, so the two can't drift apart). An
     empty input matches everything, so tapping Tab on a blank
     prompt cycles through the full command list.

  2. "read <name>" / "read subcategory <name>" - completes
     against entry titles + category/subcategory names (or,
     with the subcategory prefix, subcategory names only).

  3. "search <term>" - same title/category/subcategory pool as
     "read", offered as a convenient starting point (search
     itself isn't restricted to these, they're just reasonable
     things to search for).

Whichever mode matched, pressing Tab repeatedly cycles through
every match, wrapping back around to the first once it reaches
the end, with a small "(2/5)" style counter next to the cursor.

IMPORTANT: once a cycle is underway (tabBase !== null), this
function must NOT re-derive the query from el.value - el.value
IS the previous suggestion at that point, so re-parsing it would
treat that suggestion as a brand new query and immediately break
the cycle after a single step. Only a fresh Tab press (tabBase
still null, reset by any other keystroke / history recall /
Enter - see the keydown handler above) is allowed to rebuild the
match list.
===========================================================
*/

function autoComplete(el){

    // Already mid-cycle: just advance, don't touch the query.
    if(tabBase !== null){

        tabIndex = (tabIndex + 1) % tabMatches.length;

        applyTabMatch(el);

        return;

    }


    let value = el.value;

    let parts = value.split(" ");

    let firstWord = parts[0].toLowerCase();


    let query;

    let candidates;

    let prefix;


    if(parts.length === 1){

        // Mode 1: still typing the command word.
        query = firstWord;

        candidates = availableCommandWords()

            .filter(name => name.startsWith(query))

            .sort((a,b) => a.localeCompare(b))

            // A trailing space so the cursor lands ready for an
            // argument, the way real shell completion does.
            .map(name => name + " ");

        prefix = "";

    }

    else if(firstWord === "read"){

        // Mode 2: "read subcategory <name>" completes against
        // subcategory names only; bare "read <name>" completes
        // against titles + category/subcategory names.
        let usingSubPrefix =
            parts[1]
            &&
            parts[1].toLowerCase() === "subcategory";

        query = usingSubPrefix
            ? parts.slice(2).join(" ").toLowerCase()
            : parts.slice(1).join(" ").toLowerCase();

        prefix = usingSubPrefix ? "read subcategory " : "read ";

        candidates = usingSubPrefix
            ? subcategoryCandidates(query)
            : readArgumentCandidates(query);

    }

    else if(firstWord === "search"){

        // Mode 3: same candidate pool as a bare "read <name>".
        query = parts.slice(1).join(" ").toLowerCase();

        prefix = "search ";

        candidates = readArgumentCandidates(query);

    }

    else{

        return;

    }


    if(candidates.length === 0) return;


    tabBase = query;

    tabMatches = candidates;

    tabIndex = 0;

    tabPrefix = prefix;

    applyTabMatch(el);

}



// Every command word usable right now, given login/admin state -
// built from the same registry "help" renders from, so Tab
// completion and "help" can never list different things.
function availableCommandWords(){

    let list = (isLoggedIn ? LOGGED_IN_HELP : GUEST_HELP)

        .map(entry => entry.usage.split(" ")[0]);

    if(isLoggedIn && isAdmin){

        list = list.concat(ADMIN_ONLY_COMMANDS);

    }

    return list;

}



// Candidate pool shared by "read <name>" and "search <term>" -
// every entry title plus every category/subcategory name.
function readArgumentCandidates(query){

    // Categories & subcategories - case-insensitive either way,
    // so lowercase works fine for both matching and inserting.
    let categoryNames = new Set();

    Object.values(database).forEach(entry=>{

        categoryNames.add(entry.category.toLowerCase());

        if(entry.subcategory){

            categoryNames.add(entry.subcategory.toLowerCase());

        }

    });


    // Titles - matched case-insensitively for convenience, but the
    // ACTUAL casing gets inserted, since a direct title lookup is
    // case-sensitive (keys are no longer offered here at all - not
    // meant to be typed by hand anymore).
    let titleNames = new Set();

    Object.values(database).forEach(entry=>{

        if(entry.title){

            titleNames.add(entry.title);

        }

    });


    return [

        ...[...categoryNames].filter(name => name.startsWith(query)),

        ...[...titleNames].filter(title => title.toLowerCase().startsWith(query))

    ].sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));

}



// Candidate pool for "read subcategory <name>" - subcategory
// names only.
function subcategoryCandidates(query){

    let subNames = new Set();

    Object.values(database).forEach(entry=>{

        if(entry.subcategory){

            subNames.add(entry.subcategory.toLowerCase());

        }

    });

    return [...subNames]

        .filter(name => name.startsWith(query))

        .sort((a,b) => a.localeCompare(b));

}



function applyTabMatch(el){

    el.value = tabPrefix + tabMatches[tabIndex];

    updateTabHint();

}



function updateTabHint(){

    tabHint.textContent = tabMatches.length > 1
        ? `(${tabIndex + 1}/${tabMatches.length})`
        : "";

}



function clearTabHint(){

    tabHint.textContent = "";

}




/*
===========================================================
COMMAND SYSTEM
===========================================================
*/


async function execute(text){


    // Hidden minigame (blackjack.js). Returns true if it consumed
    // the command - otherwise falls through to the normal terminal.
    if(typeof blackjackIntercept === "function" && blackjackIntercept(text)){

        return;

    }


    let args=text.split(" ");

    let command=args[0].toLowerCase();



    switch(command){


        case "clear":

            feed.innerHTML="";

        break;



        case "mute":

            muteCommand();

        break;



        case "unmute":

            unmuteCommand();

        break;



        case "help":

            if(!isLoggedIn){

                printLine(
                "Available commands:",
                "success"
                );

                GUEST_HELP.forEach(entry=>{

                    printCommandBox(entry.usage, entry.description);

                });

            }

            else{

                printLine(
                "Available commands:",
                "success"
                );

                LOGGED_IN_HELP.forEach(entry=>{

                    printCommandBox(entry.usage, entry.description);

                });

                if(isAdmin){

                    ADMIN_ONLY_COMMANDS.forEach(cmd=>{

                        printCommandBox(
                        cmd,
                        ADMIN_COMMAND_DESCRIPTIONS[cmd] || "???",
                        "warning"
                        );

                    });

                }

            }

        break;



        case "login":

            login(args[1],args[2]);

        break;



        case "logout":

            logout();

        break;



        case "whoami":

            playSound("success");

            printLine(
            currentUser
            );

        break;



        case "database":

            databaseCommand();

        break;



        case "read":

            readEntry(
                args.slice(1).join(" ")
            );

        break;



        case "search":

            searchCommand(
                args.slice(1).join(" ")
            );

        break;



        case "petrify":

            petrifyEvent();

        break;



        case "debug":

            debugEvent();

        break;



        case "finality":

            finalityEvent();

        break;



        case "forceidle":

            forceIdleCommand();

        break;



        case CREDITS_COMMAND:

            showCredits();

        break;




        default:

            playSound("error");

            printLine(
            "UNKNOWN COMMAND",
            "error"
            );

        break;


    }


}



/*
===========================================================
LOGIN
===========================================================
*/


function login(user,pass){


    if(isLoggedIn){

        printLine(
        "Already logged in.",
        "error"
        );

        return;

    }



    if(
        user === "div9"
        &&
        pass === "exo248"
    ){

        isLoggedIn=true;

        clearanceLevel=0;

        currentUser="DIV9_GUEST";


        status.innerText="SECURE";

        applyTheme(currentUser);

        printLine(
        "Authenticating...",
        "system"
        );


        setTimeout(()=>{

            playSound("loginsuccess");

            printLine(
            "ACCESS GRANTED",
            "success"
            );

            printLine(
            "Welcome DIV9_GUEST."
            );

            printLine(
            "Type 'help' for a list of commands."
            );

        },700);


        return;

    }



    if(
        user === "div9_admin"
        &&
        pass === "helios"
    ){

        isLoggedIn=true;

        clearanceLevel=1;

        currentUser="DIV9_ADMIN";

        applyTheme(currentUser);

        playSound("loginsuccess");

        printLine(
        "ACCESS GRANTED",
        "success"
        );

        printLine(
        "Welcome DIV9_ADMIN."
        );


        return;

    }



    if(
        user === "admin"
        &&
        pass === "override"
    ){

        isLoggedIn=true;

        isAdmin=true;

        clearanceLevel=3;

        currentUser="ADMIN";

        applyTheme(currentUser);

        playSound("loginsuccess");

        printLine(
        "ADMIN BACKDOOR ACCEPTED",
        "success"
        );


        printLine(
        "ROOT ACCESS ENABLED",
        "warning"
        );


        return;

    }



    if(
        user === "basilisk"
        &&
        pass === "mirror"
    ){

        isLoggedIn=true;

        clearanceLevel=2;

        currentUser="BASILISK";

        applyTheme(currentUser);

        playSound("loginsuccess");

        printLine(
        "SIGNAL ACCEPTED",
        "success"
        );

        printLine(
        "CLEARANCE GRANTED",
        "warning"
        );


        return;

    }



    playSound("loginerror");

    printLine(
    "ACCESS DENIED",
    "error"
    );


}




function logout(){

    if(typeof blackjackReset === "function") blackjackReset();

    isLoggedIn=false;

    isAdmin=false;

    clearanceLevel=0;

    currentUser="GUEST";


    status.innerText="ONLINE";

    applyTheme(currentUser);

    playSound("success");

    printLine(
    "SESSION TERMINATED",
    "system"
    );

}



/*
===========================================================
DATABASE
===========================================================
*/


function databaseCommand(){


    if(!isLoggedIn){

        playSound("error");

        printLine(
        "ERROR: LOGIN REQUIRED",
        "error"
        );

        return;

    }



    playSound("success");

    printLine(
    "DATABASE INDEX - CATEGORIES:",
    "success"
    );


    // Group entries by category / subcategory, splitting each
    // group into what THIS logged-in account can actually open
    // (shown by title) vs what it can't (shown only as a
    // hidden/locked count - title withheld).
    let categories = {};


    Object.values(database).forEach(entry=>{

        if(!categories[entry.category]){

            categories[entry.category] = {

                direct: { titles: [], locked: 0 },

                subcategories: {}

            };

        }


        let cat = categories[entry.category];

        let visible = hasAccessTo(entry);


        if(entry.subcategory){

            if(!cat.subcategories[entry.subcategory]){

                cat.subcategories[entry.subcategory] = {

                    titles: [],

                    locked: 0

                };

            }


            if(visible){

                cat.subcategories[entry.subcategory].titles.push(entry.title);

            }

            else{

                cat.subcategories[entry.subcategory].locked++;

            }

        }

        else{

            if(visible){

                cat.direct.titles.push(entry.title);

            }

            else{

                cat.direct.locked++;

            }

        }

    });


    Object.keys(categories).forEach(cat=>{

        let entry = categories[cat];


        printLine(
        `[${cat.toUpperCase()}]`
        );


        entry.direct.titles.forEach(title=>{

            printLine(
            `    ${title}`
            );

        });

        if(entry.direct.locked > 0){

            printLine(
            `    ${entry.direct.locked} HIDDEN / LOCKED`,
            "warning"
            );

        }


        Object.keys(entry.subcategories).forEach(sub=>{

            let subEntry = entry.subcategories[sub];

            printLine(
            `    [${sub.toUpperCase()}]`
            );

            subEntry.titles.forEach(title=>{

                printLine(
                `        ${title}`
                );

            });

            if(subEntry.locked > 0){

                printLine(
                `        ${subEntry.locked} HIDDEN / LOCKED`,
                "warning"
                );

            }

        });

    });


}




/*
===========================================================
CLEARANCE CHECK

An entry is visible if the logged-in account's clearanceLevel
meets or exceeds the entry's required clearance (0 by default
- visible to anyone logged in). isAdmin always bypasses this
entirely, regardless of clearanceLevel.
===========================================================
*/

function hasAccessTo(entry){

    return isAdmin || clearanceLevel >= (entry.clearance || 0);

}



async function readEntry(name){


    if(!isLoggedIn){

        playSound("error");

        printLine(
        "ERROR: LOGIN REQUIRED",
        "error"
        );

        return;

    }



    // 0. Explicit "subcategory <name>" syntax - forces a
    // subcategory-only lookup, bypassing categories and titles
    // entirely. The bare "read <name>" form below already falls
    // back to matching a subcategory (step 5), so this exists
    // purely to disambiguate on demand.
    if(name.toLowerCase().startsWith("subcategory ")){

        let subName = name.slice("subcategory ".length).trim();

        if(subName === ""){

            playSound("error");

            printLine(
            "USAGE: read subcategory <name>",
            "error"
            );

            return;

        }

        let subMatches = Object.keys(database).filter(entry=>

            database[entry].subcategory
            &&
            database[entry].subcategory.toLowerCase()
            ===
            subName.toLowerCase()
            &&
            hasAccessTo(database[entry])

        );

        if(subMatches.length > 0){

            playSound("success");

            printLine(
            `SUBCATEGORY: ${subName.toUpperCase()}`,
            "success"
            );

            subMatches.forEach(entry=>{

                printLine(
                `[${database[entry].title.toUpperCase()}]`
                );

            });

            return;

        }

        playSound("error");

        printLine(
        "ERROR 0xA143",
        "error"
        );

        printLine(
        "FILE NOT FOUND",
        "error"
        );

        return;

    }



    // 1. Direct key match - case-insensitive. Keys are internal
    // IDs now, not what's displayed, so exact case no longer
    // matters here the way it used to.
    let matchedKey = Object.keys(database).find(k=>

        k.toLowerCase() === name.toLowerCase()

    );

    if(matchedKey && hasAccessTo(database[matchedKey])){

        await openEntry(database[matchedKey]);

        return;

    }



    // 2. Title match(es) - case-insensitive, same as every other
    // lookup in this function (category, subcategory, and the
    // qualifier compound below). A case-sensitive title match was
    // the actual root cause of entries like "Other Offices"
    // appearing unreadable: typing the natural lowercase form
    // skipped this step entirely (0 matches, no qualifier given)
    // and fell all the way through to a dead-end "FILE NOT FOUND"
    // instead of ever reaching the "MULTIPLE ENTRIES FOUND" hint.
    let titleKeys = Object.keys(database).filter(k=>

        database[k].title.toLowerCase() === name.toLowerCase()
        &&
        hasAccessTo(database[k])

    );

    if(titleKeys.length === 1){

        await openEntry(database[titleKeys[0]]);

        return;

    }

    if(titleKeys.length > 1){

        playSound("success");

        printLine(
        `MULTIPLE ENTRIES FOUND: "${name}"`,
        "warning"
        );

        let locations = new Set();

        titleKeys.forEach(k=>{

            let e = database[k];

            locations.add(

                e.subcategory
                ? `${e.category} / ${e.subcategory}`
                : e.category

            );

        });

        locations.forEach(loc=>{

            printLine(`[${loc.toUpperCase()}]`);

        });

        printLine(
        `Type 'read <category/subcategory> ${name}' to specify - see location(s) above.`
        );

        return;

    }



    // 3. "<category or subcategory> <title>" compound - resolves
    // the ambiguity from step 2 by qualifying which one you mean.
    //
    // Built directly from the data (every entry's own category/
    // subcategory + title) rather than naively splitting the input
    // on its first space - category and subcategory names can be
    // multiple words themselves (e.g. "Division 7", "Standard
    // Issue"), which a first-space split can never match. This is
    // also the only thing that can actually disambiguate two
    // entries that share the same category and only differ by
    // subcategory (e.g. two "Other Offices" entries both filed
    // under BSLSK) - qualifying by category alone can't tell them
    // apart, qualifying by subcategory can.
    let lowerName = name.toLowerCase();

    let qualifiedKey = Object.keys(database).find(k=>{

        let e = database[k];

        let byCategory = (e.category + " " + e.title).toLowerCase();

        let bySubcategory = e.subcategory
            ? (e.subcategory + " " + e.title).toLowerCase()
            : null;

        return lowerName === byCategory || lowerName === bySubcategory;

    });

    if(qualifiedKey && hasAccessTo(database[qualifiedKey])){

        await openEntry(database[qualifiedKey]);

        return;

    }



    // 4. Category listing (by title, not key)
    let matches = Object.keys(database).filter(entry=>

        database[entry].category.toLowerCase()
        ===
        name.toLowerCase()
        &&
        hasAccessTo(database[entry])

    );


    if(matches.length > 0){

        playSound("success");

        printLine(
        `CATEGORY: ${name.toUpperCase()}`,
        "success"
        );

        matches.forEach(entry=>{

            printLine(
            `[${database[entry].title.toUpperCase()}]`
            );

        });

        return;

    }



    // 5. Subcategory listing (by title, not key)
    let subMatches = Object.keys(database).filter(entry=>

        database[entry].subcategory
        &&
        database[entry].subcategory.toLowerCase()
        ===
        name.toLowerCase()
        &&
        hasAccessTo(database[entry])

    );


    if(subMatches.length > 0){

        playSound("success");

        printLine(
        `SUBCATEGORY: ${name.toUpperCase()}`,
        "success"
        );

        subMatches.forEach(entry=>{

            printLine(
            `[${database[entry].title.toUpperCase()}]`
            );

        });

        return;

    }


    playSound("error");

    printLine(
    "ERROR 0xA143",
    "error"
    );


    printLine(
    "FILE NOT FOUND",
    "error"
    );


}



/*
===========================================================
SEARCH

Full-text search across title, category, subcategory and
body content - unlike 'read', which only matches against
titles/categories/subcategories, this digs into the actual
file contents. Locked entries are filtered out by
hasAccessTo() exactly like everywhere else, so a search never
reveals that a clearance-gated file even exists.

Each result prints its title (highlighted if the term appears
there) plus, when the match is inside the body content, a
short excerpt around it with the match highlighted too - so
it's clear at a glance *why* something matched instead of
just *that* it did.
===========================================================
*/

function searchCommand(term){

    if(!isLoggedIn){

        playSound("error");

        printLine(
        "ERROR: LOGIN REQUIRED",
        "error"
        );

        return;

    }


    term = term.trim();

    if(term === ""){

        playSound("error");

        printLine(
        "USAGE: search <term>",
        "error"
        );

        return;

    }


    let query = term.toLowerCase();

    let results = Object.keys(database).filter(k=>{

        let entry = database[k];

        if(!hasAccessTo(entry)) return false;

        let haystack = (
            entry.title
            + " "
            + entry.category
            + " "
            + (entry.subcategory || "")
            + " "
            + entry.content
        ).toLowerCase();

        return haystack.includes(query);

    });


    if(results.length === 0){

        playSound("error");

        printLine(
        `NO RESULTS FOR "${term}"`,
        "error"
        );

        return;

    }


    playSound("success");

    printLine(
    `SEARCH RESULTS FOR "${term}" (${results.length}):`,
    "success"
    );

    results.forEach(k=>{

        let entry = database[k];

        let location = entry.subcategory
            ? `${entry.category} / ${entry.subcategory}`
            : entry.category;

        printLine(
        `    [${location.toUpperCase()}] ${entry.title}`,
        "",
        term
        );

        let snippet = buildSnippet(entry.content, query);

        if(snippet){

            printLine(
            `        "${snippet}"`,
            "system",
            term
            );

        }

    });

}


// Grabs a short window of text around the first occurrence of
// `query` inside `content`, collapses any newlines/extra
// whitespace so it reads as one clean line, and adds an ellipsis
// on whichever side got trimmed. Returns null if the term isn't
// actually in the content (e.g. it only matched the title).
function buildSnippet(content, query, radius=40){

    let lower = content.toLowerCase();

    let idx = lower.indexOf(query);

    if(idx === -1) return null;


    let start = Math.max(0, idx - radius);

    let end = Math.min(content.length, idx + query.length + radius);

    let snippet = content.slice(start, end).replace(/\s+/g, " ").trim();

    if(start > 0) snippet = "…" + snippet;

    if(end < content.length) snippet = snippet + "…";

    return snippet;

}



async function openEntry(entry){

    await loading(
    "Opening archive"
    );


    await loading(
    "Decrypting file"
    );


    playSound("success");

    printLine(
    entry.content
    );

}



/*
===========================================================
CREDITS (secret command)
===========================================================
*/


async function showCredits(){

    playSound("success");

    for(const line of CREDITS_TEXT){

        await printLine(line, "success");

    }

}



async function petrifyEvent(){


    if(!isLoggedIn){

        printLine(
        "UNKNOWN COMMAND",
        "error"
        );

        return;

    }


    await printLine(
    "//-UNKOWN_SIGNAL_DETECTED",
    "system"
    );

    await sleep(500);


    await printLine(
    " //-SIGNAL_DECODED",
    "system"
    );

    await sleep(500);


    await printLine(
    "  //-DISPLAY_DECODED_SIGNAL",
    "system"
    );

    await sleep(500);


    await printLine(
    "//-Y/N",
    "system"
    );

    await sleep(600);


    await printLine(
    ">\\Y",
    "warning"
    );

    await sleep(800);


    await printLine(
    "//-[WE HAVE BEEN WATCHING YOU OPERATOR. YOU ARE AWFULLY INTERESTED IN DIVISION-9. HERE'S A GIFT. HAVE FUN DIGGING.]",
    "error"
    );

    await sleep(800);


    await printLine(
    "//-ATTACHMENT_FOUND",
    "system"
    );

    await sleep(500);


    await printLine(
    "   //-DISPLAY_ATTACHMENT",
    "system"
    );

    await sleep(500);


    await printLine(
    "//-Y/N",
    "system"
    );

    await sleep(600);


    await printLine(
    ">>\\Y",
    "warning"
    );

    await sleep(800);


    await printLine(
    "//-[===REDACTED===]",
    "error"
    );

    await sleep(500);


    await printLine(
    "//-\u2620\uFE0E\u2620\uFE0E",
    "error"
    );

    await sleep(1000);


    await printLine("");

    await printLine(
    "            // username: basilisk",
    "success"
    );

    await printLine(
    "              // password: mirror",
    "success"
    );

}



/*
===========================================================
DEBUG EVENT

Hidden command - deliberately left out of 'help', but not
gated behind login the way the ADMIN_ONLY_COMMANDS are.
Any logged-in account (including plain guest) can trigger
it if they know to type it. Plays out as a faux debug/crash
log ending in a "maintenance note" and the decrypted
div9_admin credentials.
===========================================================
*/

async function debugEvent(){


    if(!isLoggedIn){

        printLine(
        "UNKNOWN COMMAND",
        "error"
        );

        return;

    }


    await printLine(
    "[DEBUG] init_trace() -> ok",
    "system"
    );

    await sleep(400);


    await printLine(
    "[DEBUG] verifying session token...",
    "system"
    );

    await sleep(500);


    await printLine(
    "[DEBUG] token verification FAILED (0x22)",
    "error"
    );

    await sleep(600);


    await printLine(
    "[DEBUG] falling back to legacy auth table...",
    "system"
    );

    await sleep(700);


    await printLine(
    "--------------------------------------------------",
    "system"
    );

    await sleep(400);


    await printLine(
    "// NOTE (maintenance):",
    "warning"
    );

    await sleep(500);


    await printLine(
    "// found the old admin account in the code.",
    "warning"
    );

    await sleep(500);


    await printLine(
    "// i managed to hide it from plain view but",
    "warning"
    );

    await sleep(500);


    await printLine(
    "// it's still a viable backdoor.",
    "warning"
    );

    await sleep(700);


    await printLine(
    "--------------------------------------------------",
    "system"
    );

    await sleep(600);


    await printLine(
    "[DEBUG] legacy_table.entries -> 1 record found",
    "system"
    );

    await sleep(500);


    await printLine(
    "[DEBUG] decrypting legacy credentials...",
    "system"
    );

    await sleep(500);


    await printLine(
    "[DEBUG] cipher AES_256 -> key mismatch, retrying",
    "error"
    );

    await sleep(600);


    await printLine(
    "[DEBUG] fallback cipher accepted -> OK",
    "success"
    );

    await sleep(800);


    await printLine("");

    await printLine(
    "         // username: div9_admin",
    "success"
    );

    await printLine(
    "         // password: helios",
    "success"
    );

}



/*
===========================================================
FINALITY

Hidden command gated to clearanceLevel >= 2 (basilisk and
above - admin bypasses via isAdmin regardless of level).
Guest and div9_admin get plain UNKNOWN COMMAND, same as
petrify/debug's hidden treatment. Plays a short decrypt
sequence, then redirects to the sister site.
===========================================================
*/

async function finalityEvent(){


    if(!isAdmin && clearanceLevel < 2){

        printLine(
        "UNKNOWN COMMAND",
        "error"
        );

        return;

    }


    await printLine(
    "//-INITIATING FINAL SEQUENCE",
    "system"
    );

    await sleep(500);


    await printLine(
    "//-VERIFYING CLEARANCE...",
    "system"
    );

    await sleep(600);


    await printLine(
    "//-CLEARANCE CONFIRMED",
    "success"
    );

    await sleep(600);


    await printLine(
    "//-UNSEALING EXTERNAL ARCHIVE LINK",
    "system"
    );

    await sleep(700);


    await printLine(
    "//-DECRYPTING DESTINATION...",
    "warning"
    );

    await sleep(900);


    await printLine(
    "//-[REDIRECT AUTHORIZED]",
    "error"
    );

    await sleep(900);


    await printLine(
    "Redirecting...",
    "success"
    );

    await sleep(1200);


    window.location.href = "https://inkbleeder.github.io/EXOSHOCK_DIVISION-9_EVIDENCE_DIRECTORY/";

}



/*
===========================================================
FORCE IDLE (admin-only)

Manually triggers the idle banner on demand, bypassing the
IDLE_MS wait and the "screen must be empty" requirement.
Only works for the true admin account (isAdmin) - basilisk's
clearance does not grant this.
===========================================================
*/

function forceIdleCommand(){

    if(!isAdmin){

        printLine(
        "UNKNOWN COMMAND",
        "error"
        );

        return;

    }

    printLine(
    "FORCING IDLE BANNER",
    "warning"
    );

    showIdleBanner();

}



/*
===========================================================
IDLE BANNER

After IDLE_MS of no activity, a large ASCII logo fades in
and bounces around the screen like an old DVD screensaver -
but only if the terminal is currently empty (i.e. the
"clear" command has been used). Any keypress or click
dismisses it immediately and restarts the countdown.

To use a different logo, just replace the IDLE_BANNER string
below with any plain-text ASCII art (e.g. from an online
"figlet" generator) - no special format required.
===========================================================
*/

const IDLE_MS = 5 * 60 * 1000; // 5 minutes

const IDLE_BANNER_SPEED = 90; // pixels per second

const idleBannerEl   = document.getElementById("idle-banner");
const idleBannerText = document.getElementById("idle-banner-text");

const IDLE_BANNER =
`████  █████ █     █████ █   █    ████  █████ █   █       ████  
█   █ █     █     █     █  █     █   █   █   █   █       █   █ 
████  █████ █     █████ ███      █   █   █   █   █ █████ ████  
█   █     █ █         █ █  █     █   █   █   █   █           █ 
█   █     █ █         █ █   █    █   █   █    █ █            █ 
████  █████ █████ █████ █   █    ████  █████   █         ████  `;

let lastActivity = Date.now();
let idleBannerVisible = false;
let idleBounceFrame = null;

let bounceX = 0;
let bounceY = 0;
let bounceVX = IDLE_BANNER_SPEED;
let bounceVY = IDLE_BANNER_SPEED;
let lastFrameTime = 0;

// Cached geometry. Reading getBoundingClientRect() and rewriting the
// container's left/top/width/height on every animation frame forced a
// layout each frame, which on phones showed up as tearing. Measure
// once (and again on resize) and only touch transform per frame.
let idleTermRect = null;
let idleBannerRect = null;


function registerActivity(){

    lastActivity = Date.now();

    if(idleBannerVisible){

        hideIdleBanner();

    }

}


function showIdleBanner(){

    idleBannerVisible = true;

    // Treat showing the banner as activity too, so it doesn't
    // immediately re-trigger and instead waits another full
    // IDLE_MS before it can appear again.
    lastActivity = Date.now();

    idleBannerText.textContent = IDLE_BANNER;

    // Clear any shrink-to-fit font-size left over from a previous
    // showing before measuring below, so that measurement reflects
    // the banner's natural (CSS clamp()) size, not last time's
    // already-shrunk size.
    idleBannerText.style.fontSize = "";

    idleBannerEl.classList.add("visible");

    playSound("idle");


    // Confine the banner to the console's own box, not the whole
    // browser window - position and size the banner container to
    // exactly match #terminal, then clip anything outside it.
    let terminalRect = document.getElementById("terminal").getBoundingClientRect();

    idleBannerEl.style.left   = terminalRect.left   + "px";
    idleBannerEl.style.top    = terminalRect.top    + "px";
    idleBannerEl.style.width  = terminalRect.width  + "px";
    idleBannerEl.style.height = terminalRect.height + "px";


    // On a narrow phone, clamp()'s own floor plus the banner's
    // fixed letter-spacing can still add up to wider (or taller)
    // than the box itself, which is why it wasn't rendering
    // properly on mobile - shrink it further, in JS, until it
    // actually fits.
    fitIdleBannerToBox(terminalRect);


    // Start somewhere inside the console, moving in a random direction.
    let bannerRect = idleBannerText.getBoundingClientRect();

    idleTermRect = terminalRect;
    idleBannerRect = bannerRect;

    bounceX = Math.random() * Math.max(terminalRect.width  - bannerRect.width,  0);
    bounceY = Math.random() * Math.max(terminalRect.height - bannerRect.height, 0);

    let angle = Math.random() * Math.PI * 2;

    bounceVX = Math.cos(angle) * IDLE_BANNER_SPEED;
    bounceVY = Math.sin(angle) * IDLE_BANNER_SPEED;

    lastFrameTime = performance.now();

    idleBounceFrame = requestAnimationFrame(stepBounce);

}


// Shrinks idleBannerText's font-size (if needed) so the ASCII art
// actually fits inside the terminal box on both axes. clamp()'s CSS
// floor is a reasonable default for most screens, but on a narrow
// phone the fixed 2px letter-spacing alone can push the natural
// width past the available space - this catches that case
// directly by measuring, instead of guessing at more breakpoints.
function fitIdleBannerToBox(terminalRect){

    let computed = getComputedStyle(idleBannerText);

    let baseFontSize = parseFloat(computed.fontSize);

    let naturalRect = idleBannerText.getBoundingClientRect();

    let padding = 24; // small margin off the box edges

    let availableWidth  = Math.max(terminalRect.width  - padding, 10);
    let availableHeight = Math.max(terminalRect.height - padding, 10);

    let scale = Math.min(
        1,
        availableWidth  / naturalRect.width,
        availableHeight / naturalRect.height
    );

    if(scale < 1){

        // Whole pixels only - fractional font sizes make the block
        // glyphs render with seams between rows on some phones.
        idleBannerText.style.fontSize = Math.max(Math.floor(baseFontSize * scale), 4) + "px";

    }

}


function stepBounce(now){

    let dt = (now - lastFrameTime) / 1000;

    lastFrameTime = now;


    let maxX = idleTermRect.width  - idleBannerRect.width;
    let maxY = idleTermRect.height - idleBannerRect.height;


    bounceX += bounceVX * dt;
    bounceY += bounceVY * dt;


    if(bounceX <= 0){

        bounceX = 0;

        bounceVX = Math.abs(bounceVX);

    }
    else if(bounceX >= maxX){

        bounceX = maxX;

        bounceVX = -Math.abs(bounceVX);

    }


    if(bounceY <= 0){

        bounceY = 0;

        bounceVY = Math.abs(bounceVY);

    }
    else if(bounceY >= maxY){

        bounceY = maxY;

        bounceVY = -Math.abs(bounceVY);

    }


    // Rounded to whole pixels + translate3d (own compositor layer)
    // so the text isn't re-rasterised at sub-pixel offsets.
    idleBannerText.style.transform =
        `translate3d(${Math.round(bounceX)}px, ${Math.round(bounceY)}px, 0)`;


    if(idleBannerVisible){

        idleBounceFrame = requestAnimationFrame(stepBounce);

    }

}


// Re-measure if the viewport changes while the banner is up
// (phone rotation, URL bar showing/hiding).
window.addEventListener("resize", ()=>{

    if(!idleBannerVisible) return;

    let r = document.getElementById("terminal").getBoundingClientRect();

    idleBannerEl.style.left   = r.left   + "px";
    idleBannerEl.style.top    = r.top    + "px";
    idleBannerEl.style.width  = r.width  + "px";
    idleBannerEl.style.height = r.height + "px";

    idleBannerText.style.fontSize = "";

    fitIdleBannerToBox(r);

    idleTermRect = r;
    idleBannerRect = idleBannerText.getBoundingClientRect();

});

// Touch counts as activity too (scrolling on a phone fires no
// keypress or click).
document.addEventListener("touchstart", ()=>{ registerActivity(); }, { passive:true });


function hideIdleBanner(){

    idleBannerVisible = false;

    idleBannerEl.classList.remove("visible");

    if(idleBounceFrame){

        cancelAnimationFrame(idleBounceFrame);

        idleBounceFrame = null;

    }

    // Stop the looping idle track and reset it so it starts
    // from the beginning the next time the banner appears.
    sounds.idle.pause();

    sounds.idle.currentTime = 0;

}


setInterval(()=>{

    let idleFor = Date.now() - lastActivity;

    if(

        !idleBannerVisible
        &&
        !(typeof blackjackActive === "function" && blackjackActive())
        &&
        idleFor >= IDLE_MS

    ){

        showIdleBanner();

    }

}, 3000);



/*
===========================================================
CLICK TO FOCUS
===========================================================
*/


document.body.onclick=()=>{

    input.focus();

    startAmbience();

    unlockIdleAudio();

    registerActivity();

};
