<?php

declare(strict_types=1);

namespace App\Data;

use Illuminate\Support\Collection;
use Spatie\Permission\Models\Role;

final readonly class RoleMappingResult
{
    /**
     * @param  Collection<int, Role>  $roles
     * @param  list<int>  $ruleIds
     */
    public function __construct(
        public Collection $roles,
        public array $ruleIds,
    ) {}
}
