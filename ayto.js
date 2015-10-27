$(function() {
    // Use JavaScript workers to avoid breaking the UI
    var worker = new Worker('worker.js');

    function manWoman( person1, person2 ) {
	var man = -1;
	var woman = -1;

	if (men.indexOf(person1) >= 0) {
	    man = men.indexOf(person1);
	    woman = women.indexOf(person2);
	} else {
	    man = men.indexOf(person2);
	    woman = women.indexOf(person1);
	}

	return [man, woman];
    }
    
    function postUpdate() {
	var forcedMatches = [];
	var forcedNonmatches = [];

	// Add the buttons that the user has clicked
	$('td.probability').each( function() {
	    var cell = $(this);
	    var man = cell.attr('data-man');
	    var woman = cell.attr('data-woman');

	    if (cell.hasClass('forced-match'))
		forcedMatches.push( [man, woman] );

	    if (cell.hasClass('forced-non-match'))
		forcedNonmatches.push( [man, woman] );
	});

	if ((forcedMatches.length == 0) && (forcedNonmatches.length == 0))
	    $('#reset-button').addClass('disabled');
	else
	    $('#reset-button').removeClass('disabled');	    

	// Add the active truth booths
	$('.truth-booth').each( function() {
	    var truthBooth = $(this);
	    if ( ! truthBooth.hasClass('dimmed')) {
		var truthBooth = truthBooth.data();

		var person1 = Object.keys(truthBooth)[0];
		var person2 = Object.keys(truthBooth[person1])[0];
		var result = truthBooth[person1][person2];

		if (!result)
		    forcedNonmatches.push( manWoman( person1, person2 ) );
		else
		    forcedMatches.push( manWoman( person1, person2 ) );
	    }
	});

	var ceremonies = [];
	var lights = [];
	
	// Add the active matchups
	$('.match-up').each( function() {
	    var matchUp = $(this);
	    if ( ! matchUp.hasClass('dimmed')) {
		var matchUp = matchUp.data();

		lights.push( matchUp[0] );

		var pairings = matchUp[1];

		var tuples = [];
		Object.keys(pairings).forEach( function(name1) {
		    var name2 = pairings[name1];
		    tuple = manWoman( name1, name2 );
		    tuples[tuple[0]] = tuple[1];
		});

		ceremonies.push( tuples );
	    }
	});

	var constraints = {};
	constraints['matches'] = forcedMatches;
	constraints['nonmatches'] = forcedNonmatches;
	constraints['lights'] = lights;
	constraints['ceremonies'] = ceremonies;
	
	worker.postMessage(constraints);
    }

    //var f = Module._simulate( 0, 0, 0, 0, 0, 0 );
    //f();

    // Populate the table headers
    men.forEach( function(name) {
	$('thead tr').append( $('<th>' + name + '</th>') );
    });

    // Populate the table headers
    women.forEach( function(woman) {
	var row = $('<tr></tr>');
	var header = $('<td>' + woman + '</td>');
	row.append( header );
	
	men.forEach( function(man) {
	    var cell = $('<td class="probability">?</td>');
	    cell.attr( 'id', 'cell-' + men.indexOf(man) + '-' + women.indexOf(woman) );
	    cell.attr( 'data-man', men.indexOf(man) );
	    cell.attr( 'data-woman', women.indexOf(woman) );
	    row.append( cell );
	    
	    cell.click(function(event) {
		if (cell.hasClass( 'forced-match' )) {
		    cell.removeClass('forced-match');
		    cell.addClass('forced-non-match');
		} else {
		    if (cell.hasClass( 'forced-non-match' ))
			cell.removeClass('forced-non-match');
		    else
			cell.addClass('forced-match');
		}

		postUpdate();
	    });
	});
	
	$('tbody').append( row );
    });

    postUpdate();

    ////////////////////////////////////////////////////////////////
    // Setup reset button
    
    $('#reset-button').click( function(event) {
	$('.forced-match').removeClass('forced-match');
	$('.forced-non-match').removeClass('forced-non-match');

	postUpdate();
    });
    
    ////////////////////////////////////////////////////////////////
    // Setup slider

    // Tool tip lets the user know where they are in the season
    $('#slider').slider({
	min: 0,
	max: truthBooths.length + matchUps.length,
	value: truthBooths.length + matchUps.length,	
	step: 1,
	formatter: function(value) {
	    if (value == 0)
		return 'Preseason';
	    
	    var episode = Math.ceil(value/2);
	    if ((value % 2) == 1)
		return 'Episode ' + episode + ' Truth Booth';
	    return 'Episode ' + episode + ' Matching Ceremony';	    
	}
    });

    // As you slide the slider, hide the "future" episode events
    $('#slider').on('change', function(e) {
	var value = e.value.newValue;

	$('.truth-booth').addClass( 'dimmed' );
	$('.match-up').addClass( 'dimmed' );
	
	for( var i=1; i<=value; i++ ) {
	    if ((i % 2) == 1)
		$('#truth-booth-' + Math.ceil(i/2)).removeClass('dimmed');
	    else
	    	$('#match-up-' + i/2).removeClass('dimmed');
	}

	postUpdate();
    });

    ////////////////////////////////////////////////////////////////
    // Add truth booths
    var truthBoothPanel = function( episode, truthBooth ) {
	var panel = $('<div class="panel panel-default truth-booth" id="truth-booth-' + episode + '"></div>');
	panel.data( truthBooth );
	
	var title = 'Truth Booth ' + episode;
	var header = $('<div class="panel-heading"><h3 class="panel-title">' + title + '</h3></div>');
	panel.append( header );

	var content = $('<div class="panel-body"></div>');
	
	var person1 = Object.keys(truthBooth)[0];
	var person2 = Object.keys(truthBooth[person1])[0];
	var result = truthBooth[person1][person2];

	content.text( person1 + ' and ' + person2 + ' are ' + ((result) ? '':'not ') +  'a match.' );
	panel.append(content);
	
	return panel;
    };
    
    truthBooths.forEach( function(truthBooth) {
	var episode = truthBooths.indexOf(truthBooth) + 1;
	var panel = truthBoothPanel( episode, truthBooth );
	var container = $('<div class="col-sm-3"></div>');
	container.append( panel );
	$('#episodeEvents').append( container );
    });

    ////////////////////////////////////////////////////////////////
    // Add matching ceremonies    
    var matchUpPanel = function( episode, matchUp ) {
	var panel = $('<div class="panel panel-default match-up" id="match-up-' + episode + '"></div>');
	panel.data( matchUp );
	
	var title = 'Matching Ceremony ' + episode;
	var header = $('<div class="panel-heading"><h3 class="panel-title">' + title + '</h3></div>');
	panel.append( header );

	var content = $('<div class="panel-body"></div>');
	var list = $('<ul></ul>');
	
	Object.keys(matchUp[1]).forEach( function(person1) {
	    list.append( $('<li>' + person1 + ' and ' + matchUp[1][person1] + '</li>') );
	});
	
	content.append(list);
	content.append( $('<p>' + matchUp[0] + ' perfect matches.</p>') );
	panel.append(content);
	
	return panel;
    };    
    
    matchUps.forEach( function(matchUp) {
	var episode = matchUps.indexOf(matchUp) + 1;
	var panel = matchUpPanel( episode, matchUp );
	var container = $('<div class="col-sm-3"></div>');
	container.append( panel );
	$('#truth-booth-' + episode).parent().after( container );
    });    

    ////////////////////////////////////////////////////////////////
    // Update with new probabilities from the worker
    worker.addEventListener('message', function(e) {
	var data = e.data;

	var results = data.results;
	var total = data.total;

	$('#total-possibilities').text( total );	
	
	for( var x = 0; x < 10; x++ ) {
	    for( var y = 0; y < 10; y++ ) {
		var cell = $('#cell-' + x + '-' + y);
		if (total == 0) 
		    cell.text( '0.0%' );
		else
		    cell.text( (100 * results[x][y] / total).toFixed(1) + "%" );
	    }
	}


	
    }, false);

    
});
