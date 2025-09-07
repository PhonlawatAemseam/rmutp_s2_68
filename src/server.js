"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_server_1 = require("@hono/node-server");
var app_1 = require("./app");
(0, node_server_1.serve)(app_1.default, function (info) {
    console.log("Running server on port ".concat(info.port));
});
