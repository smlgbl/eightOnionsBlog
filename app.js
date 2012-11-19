/* Module deps */

var express = require( 'express' )
, stylus = require( 'stylus' )
, nib = require( 'nib' )
, articleProvider = require('./modules/articleProviderMongoDB.js')
, accountManager = require('./modules/accountManager.js')
, emailDispatcher = require('./modules/emailDispatcher.js')

var app = express()
function  compile( str, path ) {
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
    if( req.param( 'title' ).length  && req.param( 'body' ).length ) {
      articleProvider.save(
        [{
          title: req.param('title'),
          body: req.param('body')
        }],
        function( error, articles ) {
          res.redirect('/')
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
    res.render('blog_show',
      {
        title: article.title,
        article: article
      }
    )
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

app.get('*', function(req, res) {
  res.redirect('/')
})

app.listen( 80 )
