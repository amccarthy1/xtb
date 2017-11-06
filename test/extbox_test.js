assert = require('assert');
uuidv4 = require('uuid/v4');

ExtBot = require('../lib/extbot');

describe('ExtBot', function() {
  const channel = "channel";
  let tmi; // tmi mock
  let send; // call to send a fake message
  let messages; // a list of messages sent by ExtBot
  let connected;

  // test users to send messages
  let testUserSelf;
  let testUserOther;

  // the mocked xtb object
  let xtb;

  // This partially mocks out tmi.js so we can simulate xtb's use
  beforeEach(function() {
    testUserSelf = {
      id: uuidv4(),
      'display-name': 'extbot'
    };
    testUserOther = {
      id: uuidv4(),
      'display-name': 'test'
    };
    messages = [];
    send = () => {
      assert.fail('Tried to send message before registering listener');
    };
    connected = false;
    tmi = {
      say: function(channel, msg) {
        messages.push(msg);
        send(testUserSelf, msg);
      },
      on: function(evtType, handler) {
        send = function(user, message) {
          const self = user.id === testUserSelf.id;
          handler(`#${channel}`, user, message, self);
        };
      },
      connect: () => { connected = true; }
    };
    xtb = new ExtBot(tmi, channel);
  });

  describe('connect', function() {
    it('calls connect on tmi', function() {
      assert.equal(connected, false);
      xtb.connect();
      assert.equal(connected, true, 'should call connect on tmi');
    });
  });

  describe('registerCommand', function() {
    it('detects duplicate commands and doesn\'t overwrite', function() {
      let hit = 0;
      assert.equal(xtb.registerCommand('!test', () => hit++), true);
      send(testUserOther, '!test');
      assert.equal(hit, 1);
      assert.equal(xtb.registerCommand('!test', () => { hit = 400 }), false, 'xtb should prevent overwriting commands');
      send(testUserOther, '!test');
      assert.equal(hit, 2);
    });

    it('triggers from its own messages', function() {
      let hit = 0;
      assert.equal(xtb.registerCommand('!test', () => hit++), true);
      send(testUserSelf, '!test');
      assert.equal(hit, 1);
      send(testUserOther, '!test');
      assert.equal(hit, 2);
    });
  });

  describe('addTextCommand', function() {
    it('triggers a response only when message not sent by self', function() {
      assert.equal(xtb.addTextCommand('hello', 'world'), true, 'addTextCommand should succeed');
      assert.equal(xtb.addTextCommand('hello', 'there'), false, 'addTextCommand should not overwrite and return false');
      send(testUserOther, 'hello');
      assert.equal(messages.length, 1);
      assert.equal(messages[0], 'world');
      send(testUserSelf, 'hello');
      assert.equal(messages.length, 1);
    });
  });
});
