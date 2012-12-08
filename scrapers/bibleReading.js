var nodeio = require('node.io')

module.exports = function( date, callback ) {
	var job  = new nodeio.Job({
		input:	[ date ],
		run:	function( date ){
			var month = date.getMonth() + 1
			var today = date.getFullYear() + '/' + month  + '/' + date.getDate()

			this.getHtml( 
				'http://wol.jw.org/en/wol/dt/r1/lp-e/' + today,
				function( err, $ ) {
					if(err) {
						this.emit(err)
					} else {
						var r = $('p.se').fulltext
						this.emit(r.replace(/.+:\s+/, ''))
					}
				}
			)
		}
	})

	nodeio.start( job, { silent: true }, callback, true)
}
