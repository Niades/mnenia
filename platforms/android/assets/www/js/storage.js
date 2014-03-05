function Storage()  {
    var storage = {};
	return {
		"exists" : function(key) {
			return (typeof(storage[key])=='undefined');
		},
		"get" : function(key) {
			return storage[key];
		},
		"set" : function(key, value) {
			storage[key] = value;
		}
	};
}