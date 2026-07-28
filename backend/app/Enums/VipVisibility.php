<?php

declare(strict_types=1);

namespace App\Enums;

enum VipVisibility: string
{
    case Private = 'private';
    case Public = 'public';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
