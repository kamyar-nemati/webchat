<?php

namespace App\Http\Controllers;

use App\Task;
use App\User;

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
        $uuid = Auth::user()['uuid'];

        return view('task', [
            'user_uuid' => $uuid,
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
        $task_name = $request->task_name;
        $user_uuid = $request->user_uuid;

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

        // begin transaction
        DB::beginTransaction();
        
        try
        {
            // get owner user_id reference
            $owner_user_id = User::where('uuid', '=', $user_uuid)
                    ->get(['id'])
                    ->first()
                    ->toArray()['id'];

            // save task into database
            $task = Task::create([
                'uuid' => $task_uuid,
                'name' => $task_name,
                'user_id' => $owner_user_id,
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
            'task_uuid' => $task_uuid,
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
     * @param  \App\Task  $task
     * @return \Illuminate\Http\Response
     */
    public function edit(Task $task)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Task  $task
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Task $task)
    {
        //
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

    public function poll(Request $request)
    {
        $user_id = Auth::user()['id'];

        // get own tasks
        $tasks = Task::where('tasks.user_id', '=', $user_id)
                ->get(['uuid', 'name'])
                ->toArray();

        return $tasks;
    }
}
