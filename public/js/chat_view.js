
/*
 * This JavaScript file is strictly for implemen-
 * tations on the view file: resources/views/chat.blade.php
 */

(function ($) {
    // the chat agent
    $.ChatAgent = {};

    // domain object model references
    $.ChatAgent.Dom = {};
    $.ChatAgent.Dom.conversation_body = null;
    $.ChatAgent.Dom.text_message_box = null;
    $.ChatAgent.Dom.send_message_btn = null;

    // the socket
    $.ChatAgent.Socket = null;

    // cross site request forgery token
    $.ChatAgent.csrf_token = null;

    // websocket host url and port
    $.ChatAgent.socket_url = null;
    $.ChatAgent.socket_port = null;

    // user and recipient uuid
    $.ChatAgent.sender_uuid = null;
    $.ChatAgent.receiver_uuid = null;

    $.ChatAgent.launched = false;

    // socket server end point
    $.ChatAgent.get_socket_end_point = function() {
        return this.socket_url + ':' + this.socket_port;
    }

    // scroll down conversations smoothly
    $.ChatAgent.scroll_down_conversation_body = function() {
        var distance_to_scroll = 
                this.Dom.conversation_body.height() + this.Dom.conversation_body.scrollTop();
        
        var scroll_smoothness = 500;

        // scroll down
        this.Dom.conversation_body.animate(
            {scrollTop: distance_to_scroll}, scroll_smoothness
        );
    };

    $.ChatAgent.disable_conversation_components = function() {
        this.Dom.conversation_body.attr('disabled', 'disabled');
        this.Dom.text_message_box.attr('disabled', 'disabled');
        this.Dom.send_message_btn.attr('disabled', 'disabled');
    }

    $.ChatAgent.enable_conversation_components = function() {
        this.Dom.conversation_body.removeAttr('disabled');
        this.Dom.text_message_box.removeAttr('disabled');
        this.Dom.send_message_btn.removeAttr('disabled');
    }

    $.ChatAgent.get_message = function() {
        return this.Dom.text_message_box.val();
    }

    // new message function
    $.ChatAgent.send_message = function() {
        var message = this.get_message();

        // abort on empty message
        if (message === '')
        {
            return false;
        }

        // save message
        $.ajax({
            url: "/chat/store",
            type: "POST",
            headers: {
                "X-CSRF-TOKEN": $.ChatAgent.csrf_token
            },
            data: {
                "message": message,
                "sender_uuid": $.ChatAgent.sender_uuid,
                "receiver_uuid": $.ChatAgent.receiver_uuid
            },
            success: function(data, textStatus, jqXHR) {
                console.log('Sending new message');

                // send (broadcast) message
                $.ChatAgent.Socket.emit('new_msg', {
                    message: message,
                    recipient: $.ChatAgent.receiver_uuid
                });

                // add message to conversation body
                $.ChatAgent.Dom.conversation_body.append("<p class='message_box message_box_you'>" + message + "</p><br/><br/><br/>");

                $.ChatAgent.scroll_down_conversation_body();

                // clear the message textbox
                $.ChatAgent.Dom.text_message_box.val('');
            }
        });
    }

    $.ChatAgent.launch = function() {
        if (this.launched)
        {
            return false;
        }

        // trigger new message on click
        this.Dom.send_message_btn.click(function() {
            $.ChatAgent.send_message();
        });

        // trigger new message on enter
        this.Dom.text_message_box.keypress(function(e) {
            var keyCode = e.keyCode;
            var enterKeyCode = 13;

            if (keyCode === enterKeyCode)
            {
                $.ChatAgent.send_message();
            }
        });
        
        this.disable_conversation_components();

        var socket_end_point = this.get_socket_end_point();

        // establish websocket connection
        console.log('Connecting websocket ' + socket_end_point);
        this.Socket = io.connect(socket_end_point);

        // 'joined' event handler
        this.Socket.on('joined', (object) => {
            this.enable_conversation_components();
        });

        // 'new_msg' event handler
        this.Socket.on('new_msg', (object) => {
            console.log('New message received ' + JSON.stringify(object));

            var message = object.message;
            var sender = object.sender;

            // user is interested in messages from recipient only
            if (sender === this.receiver_uuid)
            {
                // add received message to conversation body
                this.Dom.conversation_body.append("<p class='message_box message_box_them'>" + message + "</p><br/><br/><br/>");
            }
        });

        // 'disconnect' event handler
        this.Socket.on('disconnect', () => {
            this.disable_conversation_components();
        });

        // 'reconnect' event handler
        this.Socket.on('reconnect', (attemptNumber) => {
            this.enable_conversation_components();
        });

        // join room
        console.log('Joining room');
        this.Socket.emit('join', {
            client_uuid: this.sender_uuid
        });

        this.launched = true;
    }

    $(document).ready(function() {
        /**
         * Initializing the Chat Agent
         */
        $.ChatAgent.Dom.conversation_body = $('#conversation_body');
        $.ChatAgent.Dom.text_message_box = $('#text_message_box');
        $.ChatAgent.Dom.send_message_btn = $('#send_message_btn');
    
        $.ChatAgent.csrf_token = $('#csrf-token').val();
        
        $.ChatAgent.socket_url = $('#socket_url').val();
        $.ChatAgent.socket_port = $('#socket_port').val();
    
        $.ChatAgent.sender_uuid = $('#sender_uuid').val();
        $.ChatAgent.receiver_uuid = $('#receiver_uuid').val();
    
        // launch the chat agent
        $.ChatAgent.launch();
    });
}(jQuery));
