var articleCounter = 1;

ArticleProvider = function(){};
ArticleProvider.prototype.dummyData = [];

ArticleProvider.prototype.findAll = function(callback) {
  callback( null, this.dummyData )
};

ArticleProvider.prototype.findById = function(id, callback) {
  var result = null;
  for(var i =0;i<this.dummyData.length;i++) {
    if( this.dummyData[i]._id == id ) {
      result = this.dummyData[i];
      break;
    }
  }
  callback(null, result);
};

ArticleProvider.prototype.save = function(articles, callback) {
  var article = null;

  for( var i =0;i< articles.length;i++ ) {
    article = articles[i];
    article._id = articleCounter++;
    article.created_at = new Date();

    if( article.comments === undefined )
      article.comments = [];

    for(var j =0;j< article.comments.length; j++) {
      article.comments[j].created_at = new Date();
    }
    this.dummyData[this.dummyData.length]= article;
  }
  callback(null, articles);
};

/* Lets bootstrap with dummy data */
new ArticleProvider().save([
  {title: 'Post one', body: 'Post until you drop', comments:[{author:'Bob', comment:'I love it'}, {author:'Dave', comment:'This is rubbish!'}]},
  {title: 'Post two', body: 'Evi has a fabulous body.', comments:[{author: 'Samuel', comment: 'Yes, that\'s so true.'}]},
  {title: 'Post three', body: 'Body three'}
], function(error, articles){});

exports.ArticleProvider = ArticleProvider;