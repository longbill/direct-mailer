const { ok, equal } = require('assert');
const dns = require('dns');
const net = require('net');


class DirectMailer {

	constructor(fromEmail, fromName) {
		ok(fromEmail, 'You must set from email address');

		let ms = fromEmail.match(/\w[a-zA-Z0-9\.\-\+]*\@(\w+[a-zA-Z0-9\-\.]+\w)/i);
		ok(ms && ms[1], 'invalid from email address: '+fromEmail);

		this.fromEmail = fromEmail;
		this.fromHost = ms[1].toLowerCase();
		this.fromName = fromName || 'DirectMailer';
		this.logs = [];
		this.responses = [];
	}

	getMxHost(host) {
		return new Promise( (done, reject)=>{
			dns.resolveMx(host, function(err, addresses) {
				if (!err && addresses && addresses.length > 0 && addresses[0] && addresses[0].exchange) {
					done(addresses[0].exchange);
				} else {
					reject(err);
				}
			});
		});
	}

	log(t) {
		//console.log(t);
		this.logs.push(t);
	}

	send(mailto, subject, body) {

		this.logs = [];
		this.responses = [];

		return new Promise((done, reject)=>{
			let ms = mailto.match(/\w[a-zA-Z0-9\.\-\+]*\@(\w+[a-zA-Z0-9\-\.]+\w)/i);
			ok(ms && ms[1], 'invalid mailto address: '+mailto);

			return this.getMxHost(ms[1]).then(mx=>{
				let commands = [
					'HELO '+this.fromHost,
					'MAIL FROM:<'+this.fromEmail+'>',
					'RCPT TO:<'+mailto+'>',
					'DATA',
					"content",
					'QUIT'
				];

				let contents = [
					"MIME-Version: 1.0",
					"Delivered-To: "+mailto,
					"Subject: =?UTF-8?B?"+Buffer.from(subject, 'utf8').toString('base64')+"?=",
					"From: "+this.fromName+" <"+this.fromEmail+">",
					"To: "+mailto,
					"Content-Type: text/plain; charset=UTF-8",
					"Content-Transfer-Encoding: base64",
					"",
					Buffer.from(body, 'utf8').toString('base64')
				];

				let fp = net.createConnection(25, mx);

				fp.on('data', data=>{
					data = data.toString('utf8');
					this.log('>>> '+data);

					let parts = data.split(' ', 2);
					let status = parts[0]*1;
					let msg = data;

					this.responses.push({ code: status, msg });

					if (Math.floor(status / 100) === 5) {
						fp.destroy();
						return;
					}

					

					let cmd = commands.shift();
					if (cmd) {
						if (cmd === 'content') cmd = contents.join("\r\n")+"\r\n.";
						fp.write(cmd+"\r\n");
						this.log('<<< '+cmd)
					}
				});

				fp.on('end', ()=>{
					onFinish();
				});

				fp.on('error', ()=>{
					onFinish();
				});

				fp.on('disconnected', ()=>{
					onFinish();
				});

				fp.on('close', ()=>{
					onFinish();
				});

				fp.on('timeout', ()=>{
					onFinish();
				});
				

				var finished = false;
				var onFinish = () => {
					if (finished) return;
					finished = true;
					fp = null;
					let errorMsg = '';
					this.responses.map(r=>{
						if ( Math.floor(r.code / 100) === 5 && !errorMsg ) {
							errorMsg = r.msg;
						}
					});
					if (errorMsg) {
						reject(errorMsg);
					} else {
						done(true);
					}
				};

			});
		});
	}

}

module.exports = DirectMailer;





