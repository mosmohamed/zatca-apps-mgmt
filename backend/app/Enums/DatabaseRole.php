<?php

declare(strict_types=1);

namespace App\Enums;

enum DatabaseRole: string
{
    case Primary = 'primary';
    case Replica = 'replica';
    case Standby = 'standby';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
