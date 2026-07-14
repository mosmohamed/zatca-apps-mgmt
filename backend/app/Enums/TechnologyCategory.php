<?php

declare(strict_types=1);

namespace App\Enums;

enum TechnologyCategory: string
{
    case Frontend = 'Frontend';
    case Backend = 'Backend';
    case Database = 'Database';
    case Cloud = 'Cloud';
    case Mobile = 'Mobile';
    case Other = 'Other';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
