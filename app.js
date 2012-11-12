/* Module deps */

var express = require( 'express' )
  , stylus = require( 'stylus' )
  , nib = require( 'nib' )
  , ArticleProvider = require('./articleProviderInMemory.js').ArticleProvider

var app = express()
function  compile( str, path ) {
  return stylus( str )
    .set( 'filename', path )
	.use( nib() )
}

app.set( 'views', __dirname + '/views' )
app.set( 'view engine', 'jade' )
app.use( express.logger( 'dev' ) )
app.use( stylus.middleware( 
  {
    src: __dirname + '/public' 
	, compile: compile
  }
))
app.use( express.static( __dirname + '/public' ) )

var articleProvider = new ArticleProvider()

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

app.get('/blog/new', function(req, res) {
    res.render('blog_new.jade', {
      title: 'New Post'
    });
});

app.post('/blog/new', function(req, res){
    articleProvider.save({
        title: req.param('title'),
        body: req.param('body')
    }, function( error, articles ) {
        res.redirect('/')
    });
});

app.listen( 3000 )
