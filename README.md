# eXtensible Twitch Bot

A twitch bot written in Node.js, designed to be efficient and flexible.

## Installation (standalone bot)
* Add a file `auth.json` containing your bot username and oauth token.
  (`auth.json.example` provided as an example)
* Edit `botconfig.json` to change the bot channel and add commands to your bot
* run `npm install` to install dependencies
* run the standalone bot with `node app.js`. Stop it with
<kbd>Ctrl</kbd>+<kbd>C</kbd>

## Usage (for programmers)
API documentation Coming Soon&trade;
(Really though the source is dead simple at this point. check out `extbot.js`)

## Words of Warning
This bot does not (yet) correctly rate-limit requests to avoid temporary global
bans. (This feature is coming soon).
