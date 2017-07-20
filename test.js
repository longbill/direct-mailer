const DirectMailer = require('./');
let mail = new DirectMailer('me@server.com', 'Chunlong');
mail.send('someone@other.com', 'subject here', 'content here').then(()=>{
	console.log('sent');
}).catch(err=>{
	console.error(err);
});

