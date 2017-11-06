const assert = require('assert');

const HashMap = require('../lib/hashmap');

describe('HashMap', function() {
  describe('containsKey', function() {
    let hashmap;

    beforeEach(function() {
      hashmap = new HashMap();
    });

    it('handles nonexistent keys when empty', function() {
      assert.equal(hashmap.containsKey('foo'), false, 'containsKey should be false for nonexistent string key');
      assert.equal(hashmap.containsKey(undefined), false, 'containsKey should be false for a key of undefined');
      assert.equal(hashmap.containsKey(null), false, 'containsKey should be false for a key of null');
      assert.equal(hashmap.containsKey('hasOwnProperty'), false, 'containsKey should not count inherited properties');
    });

    it('correctly identifies keys when present', function() {
      hashmap.put('key', 'value');
      assert.equal(hashmap.containsKey('key'), true, 'containsKey should be true for a key that exists');
      assert.equal(hashmap.containsKey('key2'), false, 'containsKey should be false for a key that does not exist');
      hashmap.put(1, '1');
      assert.equal(hashmap.containsKey(1), true, 'containsKey should work for number keys');
      // confusing, but ultimately all messages are strings, so this is expected.
      assert.equal(hashmap.containsKey('1'), true, 'containsKey should not distinguish numbers from strings');
    });
  });

  describe('get', function() {
    let hashmap;

    beforeEach(function() {
      hashmap = new HashMap('sentinel value');
    });

    it('handles nonexistent keys by returning default value', function() {
      assert.equal(hashmap.containsKey('key'), false);
      assert.equal(hashmap.get('key'), 'sentinel value', 'get should return default value when empty');
      hashmap.put('key', 'value');
      assert.equal(hashmap.get('key2'), 'sentinel value', 'get should return default value for nonexistent keys');
    });

    it('handles adding and updating keys', function() {
      hashmap.put('key', 'value');
      assert.equal(hashmap.get('key'), 'value', 'get should return a value once it has been stored');

      hashmap.put('key', 'newValue');
      hashmap.put('key2', 'value2');
      assert.equal(hashmap.get('key'), 'newValue', 'get should return new value after update');
      assert.equal(hashmap.get('key2'), 'value2', 'get should return appropriate values when multiple keys are present');
    });
  });
});
