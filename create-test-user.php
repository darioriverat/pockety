<?php

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$user = User::factory()->create([
    'email' => 'test@test.com',
    'password' => bcrypt('password'),
    'email_verified_at' => now(),
]);

echo "User created: {$user->email}\n";
