
/*
 * This JavaScript file is strictly for implemen-
 * tations on the view file: resources/views/chat.blade.php
 */

(function ($) {
    // the chat agent
    $.TaskAgent = {};

    // domain object model references
    $.TaskAgent.Dom = {};
    $.TaskAgent.Dom.task_list = null;
    $.TaskAgent.Dom.task_name = null;
    $.TaskAgent.Dom.task_save_btn = null;
    $.TaskAgent.Dom.status_panel = null;

    // message formatter object model
    $.TaskAgent.Formatter = {};
    $.TaskAgent.Formatter.NewTask = {};

    // websocket
    $.TaskAgent.Socket = null;

    // cross site request forgery token
    $.TaskAgent.csrf_token = null;

    // websocket host url and port
    $.TaskAgent.socket_url = null;
    $.TaskAgent.socket_port = null;

    // user uuid
    $.TaskAgent.user_uuid = null;

    $.TaskAgent.launched = false;
    $.TaskAgent.disrupted = false;

    // task formatter object implementation
    $.TaskAgent.Formatter.NewTask.format = function(Task) {
        return '<p id="' + Task.uuid + '" class="">' + Task.name + '</p>';
    }

    // socket server end point
    $.TaskAgent.get_socket_end_point = function() {
        return this.socket_url + ':' + this.socket_port;
    }

    // scroll down tasks smoothly
    $.TaskAgent.scroll_down_task_list = function() {
        var distance_to_scroll = 
                this.Dom.task_list.height() + this.Dom.task_list.scrollTop();
        
        var scroll_smoothness = 500;

        // scroll down
        this.Dom.task_list.animate(
            {scrollTop: distance_to_scroll}, scroll_smoothness
        );
    };

    $.TaskAgent.disable_task_list_components = function() {
        this.Dom.task_list.attr('disabled', 'disabled');
        this.Dom.task_name.attr('disabled', 'disabled');
        this.Dom.task_save_btn.attr('disabled', 'disabled');
    }

    $.TaskAgent.enable_task_list_components = function() {
        this.Dom.task_list.removeAttr('disabled');
        this.Dom.task_name.removeAttr('disabled');
        this.Dom.task_save_btn.removeAttr('disabled');
    }

    $.TaskAgent.start_act_disrupted = function() {
        this.disable_task_list_components();

        this.disrupted = true;

        var status_str = 'Attempting to connect to websocket';
        this.Dom.status_panel.text(status_str);
    }

    $.TaskAgent.continue_act_disrupted = function() {
        if (!this.disrupted)
        {
            return;
        }

        var status_str = this.Dom.status_panel.text();
        status_str += '.';
        this.Dom.status_panel.text(status_str);
    }

    $.TaskAgent.stop_act_disrupted = function() {
        this.Dom.status_panel.text('');

        this.disrupted = false;

        this.enable_task_list_components();
    }

    // list task function
    $.TaskAgent.list_task = function(Task, paper, Formatter) {
        paper.append(Formatter.format(Task));
    }

    $.TaskAgent.get_task_name = function() {
        return this.Dom.task_name.val();
    }

    // save task function
    $.TaskAgent.save_task = function() {
        var task_name = this.get_task_name();

        // abort on empty task name
        if (task_name === '')
        {
            return false;
        }

        // save task
        $.ajax({
            url: '/task/store',
            type: 'POST',
            headers: {
                'X-CSRF-TOKEN': $.TaskAgent.csrf_token
            },
            data: {
                'task_name': task_name,
                'user_uuid': $.TaskAgent.user_uuid,
            },
            success: function(data, textStatus, jqXHR) {
                // abort send on failure
                if (data.stat !== 0)
                {
                    return false;
                }

                // get task uuid
                var task_uuid = data.task_uuid;
                
                // send (broadcast) task
                /* $.TaskAgent.Socket.emit('new_msg', {
                    task_uuid: task_uuid,
                    task_name: task_name,
                }); */

                var Task = {
                    uuid: task_uuid,
                    name: task_name
                };

                // append task to task_list body
                $.TaskAgent.list_task(Task, $.TaskAgent.Dom.task_list, $.TaskAgent.Formatter.NewTask);
                
                $.TaskAgent.scroll_down_task_list();

                // clear the task name textbox
                $.TaskAgent.Dom.task_name.val('');
            }
        });
    }

    // task agent launcher
    $.TaskAgent.launch = function() {
        // launch once
        if (this.launched)
        {
            return false;
        }
        
        // trigger save task on click
        this.Dom.task_save_btn.click(function() {
            $.TaskAgent.save_task();
        });

        // trigger save task on enter
        this.Dom.task_name.keypress(function(e) {
            var keyCode = e.keyCode;
            var enterKeyCode = 13;

            if (keyCode === enterKeyCode)
            {
                $.TaskAgent.save_task();
            }
        });
        
        this.start_act_disrupted();

        var socket_end_point = this.get_socket_end_point();

        // establish websocket connection
        this.Socket = io.connect(socket_end_point);

        // custom 'joined' event handler
        this.Socket.on('joined', (object) => {
            // enable task list components on successful join
            this.stop_act_disrupted();
        });

        // custom 'new_msg' event handler
        /* this.Socket.on('new_msg', (object) => {
            var message_uuid = object.message_uuid;
            var message = object.message;
            var sender = object.sender;

            var formatter = this.Formatter.NewTask;
            // process_new_message => list_task
            this.process_new_message(message_uuid, message, sender, formatter, function(success) {});
        }); */

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

        // poll tasks before joining
        $.ajax({
            url: '/task/poll',
            method: 'GET',
            async: false,
            headers: {
                'X-CSRF-TOKEN': $.TaskAgent.csrf_token
            },
            data: {},
            success: function(data, textStatus, jqXHR) {
                // loop through missed messages
                data.forEach(messageObject => {
                    // task object
                    var Task = {
                        uuid: messageObject.uuid,
                        name: messageObject.name
                    };

                    var Formatter = $.TaskAgent.Formatter.NewTask;

                    $.TaskAgent.list_task(Task, $.TaskAgent.Dom.task_list, Formatter);
                });
            }
        });

        // join room
        this.Socket.emit('join', {
            client_uuid: this.user_uuid
        });
        
        this.launched = true;
    }

    // entry point
    $(document).ready(function() {
        /**
         * Initializing the Task Agent
         */
        $.TaskAgent.Dom.task_list       = $('#task_list');
        $.TaskAgent.Dom.task_name       = $('#task_name');
        $.TaskAgent.Dom.task_save_btn   = $('#task_save_btn');
        $.TaskAgent.Dom.status_panel    = $('#status_panel');
    
        $.TaskAgent.csrf_token          = $('#csrf-token').val();
        
        $.TaskAgent.socket_url          = $('#socket_url').val();
        $.TaskAgent.socket_port         = $('#socket_port').val();
    
        $.TaskAgent.user_uuid           = $('#user_uuid').val();
    
        // launch the task agent
        $.TaskAgent.launch();
    });
}(jQuery));
