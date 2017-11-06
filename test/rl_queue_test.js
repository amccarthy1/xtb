assert = require('assert');
RLQueue = require('../lib/rl_queue');

describe('RL Queue', function() {
  let queue;

  beforeEach(function() {
    queue = new RLQueue(3, 25); // 25ms timeout
  });

  describe('submit', function() {
    it('executes immediately only when below the timeout', function() {
      let executed = 0;
      const increment = () => executed++;
      queue.submit(increment);
      assert.equal(executed, 1); // should invoke synchronously
      queue.submit(increment);
      assert.equal(executed, 2); // should invoke synchronously
      queue.submit(increment);
      assert.equal(executed, 3, 'Submit should invoke immediately when n=3');
      queue.submit(increment);
      assert.equal(executed, 3, 'Submit should not execute until the 50ms timeout passes');
    });

    it('executes after the timeout passes', function(done) {
      let executed = 0;
      const increment = () => executed++;
      queue.submit(increment);
      queue.submit(increment);
      queue.submit(increment);
      queue.submit(increment); // delayed
      assert.equal(executed, 3);
      queue.submit(() => {
        assert.equal(executed, 4, 'Submit should execute pending tasks in order');
        done();
      });
    })
  });
});
