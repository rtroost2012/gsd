function merge(joined, target) {
    var sources = [].slice.call(arguments, 2);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    
    output = [];
    for (var key in target) {
      if (joined.indexOf(key)==-1){	
	output.push(key,target[key]);	
      }else{
	output.push(key + target[key]);

      }

    }

    return output;
}

exports.merge = merge;