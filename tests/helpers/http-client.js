/*jshint node:true*/
'use strict';

var http = require('http');

module.exports = function (port) {
    return function request (method, path, data, callback) {
        var req = http.request({ port: port, method: method, path: path }, function (res) {
            var chunks = [];

            res.on('data', function (buffer) {
                chunks.push(buffer);
            });

            res.on('end', function () {
                callback(res, Buffer.concat(chunks).toString());
            });
        });

        if (data) {
            req.write(data);
        }

        req.end();
    };
};
