/*jshint node:true*/
'use strict';

var http = require('http');

module.exports = function (port) {
    return function request (opts, data, callback) {
        var req = http.request({ port: port, method: opts.method, path: opts.path }, function (res) {
            var chunks = [];

            res.on('data', function (buffer) {
                chunks.push(buffer);
            });

            res.on('end', function () {
                if (callback) {
                    callback(res, Buffer.concat(chunks).toString());
                }
            });
        });

        if (opts.type) {
            req.setHeader('Content-Type', opts.type);
        }

        if (data) {
            req.write(data);
        }

        req.end();
    };
};
