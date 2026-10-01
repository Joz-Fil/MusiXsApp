# MusiXs App — Proposed System Checklist

```
Legend:   __✓_  = implemented        ____  = not yet implemented


__✓_ a. Splash/Intro module

          __✓_ a.1. Animated app introduction screen

          __✓_ a.2. Auto-redirect to the main menu after the intro

__✓_ b. Sign-In/Log-in module

          __✓_ b.1. Log-in using username and password

          __✓_ b.2. Input validation and error prompts

          __✓_ b.3. Remember session / auto sign-in (saved session)

          __✓_ b.4. Log-out

          ____ b.5. Forgot password

          ____ b.6. Password retrieval (e-mail / OTP verification)

          ____ b.7. Change password

          ____ b.8. Improved cloud login / social sign-in

__✓_ c. Registration module

          __✓_ c.1. Create account with username and password

          __✓_ c.2. Password confirmation and minimum-length validation

          __✓_ c.3. Duplicate username checking

          __✓_ c.4. Secure password storage (salted hash)

          ____ c.5. E-mail verification upon registration

__✓_ d. Home/Main Menu module

          __✓_ d.1. Navigation buttons to all modules (Learn, Build, Guess, History, Settings, Profile)

          __✓_ d.2. Bottom navigation bar

          __✓_ d.3. Background menu music

__✓_ e. Learn Chord module

          __✓_ e.1. Interactive chord/note explorer (tap and listen)

          __✓_ e.2. Real-time audio playback of selected notes

__✓_ f. Build Chord module

          __✓_ f.1. Interactive note selection (note grid)

          __✓_ f.2. Play notes while building the chord

          __✓_ f.3. Submit the built chord for identification

__✓_ g. Chord Result module

          __✓_ g.1. Display the identified chord and its notes

          __✓_ g.2. Audio playback of the built chord

          __✓_ g.3. Build another chord / navigate back

__✓_ h. Guess Chord module (Quiz)

          __✓_ h.1. Multiple-choice chord identification

          __✓_ h.2. Score and feedback per attempt

          __✓_ h.3. Log results to history

__✓_ i. History module

          __✓_ i.1. Record build-chord and guess-chord activities

          __✓_ i.2. View past attempts with results

          __✓_ i.3. Clear/delete history (with confirmation)

__✓_ j. Profile module

          __✓_ j.1. View account information

          __✓_ j.2. Log-out from the profile screen

          ____ j.3. Change profile (edit display name / avatar)

__✓_ k. Settings module

          __✓_ k.1. Volume control

          __✓_ k.2. Dark mode toggle

          __✓_ k.3. About / credits section

__✓_ l. Audio/Music module

          __✓_ l.1. Chord and note sound samples

          __✓_ l.2. Background lo-fi menu music loop

          __✓_ l.3. Audio ducking (music lowers while chord samples play)

__✓_ m. Local Database module (SQLite)

          __✓_ m.1. Users table with hashed passwords

          __✓_ m.2. Chord history table

          __✓_ m.3. Saved session storage

____ n. Cloud Database module

          ____ n.1. Migrate user accounts from local SQLite to the cloud

          ____ n.2. Sync chord history / quiz scores to the cloud

          ____ n.3. Offline-first storage with cloud backup

          ____ n.4. Cross-device access to accounts and history


Summary — Not Yet Implemented (for future development)

          1. Forgot password

          2. Password retrieval (e-mail / OTP)

          3. Change password

          4. Improved cloud login / social sign-in

          5. E-mail verification upon registration

          6. Change profile (edit display name / avatar)

          7. Cloud Database module (accounts + history sync, offline-first backup, cross-device access)
```
