@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8 col-md-offset-2">
            <div class="panel panel-default">
                <div class="panel-heading">Update your task</div>

                {{-- csrf token --}}
                <input type="hidden" id="csrf-token" value="{{ csrf_token() }}">
                {{-- websocket host --}}
                <input type="hidden" id="socket_url" value="{{ config('app.socket_url', '') }}">
                <input type="hidden" id="socket_port" value="{{ config('app.socket_port', '') }}">
                {{-- user and task unique id --}}
                <input type="hidden" id="user_uuid" value="{{ $user_uuid }}">
                <input type="hidden" id="task_uuid" value="{{ $task_uuid }}">

                <div class="panel-body">
                    @if (session('status'))
                        <div class="alert alert-success">
                            {{ session('status') }}
                        </div>
                    @endif
                    
                    <div class="input-group">
                        <span class="input-group-addon">Update task</span>
                        <input id="task_name" type="text" class="form-control" value="{{ $task_name }}" placeholder="The task cannot be updated to empty text, type something&hellip;">
                        <span class="input-group-btn">
                            <button id="task_update_btn" type="button" class="btn btn-default">Update</button>
                        </span>
                    </div>

                    @if ($attachment_url)
                        <br>

                        <div class="input-group">
                            <span class="input-group-addon" id="basic-addon1">Attachment:</span>
                            <a class="form-control" href="{{ $attachment_url }}">{{ $attachment_name }}</a>
                        </div>
                    @endif

                    <div id="status_panel" class="panel_status"></div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

<!-- jquery library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.js"></script>
<!-- socket.io library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js"></script>
<!-- custom javascript -->
<script src="{{ asset('js/task_update_view.js') }}"></script>
