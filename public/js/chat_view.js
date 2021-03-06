
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
    $.ChatAgent.Dom.status_panel = null;

    // message formatter object model
    $.ChatAgent.Formatter = {};
    $.ChatAgent.Formatter.NewMessage = {};
    $.ChatAgent.Formatter.NewIncomingMessage = {};
    $.ChatAgent.Formatter.NewIncomingMissedMessage = {};

    // websocket
    $.ChatAgent.Socket = null;

    // cross site request forgery token
    $.ChatAgent.csrf_token = null;

    // websocket host url and port
    $.ChatAgent.socket_url = null;
    $.ChatAgent.socket_port = null;

    // sender and receiver uuid
    $.ChatAgent.sender_uuid = null;
    $.ChatAgent.receiver_uuid = null;

    $.ChatAgent.launched = false;
    $.ChatAgent.disrupted = false;

    // message formatter object implementation
    $.ChatAgent.Formatter.NewMessage.format = function(message) {
        return '<p class="message_box message_box_you">' + message + '</p><br/><br/><br/>';
    }

    $.ChatAgent.Formatter.NewIncomingMessage.format = function(message) {
        return '<p class="message_box message_box_them">' + message + '</p><br/><br/><br/>';
    }

    $.ChatAgent.Formatter.NewIncomingMissedMessage.format = function(message) {
        return '<p class="message_box message_box_them message_box_new">' + message + '</p><br/><br/><br/>';
    }

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

    $.ChatAgent.start_act_disrupted = function() {
        this.disable_conversation_components();

        this.disrupted = true;

        var status_str = 'Attempting to connect to websocket';
        this.Dom.status_panel.text(status_str);
    }

    $.ChatAgent.continue_act_disrupted = function() {
        if (!this.disrupted)
        {
            return;
        }

        var status_str = this.Dom.status_panel.text();
        status_str += '.';
        this.Dom.status_panel.text(status_str);
    }

    $.ChatAgent.stop_act_disrupted = function() {
        this.Dom.status_panel.text('');

        this.disrupted = false;

        this.enable_conversation_components();
    }

    $.ChatAgent.print_message = function(message, paper, Formatter) {
        paper.append(Formatter.format(message));
    }

    // message delivery status update function
    $.ChatAgent.update_message_delivery_status = function(input_data, callBack) {
        // callBack data
        var returned_callBack;
        
        $.ajax({
            url: '/chat/update',
            method: 'PATCH',
            async: false, // to wait for callBack returned data
            headers: {
                'X-CSRF-TOKEN': $.ChatAgent.csrf_token
            },
            data: input_data,
            success: function(data, textStatus, jqXHR) {
                returned_callBack = callBack(data, textStatus, jqXHR);
            }
        });

        return returned_callBack;
    };

    // new message processing function
    $.ChatAgent.process_new_message = function(message_uuid, message, sender, Formatter, callBack) {
        // process status
        var success = false;

        // user is interested in messages from recipient only
        if (sender === this.receiver_uuid)
        {
            var input_data = {
                delivered_messages: [
                    {
                        recipient_uuid: this.sender_uuid,
                        message_uuid: message_uuid
                    }
                ]
            };
            
            // mark message as delivered
            success = this.update_message_delivery_status(input_data, function(data, textStatus, jqXHR) {
                // abort on failure
                if (data.stat !== 0)
                {
                    return false;
                }
                
                // add received message to conversation body
                $.ChatAgent.print_message(message, $.ChatAgent.Dom.conversation_body, Formatter);
                
                return true;
            });
        }

        // return process status
        callBack(success);
    };

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
            url: '/chat/store',
            type: 'POST',
            headers: {
                'X-CSRF-TOKEN': $.ChatAgent.csrf_token
            },
            data: {
                'message': message,
                'sender_uuid': $.ChatAgent.sender_uuid,
                'receiver_uuid': $.ChatAgent.receiver_uuid
            },
            success: function(data, textStatus, jqXHR) {
                // abort send on failure
                if (data.stat !== 0)
                {
                    return false;
                }

                // get message uuid
                var message_uuid = data.message_uuid;
                
                // send (broadcast) message
                $.ChatAgent.Socket.emit('new_msg', {
                    message_uuid: message_uuid,
                    message: message,
                    recipient: $.ChatAgent.receiver_uuid
                });

                // append message to conversation body
                $.ChatAgent.print_message(message, $.ChatAgent.Dom.conversation_body, $.ChatAgent.Formatter.NewMessage);
                
                $.ChatAgent.scroll_down_conversation_body();

                // clear the message textbox
                $.ChatAgent.Dom.text_message_box.val('');
            }
        });
    }

    // chat agent launcher
    $.ChatAgent.launch = function() {
        // launch once
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
        
        this.start_act_disrupted();

        var socket_end_point = this.get_socket_end_point();

        // establish websocket connection
        this.Socket = io.connect(socket_end_point);

        // custom 'joined' event handler
        this.Socket.on('joined', (object) => {
            // enable chat components on successful join
            this.stop_act_disrupted();
        });

        // custom 'new_msg' event handler
        this.Socket.on('new_msg', (object) => {
            var message_uuid = object.message_uuid;
            var message = object.message;
            var sender = object.sender;

            var formatter = this.Formatter.NewIncomingMessage;
            
            this.process_new_message(message_uuid, message, sender, formatter, function(success) {});
        });

        // 'disconnect' event handler
        this.Socket.on('disconnect', () => {
            this.start_act_disrupted();
        });

        // 'reconnecting' event handler
        this.Socket.on('reconnecting', (attemptNumber) => {
            this.continue_act_disrupted();
        });

        // 'reconnect' event handler
        this.Socket.on('reconnect', (attemptNumber) => {
            this.stop_act_disrupted();
        });

        // poll new messages before joining
        $.ajax({
            url: '/chat/poll',
            method: 'GET',
            async: false,
            headers: {
                'X-CSRF-TOKEN': $.ChatAgent.csrf_token
            },
            data: {
                recipient_uuid: $.ChatAgent.sender_uuid
            },
            success: function(data, textStatus, jqXHR) {
                // loop through missed messages
                data.forEach(messageObject => {
                    // message data
                    var message_uuid = messageObject.message_uuid;
                    var message = messageObject.message;
                    var sender = messageObject.sender;

                    var formatter = $.ChatAgent.Formatter.NewIncomingMissedMessage;

                    $.ChatAgent.process_new_message(message_uuid, message, sender, formatter, function(success) {});
                });
            }
        });

        // join room
        this.Socket.emit('join', {
            client_uuid: this.sender_uuid
        });
        
        this.launched = true;
    }

    // entry point
    $(document).ready(function() {
        /**
         * Initializing the Chat Agent
         */
        $.ChatAgent.Dom.conversation_body = $('#conversation_body');
        $.ChatAgent.Dom.text_message_box = $('#text_message_box');
        $.ChatAgent.Dom.send_message_btn = $('#send_message_btn');
        $.ChatAgent.Dom.status_panel = $('#status_panel');
    
        $.ChatAgent.csrf_token = $('#csrf-token').val();
        
        $.ChatAgent.socket_url = $('#socket_url').val();
        $.ChatAgent.socket_port = $('#socket_port').val();
    
        $.ChatAgent.sender_uuid = $('#sender_uuid').val();
        $.ChatAgent.receiver_uuid = $('#receiver_uuid').val();
    
        // launch the chat agent
        $.ChatAgent.launch();
    });
}(jQuery));
