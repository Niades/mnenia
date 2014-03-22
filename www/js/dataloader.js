(function() {
	function l(m) {
		_l('dataloader.js', m);
	}

	var loaders = {};

	function checkFields(object, fields) {
		for(var i in fields) {
			if(typeof(fields[i]) != 'function') {
				if(typeof(object[fields[i]])=='undefined') {
					return false;
				}
			}
		}
		return true;
	}

	var DataLoader = {
		init : function(options) {
			loaders = options;
		},
		loadMissing : function(object, fields, callback) {
			if(!checkFields(object, fields)) {
				var length = fields.length,
					field = null, 
					fieldsToLoad = [];
				function onFieldLoaded(fieldName) {
					var index = fieldsToLoad.indexOf(fieldName);
					if(index!=-1) {
						fieldsToLoad.splice(index, 1);
					}
					if(fieldsToLoad.length == 0) {
						l('Success loading object ' + object);
						callback(object);
					}
				}
				for(var i=0; i<length; i++) {
					field = fields[i];
					if(typeof(object[field])=='undefined') {
						if(typeof(loaders[field])!='undefined') {
							fieldsToLoad.push(field);
							loaders[field](object, onFieldLoaded)
						} else {
							l('Missing loader for ' + field + '! Skipping');
						}
					}	
				}
			} else {
				callback(object);
			}
		},
		checkFields : function(object, fields) {
			for(var i in fields) {
				if(typeof(fields[i]) != 'function') {
					if(typeof(object[fields[i]])=='undefined') {
						return false;
					}
				}
			}
			return true;
		}
	};
	window.DataLoader = DataLoader;
})();