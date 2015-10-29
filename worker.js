self.addEventListener('message', function(event) {
    "use strict";
    
    var constraints = event.data;
    console.log( constraints );

    var CARDINALITY = 10;

    var total = 0;

    var counts = new Uint32Array(CARDINALITY * CARDINALITY);
    counts.fill(0);
    
    var matches = constraints.matches;
    var leftMatches = new Uint32Array(matches.map( function(m) { return m[0] } ));
    var rightMatches = new Uint32Array(matches.map( function(m) { return m[1] } ));
    var matchesLength = constraints.matches.length;
    
    var nonmatches = constraints.nonmatches;
    var leftNonmatches = new Uint32Array(nonmatches.map( function(m) { return m[0] } ));
    var rightNonmatches = new Uint32Array(nonmatches.map( function(m) { return m[1] } ));    
    var nonmatchesLength = constraints.nonmatches.length;
    
    var lights = new Uint32Array(constraints.lights);
    var ceremonies = constraints.ceremonies;
    var ceremonies = new Uint32Array( ceremonies.reduce(function(a, b) { return a.concat(b); }, []) );
    var ceremoniesLength = constraints.ceremonies.length;    

    var FACTORIAL = 10*9*8*7*6*5*4*3*2*1 | 0;

    console.log( 'here we go' );
    
    var permuted = new Int8Array(10);
    var elements = new Int8Array(10);    
    var identityPermutation = new Int8Array([0,1,2,3,4,5,6,7,8,9]);
    
    var index;
    var i, j;
    var m;
    var valid;
    var correct;
    
    for(var p=0; p<FACTORIAL; ++p ) {
	m = p;
	elements.set( identityPermutation );

	if (p % (9*8*7*6*4*3*1) == 0)
	    self.postMessage({progress: p / (9*8*7*6*4*3*1)});
	    
	// Antoine Cormeau's algorithm
	for( i=0; i<CARDINALITY; ++i ) {
	    index = m % (CARDINALITY-i);
	    m = Math.floor(m / (CARDINALITY-i));
	    permuted[i] = elements[index];
	    elements[index] = elements[CARDINALITY-i-1];
	}

	valid = true;

	// Verify the matches
	for( i = 0; i < matchesLength; ++i ) {
	    if (permuted[leftMatches[i]] != rightMatches[i]) {
		valid = false;
		break;
	    }
	}

	if (!valid) continue;

	// Verify the nonmatches
	for( i = 0; i < nonmatchesLength; ++i ) {
	    if (permuted[leftNonmatches[i]] == rightNonmatches[i]) {
		valid = false;
		break;
	    }
	}

	if (!valid) continue;

	// Verify the matching ceremonies
	for( i = 0; i < ceremoniesLength; ++i ) {

	    correct = 0;
	    for( j=0; j<CARDINALITY; j++ ) {
		if (permuted[j] == ceremonies[i * CARDINALITY + j])
		    correct++;
	    }
	    
	    if (correct != lights[i]) {
		valid = false;
		break;
	    }
	}

	if (!valid) continue;
	
	// Record the result
	total++;
	for( i=0; i<CARDINALITY; ++i ) {
	    counts[i * CARDINALITY + permuted[i]]++;
	}
    }

    var results = [[],[],[],[],[],[],[],[],[],[]];
    for( var x = 0; x < CARDINALITY; x++ )
	for( var y = 0; y < CARDINALITY; y++ )
	    results[x][y] = counts[x * CARDINALITY + y];
    
    self.postMessage({results: results, total: total});
}, false);
