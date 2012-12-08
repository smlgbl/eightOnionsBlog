var moment = require( 'moment' )
, GoogleCalendar = require('google-calendar')
, articleProvider = require('./modules/articleProviderMongoDB.js')
, accountManager = require('./modules/accountManager.js')
, emailDispatcher = require('./modules/emailDispatcher.js')
, rssManager = require('./modules/rssManager.js')
, jobProvider = require('./modules/jobProvider.js')

var google_calendar = new GoogleCalendar.GoogleCalendar(
  '98879275279.apps.googleusercontent.com', 
  'X8UlvdT5YZGgWpPRtXoO7Ktj',
  'http://localhost:80/authentication')

var feed = rssManager.initFeed( 'eightOnions blog', 'http://www.eightonions.com', '/rss.xml', '/favicon.ico', 'smlgbl' )

articleProvider.init( 
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
				xml = rssManager.xml( feed )
			}
		}
)

module.exports = function(app) {

	app.get( '/', function( req, res ) {
		articleProvider.findAll( 
			function( error, articles) {
				res.render( 'index',
					{
						title : 'eightOnions.com'
						, posts : articles
					})
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
			})
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
				jobs: Object.keys( jobProvider ),
				texts: []
			})
		}
	})

	// wow, recursion!

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
				if( req.param( 'type' ).length && jobProvider[ req.param('type' ) ].length ) {
					jobProvider[req.param('type')]( start, end, function( texts ) {
						res.render( 'admin_cal', {
							title: req.param('type'),
							texts: texts,
							jobs: Object.keys( jobProvider )
						})
					})
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
							}, function() { xml = rssManager.xml( feed ) }
							)
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
						})
				})
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

	app.get( '/rss.xml', function( req, res ) {
		res.setHeader( 'Content-Type', 'application/rss+xml' )
		res.setHeader( 'Content-Lenght', xml.length )
		res.end( xml )
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
//						calendarList.items.forEach(function(calendar) {
//							//Events.list
//							if( calendar.summary == 'es' ) {
//								google_calendar.listEvent(access_token, calendar.id, function(err, events) {
//									events.items.forEach( function(event) {
//										body += 'Event: ' + event.summary + '\n'
//									})
//								})
//							}
//						})
						res.render( 'admin_select_calendar', {
							title: 'Select your calendar',
							calendars: calendarList.items 
						})
					})
				}
			})
		}
	})

	app.get('*', function(req, res) {
		res.redirect('/')
	})

}
