const auth = require("./auth.json");
const botconfig = require("./botconfig.json");
const ExtBot = require("./extbot.js");
const tmi = require("tmi.js");

const options = {
    options: {
        debug: true
    },
    connection: {
        cluster: "aws",
        reconnect: true
    },
    identity: auth,
    channels: [botconfig.channel]
};

const client = tmi.client(options);

const bot = new ExtBot(client, botconfig.channel);
bot.load(botconfig.commands);

bot.connect();
