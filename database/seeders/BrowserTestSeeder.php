<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\CategoryTemplate;
use Illuminate\Database\Seeder;

class BrowserTestSeeder extends Seeder
{
    /**
     * Seed the browser test data set.
     */
    public function run(): void
    {
        // Plain password — User model casts password as hashed.
        $user = User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Browser Test User',
                'password' => 'password',
                'email_verified_at' => now(),
                'default_currency' => 'CAD',
            ],
        );

        CategoryTemplate::seedForUser((int) $user->id);
    }
}
