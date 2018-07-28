
/*
 * This JavaScript file is strictly for implemen-
 * tations on the view file: resources/views/chat.blade.php
 */

(function ($) {
    // the chat agent
    $.TaskAgent = {};

    // domain object model references
    $.TaskAgent.Dom = {};
    $.TaskAgent.Dom.task_name = null;
    $.TaskAgent.Dom.task_update_btn = null;
    $.TaskAgent.Dom.status_panel = null;

    // websocket
    $.TaskAgent.Socket = null;

    // cross site request forgery token
    $.TaskAgent.csrf_token = null;

    // websocket host url and port
    $.TaskAgent.socket_url = null;
    $.TaskAgent.socket_port = null;

    // user and task uuid
    $.TaskAgent.user_uuid = null;
    $.TaskAgent.task_uuid = null;

    $.TaskAgent.launched = false;
    $.TaskAgent.disrupted = false;

    // socket server end point
    $.TaskAgent.get_socket_end_point = function() {
        return this.socket_url + ':' + this.socket_port;
    }

    $.TaskAgent.disable_task_updater_components = function() {
        this.Dom.task_name.attr('disabled', 'disabled');
        this.Dom.task_update_btn.attr('disabled', 'disabled');
    }

    $.TaskAgent.enable_task_updater_components = function() {
        this.Dom.task_name.removeAttr('disabled');
        this.Dom.task_update_btn.removeAttr('disabled');
    }

    $.TaskAgent.start_act_disrupted = function() {
        this.disable_task_updater_components();

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

        this.enable_task_updater_components();
    }

    $.TaskAgent.get_task_name = function() {
        return this.Dom.task_name.val();
    }

    // update task function
    $.TaskAgent.update_task = function() {
        var task_uuid = this.task_uuid;
        var task_name = this.get_task_name();

        // abort on empty task name
        if (task_name === '')
        {
            return false;
        }

        // update task
        $.ajax({
            url: '/task/update',
            type: 'POST',
            headers: {
                'X-CSRF-TOKEN': $.TaskAgent.csrf_token
            },
            data: {
                'task_uuid': task_uuid,
                'task_name': task_name
            },
            success: function(data, textStatus, jqXHR) {
                // abort send on failure
                if (data.stat !== 0)
                {
                    return false;
                }

                // send update notification
                var task_owner = data.task_owner;
                var shared_list = data.shared_list;

                shared_list.forEach(userObject => {
                    var recipient = userObject.uuid;

                    // send (broadcast) task update
                    $.TaskAgent.Socket.emit('task_updated', {
                        recipient: recipient,
                        task_uuid: task_uuid,
                        task_owner: task_owner,
                        task_name: task_name
                    });
                });

                // go back to task list
                location.href = '/task';
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
        
        // trigger update task on click
        this.Dom.task_update_btn.click(function() {
            $.TaskAgent.update_task();
        });

        // trigger update task on enter
        this.Dom.task_name.keypress(function(e) {
            var keyCode = e.keyCode;
            var enterKeyCode = 13;

            if (keyCode === enterKeyCode)
            {
                $.TaskAgent.update_task();
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
        $.TaskAgent.Dom.task_name       = $('#task_name');
        $.TaskAgent.Dom.task_update_btn = $('#task_update_btn');
        $.TaskAgent.Dom.status_panel    = $('#status_panel');
    
        $.TaskAgent.csrf_token          = $('#csrf-token').val();
        
        $.TaskAgent.socket_url          = $('#socket_url').val();
        $.TaskAgent.socket_port         = $('#socket_port').val();
    
        $.TaskAgent.user_uuid           = $('#user_uuid').val();
        $.TaskAgent.task_uuid           = $('#task_uuid').val();
        
        // launch the task agent
        $.TaskAgent.launch();
    });
}(jQuery));
