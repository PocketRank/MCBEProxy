const fs = require("fs");

const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');

http.createServer((req, res) => {
    res.writeHead(301, {Location: 'https://' + req.headers.host + req.url});
    res.end();
}).listen(80, () => {
    console.log('listening on port 80');
});

var proxy = httpProxy.createProxyServer({
    ssl: {
        key: fs.readFileSync(__dirname + '/ssl/private.key'),
        cert: fs.readFileSync(__dirname + '/ssl/cert.pem'),
        ca: fs.readFileSync(__dirname + '/ssl/ca.pem')
    },
    secure: false
});
proxy.on('proxyReq', function(proxyReq, req, res, options) {
    proxyReq.setHeader('X-Forwarded-For', (req.headers["X-Forwarded-For"] ||
        req.headers["x-forwarded-for"] ||
        '').split(',')[0] ||
        req.client.remoteAddress);
});
https.createServer({
    key: fs.readFileSync(__dirname + '/ssl/private.key'),
    cert: fs.readFileSync(__dirname + '/ssl/cert.pem'),
    ca: fs.readFileSync(__dirname + '/ssl/ca.pem')
}, (req ,res) => {
    //pmmp.me: 5000
    //mcbe.cf: 5001

    //console.log(req.headers.host);
    let split = req.headers.host.split('.').reverse();
    switch (split[1] + '.' + split[0]) {
        case "mcbe.cf":
            proxy.web(req, res, {target: 'https://127.0.0.1:5001'});
            break;
        case "pmmp.me":
            proxy.web(req, res, {target: 'https://127.0.0.1:5000'});
            break;
        default:
            res.end("Cannot GET + " + req.headers.host + req.url);
            return;
    }
}).listen(443, () => {
    console.log("listening on port 443");
});