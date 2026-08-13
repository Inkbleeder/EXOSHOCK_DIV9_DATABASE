/*
===========================================================
BSLSK DIVISION-9 DATABASE

database.js

Contains all archived lore entries.

Every entry needs a unique KEY (the quoted text right before
the { - can be anything, any case, doesn't need to be
lowercase anymore) and a TITLE (what actually displays and
what people type into 'read'). The key just needs to exist
and be unique - think of it as an internal filing number
nobody ever has to type. The title is what matters day to
day, and titles CAN repeat across different entries (see
DUPLICATE TITLES below).

---------------------------------------------------------
HOW TO ADD A NEW ENTRY:

Copy this block, paste it inside the database object,
and fill it in. A brand new category name (anything you
type) automatically becomes a real, searchable category -
there is no separate list to update. The same goes for
subcategory - it's entirely optional, and typing any new
name for it automatically creates that subcategory too.

"a-unique-internal-key": {

    title: "What Actually Displays",

    category: "Category Name",

    subcategory: "Optional Subcategory Name",

    clearance: 0,

    content:
    `
    Your text here.
    `

},

Leave out the "subcategory" line entirely if an entry
doesn't need one - it'll just show up directly under its
main category like before, no different than today.

DUPLICATE TITLES:

Two entries CAN share the same title (e.g. two different
entries both titled "Other"), as long as they're in
different categories or subcategories. If someone types
'read Other' and it's ambiguous, the terminal lists which
categories have a match and tells them to be specific:

    'read <category name> <title>'

    e.g. 'read Factions Other' vs 'read Projects Other'

If two entries share BOTH a title AND a category/subcategory,
there's no way to tell them apart anymore - avoid that.

CLEARANCE LEVELS - how locked an entry is:

    0 = anyone logged in can read it (default - this is
        what every entry above uses)
    1 = requires the div9_admin account or higher
    2 = requires the basilisk account or higher
    3 = the true admin account only (admin bypasses every
        level automatically, so 3 is really just "nobody
        else will ever see this")

Typing 'database' in the terminal will then show:

[CATEGORY NAME]
    [OPTIONAL SUBCATEGORY NAME]
    N FILES
    N HIDDEN / LOCKED

Typing 'read <category name>' lists every entry in that
category (regardless of subcategory) BY TITLE.
Typing 'read <subcategory name>' lists only the entries in
that specific subcategory, also by title.
Typing 'read <title>' opens that entry directly if the title
is unique - see DUPLICATE TITLES above if it isn't.
---------------------------------------------------------
===========================================================
*/


const database = {


/*
===========================================================
ZETA-1 VEIL
===========================================================
*/

"zeta-1 veil": {

title: "Zeta-1 Veil",

category: "Projects",

clearance: 1,

content:
`
FILE ID: ZETA-1 VEIL

CLASSIFICATION:
PROJECT COVET PROTOTYPE UNIT 1 OF [REDACTED]

---------------------------------------

Zeta 1 "Veil" was the first of four prototype units
under the project name "Covet".

During the early days of BSLSK, it was realized that
standard efficiency was not always enough.

A new type of psychological weapon was required.

Something capable of not only defeating a target,
but terrifying them.

Thus Project "Covet" was created.

---------------------------------------

Zeta 1, codenamed "Veil", was the first attempt.

Utilizing the then-new MK2 suits in non-standard
prototype black, the four "Veil" operatives were
trained to operate in their new environment.

Their doctrine focused on:

- Psychological warfare
- Close Quarters Combat
- Rapid deployment
- Fear-based suppression

Plasma rifles and experimental rail guns were issued
to neutralize resistance and leave survivors with
a warning.

The resulting battlefield effects became their
calling card.

Charred remains.

Destroyed defenses.

And survivors unable to explain what they saw.

---------------------------------------

Their preference for fast movements and defensive
holds earned them the names:

"Unmoving Shadows"

and

"Advancing Veil"

The latter eventually became the unit's official
designation.

Voice modulators were custom-built to further
reinforce the illusion of an unstoppable entity.

---------------------------------------

In recent years, Project "Covet" has been officially
terminated.

BSLSK has lost contact with all assets attached:

[ZETA_1_VEIL]

[REDACTED]

[REDACTED]

[REDACTED]

Rumors of continued operation remain common among
standardized squads.

No official evidence has confirmed these claims.
`

},





/*
===========================================================
DEATHSEEKERS
===========================================================
*/


"deathseekers": {

title: "Deathseekers",

category: "Projects",

clearance: 1,

content:
`
FILE ID: DEATHSEEKERS

STATUS:
PROJECT COVET PROTOTYPE UNIT 2

---------------------------------------

Death Seekers represent the most unstable category
of BSLSK operatives.

Unlike standard soldiers, Death Seekers do not merely
survive war.

They thrive within it.

---------------------------------------

Personnel records indicate varied backgrounds.

Former criminals.

Convicted killers.

Extreme-risk individuals.

Individuals who display abnormal reactions toward
danger and mortality.

Many actively seek situations considered
unacceptable for normal deployment.

---------------------------------------

Death Seekers serve as one of BSLSK's final lines
of defense.

Their effectiveness comes from their willingness
to operate where others refuse.

However, this same trait creates significant
disciplinary issues.

Unauthorized deployments are common.

Command intervention is frequently required.

---------------------------------------

Despite these concerns, Death Seekers remain
hand-selected by BSLSK higher command.

Their purpose remains:

Maintain order.

Remove threats.

Complete objectives regardless of cost.
`

},





/*
===========================================================
PROJECT COVET
===========================================================
*/


"project covet": {

title: "Project Covet",

category: "Projects",

clearance: 1,

content:
`
FILE ID: PROJECT COVET

CLASSIFICATION:
DIVISION 9 PROTOTYPE WARFARE PROJECT

ERROR 0xA143

FILE STATUS:
EXISTS

DOCUMENT STATUS:
UNAVAILABLE
`

},




/*
===========================================================
BSLSK - DIVISION 9
===========================================================
*/


"division 9 main description": {

title: "Division 9 Main Description",

category: "BSLSK",

subcategory: "Division 9",

clearance: 0,

content:
`
Division 9 is the "Field Operations" division. These are operations which occur well outside the official scope of BSLSK's corporate jurisdiction, and are often incursions into the clearly demarcated boundaries of the operational territories claimed by another factional entity. These entities may even ostensibly be allied or aligned with BSLSK.

The actions carried out by Division 9 are, therefore, largely those kinds of dangerous and extra-legal enterprises which the conglomerate wants to be able to disavow completely. The division's existence itself is not a secret, but to external investigators its primary purpose is represented as a kind of auxiliary, general-purpose military resource.

In reality, the division specializes in black-ops, grey-ops, sabotage, suicide missions, political destabilization, and any number of other undertakings which help tip balances of power in the conglomerate's favor.

The majority of Field Operatives in Div9 are essentially indentured soldiers, allowed to maintain a pretense of a mercenary culture or military brotherhood. Most of these soldiers are born and bred within Div9's carefully managed breeding program, but the division also serves as a convenient terminus for BSLSK assets who don't fit in anywhere else, or who are predicted to cause conflict.
`

},



"other offices div9": {

title: "Other Offices",

category: "BSLSK",

subcategory: "Division 9",

clearance: 0,

content:
`
Division 9 has a skeleton crew of administrative staff. Most of the larger operation, management, and resource allocation is handled by other divisions, but a core group of a hundred or so admins are assigned directly to Div 9, and are able to directly address more specific and immediate details.

The executive role for Division 9 often remains unfilled for long periods of time. During these times, Helios (see: Helios Compliance Engine) will function as the executive. When someone does occupy the executive position, that individual is likely to have been given the role by Helios, and Helios will take responsibility for most of the high-level decisions.

It is not known why Helios takes such an active involvement in this division, as the other divisions it oversees are arguably considerably higher within the conglomerate's hierarchy of organizational sectors. One possible explanation, though, is that [REDACTED]
`

},



"div_9 database": {

title: "Div_9 Database",

category: "BSLSK",

subcategory: "Division 9",

clearance: 0,

content:
`
This database is an informational archive for the directives and protocols of Division 9. It is maintained by the division's administrative staff and is largely inaccessible to the Field Operatives themselves (a separate, edited database is made available to them).

The entries in this archive are only as complete as is necessary for admins to discharge their responsibilities. This is partially the result of much of the information being purged by [REDACTED] after [REDACTED]

The acquisition or sharing of information not currently included in this database is strongly discouraged.
`

},




/*
===========================================================
BSLSK - DIVISION 7
===========================================================
*/


"division 7 main description": {

title: "Division 7 Main Description",

category: "BSLSK",

subcategory: "Division 7",

clearance: 0,

content:
`
Division 7 is the "Commutable Personnel" division, the majority of which is composed of massive populations of more-or-less slave labor, shuttled in and out of cryogenic sleep at the whim of the corporation. There are few endeavors which can't be handled with more skill and for less cost by using robotics, and those few require incredible amounts of disposable manpower to be profitable.

Division 7 is one of the least glamorous divisions that someone in a managerial or administrative role could find themselves in. Being one of the workers themselves is arguably one of the most miserable existences within the BSLSK corporate structure (with the possible exception of the experimental subjects in [REDACTED].
`

},



"other offices div7": {

title: "Other Offices",

category: "BSLSK",

subcategory: "Division 7",

clearance: 0,

content:
`
Division 7 has a moderate managerial and administrative layer which serves to manage the human resources. Many small offices exist for specialized purposes, including protein production, breeding management, cryo storage, and body disposal. There is no executive position overseeing Div7, as the division does not need to be steered by strategic decision-making, but merely maintained. Helios (see: Helios Compliance Engine) serves as the executive in charge of Div7.
`

},



"division 9 transfer protocols": {

title: "Division 9 Transfer Protocols",

category: "BSLSK",

subcategory: "Division 7",

clearance: 0,

content:
`
There exists a small but seldom used pipeline between Division 7 and Division 9 (see: Division 9, Field Operatives and Operations). This pipeline is largely used as a pressure release valve, siphoning off individuals who would otherwise cause trouble or endanger their fellow workers through hopelessness-induced carelessness.

Any Div 7 employee of any age may apply for a transfer to Division 9. They will need to make several recorded statements acknowledging their understanding of the likelihood of bodily harm or death as a result of their assignments once transferred. A provisional approval from Helios (see: Helios Compliance Engine) will be followed by the required step of a successful completion of a basic skill assessment exercise.

Failure to complete this exercise results in transfer back to Division 7, combined with an increased allocation of hazard duties and a rations reduction.
`

},




/*
===========================================================
BSLSK - HELIOS COMPLIANCE ENGINE
===========================================================
*/


"function": {

title: "Function",

category: "BSLSK",

subcategory: "Helios Compliance Engine",

clearance: 0,

content:
`
Helios ("HCE", or merely "Compliance") is a semi-independent digital intelligence which operates a vast network of quality control assessments, strategic planning, policy enforcement, and internal surveillance across and within all divisions. Helios is not an executive agent or management coordinator, although the actions it performs are often aligned with those roles. Instead it functions as an overarching superego for all activities, separate and intersecting, conducted by the BSLSK conglomerate.
`

},



"history": {

title: "History",

category: "BSLSK",

subcategory: "Helios Compliance Engine",

clearance: 0,

content:
`
Unknown and/or unreliable data. Helios came online two to three centuries before this database was compiled. Executive databases may have more information.
`

},



"other bslsk helios": {

title: "Other",

category: "BSLSK",

subcategory: "Helios Compliance Engine",

clearance: 0,

content:
`
Over time, BSLSK personnel have developed identities which they project onto Helios, depending on their interactions with it. This projection is neither encouraged or discouraged.
`

},




/*
===========================================================
BSLSK - FIELD OPERATIVES AND OPERATIONS
===========================================================
*/


"suit information": {

title: "Suit Information",

category: "BSLSK",

subcategory: "Field Operatives and Operations",

clearance: 0,

content:
`
ERROR 0xA143

FILE STATUS:
EXISTS

DOCUMENT STATUS:
UNAVAILABLE
`

},



"purpose": {

title: "Purpose",

category: "BSLSK",

subcategory: "Field Operatives and Operations",

clearance: 0,

content:
`
Div9 Field Operatives are used for black-ops, grey-ops, sabotage, suicide missions, and any other work which the conglomerate wants to be able to disavow. They are skilled and well-equipped, although at an individual they are more disposable than the military or subversion units in some of the other divisions. The structure of the Field Operatives positions them in a mercenary role, and they are allowed to choose missions among any number of ongoing projects being advanced by BSLSK.
`

},



"contracts": {

title: "Contracts",

category: "BSLSK",

subcategory: "Field Operatives and Operations",

clearance: 0,

content:
`
Missions are compiled by Helios (see: Helios Compliance Engine) and made available to the D9 operatives. These missions cover a wide spectrum of imperatives, including, but not limited to, sabotage, vessel elimination, asset extraction, asset insertion, responding to distress calls, data theft or corruption, destruction of research or prototypes, diversions, cover-ups and clean-up tasks, privateering, targeted assassination, and false-flag operations. Operatives may be used as the tip of the spear in one mission, and then be used as sand thrown in the face on the next.

Most of the missions that lower-ranking Div9 operatives are given aren't mission critical at the larger level of conglomerate operations, but instead are intended often meant simply to exert pressure in the service of ongoing agendas or to exploit vulnerabilities and opportunities as they arise. Successful execution of a mission is always helpful, but failure is not disastrous to the pursuance of any executive level goals. They are also used as immediately deployable rapid response teams for unexpected or developing situations. That being said, Helios has been known to assign critical missions to Division 9 in order to conceal their importance (from infiltrators spying for other forces or for unknown internal purposes). The operatives would not be aware that the mission is any different from their normal assignments until afterwards (and possibly not even then).

Operatives who refuse to volunteer frequently enough for missions will be given a more and more dangerous selection of missions. An operative who refuses missions entirely will be drugged and then wake up to find themselves on a mission-bound out-going dropship (or they will be simply liquidated).
`

},



"ranks": {

title: "Ranks",

category: "BSLSK",

subcategory: "Field Operatives and Operations",

clearance: 0,

content:
`
ERROR 0xA143

FILE STATUS:
EXISTS

DOCUMENT STATUS:
UNAVAILABLE
`

},



"zephyr constructs": {

title: "Zephyr Constructs",

category: "BSLSK",

subcategory: "Field Operatives and Operations",

clearance: 0,

content:
`
Zephyrs are the latest automatons in the BSLSK "construct" product line. Alpha Constructs were their first successful product in this line, and there are a number of other very successful products, some of which are designed for specialized functions. The Zephyr is by far the most advanced of these products, though, and in fact has not been made available for general sale. Except for very special clients, ZCs are used exclusively by BSLSK. They are used in many divisions, but they are an especially good fit for the types of tasks carried out by Div9. However, given the dynamic, chaotic, and often brutal nature of Div9 missions, they are not a replacement for humans or human-led teams.
`

},



"other bslsk field operations": {

title: "Other",

category: "BSLSK",

subcategory: "Field Operatives and Operations",

clearance: 0,

content:
`
ERROR 0xB378

FILE STATUS:
REDACTED

DOCUMENT STATUS:
REDACTED
`

}



};
