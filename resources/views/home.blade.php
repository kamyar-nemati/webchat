@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8 col-md-offset-2">
            <div class="panel panel-default">
                <div class="panel-heading">Contacts</div>

                <div class="panel-body">
                    @if (session('status'))
                        <div class="alert alert-success">
                            {{ session('status') }}
                        </div>
                    @endif

                    @foreach ($contacts as $contact)
                        <p><a href="{{ $contact['uuid'] }}"><b>{{ $contact['name'] }}</b>&nbsp;({{ $contact['email'] }})</a></p>
                    @endforeach
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
