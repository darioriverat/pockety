<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::factory()->create([
    'email' => 'test@test.com',
    'password' => bcrypt('password'),
    'email_verified_at' => now(),
]);

echo "User created: {$user->email}\n";
