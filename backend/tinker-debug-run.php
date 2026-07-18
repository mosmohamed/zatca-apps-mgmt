<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

echo 'Auth::getDefaultDriver(): '.Auth::getDefaultDriver().PHP_EOL;
echo "config('auth.defaults.guard'): ".config('auth.defaults.guard').PHP_EOL;

Sanctum::actingAs(User::role('super_admin')->first());

echo 'After Sanctum::actingAs - Auth::getDefaultDriver(): '.Auth::getDefaultDriver().PHP_EOL;

$roleModel = new Role;
echo '(new Spatie\Permission\Models\Role)->guard_name: '.$roleModel->guard_name.PHP_EOL;
echo 'getModelForGuard((new Role)->guard_name): '.getModelForGuard($roleModel->guard_name).PHP_EOL;
echo "getModelForGuard('sanctum'): ".getModelForGuard('sanctum').PHP_EOL;

try {
    Role::first()->users();
    echo 'users ok'.PHP_EOL;
} catch (Throwable $e) {
    echo 'catch: '.get_class($e).': '.$e->getMessage().PHP_EOL;
}
