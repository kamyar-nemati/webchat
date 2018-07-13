<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

// ramsey/uuid package
use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;

use App\User;
use App\Chat;
use Carbon\Carbon;

class ChatController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }
    
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index($sender_uuid, $receiver_uuid)
    {
        // do not route to self-chat page
        if ($sender_uuid === $receiver_uuid)
        {
            abort(404);
        }

        // get contact's name
        $receiver_info = User::where('uuid', '=', $receiver_uuid)
                ->get(['alias', 'name'])
                ->first()
                ->toArray();

        return view('chat', [
            'sender_uuid' => $sender_uuid,
            'receiver_uuid' => $receiver_uuid,
            'receiver_alias' => $receiver_info['alias'],
            'receiver_name' => $receiver_info['name'],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $message = $request->message;
        $sender_uuid = $request->sender_uuid;
        $receiver_uuid = $request->receiver_uuid;

        // every chat message must be given a uuid
        $message_uuid = "";
        
        // create a uuid
        try
        {
            $uuid_obj = Uuid::uuid1();
            $message_uuid = $uuid_obj->toString();
        }
        catch (UnsatisfiedDependencyException $ex)
        {
            return [
                'stat' => -1,
                'msg' => $ex->getMessage(),
            ];
        }

        // get references
        $sender_user_id = User::where('uuid', '=', $sender_uuid)
                ->get(['id'])
                ->first()
                ->toArray()['id'];

        $receiver_user_id = User::where('uuid', '=', $receiver_uuid)
                ->get(['id'])
                ->first()
                ->toArray()['id'];

        // save message into database
        $chat = Chat::create([
            'uuid' => $message_uuid,
            'message' => $message,
            'sender_user_id' => $sender_user_id,
            'receiver_user_id' => $receiver_user_id,
        ]);

        // TODO: check chat create before return
        
        return [
            'stat' => 0,
            'message_uuid' => $message_uuid,
        ];
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id = NULL)
    {
        $message_uuid = $request->message_uuid;

        // update message delivery status
        Chat::where('uuid', '=', $message_uuid)
                ->update([
                    'delivered' => true,
                    'delivered_at' => Carbon::now(),
                ]);

        return [
            'stat' => 0,
        ];
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }
}
