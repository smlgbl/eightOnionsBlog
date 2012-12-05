var nodeio = require('node.io')

var date = new Date()
var month = date.getMonth() + 1
var today = date.getFullYear() + '/' + month  + '/' + date.getDate()

exports.job = new nodeio.Job({
	input:	false,
	run:	function(){
		this.getHtml( 
			'http://wol.jw.org/en/wol/dt/r1/lp-e/' + today,
			function( err, $ ) {
				if(err) {
					this.exit(err)
				} else {
					var w = $('p.sc').first().fulltext
					var s = $('p.sc').last().fulltext
					this.emit(w + s.replace(/.+:/, ''))
				}
			}
		)
	}
})

