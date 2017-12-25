const assert = require('assert');
const uuidv4 = require('uuid/v4');

const ExtBot = require('../lib/extbot');

describe('ExtBot', function() {
    const channel = 'channel';
    let tmi; // tmi mock
    let send; // call to send a fake message
    let messages; // a list of messages sent by ExtBot
    let actions; // a list of 'action' messages sent by ExtBot
    let bans; // a list of 'ban' objects with usernames and reasons.
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
            'display-name': 'extbot',
        };
        testUserOther = {
            id: uuidv4(),
            'display-name': 'test',
        };
        messages = []; actions = []; bans = [];
        send = () => {
            assert.fail('Tried to send message before registering listener');
        };
        connected = false;
        tmi = {
            say: function(channel, msg) {
                messages.push(msg);
                send(testUserSelf, msg);
                return Promise.resolve(msg);
            },
            action: function(channel, msg) {
                actions.push(msg);
                send(testUserSelf, msg);
                return Promise.resolve(msg);
            },
            ban: function(channel, username, reason) {
                const ban = { username, reason };
                bans.push(ban);
                return Promise.resolve(ban);
            },
            on: function(evtType, handler) {
                send = function(user, message) {
                    const self = user.id === testUserSelf.id;
                    handler(`#${channel}`, user, message, self);
                };
            },
            connect: () => { connected = true; },
            disconnect: () => { connected = false; },
        };
        xtb = new ExtBot(tmi, channel);
    });

    afterEach(function() {
        xtb.disconnect();
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
            assert.equal(xtb.registerCommand('!test', () => { hit = 400; }), false, 'xtb should prevent overwriting commands');
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

    describe('tmi wrapper', function() {
        it('say calls TMI function', function(done) {
            const msg = uuidv4();
            xtb.say(msg).then(() => {
                assert.equal(messages.length, 1);
                assert.equal(messages[0], msg);
                return done();
            });
        });

        it('action calls TMI function', function(done) {
            const msg = uuidv4();
            xtb.action(msg).then(() => {
                assert.equal(actions.length, 1);
                assert.equal(actions[0], msg);
                return done();
            });
        });

        it('ban calls TMI function', function(done) {
            const reason = uuidv4();
            xtb.ban(testUserOther['display-name'], reason).then(() => {
                assert.equal(bans.length, 1);
                assert.equal(bans[0].username, 'test');
                assert.equal(bans[0].reason, reason);
                return done();
            });
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

    describe('loadPlugin', function() {
        it('calls initialize and cleanup', function() {
            var initialized = false;
            var cleanedUp = false;
            const plugin = {
                initialize: () => initialized = true,
                cleanup: () => cleanedUp = true,
            };
            xtb.loadPlugin(plugin);
            assert.equal(initialized, true);
            assert.equal(cleanedUp, false);
            xtb.disconnect();
            assert.equal(cleanedUp, true);
        });
    });
});
