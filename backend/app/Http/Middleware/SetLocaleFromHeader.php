<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class SetLocaleFromHeader
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $preferred = $request->getPreferredLanguage(['en', 'ar']);

        if (is_string($preferred) && in_array($preferred, ['en', 'ar'], true)) {
            app()->setLocale($preferred);
        }

        return $next($request);
    }
}
