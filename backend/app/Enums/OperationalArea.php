<?php

declare(strict_types=1);

namespace App\Enums;

enum OperationalArea: string
{
    case Application = 'application';
    case Infra = 'infra';
    case ServiceDesk = 'service_desk';
    case NetworkOps = 'network_ops';
    case ReleaseManagement = 'release_management';
    case SmartFacilities = 'smart_facilities';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
