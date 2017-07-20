# Direct Mailer

When considering email sending from node.js, the most popular way is to connect to your SMTP server and let the server send the mail for you.

`your node` => `your SMTP server` => `destination SMTP server` => `destination Email inbox`

This is a module let you send mail directly to the destination mail server. 

`your node` => `destination SMTP server` => `destination Email inbox`


## Install

```
npm install --save direct-mailer
```

## Usage

```javascript
const DirectMailer = require('direct-mailer');

//create an instance, pass your own email address and your name
let mail = new DirectMailer('me@server.com', 'Chunlong');

//send
mail.send('someone@other.com', 'subject here', 'content here').then(()=>{
	console.log('sent');
}).catch(err=>{
	console.error(err);
});
```

