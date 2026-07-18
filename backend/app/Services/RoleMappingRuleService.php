<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\RoleMappingRule;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RoleMappingRuleService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, RoleMappingRule>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = RoleMappingRule::query()->with(['identityProvider', 'role']);
        $this->applyColumnSearch($query, $filters['search'] ?? null, ['claim_name', 'external_value']);
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['claim_name', 'external_value', 'priority', 'enabled', 'created_at', 'updated_at'],
            '-priority',
        );

        return $query->paginate(
            perPage: max(1, min((int) ($filters['per_page'] ?? 15), 100)),
            page: max(1, (int) ($filters['page'] ?? 1)),
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): RoleMappingRule
    {
        return DB::transaction(function () use ($data): RoleMappingRule {
            $this->assertUnique($data);

            return RoleMappingRule::query()->create($data)->load(['identityProvider', 'role']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(RoleMappingRule $rule, array $data): RoleMappingRule
    {
        return DB::transaction(function () use ($rule, $data): RoleMappingRule {
            $candidate = array_replace($rule->only([
                'identity_provider_id', 'claim_name', 'external_value', 'role_id',
            ]), $data);
            $this->assertUnique($candidate, $rule->id);
            $rule->update($data);

            return $rule->refresh()->load(['identityProvider', 'role']);
        });
    }

    public function delete(RoleMappingRule $rule): void
    {
        DB::transaction(static fn () => $rule->delete());
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function assertUnique(array $data, ?int $exceptId = null): void
    {
        $exists = RoleMappingRule::query()
            ->when($exceptId !== null, static fn ($query) => $query->whereKeyNot($exceptId))
            ->where('identity_provider_id', $data['identity_provider_id'])
            ->where('claim_name', $data['claim_name'])
            ->where('external_value', $data['external_value'])
            ->where('role_id', $data['role_id'])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'external_value' => [__('messages.role_mappings.duplicate')],
            ]);
        }
    }
}
