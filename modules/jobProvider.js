var moment = require('moment')
, dayTextJob = require( '../scrapers/daysText.js' )
, bibleReadingJob = require('../scrapers/bibleReading.js')
, wtJob = require('../scrapers/wtSubject.js')

var Jobs = {
	'days text': getTexts
	, 'bible reading': getReadingSchedule
	, 'watchtower subject': getWTs
}

module.exports = Jobs

function getTexts( start, end, callback ) {
	var texts = []
	var date = start
	var textCallback = function( err, output ) {
		if( err ) {
			console.log( err )
		}
		else {
			texts.push( {
				title: date.toString(),
				scripture: output[ 0 ],
				comment: output[ 1 ]
			})
		}
		date = moment( date ).add( 'days', 1 ).toDate()
		if( date < end ) dayTextJob( date, textCallback )
		else callback( texts )
	}
	dayTextJob( date, textCallback )
}

function getReadingSchedule( start, end, callback ) {
	var texts = []
	var date = start
	var textCallback = function( err, output ) {
		if( err ) {
			console.log( err )
		}
		else {
			texts.push( {
				title: date.toString(),
				scripture: output[ 0 ],
				comment: ''
			})
		}
		date = moment( date ).add( 'days', 7 ).toDate()
		if( date < end ) bibleReadingJob( date, textCallback )
		else callback( texts )
	}
	bibleReadingJob( date, textCallback )
}

function getWTs( start, end, callback ) {
	var texts = []
	var date = start
	var textCallback = function( err, output ) {
		if( err ) {
			console.log( err )
		}
		else {
			texts.push( {
				title: date.toString(),
				scripture: output[ 0 ],
				comment: ''
			})
		}
		date = moment( date ).add( 'days', 7 ).toDate()
		if( date < end ) wtJob( date, textCallback )
		else callback( texts )
	}
	wtJob( date, textCallback )
}

