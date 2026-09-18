<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class BrowserTestSeeder extends Seeder
{
    /**
     * Seed the browser test data set.
     */
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
        ]);

        // Plain password — User model casts password as hashed.
        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Browser Test User',
                'password' => 'password',
                'email_verified_at' => now(),
                'default_currency' => 'CAD',
                'category_language' => 'en',
            ],
        );
    }
}
