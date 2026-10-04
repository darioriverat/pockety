<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\CategoryTemplate;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Apply the household category template to every existing user.
     * Matched by (user_id, code); does not steal rows from other users.
     */
    public function run(): void
    {
        $users = User::query()->orderBy('id')->get();

        if ($users->isEmpty()) {
            if ($this->command) {
                $this->command->warn('No users found; skipping category template seed.');
            }

            return;
        }

        foreach ($users as $user) {
            CategoryTemplate::seedForUser((int) $user->id);
        }

        if ($this->command) {
            $this->command->info('Successfully seeded 47 categories (46 active + 1 retired) per user');
        }
    }
}
