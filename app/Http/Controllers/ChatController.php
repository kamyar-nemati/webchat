<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\User;

class ChatController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }
    
    public function index($user_uuid, $rcpt_uuid)
    {
        $contact_name = User::where('uuid', '=', $rcpt_uuid)
        ->get(['name'])
        ->first()
        ->toArray()['name'];

        return view('chat', [
            'contact_name' => $contact_name,
            'user_uuid' => $user_uuid,
            'rcpt_uuid' => $rcpt_uuid,
        ]);
    }
}
