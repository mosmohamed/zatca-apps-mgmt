<?php

declare(strict_types=1);

namespace App\Enums;

enum IntegrationDirection: string
{
    case Inbound = 'inbound';
    case Outbound = 'outbound';
    case Bidirectional = 'bidirectional';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
