var rss = require( 'rss' )

var RSS = {}

module.exports = RSS

RSS.initFeed = function( title, site, feed, image, author ) {
	return new rss( {
		title: title,
		feed_url: site + feed,
		site_url: site,
		image_url: site + image,
		author: author,
	} )
}

RSS.addItem = function( feed, item, callback ) {
	feed.item( item )
	if( callback ) callback()
}

RSS.updateFeed = function( feed, items, callback ) {
	var f2 = new rss( {
		title: feed.title,
		feed_url: feed.feed_url,
		site_url: feed.site_url,
		image_url: feed.image_url,
		author: feed.author
	})
	for( var item in feed.items ) {
		f2.item( item )
	}
	for( var item in items ) {
		f2.item( item )
	}
	callback( f2 )
}

RSS.xml = function( feed ) {
	return feed.xml()
}

