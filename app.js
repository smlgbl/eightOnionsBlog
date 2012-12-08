/* Module deps */

var express = require( 'express' )
, stylus = require( 'stylus' )
, nib = require( 'nib' )
var xml = ''
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

require('./router.js')(app)

var port = 80
app.listen( port )

console.log( "Listening on port " + port )

