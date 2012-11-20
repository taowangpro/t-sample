#!/usr/bin/node

// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-http';

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

// Create a new instance of HttProxy to use in your server
var httpProxy = require('http-proxy');
var proxy = new httpProxy.RoutingProxy();

var myConn = require('mysql').createConnection({
    host     : 'localhost',
    user     : 'node_chat',
    password : 'node_chat',
    database : 'node_chat'
});

myConn.connect(function(err) {
    if (err) throw err;
    console.log('DB is OK');
});

/**
 * Global variables
 */
var history = [ ];
// latest 100 messages
myConn.query('SELECT u.user_name AS author, l.time, l.text, u.color FROM Log l JOIN User u ON l.user_id = u.id ORDER BY l.time DESC LIMIT 100', function(err, rows) {
    if (err) throw err;
    history = rows;
});
// list of currently connected clients (users)
var clients = [ ];
// track unique username
var namelist = {};

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Array with some colors
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    // hand it over to apache
    console.log('Received request ' + request.url);
    proxy.proxyRequest(request, response, {
        host: '127.0.0.1',
        port: 8383
    });
});

// Port where we'll run the websocket server
server.listen(80, function() {
    console.log((new Date()) + " Server is listening on port 80");
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    // Make sure we only accept requests from an allowed origin
    if (!originIsAllowed(request.origin)) {
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin);
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;
    var userDBId;

    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }

    // user sent some message
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // accept only text
            if (userName === false) { // first message sent by user is their name
                // remember user name
                userName = htmlEntities(message.utf8Data);

                while(namelist[userName]) {
                    var match = userName.match(/(.+?)\((\d+)\)/);
                    if (match) {
                        userName = match[1] + "(" + (parseInt(match[2]) + 1) + ")";
                    } else {
                        userName = userName + "(1)";
                    }
                }
                namelist[userName] = true;

                // get random color and send it back to the user
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({ type:'userName', data: userName }));
                connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
                console.log((new Date()) + ' User is known as: ' + userName + ' with ' + userColor + ' color.');

                // insert into db, write down userDBId
                myConn.query('INSERT INTO User (user_name,color,origin,enter) VALUE ( ?,?,?,NOW() )', [ userName, userColor, request.origin], function(err, result) {
                    if (err) throw err;
                    console.log('insert USER: ', result.insertId);
                    userDBId = result.insertId;
                });

            } else { // log and broadcast the message
                console.log((new Date()) + ' Received Message from '
                            + userName + ': ' + message.utf8Data);

                // insert into db, write down userDBId
                myConn.query('INSERT INTO Log (user_id, `text`,`time`) VALUES (?, ?, NOW())', [userDBId, message.utf8Data], function(err, result) {
                    if (err) throw err;
                    console.log('insert Log: ', result.insertId);
                });

                // history is ongoing
                myConn.query('SELECT u.user_name AS author, l.time, l.text, u.color FROM Log l JOIN User u ON l.user_id = u.id ORDER BY l.time DESC LIMIT 100', function(err, rows) {
                    if (err) throw err;
                    history = rows;
                });

                // broadcast message to all connected clients
                var json = JSON.stringify({
                    type:'message',
                    data: {
                        time: (new Date()).getTime(),
                        text: htmlEntities(message.utf8Data),
                        author: userName,
                        color: userColor
                    }
                });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer " + userName + " left.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
            //remove from name list
            delete namelist[userName];

            // update user left db, write down userDBId
            myConn.query('UPDATE User SET `left` = NOW() WHERE id=?', [userDBId]);
        }
    });

});