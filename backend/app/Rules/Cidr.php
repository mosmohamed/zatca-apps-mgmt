<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates an IPv4 or IPv6 network in CIDR notation, e.g. `10.20.0.0/16`
 * or `2001:db8::/32`.
 */
class Cidr implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! str_contains($value, '/')) {
            $fail(__('messages.validation.cidr'));

            return;
        }

        [$network, $prefix] = explode('/', $value, 2);

        if ($prefix === '' || preg_match('/^\d{1,3}$/', $prefix) !== 1) {
            $fail(__('messages.validation.cidr'));

            return;
        }

        $prefixLength = (int) $prefix;

        if (filter_var($network, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false) {
            if ($prefixLength > 32) {
                $fail(__('messages.validation.cidr'));
            }

            return;
        }

        if (filter_var($network, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false) {
            if ($prefixLength > 128) {
                $fail(__('messages.validation.cidr'));
            }

            return;
        }

        $fail(__('messages.validation.cidr'));
    }
}
