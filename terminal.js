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
let hasClearance = false;
let currentUser = "GUEST";


const feed = document.getElementById("terminal-output");
const input = document.getElementById("command-input");
const status = document.getElementById("connection-status");


/*
===========================================================
AUDIO

Drop your .wav files into an /audio folder next to
index.html, using these filenames (or change the paths
below to match whatever you name them):

  audio/startup.wav    -> plays once when the terminal boots
  audio/keypress.wav   -> plays once per keystroke
  audio/success.wav    -> plays on successful login / credits
  audio/error.wav      -> plays on general errors (unknown
                          command, file not found, must-login)
  audio/loginerror.wav -> plays specifically on failed login
                          (wrong username/password)
===========================================================
*/

const sounds = {

    startup: document.getElementById("startup"),

    keypress: document.getElementById("keypress"),

    success: document.getElementById("success"),

    error: document.getElementById("error"),

    loginerror: document.getElementById("loginerror"),

    ambience: document.getElementById("ambience")

};

sounds.startup.src    = "audio/startup.wav";
sounds.keypress.src   = "audio/keypress.wav";
sounds.success.src    = "audio/success.wav";
sounds.error.src      = "audio/error.wav";
sounds.loginerror.src = "audio/loginerror.wav";
sounds.ambience.src   = "audio/ambience.wav";


// If a wav file is missing, misnamed, or in a format the
// browser can't decode, log which one so it's easy to spot
// instead of failing completely silently.
Object.keys(sounds).forEach(name=>{

    sounds[name].addEventListener("error", ()=>{

        console.warn(

            `[audio] "${name}" failed to load - check that ` +
            `audio/${name}.wav exists and is a valid wav file.`

        );

    });

});


function playSound(name){

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
BACKGROUND AMBIENCE

A quiet looping track that starts on the user's first
interaction with the page (browsers block audio from
autoplaying before that). Adjust AMBIENCE_VOLUME below to
taste - 0 is silent, 1 is full volume.
===========================================================
*/

const AMBIENCE_VOLUME = 0.25;

let ambienceStarted = false;

sounds.ambience.loop = true;
sounds.ambience.volume = AMBIENCE_VOLUME;


function startAmbience(){

    if(ambienceStarted) return;

    ambienceStarted = true;

    sounds.ambience.play().catch(()=>{

        // Autoplay still blocked (rare) - try again on the
        // next interaction instead of giving up permanently.
        ambienceStarted = false;

    });

}



/*
===========================================================
SECRET CREDITS COMMAND

Not listed in "help" - only discoverable if a database
entry tells the player the command word. Change
CREDITS_COMMAND to whatever word you plant in that entry,
and edit the CREDITS_TEXT array with your contributors.
===========================================================
*/

const CREDITS_COMMAND = "manifest";

const CREDITS_TEXT = [

    "// DIVISION-9 ARCHIVE - CONTRIBUTOR MANIFEST",

    "",

    "Lead Developer   :  ZETA-1 INK",

    "Writing / Lore   :  SHEPHARD42, ZETA-1 INK, SKETCHY, NIMBLEBEAR"

    "Sound effects and Audio : NIMBLEBEAR, SKETCHY

    "Additional Thanks:  EDUARDO, SCOTT, NICKB, EXOSHOCK",

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

        "theme-admin",

        "theme-basilisk"

    );

    if(user === "DIV9_GUEST"){

        document.body.classList.add("theme-div9guest");

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


function printLine(text, type=""){

    return new Promise(resolve=>{

        printQueue.push({ text, type, resolve });

        if(!isPrinting){

            processQueue();

        }

    });

}


async function processQueue(){

    isPrinting = true;

    while(printQueue.length > 0){

        let item = printQueue.shift();

        let line = document.createElement("div");

        line.className = item.type;

        feed.appendChild(line);


        for(let i=0; i<=item.text.length; i++){

            line.textContent = item.text.slice(0,i);

            feed.scrollTop = feed.scrollHeight;

            await sleep(TYPE_SPEED);

        }


        item.resolve();

    }

    isPrinting = false;

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


input.addEventListener(
"keydown",
async function(event){


    startAmbience();


    if(event.key !== "Enter"){

        playSound("keypress");

        return;

    }


    let commandLine=this.value.trim();


    if(commandLine==="")
        return;


    await printLine(
        `${currentUser}@DATABASE:> ${commandLine}`,
        "system"
    );


    this.value="";


    execute(commandLine);


});




/*
===========================================================
COMMAND SYSTEM
===========================================================
*/


async function execute(text){


    let args=text.split(" ");

    let command=args[0].toLowerCase();



    switch(command){


        case "clear":

            feed.innerHTML="";

        break;



        case "help":

            if(!isLoggedIn){

                printLine(
                "Available commands:",
                "success"
                );

                printLine(
                "login <username> <password>"
                );

                printLine(
                "clear"
                );

            }

            else{

                printLine(
                "Available commands:",
                "success"
                );

                printLine(
                "database"
                );

                printLine(
                "read <entry / category>"
                );

                printLine(
                "whoami"
                );

                printLine(
                "logout"
                );

                printLine(
                "clear"
                );

            }

        break;



        case "login":

            login(args[1],args[2]);

        break;



        case "logout":

            logout();

        break;



        case "whoami":

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



        case "petrify":

            petrifyEvent();

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

        currentUser="DIV9_GUEST";


        status.innerText="SECURE";

        applyTheme(currentUser);

        printLine(
        "Authenticating...",
        "system"
        );


        setTimeout(()=>{

            playSound("success");

            printLine(
            "ACCESS GRANTED",
            "success"
            );

            printLine(
            "Welcome DIV9_GUEST."
            );

        },700);


        return;

    }



    if(
        user === "admin"
        &&
        pass === "override"
    ){

        isLoggedIn=true;

        isAdmin=true;

        hasClearance=true;

        currentUser="ADMIN";

        applyTheme(currentUser);

        playSound("success");

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

        hasClearance=true;

        currentUser="BASILISK";

        applyTheme(currentUser);

        playSound("success");

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

    isLoggedIn=false;

    isAdmin=false;

    hasClearance=false;

    currentUser="GUEST";


    status.innerText="ONLINE";

    applyTheme(currentUser);


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



    printLine(
    "DATABASE INDEX - CATEGORIES:",
    "success"
    );


    let categories = {};


    Object.values(database).forEach(entry=>{

        if(!categories[entry.category]){

            categories[entry.category] = {

                total: 0,

                locked: 0

            };

        }


        categories[entry.category].total++;


        if(entry.locked){

            categories[entry.category].locked++;

        }

    });


    Object.keys(categories).forEach(cat=>{

        printLine(
        `[${cat.toUpperCase()}]`
        );

        printLine(
        `${categories[cat].total} FILES`
        );

        if(categories[cat].locked > 0){

            printLine(
            `${categories[cat].locked} HIDDEN / LOCKED`,
            "warning"
            );

        }

    });


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



    let direct = database[name];


    if(direct && (!direct.locked || hasClearance)){

        await loading(
        "Opening archive"
        );


        await loading(
        "Decrypting file"
        );


        printLine(
        direct.content
        );


        return;

    }



    let matches = Object.keys(database).filter(entry=>

        database[entry].category.toLowerCase()
        ===
        name.toLowerCase()
        &&
        (
            !database[entry].locked
            ||
            hasClearance
        )

    );


    if(matches.length > 0){

        printLine(
        `CATEGORY: ${name.toUpperCase()}`,
        "success"
        );

        matches.forEach(entry=>{

            printLine(
            `[${entry.toUpperCase()}]`
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
CLICK TO FOCUS
===========================================================
*/


document.body.onclick=()=>{

    input.focus();

    startAmbience();

};
