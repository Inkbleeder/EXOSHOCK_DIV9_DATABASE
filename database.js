/*
===========================================================
BSLSK DIVISION-9 DATABASE

database.js

Contains all archived lore entries.

Entry names must be lowercase.
Terminal searches these keys.

---------------------------------------------------------
HOW TO ADD A NEW ENTRY:

Copy this block, paste it inside the database object,
and fill it in. A brand new category name (anything you
type) automatically becomes a real, searchable category -
there is no separate list to update. The same goes for
subcategory - it's entirely optional, and typing any new
name for it automatically creates that subcategory too.

"your entry key": {

    category: "Category Name",

    subcategory: "Optional Subcategory Name",

    locked: false,

    content:
    `
    Your text here.
    `

},

Leave out the "subcategory" line entirely if an entry
doesn't need one - it'll just show up directly under its
main category like before, no different than today.

Typing 'database' in the terminal will then show:

[CATEGORY NAME]
    [OPTIONAL SUBCATEGORY NAME]
    N FILES
    N HIDDEN / LOCKED

Typing 'read <category name>' lists every entry in that
category (regardless of subcategory).
Typing 'read <subcategory name>' lists only the entries in
that specific subcategory.
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

category: "Factions",

locked: false,

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

category: "Factions",

locked: false,

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

category: "Projects",

locked: false,

content:
`
FILE ID: PROJECT COVET

CLASSIFICATION:
DIVISION 9 PROTOTYPE WARFARE PROJECT

---------------------------------------

ERROR 0xA143

FILE STATUS:
EXISTS

DOCUMENT STATUS:
UNAVAILABLE

---------------------------------------

Possible causes:

> FILE CORRUPTION

> ARCHIVE FAILURE

> CLEARANCE MISMATCH

> DOCUMENT PENDING RECOVERY


Recovery attempt failed.

Further access requires administrator clearance.
`

}



};
