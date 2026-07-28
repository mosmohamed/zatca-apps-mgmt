<?php

declare(strict_types=1);

namespace App\Enums;

enum DnsScope: string
{
    case Internal = 'internal';
    case External = 'external';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
