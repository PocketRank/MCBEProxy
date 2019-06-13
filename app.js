const fs = require("fs");

const http = require('http');
const https = require('https');
const proxy = require('http-proxy');

http.createServer((req, res) => {
    if (req.headers['upgrade'] === 'websocket') {
        let split = req.headers.host.split('.').reverse();
        switch (split[1] + '.' + split[0]) {
            case "minejs.me":
                httpsProxy.web(req, res, {target: 'ws://127.0.0.1:8050'});
                break;
            default:
                res.end();
                return;
        }
    }
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
    }
});
httpsProxy.on('proxyReq', function (proxyReq, req, res, options) {
    proxyReq.setHeader('X-Forwarded-For', (req.headers["X-Forwarded-For"] ||
        req.headers["x-forwarded-for"] ||
        '').split(',')[0] ||
        req.client.remoteAddress);
});
var wssProxy = proxy.createProxyServer({
    ssl: {
        key: fs.readFileSync(__dirname + '/ssl/private.key'),
        cert: fs.readFileSync(__dirname + '/ssl/cert.pem'),
        ca: fs.readFileSync(__dirname + '/ssl/ca.pem')
    },
    target: {
        host: 'localhost',
        port: 8051
    },
    ws: true,
    secure: true
});

let https_server = https.createServer({
    key: fs.readFileSync(__dirname + '/ssl/private.key'),
    cert: fs.readFileSync(__dirname + '/ssl/cert.pem'),
    ca: fs.readFileSync(__dirname + '/ssl/ca.pem')
}, (req, res) => {
    //pmmp.me: 5000
    //mcbe.cf: 5001
    //minejs.me: 8051 (http is 8050)

    //console.log(req.headers.host);
    if (req.headers['upgrade'] === 'websocket') {
        let split = req.headers.host.split('.').reverse();
        switch (split[1] + '.' + split[0]) {
            case "minejs.me":
                wssProxy.web(req, res);
                break;
            default:
                res.end();
                return;
        }
    }
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

});
https_server.on('upgrade', function (req, socket, head) {
    console.log(req);
    wssProxy.ws(req, socket, {target: 'wss://127.0.0.1:8051'});
});
https_server.listen(443, () => {
    console.log("listening on port 443");
});