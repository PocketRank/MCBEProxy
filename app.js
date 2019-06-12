const fs = require("fs");

const http = require('http');
const https = require('https');
const proxy = require('http-proxy');
http.createServer((req, res) => {
    res.writeHead(301, {Location: 'https://' + req.headers.host + req.url});
    res.end();
}).listen(80, () => {
    console.log('listening on port 80');
});

var httpsProxy = proxy.createProxyServer({
    ssl: {
        key: fs.readFileSync(__dirname + '/ssl/private.key'),
        cert: fs.readFileSync(__dirname + '/ssl/cert.pem'),
        ca: fs.readFileSync(__dirname + '/ssl/ca.pem')
    },
    secure: false
});
httpsProxy.on('proxyReq', function (proxyReq, req, res, options) {
    proxyReq.setHeader('X-Forwarded-For', (req.headers["X-Forwarded-For"] ||
        req.headers["x-forwarded-for"] ||
        '').split(',')[0] ||
        req.client.remoteAddress);
});

https.createServer({
    key: fs.readFileSync(__dirname + '/ssl/private.key'),
    cert: fs.readFileSync(__dirname + '/ssl/cert.pem'),
    ca: fs.readFileSync(__dirname + '/ssl/ca.pem')
}, (req, res) => {
    //pmmp.me: 5000
    //mcbe.cf: 5001
    //minejs.me: 8051 (http is 8050)

    //console.log(req.headers.host);
    try {
        let split = req.headers.host.split('.').reverse();
        switch (split[1] + '.' + split[0]) {
            case "mcbe.cf":
                httpsProxy.web(req, res, {target: 'https://127.0.0.1:5001'});
                break;
            case "pmmp.me":
                httpsProxy.web(req, res, {target: 'https://127.0.0.1:5000'});
                break;
            case "minejs.me":
                httpsProxy.web(req, res, {target: 'https://127.0.0.1:8051'});
                break;
            default:
                res.end("Cannot GET + " + req.headers.host + req.url);
                return;
        }
    } catch (e) {
        res.end(e);
    }

}).listen(443, () => {
    console.log("listening on port 443");
});