/**
 * RLQueue: An execution queue that rate-limits requests as specified.
 * Tasks are be run as soon as possible without violating rate limiting.
 */

// simple linked list queue
function Queue() {
  this.head = null;
  this.tail = null;
  this.size = 0;
}
Queue.prototype.push = function(a) {
  var node = {value: a, next: null};
  if (this.head === null) {
    this.head = node;
  } else {
    this.tail.next = node;
  }
  this.tail = node;
  this.size++;
}
Queue.prototype.poll = function() {
  if (this.size === 0) {
    return null;
  } else {
    var v = this.head.value;
    this.head = this.head.next;
    this.size--;
    return v;
  }
}

/**
 * Construct a Rate Limiting Queue that can send up to a certain number of
 * requests within a certain window.
 */
function RLQueue(requests, timeout) {
  this.requests = requests;
  this.capacity = requests;
  this.timeout = timeout;
  this.q = new Queue();
}

// TODO Might be a good idea to return a promise from this.
/**
 * Submit a task for execution. The task will be executed as soon as possible
 * without violating the rate-limiting constraint.
 * @param {function} task A task to execute when possible.
 */
RLQueue.prototype.submit = function(task) {
  this.q.push(task);
  // if possible w/o violating limit, execute now
  if (this.capacity > 0) {
    this.executeNext();
  }
  // otherwise a timer will call executeNext when there is availability.
}

// Execute the next task in the queue, update capacity, and set a timer for
// when its timeout is up.
RLQueue.prototype.executeNext = function() {
  const rlq = this;
  if (this.q.size === 0) {
    return; // nothing to execute
  }

  var task = this.q.poll();
  task();
  setTimeout(function() {
    rlq.capacity++;
    // when the timer runs out, can execute another action.
    rlq.executeNext();
  }, this.timeout);
  rlq.capacity--;
}

module.exports = RLQueue;
