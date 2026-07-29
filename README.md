Put your .wav files in this folder with these exact names:

  startup.wav      -> plays once when the terminal boots up
  keypress.wav     -> plays once per keystroke while typing
  error.wav        -> general errors (unknown command, file
                      not found, "login required")
  loginerror.wav   -> failed login attempt (wrong user/pass)
  ambience.wav     -> quiet looping background track, starts
                      on the user's first click or keypress
  loginsuccess.wav -> plays on ANY successful login (whether
                      it's div9, admin, or basilisk)
  success.wav      -> plays whenever any other command
                      completes successfully: whoami, database,
                      read (whether it opens a file or lists a
                      category), logout, and the secret credits
                      command. Any future successful command
                      you add will use this one too, unless you
                      give it its own dedicated sound + entry.

terminal.js points at these paths already (see the
SOUND_FILES object near the top of the file). If you want
different filenames, edit that object to match.

ADJUSTING VOLUME PER SOUND: near the top of terminal.js
there's a SOUND_VOLUME object listing every sound with a
number from 0 (silent) to 1 (full volume) - edit any of
those numbers to balance the mix to your taste.

TROUBLESHOOTING A SOUND THAT DOESN'T PLAY:
Open the browser dev console (F12 -> Console tab) and reload
the page. If a file is missing, misnamed, or in a format the
browser can't decode, you'll see a warning like:
  [audio] "keypress" failed to load - check that audio/keypress.wav exists...
That tells you exactly which file to fix. Common causes:
  - filename typo or wrong case (GitHub Pages is case-sensitive)
  - the wav file uses an unusual encoding (e.g. 32-bit float,
    ADPCM, or a very unusual sample rate) that the browser
    can't decode - re-export as standard 16-bit PCM if so
  - the file didn't actually get committed/pushed to the repo

NOTE ON AUTOPLAY: most browsers block audio from playing
before the user has interacted with the page at all (no
click, no keypress yet). startup.wav and ambience.wav are
affected by this - they may not play until the user's first
click or keystroke. This is a browser security restriction,
not a bug in the code.
