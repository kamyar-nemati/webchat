<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// ramsey/uuid package
use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // some full names
        $names = [
            'James Smith',
            'John Johnson',
            'Robert Williams',
            'Michael Brown',
            'William Jones',
            'David Miller',
            'Richard Davis',
            'Joseph Garcia',
            'Charles Rodriguez',
            'Thomas Wilson',
            'Mary Li',
            'Patricia Smith',
            'Jennifer Lam',
            'Elizabeth Martin',
            'Linda Gelbero',
            'Barbara Roy',
            'Susan Tremblay',
            'Margaret Lee',
            'Jessica Gagnon',
            'Sarah Wilson',
        ];

        foreach ($names as &$name)
        {
            // generate uuid
            $uuid_obj = Uuid::uuid1();
            $uuid_str = $uuid_obj->toString();

            // generate profile_id
            $profile_id = str_replace(' ', '_', strtolower($name));

            // get first name
            $first_name = substr($name, 0, strpos($name, ' '));

            // generate email
            $email = "{$profile_id}@gmail.com";

            DB::table('users')->insert([
                'uuid' => $uuid_str,
                'profile_id' => $profile_id,
                'name' => $first_name,
                'email' => $email,
                'password' => bcrypt('abc123'),
            ]);
        }
    }
}
