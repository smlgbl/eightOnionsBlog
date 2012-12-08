/* Module deps */

var express = require( 'express' )
, stylus = require( 'stylus' )
, nib = require( 'nib' )
, moment = require( 'moment' )
, articleProvider = require('./modules/articleProviderMongoDB.js')
, accountManager = require('./modules/accountManager.js')
, emailDispatcher = require('./modules/emailDispatcher.js')
, rssManager = require('./modules/rssManager.js')
, dayTextJob = require( './scrapers/daysText.js' )
, bibleReadingJob = require('./scrapers/bibleReading.js')
, wtJob = require('./scrapers/wtSubject.js')
, GoogleCalendar = require('google-calendar')

var google_calendar = new GoogleCalendar.GoogleCalendar(
  '98879275279.apps.googleusercontent.com', 
  'X8UlvdT5YZGgWpPRtXoO7Ktj',
  'http://localhost:80/authentication')

var xml = ''
var feed = rssManager.initFeed( 'eightOnions blog', 'http://www.eightonions.com', '/rss.xml', '/favicon.ico', 'smlgbl' )
var initFeed = function() {
	articleProvider.findAll( 
		function( error, articles) {
			if( error ) {
				console.log( error )
			} else {
				for( var a in articles ) {
					rssManager.addItem( feed, {
						title: articles[ a ].title,
						description: articles[ a ].body,
						url: 'http://www.eightonions.com/blog/' + articles[ a ]._id.toHexString(),
						author: 'sml',
						date: articles[ a ].created_at
					})
				}
				console.log( "updated feed." )
				xml = rssManager.xml( feed )
			}
		}
	)
}

articleProvider.init( initFeed )

var app = express()
function compile( str, path ) {
  return stylus( str )
  .set( 'filename', path )
  .use( nib() )
}

app.set( 'views', __dirname + '/views' )
app.set( 'view engine', 'jade' )
app.use( express.logger( 'dev' ) )
app.use( express.bodyParser() )
app.use( express.cookieParser() )
app.use( express.session({ secret: 'super-duper-secret-secret' }));
app.use( stylus.middleware( 
{
  src: __dirname + '/public' 
  , compile: compile
}
))
app.use( express.static( __dirname + '/public' ) )

app.get( '/', function( req, res ) {
  articleProvider.findAll( 
    function( error, articles) {
      res.render( 'index',
        {
          title : 'eightOnions.com'
          , posts : articles
        }
      )
    }
  )
})

app.get('/admin', function( req, res ) {
  if ( req.cookies.user == undefined || req.cookies.pass == undefined ) {
    res.render('admin_login', { title: "Hi, please login:"})
  } else {
    accountManager.autoLogin( req.cookies.user, req.cookies.pass, function( user ) {
      if ( user != null ) {
        req.session.user = user
        res.redirect('/admin/home')
      } else {
        res.render( 'admin_login', { title: "Hi, please login:"})
      }
    })
  }
})

app.post('/admin', function( req, res ) {
  if ( req.param('email') != null ) {
    accountManager.getEmail( req.param('email'), function( user ) {
      if ( user ) {
        res.send( 'ok', 200 )
        emailDispatcher.send( user, function(e, m){
          console.log('error : '+e, 'msg : '+m)
        })
      } else {
        res.send( 'email-not-found', 400 )
      }
    } )
  } else {
    accountManager.manualLogin( req.param('user'), req.param('pass'), function(e, user) {
      if ( !user ) {
        res.redirect('/')
      } else {
        req.session.user = user
        if ( req.param('remember-me') == 'true' ) {
          res.cookie('user', user.user, { maxAge: 900000 })
          res.cookie('pass', user.pass, { maxAge: 900000 })
        }
        res.redirect('/admin/home')
      }
    })
  }
})

app.get('/admin/home', function(req, res) {
  if( req.session == undefined || req.session.user == null ) {
    // if user is not logged-in redirect back to login page //
    res.redirect('/admin');
  } else {
    res.render('admin_home', {
      title: 'Welcome!'
    })
  }
})

app.get( '/admin/cal', function( req, res ) {
  if( req.session == undefined || req.session.user == null ) {
    // if user is not logged-in redirect back to login page //
    res.redirect('/admin');
  } else {
    res.render('admin_cal', {
      title: 'Days text',
	  texts: []
    })
  }
})

// wow, recursion!
function gatherTexts( start, end, callback ) {
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

function gatherReadingSchedule( start, end, callback ) {
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

function gatherWTs( start, end, callback ) {
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


app.post( '/admin/cal', function( req, res ) {
	if( req.session == undefined || req.session.user == null ) {
		// if user is not logged-in redirect back to login page //
		res.redirect('/admin');
	} else {
		if( req.param( 'startdate' ).length && moment( req.param( 'startdate' ) ).isValid() ) {
			var start = moment( req.param( 'startdate' ) ).toDate()
			if( req.param( 'enddate' ).length && moment( req.param( 'enddate' ) ).isValid() ) {
				var end = moment( req.param( 'enddate' ) ).toDate()
			} else var end = start + 1
			if( req.param( 'type' ).length ) {
				switch( req.param('type') ) {
					case 'dt': gatherTexts( start, end, function( texts ) {
									res.render( 'admin_cal', {
										title: 'Days texts',
										texts: texts
									})
								})
								break;
					case 'br': gatherReadingSchedule( start, end, function( texts ) {
									res.render( 'admin_cal', {
										title: 'Bible reading schedule',
										texts: texts
									})
								})
								break;
					case 'wt': gatherWTs( start, end, function( texts ) {
									res.render( 'admin_cal', {
										title: 'Watchtower subjects',
										texts: texts
									})
								})
								break;
				}
			}
		} else {
			res.redirect('/admin/cal');
		}
	}
})

app.get('/admin/new', function(req, res) {
  if( req.session.user == null ) {
    // if user is not logged-in redirect back to login page //
    res.redirect('/admin');
  } else {
    res.render('blog_new', {
      title: 'New Post'
    })
  }
})

app.post('/admin/new', function(req, res){
  if( req.session.user == null ) {
    // if user is not logged-in redirect back to login page //
    res.redirect('/admin');
  } else {
    if( req.param( 'title' ).length && req.param( 'body' ).length ) {
      articleProvider.save(
        [{
          title: req.param('title'),
          body: req.param('body')
        }],
		function( error, articles ) {
		  res.redirect('/')
		  for( var a in articles ) {
			  rssManager.addItem( feed, {
				  title: articles[ a ].title,
				  description: articles[ a ].body,
				  url: 'http://www.eightonions.com/blog/' + articles[ a ]._id.toHexString(),
				  author: 'sml',
				  date: articles[ a ].created_at
			  }, function() {
				  xml = rssManager.xml( feed )
			  } )
		  }
		}
      )
	} else {
	  res.redirect( '/admin/home' )
	}
  }
})

app.get('/admin/edit', function(req, res) {
  if( req.session.user == null ) {
    // if user is not logged-in redirect back to login page //
    res.redirect('/admin');
  } else {
    articleProvider.findAll( 
      function( error, articles) {
        res.render( 'admin_edit',
          {
            title : 'Edit Posts'
            , posts : articles
          }
        )
      }
    )
  }
})

app.get('/admin/edit/:id', function(req, res) {
  if( req.session.user == null ) {
    // if user is not logged-in redirect back to login page //
    res.redirect('/admin');
  } else {
    articleProvider.findById( req.params.id, 
      function( error, post) {
        res.render( 'admin_edit_post',
          {
            title : 'Edit Post'
            , post : post
          }
        )
      }
    )
  }
})

app.post('/admin/edit/:id', function(req, res) {
  if( req.session.user == null ) {
    // if user is not logged-in redirect back to login page //
    res.redirect('/admin');
  } else {
    articleProvider.updateArticle( req.params.id
      , {
          title: req.param('title'),
          body: req.param('body')
        }
      , function( error, post) {
        res.redirect('/admin/edit')
      }
    )
  }
})


app.get('/admin/delete/:id', function(req, res) {
  if( req.session.user == null ) {
    // if user is not logged-in redirect back to login page //
    res.redirect('/admin');
  } else {
    articleProvider.delete(req.params.id, function(error) {
      res.redirect('/admin/edit')
    })
  }
})

app.get('/admin/logout', function(req, res) {
  res.clearCookie('user')
  res.clearCookie('pass')
  req.session.destroy(function(e){ res.send('ok', 200); })
  res.redirect('/')
})

app.get('/blog/:id', function(req, res) {
  articleProvider.findById(req.params.id, function(error, article) {
    if( error || null == article ) {
      console.log( "Error: Coulnd't load " + req.params.id )
      res.redirect('/')
    } else {
      res.render('blog_show',
        {
          title: article.title,
          article: article
        }
      )
    }
  })
})

// app.post('/blog/addComment', function(req, res) {
//     articleProvider.addCommentToArticle(req.param('_id'), {
//         person: req.param('person'),
//         comment: req.param('comment'),
//         created_at: new Date()
//        } , function( error, docs) {
//            res.redirect('/blog/' + req.param('_id'))
//        })
// })

app.get( '/rss.xml', function( req, res ) {
	res.setHeader( 'Content-Type', 'text/plain' )
	res.setHeader( 'Content-Lenght', xml.length )
	res.end( xml )
})

app.get('/dt', function(req, res) {
	dayTextJob( new Date(), function( err, output ) {
		if( err ) output = err
		res.setHeader( 'Content-Type', 'text/plain' )
//		res.setHeader( 'Content-Length', output.toString().length )
		res.end( output.toString() )
	} )
})

app.all('/authentication', function(req, res){
	if(!req.query.code){
		//Redirect the user to Google's authentication form 
		google_calendar.getGoogleAuthorizeTokenURL(function(err, redirectUrl) {
			if(err) res.send(500,err)
			else res.redirect(redirectUrl)
		})
	}else{
		//Get access_token from the code
		google_calendar.getGoogleAccessToken(req.query, function(err, access_token, refresh_token) {
			if(err) res.send(500,err)
			else { 
				req.session.access_token = access_token
				req.session.refresh_token = refresh_token
				google_calendar.listCalendarList(access_token, function(err, calendarList) {
					var body = ''
					calendarList.items.forEach(function(calendar) {
						//Events.list
						console.log('Calendar : ' + calendar.summary)
						body += 'Calendar: ' + calendar.summary + '\n'
						if( calendar.summary == 'es' ) {
							google_calendar.listEvent(access_token, calendar.id, function(err, events) {
								events.items.forEach( function(event) {
									console.log( 'Event: ' + event.summary )
									body += 'Event: ' + event.summary + '\n'
								})
							})
						}
					})
					res.end( body )
				})
			}
		})
	}
})

app.get('*', function(req, res) {
  res.redirect('/')
})

var port = 80
app.listen( port )

console.log( "Listening on port " + port )

