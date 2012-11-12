/* Module deps */

var express = require( 'express' )
  , stylus = require( 'stylus' )
  , nib = require( 'nib' )

var app = express()
function  compile( str, path ) {
  return stylus( str )
    .set( 'filename', path )
	.use( nib() )
}

// data
function Post( title, content ) {
  this.title = title
  this.content = content
}

var posts = [ 
    new Post( 'Testing node.js', 'Text of post 1 isn\'t that long. But it is available' )
  , new Post( 'Post #2', 'Text of post 1 isn\'t that long. But it is available' )
  , new Post( 'Post #3', 'Text of post 1 isn\'t that long. But it is available' )
  , new Post( 'Post #4', 'Text of post 1 isn\'t that long. But it is available' )
]

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

app.get( '/', function( req, res ) {
  res.render( 'index',
  {
      title : 'eightOnions.com'
    , posts : posts
  }
  )
})

app.listen( 80 )
