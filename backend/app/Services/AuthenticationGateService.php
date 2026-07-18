<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Support\AuthenticationMode;
use Illuminate\Validation\ValidationException;

class AuthenticationGateService
{
    public function assertLocalLoginAllowed(): void
    {
        if (! AuthenticationMode::allowsLocal()) {
            throw ValidationException::withMessages([
                'email' => [__('messages.auth.local_login_disabled')],
            ]);
        }
    }

    public function assertSsoLoginAllowed(): void
    {
        if (! AuthenticationMode::allowsSso()) {
            throw ValidationException::withMessages([
                'provider' => [__('messages.sso.login_disabled')],
            ]);
        }
    }

    public function assertUserMayUseLocal(User $user): void
    {
        if ($user->authentication_type === 'sso') {
            throw ValidationException::withMessages([
                'email' => [__('messages.auth.local_login_not_allowed')],
            ]);
        }
    }

    public function assertUserMayUseSso(User $user): void
    {
        if ($user->authentication_type === 'local') {
            throw ValidationException::withMessages([
                'provider' => [__('messages.sso.user_login_not_allowed')],
            ]);
        }
    }
}
