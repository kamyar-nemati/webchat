<?php

namespace App\Http\Controllers;

use App\User;
use App\Task;
use App\Friends;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

use Illuminate\Support\Facades\DB;

use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;

class TaskController extends Controller
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
    public function index()
    {
        // get user's uuid
        $user_uuid = Auth::user()['uuid'];

        $shared_list = $this->getSharedList();
        $non_shared_list = $this->getNonSharedList($shared_list);

        return view('task', [
            'user_uuid' => $user_uuid,
            'shared_list' => $shared_list,
            'non_shared_list' => $non_shared_list,
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
        $attachment_hash = '';
        $attachment_name = '';
        $attachment_url = '';

        $task_name = $request->task_name;
        
        if ($request->attachment)
        {
            $attachment_hash = $request->attachment->store('media', 'public');
            $attachment_name = $request->attachment->getClientOriginalName();
            $attachment_url = storage_path($attachment_hash);
        }

        // get user's id
        $user_id = Auth::user()['id'];

        // every task must be given a uuid
        $task_uuid = "";
        
        // create a uuid
        try
        {
            $uuid_obj = Uuid::uuid1();
            $task_uuid = $uuid_obj->toString();
        }
        catch (UnsatisfiedDependencyException $ex)
        {
            // abort
            return [
                'stat' => -1,
                'msg' => $ex->getMessage(),
            ];
        }

        try
        {
            // save task into database
            $task = Task::create([
                'uuid' => $task_uuid,
                'name' => $task_name,
                'user_id' => $user_id,
                'attachment_hash' => $attachment_hash,
                'attachment_name' => $attachment_name,
            ]);
        }
        catch (QueryException $ex)
        {
            // abort
            return [
                'stat' => -1,
                'msg' => $ex->getMessage(),
            ];
        }
        
        return [
            'stat' => 0,
            'task_uuid' => $task_uuid,
            'task_owner' => Auth::user()['name'],
            'attachment_name' => $attachment_name,
            'attachment_url' => $attachment_url,
            'shared_list' => $this->getSharedList(),
        ];
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Task  $task
     * @return \Illuminate\Http\Response
     */
    public function show(Task $task)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  $uuid
     * @return \Illuminate\Http\Response
     */
    public function edit($uuid)
    {
        // get user's id
        $user_id = Auth::user()['id'];
        // get user's uuid
        $user_uuid = Auth::user()['uuid'];

        $task = Task::where('uuid', '=', $uuid)
                ->where('user_id', '=', $user_id)
                ->get(['name', 'attachment_hash', 'attachment_name'])
                ->first();

        if (!$task)
        {
            return abort(404);
        }

        $task = $task->toArray();

        $task_name = $task['name'];
        $attachment_name = $task['attachment_name'];
        $attachment_url = '';
        if ($task['attachment_hash'])
        {
            $attachment_url = storage_path($task['attachment_hash']);
        }

        return view('task_update', [
            'user_uuid' => $user_uuid,
            'task_uuid' => $uuid,
            'task_name' => $task_name,
            'attachment_name' => $attachment_name,
            'attachment_url' => $attachment_url,
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request)
    {
        $task_uuid = $request->task_uuid;
        $task_name = $request->task_name;

        // get user's id
        $user_id = Auth::user()['id'];

        $task = Task::where('uuid', '=', $task_uuid)
                ->where('user_id', '=', $user_id)
                ->get(['name'])
                ->first();

        // validate task
        if (!$task)
        {
            return [
                'stat' => -1,
            ];
        }

        // update
        $task = Task::where('uuid', '=', $task_uuid)
                ->where('user_id', '=', $user_id)
                ->update(['name' => $task_name]);

        // verify update
        if (!$task)
        {
            return [
                'stat' => -1,
            ];
        }

        return [
            'stat' => 0,
            'task_owner' => Auth::user()['name'],
            'shared_list' => $this->getSharedList(),
        ];
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Task  $task
     * @return \Illuminate\Http\Response
     */
    public function destroy(Task $task)
    {
        //
    }

    private function getTasks(&$user_id)
    {
        return Task::join('users', 'tasks.user_id', '=', 'users.id')
                ->where('tasks.user_id', '=', $user_id)
                ->get(['tasks.uuid', 'tasks.name', 'users.name AS owner', 'attachment_hash AS attachment_url', 'attachment_name'])
                ->toArray();
    }

    private function getFriends(&$user_id)
    {
        return Friends::where('friend_user_id', '=', $user_id)
                ->get(['user_id'])
                ->toArray();
    }

    public function pollOwn(Request $request)
    {
        // get user's id
        $user_id = Auth::user()['id'];

        // get own tasks
        $tasks = $this->getTasks($user_id);

        foreach ($tasks as &$task)
        {
            if (empty($task['attachment_url']))
            {
                continue;
            }

            $task['attachment_url'] = storage_path($task['attachment_url']);
        }

        return $tasks;
    }

    public function pollOther(Request $request)
    {
        // get user's id
        $user_id = Auth::user()['id'];

        // get friends
        $friends = $this->getFriends($user_id);

        $tasks = [];

        foreach ($friends as &$friend)
        {
            $friend_user_id =& $friend['user_id'];

            $task = $this->getTasks($friend_user_id);

            if ($task)
            {
                $tasks = array_merge($tasks, $task);
            }
        }

        return $tasks;
    }

    private function getSharedList()
    {
        $user_id = Auth::user()['id'];

        return User::join('friends', 'friends.friend_user_id', '=', 'users.id')
                ->where('friends.user_id', '=', $user_id)
                ->get(['users.uuid', 'users.profile_id', 'users.name'])
                ->toArray();
    }

    private function getNonSharedList(Array &$sharedList)
    {
        $user_id = Auth::user()['id'];

        $other_users = User::where('id', '<>', $user_id)
                ->get(['uuid', 'profile_id', 'name'])
                ->toArray();

        $nonSharedList = [];

        foreach ($other_users as &$other_user)
        {
            $ok = true;

            foreach ($sharedList as &$friend)
            {
                if ($other_user['uuid'] === $friend['uuid'])
                {
                    $ok = false;
                    break;
                }
            }

            if ($ok)
            {
                $nonSharedList[] = $other_user;
            }
        }

        return $nonSharedList;
    }

    private function getFriendId(String &$friend_uuid)
    {
        $friend = User::where('uuid', '=', $friend_uuid)
                ->get(['id'])
                ->first()
                ->toArray();

        if ($friend)
        {
            return $friend['id'];
        }

        return null;
    }

    public function unshare($uuid)
    {
        $user_id = Auth::user()['id'];

        $friend_user_id = $this->getFriendId($uuid);

        if ($friend_user_id)
        {
            Friends::where('user_id', '=', $user_id)
                    ->where('friend_user_id', '=', $friend_user_id)
                    ->delete();
        }

        return $this->index();
    }

    public function share($uuid)
    {
        $user_id = Auth::user()['id'];

        $friend_user_id = $this->getFriendId($uuid);

        $friend = Friends::where('user_id', '=', $user_id)
                ->where('friend_user_id', '=', $friend_user_id)
                ->get(['id'])
                ->first();

        if (!$friend)
        {
            $friend = Friends::create([
                'user_id' => $user_id,
                'friend_user_id' => $friend_user_id,
            ]);
        }

        return $this->index();
    }
}
