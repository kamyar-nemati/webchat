@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8 col-md-offset-2">
            <div class="panel panel-default">
                <div class="panel-heading">Registered User</div>

                <div class="panel-body">
                    @if (session('status'))
                        <div class="alert alert-success">
                            {{ session('status') }}
                        </div>
                    @endif

                    @foreach ($contacts as $contact)
                        <p><a href="{{ url('/chat') }}/{{ Auth::user()->uuid }}/{{ $contact['uuid'] }}"><b>{{ $contact['name'] }}</b>&nbsp;({{ $contact['email'] }})</a></p>
                    @endforeach
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
