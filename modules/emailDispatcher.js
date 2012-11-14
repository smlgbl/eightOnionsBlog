var ES = require('./emailSettings.js')
var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect({
	host 	    : ES.host,
	user 	    : ES.user,
	password    : ES.pass,
	ssl		    : true
});

EM.dispatchResetPasswordLink = function(account, callback)
{
	EM.server.send({
		from         : ES.sender,
		to           : account.email,
		subject      : 'Password Reset',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEmail(account)
	}, callback );
}

EM.composeEmail = function(o)
{
	var link = 'http://www.eightonions.com/admin/reset-password?e='+o.email+'&p='+o.pass;
	var html = "<html><body>";
		html += "Hi "+o.name+",<br><br>";
		html += "Your username is :: <b>"+o.user+"</b><br><br>";
		html += "<a href='"+link+"'>Please click here to reset your password</a><br><br>";
		html += "Cheers,<br>";
		html += "<a href='http://www.eightonions.com'>eightOnions</a><br><br>";
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}
