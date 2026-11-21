# Free PWA beta — installation, safety and feedback

**Public URL:** https://taiduc1302.github.io/construction-vocabulary-trainer/  
**Distribution:** open the URL in the device browser. No Apple Developer, TestFlight, Google Play, Google account, payment or registration is required.

The trainer is a **Progressive Web App (PWA)**, not a native App Store/Google Play binary. On the home screen it runs in a standalone window. The curated dictionary, saved learning progress and learning sessions work locally without an account. Use the online version at least once before testing offline.

## Install on iPhone or iPad

1. Open the public URL in **Safari** (not the in-app preview browser).
2. Tap **Share** → **Add to Home Screen**. Enable **Open as Web App** when offered.
3. Name it **Civil English**, tap **Add**, then open it from its icon.
4. Confirm the top and bottom navigation are not covered by the notch/home indicator.

**Important iOS storage caveat:** Safari and the installed Home Screen web app can have separate local storage. Your Safari lessons may **not appear automatically** in the installed app. Before installing, export a JSON backup in Safari from **Settings → Export progress**. In the installed version, use **Settings → Import progress** if a transfer is needed. Keep the downloaded file until you confirm the progress was restored. A backup import replaces the current device progress and offers **Undo last import** in Settings.

## Install on Android

1. Open the public URL in **Chrome**.
2. Use **⋮ → Install app** or **Add to Home screen** (exact wording varies).
3. Start the trainer from its new icon and check it displays in its own window.
4. If Chrome shows only a shortcut, note that in feedback; do not assume native-app packaging.

## First beta session — both phones

- [ ] Initial onboarding: select your construction role, work area and English/Russian/Vietnamese language support.
- [ ] Open **Dictionary**, search `duct bank`, `DB2`, `culvert`, and a Russian/Vietnamese word. Try one shareable term page.
- [ ] Open a learning pack, answer **four** Quick 10 questions; close and reopen the app; confirm it resumes at 4/10 and can finish the remaining questions.
- [ ] Try the optional diagram sequences for **duct bank**, **culvert** and **trench box**. Check Play/Pause/Next, including reduced-motion settings where available.
- [ ] Check Dark Mode, portrait/landscape, 320–430 px layouts, visible buttons, keyboard or screen reader if applicable.
- [ ] **Export progress** to JSON. Verify the file exists in Files/Downloads. Import a controlled test backup if comfortable, check Undo, and keep the original backup.
- [ ] After the first online launch, enable **Airplane Mode** and reopen the app from the home-screen icon. Verify Today/Dictionary/Practice and `term.html?term=duct-bank` work. Reconnect and check refresh.

## Saving progress: read before testing

Progress, My Words, settings and current Quick 10 are **local**. There is **no login, cloud synchronization or automatic transfer between different phones/browsers**. Browser data clearing, deleting the app or switching the installation context can remove progress. Export to a JSON file **before** uninstalling or switching devices. Do not share your personal progress export publicly: it may contain your learning profile and My Words. Do not submit screenshots containing company drawings, private information or personal account data.

An installable PWA can be tested free by any number of people, but a successful browser/simulated-mobile test is **not** evidence that a particular iPhone or Android installation passed.

## Feedback template (copy into a message to the project owner)

- **Device / OS:** e.g. iPhone 13 / iOS version, Pixel / Android version
- **Browser:** Safari / Chrome plus version if available
- **Launch method:** browser tab or home-screen PWA
- **Build/check date:** date on which the problem happened
- **Feature:** onboarding / Dictionary / Quiz / Backup / Offline / Install / Diagram
- **Expected:** what you thought would happen
- **Actual:** what happened instead
- **Steps to reproduce:** actions in order; can it be repeated?
- **Severity:** Blocker (loss of data/cannot use), Major (feature fails), Minor (display or wording)
- **Screenshot:** optional; exclude private materials, names, tokens, company drawings, browser tabs and sensitive data

If everything works, report **"Pass"** with the device/browser and what you tested. Testers do **not** need GitHub accounts. The owner may collect responses via an ordinary message; the app itself does not upload feedback or track usage.

## Release gate and evidence

An owner-managed pilot can start with **3–5 testers**, then expand to 10–20 only after high-severity defects are resolved. Engineering gates: `npm run validate`; browser regression and accessibility scenario results; live HTTPS manifest, touch icon and offline navigation verified. **Physical iPhone and Android acceptance remains separate**. The tracked beta work is [Issue #33](https://github.com/taiduc1302/construction-vocabulary-trainer/issues/33); repo settings and licence are in [Issue #31](https://github.com/taiduc1302/construction-vocabulary-trainer/issues/31).
