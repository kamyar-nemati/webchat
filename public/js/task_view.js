
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
    $.TaskAgent.Formatter.NewOwnTask = {};
    $.TaskAgent.Formatter.NewOtherTask = {};

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

    $.TaskAgent.Attachment = null;

    // task formatter object implementation
    $.TaskAgent.Formatter.NewOwnTask.format = function(Task) {
        var attachment = '';

        if (Task.attachment_name)
        {
            attachment = '&nbsp;<i class="material-icons">attachment</i>';
        }

        return '<a class="list-group-item" href="/task/edit/' + Task.uuid + '" id="' + Task.uuid + '">' + Task.name + attachment + '</a>';
    }

    $.TaskAgent.Formatter.NewOtherTask.format = function(Task) {
        var attachment = '';

        if (Task.attachment_name)
        {
            attachment = '&nbsp;<i class="material-icons">attachment</i>';
        }

        return '<li class="list-group-item"><span class="badge">' + Task.owner + '</span><span id="' + Task.uuid + '">' + Task.name + attachment + '</span></li>';
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

        var formData = new FormData();

        formData.append('task_name', task_name);
        
        if ($.TaskAgent.Attachment)
        {
            formData.append('attachment', $.TaskAgent.Attachment[0]);
        }

        // save task
        $.ajax({
            url: '/task/store',
            type: 'POST',
            headers: {
                'X-CSRF-TOKEN': $.TaskAgent.csrf_token
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function(data, textStatus, jqXHR) {
                // abort send on failure
                if (data.stat !== 0)
                {
                    return false;
                }

                // get task info
                var task_uuid = data.task_uuid;
                var task_owner = data.task_owner;
                var attachment_name = data.attachment_name;

                var shared_list = data.shared_list;

                shared_list.forEach(userObject => {
                    var recipient = userObject.uuid;

                    // send (broadcast) new task
                    $.TaskAgent.Socket.emit('task_created', {
                        recipient: recipient,
                        task_uuid: task_uuid,
                        task_name: task_name,
                        task_owner: task_owner,
                        attachment_name: attachment_name
                    });
                });

                var Task = {
                    uuid: task_uuid,
                    name: task_name,
                    attachment_name: attachment_name,
                };

                // append task to task_list body
                $.TaskAgent.list_task(Task, $.TaskAgent.Dom.task_list, $.TaskAgent.Formatter.NewOwnTask);

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

        // custom 'task_created' event handler
        this.Socket.on('task_created', (object) => {
            var task_uuid = object.task_uuid;
            var task_name = object.task_name;
            var task_owner = object.task_owner;
            var attachment_name = object.attachment_name;

            var notification = '<b>' + task_owner + '</b> created <b>' + task_name + '</b>';

            $.bootstrapGrowl(notification, {
                // types available: info, success, warning, danger
                type: 'success',
                delay: 5000,
            });
            
            var Task = {
                uuid: task_uuid,
                name: task_name,
                owner: task_owner,
                attachment_name: attachment_name
            };

            // append task to task_list body
            $.TaskAgent.list_task(Task, $.TaskAgent.Dom.task_list, $.TaskAgent.Formatter.NewOtherTask);

        });

        // custom 'task_updated' event handler
        this.Socket.on('task_updated', (object) => {
            var task_uuid = object.task_uuid;
            var task_owner = object.task_owner;
            var task_name = object.task_name;

            var notification = '<b>' + task_owner + '</b> updated <b>' + task_name + '</b>';

            $.bootstrapGrowl(notification, {
                // types available: info, success, warning, danger
                type: 'info',
                delay: 5000,
            });

            // update task name
            $('#' + task_uuid).text(task_name);
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

        // poll own tasks before joining
        $.ajax({
            url: '/task/pollOwn',
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
                        name: messageObject.name,
                        attachment_name: messageObject.attachment_name,
                    };

                    var Formatter = $.TaskAgent.Formatter.NewOwnTask;

                    $.TaskAgent.list_task(Task, $.TaskAgent.Dom.task_list, Formatter);
                });
            }
        });

        // poll others' tasks before joining
        $.ajax({
            url: '/task/pollOther',
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
                        name: messageObject.name,
                        owner: messageObject.owner,
                        attachment_name: messageObject.attachment_name
                    };

                    var Formatter = $.TaskAgent.Formatter.NewOtherTask;

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

        // drop zone scripts
        var dropZone = document.getElementById('drop-zone');

        var startUpload = function() {
            var files = $.TaskAgent.Attachment;

            $('#file_list').html('');
            
            Array.prototype.forEach.call(files, file => {
                console.log(file);
                var file_row = '<li class="list-group-item list-group-item-info"><span class="badge alert-info pull-right"><a href="#">Delete</a></span>' + file.name + '</li>';
                $('#file_list').append(file_row);
            });
        };

        dropZone.ondrop = function(e) {
            var files = e.dataTransfer.files;

            if (files.length > 1)
            {
                $.bootstrapGrowl('Only one file can be attached.', {
                    // types available: info, success, warning, danger
                    type: 'danger',
                    delay: 2500,
                });

                return false;
            }

            e.preventDefault();
            this.className = 'upload-drop-zone';

            $.TaskAgent.Attachment = files;

            startUpload();
        }

        dropZone.ondragover = function() {
            this.className = 'upload-drop-zone drop';
            return false;
        }

        dropZone.ondragleave = function() {
            this.className = 'upload-drop-zone';
            return false;
        }

    });
}(jQuery));
