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
BOOT SEQUENCE
===========================================================
*/

window.onload = () => {

    document.getElementById("terminal").style.visibility = "visible";

    input.disabled = true;

    bootSequence();

};



async function bootSequence(){

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


    if(event.key !== "Enter")
        return;


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




        default:

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

        printLine(
        "Authenticating...",
        "system"
        );


        setTimeout(()=>{

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


    printLine(
    "ERROR 0xA143",
    "error"
    );


    printLine(
    "FILE NOT FOUND",
    "error"
    );


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

};
