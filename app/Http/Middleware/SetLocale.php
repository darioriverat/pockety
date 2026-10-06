<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Set the application locale from the authenticated user's preference
     * before validation and controller logic run. Guests stay on English.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = 'en';

        $user = $request->user();
        if ($user !== null) {
            $userLocale = $user->locale ?? 'en';
            if (in_array($userLocale, ['en', 'es'], true)) {
                $locale = $userLocale;
            }
        }

        App::setLocale($locale);

        return $next($request);
    }
}
