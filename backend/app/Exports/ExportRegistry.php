<?php

declare(strict_types=1);

namespace App\Exports;

use App\Exports\Contracts\ExportDefinitionInterface;
use App\Exports\Definitions\ApplicationsExportDefinition;
use App\Exports\Definitions\DepartmentsExportDefinition;
use App\Exports\Definitions\LicensesExportDefinition;
use App\Exports\Definitions\TechnologiesExportDefinition;
use App\Exports\Definitions\UsersExportDefinition;
use App\Exports\Definitions\VendorsExportDefinition;
use InvalidArgumentException;

final class ExportRegistry
{
    /**
     * @var array<string, class-string<ExportDefinitionInterface>>
     */
    private const array MAP = [
        'applications' => ApplicationsExportDefinition::class,
        'vendors' => VendorsExportDefinition::class,
        'users' => UsersExportDefinition::class,
        'technologies' => TechnologiesExportDefinition::class,
        'licenses' => LicensesExportDefinition::class,
        'departments' => DepartmentsExportDefinition::class,
    ];

    public function resolveOrFail(string $entity): ExportDefinitionInterface
    {
        $class = self::MAP[$entity] ?? null;

        if ($class === null) {
            throw new InvalidArgumentException(sprintf('No export definition registered for entity "%s".', $entity));
        }

        return new $class;
    }

    public function has(string $entity): bool
    {
        return array_key_exists($entity, self::MAP);
    }

    /**
     * @return list<string>
     */
    public function keys(): array
    {
        return array_keys(self::MAP);
    }
}
