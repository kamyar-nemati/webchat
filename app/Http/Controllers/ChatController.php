<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }
    
    public function index($user_uuid, $rcpt_uuid)
    {
        return view('chat', [
            'user_uuid' => $user_uuid,
            'rcpt_uuid' => $rcpt_uuid,
        ]);
    }
}
