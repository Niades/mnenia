'use strict';

var DEBUG = true;

function ffn(a) {
	if(a.length > 0) {
		for(var i=0; i<a.length; i++) {
			if(typeof(a[i])=='function') {
				return a[i];
			}
		}
	}
	return null;
}

function decorate(method, decorator) {
	return decorator(method);
}

function dv(v, _v) {
	if(typeof(v)=='undefined'||typeof(v)=='function') {
		return _v;
	} else {
		return v;
	}
}

function sformat (str, arr) {
    var a = (typeof arguments[1] === 'object') ? arr : Array.prototype.slice.call(arguments).slice(1);
    return str.replace(
        /\{{([0-9]+)\}}/g,
        function (_, index) {
			return a[index]; 
		});
}
 
function _l(source, message) {
	if(DEBUG)
		console.log(sformat('[{{0}}]: {{1}}', [source, message]));
}

 
