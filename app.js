/* Module deps */

var express = require( 'express' )
  , stylus = require( 'stylus' )
  , nib = require( 'nib' )
  , ArticleProvider = require('./articleProviderMongoDB.js').ArticleProvider

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
app.use( stylus.middleware( 
  {
    src: __dirname + '/public' 
	, compile: compile
  }
))
app.use( express.static( __dirname + '/public' ) )

var articleProvider = new ArticleProvider('localhost', 27017)

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
    })
})

app.post('/blog/new', function(req, res){
    articleProvider.save(
      [{
        title: req.param('title'),
        body: req.param('body')
      }],
      function( error, articles ) {
        res.redirect('/')
      }
    )
})

app.get('/blog/:id', function(req, res) {
    articleProvider.findById(req.params.id, function(error, article) {
        res.render('blog_show.jade',
          {
            title: article.title,
            article:article
          }
        )
    })
})

app.post('/blog/addComment', function(req, res) {
    articleProvider.addCommentToArticle(req.param('_id'), {
        person: req.param('person'),
        comment: req.param('comment'),
        created_at: new Date()
       } , function( error, docs) {
           res.redirect('/blog/' + req.param('_id'))
       })
})

app.listen( 80 )
