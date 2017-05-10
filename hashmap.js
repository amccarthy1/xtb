/**
 * Safe wrapper around a standard object.
 * @param {*} [defVal] The value to return for missing keys.
 */
function HashMap(defVal) {
  const table = {};

  /**
   * @param {string|number|boolean} key The key for which to check existence
   */
  this.containsKey = function(key) {
    // call it like this so that hasOwnProperty isn't accidentally overridden.
    return Object.prototype.hasOwnProperty.call(table, key);
  };

  this.get = function(key) {
    if (!(this.containsKey(key))) {
      return defVal;
    }
    return table[key];
  };

  this.put = function(key, value) {
    table[key] = value;
  };
}

module.exports = HashMap
