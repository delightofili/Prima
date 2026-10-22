# Prima real-phone test sheet (Day 16)

Fake data only until the Day 20 gate. Fill in one copy per phone. Tick a box only when you saw it happen.

Phone model: ______________  Android version: ______  Browser (name and version): ______________
Date: ____________  Build stamp (Account, then Phone check): ____________

## 0. Get Prima onto the phone over HTTPS

A phone only treats a page as safe (needed for the PIN, installing and offline use) if it is HTTPS or `localhost`. A plain `http://192.168...` address will NOT work.

**Path A: USB cable, no deploy**
1. Phone: Settings, About phone, tap Build number 7 times. Then Developer options, switch on USB debugging. (Menu names differ a little between phones; Tecno's exact wording is not verified here.)
2. Plug the phone into the computer. Accept the "Allow USB debugging" question on the phone.
3. Computer Chrome: open `chrome://inspect/#devices`, tick "Discover USB devices", then Port forwarding: add `4173` and `localhost:4173`.
4. In the project: `npm run build` then `npm run preview`.
5. Phone Chrome: open `http://localhost:4173`.
6. If the phone is not listed, the computer may need the phone maker's USB driver.

**Path B: test deploy (real HTTPS, real install)**
Build and publish `dist` to Cloudflare Pages (steps are in the Day 16 message). Keep the address private and switch off sign-ups on the test project afterwards.

## 1. Install

- [ ] Prima opens in Chrome and shows the sign-in or lock screen
- [ ] Account page says how to install (button, or the menu steps)
- [ ] Installed. The icon on the home screen shows the teal cross, not a letter
- [ ] Long-press the icon: "Register a patient" and "Find a patient" shortcuts appear
- [ ] Opening from the icon has no browser bar (standalone)
- [ ] The status bar colour is teal
- [ ] Phone check page says: Installed true, Secure context true

## 2. Offline (the most important test)

1. Open Prima once online and wait for "Prima is ready to work without internet".
2. Switch on airplane mode.
3. Close Prima completely (recent apps, swipe away).
4. Open it again from the home screen icon.

- [ ] It opens with no internet and asks for the PIN
- [ ] Register a patient, add a visit, edit a patient: all work
- [ ] The badge says "Offline, N saved" (no scary red)
- [ ] Switch airplane mode off: the badge counts down to Synced without tapping anything
- [ ] Cold start time (icon tap to PIN screen): ______ seconds

## 3. Updates

1. Change something visible in the app, build and publish again.
2. Open Prima on the phone, send it to the background for a few seconds, come back.

- [ ] "A new version of Prima is ready" appears above the bottom tabs
- [ ] "Later" hides it and nothing breaks
- [ ] "Update now" reloads, and the Build stamp on the Phone check page changed
- [ ] Records and sign-in are still there after the update

## 4. Gloves

Use the Phone check page (Account, then Phone check). Run the tap test 20 taps at a time and write the numbers in the table.

Gloves to try (tick what you tested): [ ] thin exam gloves  [ ] double gloves  [ ] gloves with sanitiser on  [ ] bare finger with wet hands

| Run | Glove mode | Square size | On target | Median time | Taps that did not register |
|---|---|---|---|---|---|
| Bare finger | off | 48 px | | | |
| Gloves | off | 48 px | | | |
| Gloves | off | 64 px | | | |
| Gloves | on | 48 px | | | |
| Gloves | on | 64 px | | | |

Also check by hand, with gloves on:
- [ ] Phone sensitivity: does the phone have a touch-sensitivity or glove option in its settings? ______
- [ ] Bottom tabs: no wrong tab taps
- [ ] Register form: each field opens on the first tap
- [ ] The Save button is reachable with one thumb
- [ ] Checkboxes (vaccines, consent) hit on the first tap
- [ ] Number pad appears for blood pressure and phone fields
- [ ] PIN pad: 6 digits entered with no wrong digit
- [ ] Scrolling a long list does not trigger taps

**How to read the numbers**
- On target 95% or more and few unregistered taps: that size works.
- Gloves with glove mode off below 90%, but glove mode on 95% or more: ship glove mode as a first-run suggestion for gloved staff.
- Glove mode on still below 95%: the targets need to be bigger. Tell me the glove type and the size that reached 95%.
- Many "taps that did not register": the gloves are not being sensed. A bigger button will not fix that; check the phone's sensitivity setting.

## 5. In the clinic

- [ ] Outdoors in sunlight at full brightness: text, orange banners and the teal buttons are readable
- [ ] One hand: every main action reachable with the thumb
- [ ] Android back button inside the app goes to the previous screen
- [ ] Android back button with a dialog open: what happens? ______________
- [ ] Rotating the phone does not lose a half-filled form
- [ ] Lock now and unlock: the half-filled form is still there
- [ ] Switch to another app for 2 minutes and come back: locked or not, as expected
- [ ] Battery saver on: Prima still opens and works
- [ ] Run the phone's built-in cleaner (Phone Master or similar), with the browser's "cache" ticked: Prima's patients are still there afterwards
- [ ] After installing, Phone check says Storage protected: ______ (installed apps are usually granted this, not verified here)
- [ ] Back up now saves a file, and Share opens the share sheet
- [ ] The phone does not get hot or slow during 10 minutes of use

## 6. Speed (Phone check, "Run speed check")

Patients on this phone: ______
Load every patient: ______ ms    Search every name: ______ ms
Unlock check (PIN hash): ______ ms   (over 1500 ms is too slow: tell me)
Dashboard opens in: ______ s   Patient search feels: [ ] instant  [ ] slight lag  [ ] slow

## 7. Send me the results

On the Phone check page tap "Copy report" and paste it into a message with this sheet's ticks and notes. Anything that surprised you matters more than anything that passed.
