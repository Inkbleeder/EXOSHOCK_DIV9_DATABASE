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
        "Type 'login <username> <password>'",
        "system"
    );

    await printLine(
        "Guest Access Available: veil / covet248",
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


function printLine(text, type=""){

    return new Promise(resolve=>{

        let line = document.createElement("div");

        line.className = type;

        line.innerText = text;

        feed.appendChild(line);

        feed.scrollTop = feed.scrollHeight;


        setTimeout(resolve,20);

    });

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
                "read <entry>"
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



    printLine(
    "ACCESS DENIED",
    "error"
    );


}




function logout(){

    isLoggedIn=false;

    isAdmin=false;

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
    "DATABASE INDEX:",
    "success"
    );


    Object.keys(database).forEach(entry=>{

        printLine(
        `[${entry.toUpperCase()}]`
        );

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



    if(!database[name]){


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



    await loading(
    "Opening archive"
    );


    await loading(
    "Decrypting file"
    );


    printLine(
    database[name]
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
