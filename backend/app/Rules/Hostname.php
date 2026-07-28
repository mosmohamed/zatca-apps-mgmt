<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates a DNS host name or fully qualified domain name. Labels may contain
 * letters, digits, underscores and hyphens, may not start or end with a hyphen,
 * and the whole name may not exceed 253 characters.
 */
class Hostname implements ValidationRule
{
    private const PATTERN = '/^(?=.{1,253}\.?$)(?!-)[A-Za-z0-9_-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9_-]{1,63}(?<!-))*\.?$/';

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || preg_match(self::PATTERN, $value) !== 1) {
            $fail(__('messages.validation.hostname'));
        }
    }
}
