$(function() {
    // Use JavaScript workers to avoid breaking the UI
    var worker = null;
    var processing = false;
    
    // Given names for person1 and person2, produce indexes into the men and women name list
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

    function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    function progress( p ) {
	$('#progress-bar').attr('aria-valuenow', p );
	$('#progress-bar').css('width', p + '%' );
    }
    
    // Package the desired scenario from the page into a format suitable for the worker
    function postUpdate() {
	if (processing) {
	    worker.terminate();
	    worker = null;
	}

	var transition = $('#progress-bar').css( 'transition' );
	$('#progress-bar').css( 'transition', 'none' );	
	progress( 0 );
	
	if (worker === null) {
	    worker = new Worker('worker.js');
	
	    ////////////////////////////////////////////////////////////////
	    // Update with new probabilities from the worker
	    worker.addEventListener('message', function(e) {
		if ('progress' in e.data) {
		    $('#progress-bar').css( 'transition', transition );			    
		    progress( e.data.progress );
		    return;
		}
		
		if (processing)
		    processing = false;

		progress( 100 );
		
		var data = e.data;
		
		var results = data.results;
		var total = data.total;

		// Display th number of possibilities with appropriate pluralization
		$('#total-possibilities').text( numberWithCommas(total) );
		if (total == 1) {
		    $('#total-possibilities-plural').css( 'display', 'none' );
		    $('#total-possibilities-singular').css( 'display', 'inline' );
		} else {
		    $('#total-possibilities-plural').css( 'display', 'inline' );
		    $('#total-possibilities-singular').css( 'display', 'none' );		    
		}
		
		var xMax = [];
		for( var x = 0; x < 10; x++ ) {
		    xMax[x] = Math.max.apply(null, results[x]);
		}

		var yMax = [];
		for( var y = 0; y < 10; y++ ) {
		    yMax[y] = Math.max.apply(null, results.map( function(row) { return row[y] } ));
		}

		for( var x = 0; x < 10; x++ ) {
		    for( var y = 0; y < 10; y++ ) {
			var cell = $('#cell-' + x + '-' + y);
			if (total == 0) {
			    cell.text( '0.0%' );
			    //cell.css( 'backgroundColor', 'none' );
			    cell.attr('title','');
			} else {
			    cell.attr('title',results[x][y] + ' scenarios');

			    cell.toggleClass( 'x-max', xMax[x] == results[x][y] );
			    cell.toggleClass( 'y-max', yMax[y] == results[x][y] );
			    
			    var percent = (100 * results[x][y] / total);
			    cell.text( percent.toFixed(1) + "%" );

			    var redness = percent / 100;
			    var blueness = percent / 100;
			    var cutoff = 10;
			    
			    if (percent > cutoff) {
				blueness = Math.pow((percent - cutoff) / (100 - cutoff),0.15);
				redness = 0;
			    } else {
				redness = 1.0 - Math.pow((percent) / cutoff,2.0);
				blueness = 0;				
			    }
			    cell.css( 'color', 'rgb(' + (255 * redness).toFixed(0) + ', 0, ' + (255 * blueness).toFixed(0) + ' )' );
			}
		    }
		}


	    }, false);
	}

	
	
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

	// Only enable the reset button if the user hsa made some choices
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

	processing = true;
	worker.postMessage(constraints);
    }

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

		if (cell.hasClass( 'forced-non-match' ))
		    ga('send', 'event', man + '-' + woman, 'nonmatch', '', 0, {'nonInteraction': 1});
		if (cell.hasClass( 'forced-match' ))
		    ga('send', 'event', man + '-' + woman, 'match', '', 0, {'nonInteraction': 1});		
	    });
	});
	
	$('tbody').append( row );
    });

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
    var updateFromSlider = function(e) {
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
    };
  
    $('#slider').on('change', updateFromSlider );

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

    updateFromSlider( { value: { newValue: truthBooths.length + matchUps.length } } );
});
