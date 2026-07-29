Put your .wav files in this folder with these exact names:

  startup.wav    -> plays once when the terminal boots up
  keypress.wav   -> plays once per keystroke while typing
  success.wav    -> plays on successful login / credits command
  error.wav      -> plays on general errors (unknown command,
                    file not found, "login required")
  loginerror.wav -> plays specifically when a login attempt
                    fails (wrong username/password)

terminal.js points at these paths already:
  audio/startup.wav
  audio/keypress.wav
  audio/success.wav
  audio/error.wav
  audio/loginerror.wav

If you want different filenames, edit the sounds.*.src lines
near the top of terminal.js to match.

NOTE ON AUTOPLAY: most browsers block audio from playing
before the user has interacted with the page at all (no
click, no keypress yet). This means the startup.wav sound
may not actually play on page load in some browsers - it's
a browser security restriction, not a bug in the code. It
will always play correctly on second+ loads/refreshes if the
user already interacted with the tab, and everything after
the first keystroke works normally either way.
