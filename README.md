## Morse Trainer
A small browser trainer for learning Morse by ear and by hand. Progress stays in your browser.
Learn follows the Koch method. Practice is a free send/receive sandbox and does not change Learn progress.

## Learn
Koch training. You do not pick the alphabet.

- Starts with K and M only.
- Characters are sent at full speed (default 18 WPM).
- Extra space between letters is Farnsworth spacing (default 12 WPM effective), so your ear can catch up without learning "slow Morse".
- Receive plays a random group from your current set. Type what you heard, then Check.
- When the last 50 copied characters are at least 90% correct, the next letter is unlocked.
- Send uses the same unlocked letters. Only receive scores unlock the next one.

Letter order used here:
`K M U R E S N A P T L W I J Z F O Y V G Q H B C D X`

Turn on Show Morse in Learn in Settings if you want dots and dashes on screen while you are still new. Turn it off once you are copying by ear.

## Practice
Free play. Use it to drill, mess around, or send something just to see it decode.

Receive - play your own text, or a random group from letters / numbers / punctuation.\
Send - key into a notepad.

## Sending

Two inputs, both modes:\
Straight key - one button. Short press is a dit, longer press is a dah.\
Paddles - left dit, right dah (swap in Settings).

## Why Koch
Learning every letter at 5 WPM and then speeding up often means you have to relearn the sound of each character.

Koch does the opposite: few letters, already at target speed. You add a letter only when the current set is solid. Farnsworth keeps the shape of each letter fast and puts the slack in the gaps.

This app uses that for receiving. Sending is practiced on the same set so your hand stays in sync, but the gate for a new letter is copy accuracy.

## Run locally
```
git clone https://github.com/yh-yahan/morse-trainer.git
cd morse-trainer
npm install
npm run dev
```