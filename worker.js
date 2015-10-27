importScripts('perms.js');

var simulate=Module.cwrap('simulate','void',['array', 'array', 'number', 'array', 'array', 'number'])
var countPairings=Module.cwrap('pairings','number',['number', 'number']);

self.addEventListener('message', function(event) {
    var constraints = event.data;
    console.log( constraints );
    
    var ceremonyCount = constraints.ceremonies.length;
    
    var truthBoothCount = constraints.matches.length + constraints.nonmatches.length;

    var lightsBuffer = new Uint8Array(new Uint32Array(constraints.lights).buffer);

    var booths = constraints.matches.concat( constraints.nonmatches );
    
    booths = booths.reduce(function(a, b) {
	return a.concat(b);
    }, []);

    var boothsBuffer = new Uint8Array(new Uint32Array(booths).buffer);

    var truths = constraints.matches.map( function() { return 1; } ).concat( constraints.nonmatches.map( function() { return 0; } ) );    

    var truthsBuffer = new Uint8Array(new Uint32Array(truths).buffer);

    var matchups = constraints.ceremonies.reduce(function(a, b) {
	return a.concat(b);
    }, []);
    var matchupsBuffer = new Uint8Array(new Uint32Array(matchups).buffer);    
    
    simulate(boothsBuffer,truthsBuffer,truthBoothCount,
	     matchupsBuffer,lightsBuffer,ceremonyCount);

    var total = _totalPairings();
    
    var results = [];
    for( var x = 0; x < 10; x++ ) {
	var row = [];
	for( var y = 0; y < 10; y++ )
	    row[y] = countPairings( x, y );
	results[x] = row;
    }

    self.postMessage({results: results, total: total});
}, false);
