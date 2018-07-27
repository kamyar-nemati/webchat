@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8 col-md-offset-2">
            <div class="panel panel-default">
                <div class="panel-heading">My Tasks</div>

                {{-- csrf token --}}
                <input type="hidden" id="csrf-token" value="{{ csrf_token() }}">
                {{-- websocket host --}}
                <input type="hidden" id="socket_url" value="{{ config('app.socket_url', '') }}">
                <input type="hidden" id="socket_port" value="{{ config('app.socket_port', '') }}">
                {{-- user unique id --}}
                <input type="hidden" id="user_uuid" value="{{ $user_uuid }}">

                <div class="panel-body task_list_panel" id="task_list">
                    @if (session('status'))
                        <div class="alert alert-success">
                            {{ session('status') }}
                        </div>
                    @endif

                    
                </div>
                <div class="panel-footer">
                    <div class="input-group">
                        <span class="input-group-addon">New task</span>
                        <input id="task_name" type="text" class="form-control" placeholder="Type your to-do item here&hellip;">
                        <span class="input-group-btn">
                            <button id="task_save_btn" type="button" class="btn btn-default">Save</button>
                        </span>
                    </div>
                    <div id="status_panel" class="panel_status">
                        
                    </div>
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
<script src="{{ asset('js/task_view.js') }}"></script>