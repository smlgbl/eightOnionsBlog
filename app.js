var express = require('express')
var ArticleProvider = require('./articleProviderInMemory').ArticleProvider

var app = express()

app.configure(function(){
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(require('stylus').middleware({ src: __dirname + '/public' }))
  app.use(app.router)
  app.use(express.static(__dirname + '/public'))
})

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
})

app.configure('production', function(){
  app.use(express.errorHandler())
})

var articleProvider= new ArticleProvider()

app.get('/', function(req, res){
  articleProvider.findAll(function(error, docs){
      res.render('index.jade', { locals: {
          title: 'eightOnions blog',
          articles:docs
          }
      })
  })
})

app.listen(3000)
