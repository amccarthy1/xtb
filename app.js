const auth = require("./auth.json");
const botoptions = require("./botconfig.json");
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
    channels: [botoptions.channel]
};

const client = tmi.client(options);

const bot = new ExtBot(client, botoptions.channel);
bot.load(botoptions.commands);

bot.connect();
