<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

// ramsey/uuid package
use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;

use App\User;
use App\Chat;
use App\Recipient;

use Carbon\Carbon;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;

use Illuminate\Support\Facades\Auth;

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
        $user_uuid = Auth::user()['uuid'];

        // do not allow impersonation
        if ($sender_uuid !== $user_uuid)
        {
            abort(404);
        }

        // do not allow self-chat
        if ($sender_uuid === $receiver_uuid)
        {
            abort(404);
        }

        // get contact's name
        $receiver_info = User::where('uuid', '=', $receiver_uuid)
                ->get(['profile_id', 'name'])
                ->first()
                ->toArray();

        return view('chat', [
            'sender_uuid' => $sender_uuid,
            'receiver_uuid' => $receiver_uuid,
            'receiver_profile_id' => $receiver_info['profile_id'],
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
            // abort
            return [
                'stat' => -1,
                'msg' => $ex->getMessage(),
            ];
        }

        // begin transaction
        DB::beginTransaction();
        
        try
        {
            // get sender user_id reference
            $sender_user_id = User::where('uuid', '=', $sender_uuid)
                    ->get(['id'])
                    ->first()
                    ->toArray()['id'];

            // get receiver user_id reference
            $receiver_user_id = User::where('uuid', '=', $receiver_uuid)
                    ->get(['id'])
                    ->first()
                    ->toArray()['id'];

            // save message into database
            $chat = Chat::create([
                'uuid' => $message_uuid,
                'message' => $message,
                'user_id' => $sender_user_id,
            ]);

            // save message recipient into database
            $recipient = Recipient::create([
                'chat_id' => $chat->id,
                'user_id' => $receiver_user_id,
            ]);
        }
        catch (QueryException $ex)
        {
            // roll back transaction
            DB::rollBack();

            // abort
            return [
                'stat' => -1,
                'msg' => $ex->getMessage(),
            ];
        }
        
        // commit transaction
        DB::commit();
        
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
        // TODO: remove transaction lock as it make unpredicted behaviour on delivery update

        $delivered_messages = $request->delivered_messages;

        // begin transaction
        DB::beginTransaction();

        foreach ($delivered_messages as &$delivered_message)
        {
            $recipient_uuid = $delivered_message['recipient_uuid'];
            $message_uuid = $delivered_message['message_uuid'];
            
            try
            {
                // get recipient id
                $recipient_id = Recipient::join('users', 'users.id', '=', 'recipients.user_id')
                        ->join('chats', 'chats.id', '=', 'recipients.chat_id')
                        ->where('users.uuid', '=', $recipient_uuid)
                        ->where('chats.uuid', '=', $message_uuid)
                        ->get(['recipients.id'])
                        ->first()
                        ->toArray()['id'];
                
                // update recipient message delivery status
                Recipient::where('id', '=', $recipient_id)
                        ->update([
                            'delivered' => true,
                            'delivered_at' => Carbon::now(),
                        ]);
            }
            catch (QueryException $ex)
            {
                // roll back transaction
                DB::rollBack();

                // abort
                return [
                    'stat' => -1,
                    'msg' => $ex->getMessage(),
                ];
            }
        }

        // commit transaction
        DB::commit();

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

    public function poll(Request $request)
    {
        // TODO: poll doesn't function properly on getting missed messages if there was no messages before

        $recipient_uuid = $request->recipient_uuid;

        // find last delivery
        $last_delivery_recipient = Recipient::join('users', 'users.id', '=', 'recipients.user_id')
                ->where('users.uuid', '=', $recipient_uuid)
                ->where('delivered', '=', true)
                ->orderBy('delivered_at', 'desc')
                ->get(['recipients.id'])
                ->first();

        // abort if nothing found
        if (!$last_delivery_recipient)
        {
            return [];
        }

        $last_delivery_recipient_id = $last_delivery_recipient->toArray()['id'];

        // get non-delivered messages
        $messages = Chat::join('recipients', 'recipients.chat_id', '=', 'chats.id')
                ->join('users', 'users.id', '=', 'recipients.user_id')
                ->where('users.uuid', '=', $recipient_uuid)
                ->where('recipients.id', '>', $last_delivery_recipient_id)
                ->orderBy('recipients.created_at', 'asc')
                ->get(['chats.uuid AS message_uuid', 'chats.message', 'chats.user_id'])
                ->toArray();

        // replace sender user_id with uuid
        foreach ($messages as &$message)
        {
            $sender_id =& $message['user_id'];

            $sender_uuid = User::where('id', '=', $sender_id)
                    ->get(['uuid'])
                    ->first()
                    ->toArray()['uuid'];

            unset($message['user_id']);

            $message['sender'] = $sender_uuid;
        }

        return $messages;
    }
}
