const Winston = require('winston');
const HashMap = require('./hashmap.js');
const RLQueue = require('./rl_queue.js');

/**
 * A message object
 * @param {string} channel The channel in which this message was received
 * @param {string} user The user who sent this message
 * @param {string} message The message that was sent
 * @param {string} self Did this bot send the message?
 */
function Message(channel, user, message, self) {
    this.channel = channel;
    this.user = user;
    this.contents = message;
    this.self = self;
}

/**
 * Extensible Twitch Bot. Takes an instance of TMI and wraps it with additional
 * bot-like functionality.
 * @param {Client} tmi A configured TMI.js client.
 * @param {string} channel The twitch channel to connect.
 */
function ExtBot(tmi, channel) {
    this.tmi = tmi;
    this.channel = channel;
    // Twitch rate limiting is 20 messages in a 30s window. 1s for extra buffer :)
    this.rlq = new RLQueue(20, 31000);
    if (typeof channel === 'undefined') {
        throw new Error(
            'Missing required argument \'channel\' in constructor for ExtBot'
        );
    }

    // maps text to functions that are called when the text matches the first
    // word of a message. Default for unrecognized commands is no-op.
    const commands = new HashMap(() => {});

    // globalListeners are called with every message sent in the chat. They can
    // be used for logging or handling complicated response rules.
    const globalListeners = [];

    const xtb = this;

    /**
   * Gets the function associated with a command.
   * @param {string} name The command to lookup.
   */
    this.getCommand = cmd => commands.get(cmd);

    /**
   * Register a command with this bot. Commands must be the first word in a
   * message, and can trigger any action upon receiving.
   * @param {string} name The command name (including any command characters,
   *  like ! or ~).
   * @param {function} callback The function to execute when the command is
   *  seen.
   */
    this.registerCommand = function(name, callback) {
        if (commands.containsKey(name)) {
            Winston.log(
                'warn',
                `A command with the name "${name}" has already been registered. `
                  + 'Ignoring duplicate command'
            );
            return false;
        }
        commands.put(name, callback);
        return true;
    };

    this.registerGlobalListener = action => {
        if (typeof action === 'function') {
            globalListeners.push(action);
        }
    };

    // Main handler for chat messages. All chat events go through here.
    tmi.on('chat', function(channel, user, message, self) {
        const msg = new Message(channel.replace('#', ''), user, message, self);
        if (msg.channel !== xtb.channel)
        // ignore messages in other channels and messages we sent.
            return;

        // Handle with global handlers
        globalListeners.forEach(action => {
            try {
                action(msg);
            } catch (ex) {
                Winston.log('error', ex);
            }
        });

        const command = message.trim().split(/\s/)[0];
        try {
            const responder = xtb.getCommand(command);
            responder(msg);
        } catch (ex) {
            // Make sure to catch and log the error but continue on
            Winston.log('error', ex);
        }
    });
}

ExtBot.prototype.tmi = null;
ExtBot.prototype.channel = null;

/**
 * Say a message in this bot's channel. Enforces rate-limiting.
 * @param {string} message The message to send.
 */
ExtBot.prototype.say = function(message) {
    return this.rlq.submit(
        () => this.tmi.say(this.channel, message)
    ).catch((err) => {
        Winston.log('error', err);
    });
};

/**
 * Say a message in this bot's channel with /me. Enforces rate-limiting.
 * @param {string} message The message to send with /me.
 */
ExtBot.prototype.action = function(message) {
    return this.rlq.submit(
        () => this.tmi.action(this.channel, message)
    ).catch((err) => {
        Winston.log('error', err);
    });
};

/**
 * Ban a user from this bot's channel.
 * @param {string} username 
 * @param {string} reason 
 */
ExtBot.prototype.ban = function(username, reason) {
    return this.tmi.ban(this.channel, username, reason).catch((err) => {
        Winston.log('error', err);
    });
};

/**
 * Adds a simple text => text command that responds whenever a message begins
 * with the given string of characters.
 * @param {string} name The command name (Include any ! or ~ characters you
 *  want in the command name).
 * @param {string} response The string to send whenever the given command is
 *  received.
 * @return {boolean} success true if the command was added, else false.
 */
ExtBot.prototype.addTextCommand = function(name, response) {
    return this.registerCommand(name, msg => {
        if (!msg.self) {
            this.say(response);
        }
    });
};

/**
 * Simple wrapper around the tmi.js connect function.
 */
ExtBot.prototype.connect = function() {
    this.tmi.connect();
};

/**
 * Load commands from an object.
 * @param {object} commands An object containing the commands to load in.
 *  the keys of the object are the command names, and the values are one of the
 *  following:
 *    string: A new text => text command will be added that responds to the key
 *      with its value.
 *    function: (unimplemented) A command is added to respond to the key string
 *      by calling the provided callback function, with the message as the arg.
 *    object: (unimplemented) Use a plugin for the handler (format undetermined)
 */
ExtBot.prototype.load = function(commands) {
    for (var key in commands) {
        if (!Object.prototype.hasOwnProperty.call(commands, key))
            continue;

        const value = commands[key];
        // string values => Text Commands
        if (typeof value === 'string') {
            this.addTextCommand(key, value);
        } else if (typeof value === 'function') {
            // TODO add support for passing functions (for programmer friendliness)
        } else if (typeof value === 'object') {
            // TODO handle object commands. (eventually this will be how plugins work)
        }
    }
};

/**
 * Disconnects the bot and clears the queue of any pending messages.
 */
ExtBot.prototype.disconnect = function() {
    this.rlq.close();
    return this.tmi.disconnect();
};

module.exports = ExtBot;
