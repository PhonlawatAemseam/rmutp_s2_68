"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var hono_1 = require("hono");
var app = new hono_1.Hono();
// operation
// CRUD
app.get("/", function (c) { return c.text("Hello World"); });
exports.default = app;
