var nodeio = require('node.io')

exports.job = new nodeio.Job({
	input:	false,
	run:	function(){
		var date = new Date()
		var month = date.getMonth() + 1
		var today = date.getFullYear() + '/' + month  + '/' + date.getDate()

		this.getHtml( 
			'http://wol.jw.org/en/wol/dt/r1/lp-e/' + today,
			function( err, $ ) {
				if(err) {
					this.exit(err)
				} else {
					var t = $('p.sa').fulltext
					this.emit(t)
					var c = $('p.sb').fulltext
					this.emit(c)
				}
			}
		)
	}
})

