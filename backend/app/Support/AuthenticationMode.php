<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Setting;

final class AuthenticationMode
{
    public const string KEY = 'authentication_mode';

    public const string DEFAULT = 'hybrid';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return ['local', 'sso', 'hybrid'];
    }

    public static function defaults(): string
    {
        return self::DEFAULT;
    }

    public static function normalize(mixed $value): string
    {
        $mode = is_string($value) ? strtolower(trim($value)) : '';

        return in_array($mode, self::values(), true) ? $mode : self::DEFAULT;
    }

    public static function current(): string
    {
        $value = Setting::query()
            ->where('key', self::KEY)
            ->value('value');

        return self::normalize($value);
    }

    public static function allowsLocal(?string $mode = null): bool
    {
        return in_array(self::normalize($mode ?? self::current()), ['local', 'hybrid'], true);
    }

    public static function allowsSso(?string $mode = null): bool
    {
        return in_array(self::normalize($mode ?? self::current()), ['sso', 'hybrid'], true);
    }
}
