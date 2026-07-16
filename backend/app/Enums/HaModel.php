<?php

declare(strict_types=1);

namespace App\Enums;

enum HaModel: string
{
    case ActiveActive = 'Active/Active';
    case ActivePassive = 'Active/Passive';
    case HotStandby = 'Hot Standby';
    case ColdStandby = 'Cold Standby';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
