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
						var t = $('p.sa').fulltext
						var c = $('p.sb').fulltext
						this.emit( t )
						this.emit( c )
					}
				}
			)
		}
	})

	nodeio.start( job, { silent: true }, callback, true)
}
