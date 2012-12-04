var Db = require('mongodb').Db
// var Connection = require('mongodb').Connection
var Server = require('mongodb').Server
var BSON = require('mongodb').BSON
var ObjectID = require('mongodb').ObjectID

var dbPort = 27017
var dbHost = 'localhost'
var dbName = 'node-mongo-blog'

var AP = {}

AP.init = function( callback ) {
	AP.db = new Db(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}, {}), {safe:false})
		AP.db.open(function(e, d){
			if (e) {
				console.log(e)
				callback(e)
			} else{
				console.log('connected to database :: ' + dbName)
				callback()
			}
		})
	AP.articles = AP.db.collection('articles')
}

module.exports = AP

AP.getObjectId = function(id)
{
  return AP.articles.db.bson_serializer.ObjectID.createFromHexString(id)
}

AP.findAll = function(callback) {
  AP.articles.find().toArray(function(error, results) {
    if( error ) callback(error)
    else callback(null, results)
  })
}


AP.findById = function(id, callback) {
  AP.articles.findOne({_id: this.getObjectId(id)}, function(error, result) {
    if( error ) {
      callback(error)
    } else {
      callback(null, result)
    }
  })
}

AP.save = function(articles, callback) {
  if( typeof(articles.length)=="undefined")
    articles = [articles]

  for( var i =0; i< articles.length; i++ ) {
    article = articles[i]
    article.created_at = new Date()
    if( article.comments === undefined ) article.comments = []
    for(var j =0;j< article.comments.length; j++) {
      article.comments[j].created_at = new Date()
    }
  }

  AP.articles.insert(articles, function() {
    callback(null, articles)
  })
}

AP.delete = function(id, callback)
{
  AP.articles.remove({_id: this.getObjectId(id)}, callback)
}

AP.addCommentToArticle = function(articleId, comment, callback) {
  AP.articles.update(
    {_id: this.getObjectId(articleId)},
    {"$push": {comments: comment}},
    function(error, article){
      if( error ) callback(error)
      else callback(null, article)
    }
  )
}

AP.updateArticle = function(id, article, callback) {
  AP.articles.update(
    {_id: this.getObjectId(id)},
    article,
    function(error, article) {
      if(error) callback(error)
      else callback(null, article)
    }
  )
}
