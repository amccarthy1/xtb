const HashMap = require("./hashmap.js");

var map = new HashMap();

map.put("foo", 1);
map.put("bar", 2);

console.log(map.get("foo")); // 1
console.log(map.get("bar")); // 2
console.log(map.get("baz")); // undefined
