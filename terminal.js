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
    success:        "audio/success.wav"

};

const SOUND_VOLUME = {

    startup:        1,
    keypress:       0.6,
    error:          1,
    loginerror:     1,
    ambience:       0.25,
    loginsuccess:   1,
    success:        1

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
autoplaying before that). Volume is set via SOUND_VOLUME
above ("ambience" key).
===========================================================
*/

let ambienceStarted = false;

sounds.ambience.loop = true;


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

    "Lead Developer   :  YOUR NAME HERE",

    "Writing / Lore   :  YOUR NAME HERE",

    "Additional Thanks:  YOUR NAME HERE",

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

            playSound("loginsuccess");

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

        hasClearance=true;

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

    isLoggedIn=false;

    isAdmin=false;

    hasClearance=false;

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


        playSound("success");

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

        playSound("success");

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
