<?php

declare(strict_types=1);

namespace App\Enums;

enum LoadBalancerType: string
{
    case F5 = 'f5';
    case Cloud = 'cloud';
    case Nginx = 'nginx';
    case HaProxy = 'haproxy';
    case Other = 'other';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
