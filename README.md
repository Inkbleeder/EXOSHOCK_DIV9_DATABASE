Put your .wav files in this folder with these exact names:

  startup.wav    -> plays once when the terminal boots up
  keypress.wav   -> plays once per keystroke while typing
  success.wav    -> plays on successful login / credits command
  error.wav      -> plays on general errors (unknown command,
                    file not found, "login required")
  loginerror.wav -> plays specifically when a login attempt
                    fails (wrong username/password)
  ambience.wav   -> quiet looping background track, starts on
                    the user's first click or keypress

terminal.js points at these paths already:
  audio/startup.wav
  audio/keypress.wav
  audio/success.wav
  audio/error.wav
  audio/loginerror.wav
  audio/ambience.wav

If you want different filenames, edit the sounds.*.src lines
near the top of terminal.js to match.

ADJUSTING AMBIENCE VOLUME: near the top of terminal.js there's
a line "const AMBIENCE_VOLUME = 0.25;" - change that number
(0 = silent, 1 = full volume) to taste.

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
