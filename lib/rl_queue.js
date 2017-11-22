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
};
Queue.prototype.poll = function() {
    if (this.size === 0) {
        return null;
    } else {
        var v = this.head.value;
        this.head = this.head.next;
        this.size--;
        return v;
    }
};

/** An error thrown when a task has been cancelled */
function CancellationError(message) {
    this.name = 'CancellationError';
    this.message = (message || '');
}
CancellationError.prototype = Object.create(Error.prototype);

/**
 * Construct a Rate Limiting Queue that can send up to a certain number of
 * requests within a certain window.
 */
function RLQueue(requests, timeout) {
    this.requests = requests;
    this.capacity = requests;
    this.timeout = timeout;
    this.q = new Queue();
    this.handles = new Set();
}

/**
 * Submit a task for execution. The task will be executed as soon as possible
 * without violating the rate-limiting constraint.
 * @param {function} task A task to execute when possible.
 * @return {Promise} result A promise containing the result of the execution,
 */
RLQueue.prototype.submit = function(task) {
    return new Promise((resolve, reject) => {
        this.q.push((err) => {
            if (err) reject(err); // allows queue to cancel tasks
            try {
                resolve(task());
            } catch (err) {
                reject(err);
            }
        });

        // if possible w/o violating limit, execute now
        if (this.capacity > 0) {
            this.executeNext();
        }
        // otherwise a timer will call executeNext when there is availability.
    });
};

// Execute the next task in the queue, update capacity, and set a timer for
// when its timeout is up.
RLQueue.prototype.executeNext = function() {
    if (this.q.size === 0) {
        return; // nothing to execute
    }

    var task = this.q.poll();
    task();
    let handle;
    handle = setTimeout(() => {
        this.capacity++;
        // when the timer runs out, can execute another action.
        this.executeNext();
        this.handles.delete(handle);
    }, this.timeout);
    this.handles.add(handle);
    this.capacity--;
};

/** Cancel all pending tasks and timeouts */
RLQueue.prototype.close = function() {
    this.handles.forEach(clearTimeout);
    while (this.q.size > 0) {
        const cancelledTask = this.q.poll();
        cancelledTask(
            new CancellationError('Queue closed, task has been cancelled')
        );
    }
};

module.exports = RLQueue;
