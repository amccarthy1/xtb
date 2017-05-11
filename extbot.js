const HashMap = require("./hashmap.js");

/**
 * Extensible Twitch Bot. Takes an instance of TMI and wraps it with additional
 * bot-like functionality.
 * @param {Client} tmi A configured TMI.js client.
 * @param {string} channel The twitch channel to connect.
 */
function ExtBot(tmi, channel) {
  this.tmi = tmi;
  this.channel = channel;
  if (typeof channel === "undefined") {
    throw new Error(
      "Missing required argument 'channel' in constructor for ExtBot"
    );
  }

  // maps text to functions that are called when the text matches the first
  // word of a message. Default for unrecognized commands is no-op.
  const commands = new HashMap(function() {});

  const xtb = this;

  /**
   * Gets the function associated with a command.
   * @param {string} name The command to lookup.
   */
  this.getCommand = function(name) {
    return commands.get(name);
  };

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
      console.error(
        `[WARN] A command with the name "${name}" has already been registered. `
        + "Ignoring duplicate command"
      );
      return false;
    }
    commands.put(name, callback);
    return true;
  };

  tmi.on("chat", function(channel, user, message, self) {
    if (channel.replace("#", "") !== xtb.channel)
      // ignore messages in other channels
      return;

    const command = message.trim().split(/\s/)[0];
    const responder = xtb.getCommand(command);

    // TODO redesign so that the function accepts message details.
    responder();
  });
}

ExtBot.prototype.tmi = null;
ExtBot.prototype.channel = null;

/**
 * Say a message in this bot's channel.
 * @param {string} message The message to send.
 */
ExtBot.prototype.say = function(message) {
  this.tmi.say(this.channel, message);
};

/**
 * Adds a simple text => text command that responds whenever a message begins
 * with the given string of characters.
 * @param {string} name The command name (Include any ! or ~ characters you
 *  want in the command name).
 * @param {string} response The string to send whenever the given command is
 *  received.
 */
ExtBot.prototype.addTextCommand = function(name, response) {
  const xtb = this;
  return this.registerCommand(name, function() {
    xtb.say(response);
  });
};

/**
 * Simple wrapper around the tmi.js connect function.
 */
ExtBot.prototype.connect = function() {
  this.tmi.connect();
}

module.exports = ExtBot;
