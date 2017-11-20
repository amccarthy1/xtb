/**
 * Safe wrapper around a standard object.
 * @param {*} [defVal] The value to return for missing keys.
 */
function HashMap(defVal) {
    const table = {};

    /**
   * @param {string|number|boolean} key The key for which to check existence
   */
    this.containsKey = key => Object.prototype.hasOwnProperty.call(table, key);

    /**
   * @param {string|number|boolean} key The key to look up
   */
    this.get = (key) => (this.containsKey(key) ? table[key] : defVal);

    /**
   * @param {string|number|boolean} key The key for which to set a value
   * @param {*} value The value to set for the given key
   */
    this.put = (key, value) => {
        table[key] = value;
    };
}

module.exports = HashMap;
