$(function () {
    "use strict";

    // for better performance - to avoid searching in DOM
    var jContent    = $('#content');
    var jInput      = $('#input');
    var jStatus     = $('#status');

    // name, color assigned by the server
    var myColor, myName;

    var connection = createWS();
    if (!connection) return;

    // first we want users to enter their names
    connection.onopen = function () {
        jInput.removeAttr('disabled');
        jStatus.text('Choose name:');
    };

    // just in there were some problems with conenction...
    connection.onerror = function () {
        jContent.html('<p>Sorry, but there\'s some problem with your connection or the server is down.</p>');
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // always treat .data string to json
        var json = JSON.parse(message.data);
        var data = json.data;

        if (json.type === 'userName') {     // server proved username
            myName = data;

        } else if (json.type === 'color') { // server assign color
            myColor = data;
            jStatus.text(myName + ': ').css('color', myColor);
            jInput.removeAttr('disabled').focus();

        } else if (json.type === 'history') { // entire message history inser to window, reverse for show recent at bottom
            $.map(data.reverse(), function(v){
                addMessage(v.author, v.text, v.color, new Date(v.time));
            });
        } else if (json.type === 'message') {   // it's a single message
            jInput.removeAttr('disabled');       // let the user write another message
            addMessage(data.author, data.text, data.color, new Date(data.time), true);
        }
    };

    // user interaction with input box
    jInput.on('keydown', function(e) {
        var msg = $(this).val();
        if (e.keyCode !== 13 || !msg) {
            return;
        }

        // send the message as an ordinary text
        connection.send(msg);
        // suspend input
        $(this).val('').attr('disabled', 'disabled');
    });

    /**
     * If the server wasn't able to respond to the in 5 seconds then
     * show some error message to notify the user that something is wrong.
     */
    setInterval(function() {
        if (connection.readyState === 1) return;

        jStatus.text('Error');
        jInput.attr('disabled', 'disabled')
            .val('Unable to comminucate with the WebSocket server.');
    }, 5000);

    function createWS() {
        // if user is running mozilla then use it's built-in WebSocket
        var WebSocket = window.WebSocket || window.MozWebSocket;

        // Sad case - browser not support
        if (!WebSocket) {
            jContent.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                        + 'support WebSockets.'} ));
            jInput.hide();
            $('span').hide();
            return;
        }

        // open connection
        return new WebSocket('ws://' + document.location.hostname);
    }

    // Add message to the chat window
    function addMessage(author, message, color, dt, anim) {
        jContent.append('<p><span style="color:' + color + '">' + author + '</span> @ ' +
            + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
            + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
            + ': ' + message + '</p>');

        // keep scroll content to bottom
        var scroll = jContent.height() - 400;
        if ( scroll > 0 ) {
            anim ? jContent.parent().animate({scrollTop: scroll}, 'fast', 'swing') : jContent.parent().scrollTop(scroll);
        }
    }
});