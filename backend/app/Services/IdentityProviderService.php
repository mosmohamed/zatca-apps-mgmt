<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\IdentityProvider;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class IdentityProviderService
{
    use SearchTrait;
    use SortTrait;

    public function __construct(private readonly IdentityProviderConnectionTester $connectionTester) {}

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, IdentityProvider>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = IdentityProvider::query();
        $this->applyColumnSearch($query, $filters['search'] ?? null, ['name', 'slug', 'protocol']);
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name', 'slug', 'protocol', 'enabled', 'created_at', 'updated_at'],
            'name',
        );

        return $query->paginate(
            perPage: max(1, min((int) ($filters['per_page'] ?? 15), 100)),
            page: max(1, (int) ($filters['page'] ?? 1)),
        );
    }

    /**
     * @return Collection<int, IdentityProvider>
     */
    public function enabled(): Collection
    {
        return IdentityProvider::query()
            ->where('enabled', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'protocol', 'enabled']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): IdentityProvider
    {
        return DB::transaction(static fn (): IdentityProvider => IdentityProvider::query()->create($data));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(IdentityProvider $provider, array $data): IdentityProvider
    {
        return DB::transaction(static function () use ($provider, $data): IdentityProvider {
            if (isset($data['configuration']) && is_array($data['configuration'])) {
                foreach (['client_secret', 'x509_certificate', 'private_key'] as $secret) {
                    if (
                        array_key_exists($secret, $data['configuration'])
                        && (
                            $data['configuration'][$secret] === null
                            || trim((string) $data['configuration'][$secret]) === ''
                        )
                    ) {
                        unset($data['configuration'][$secret]);
                    }
                }
                $data['configuration'] = array_replace((array) $provider->configuration, $data['configuration']);
            }

            $provider->update($data);

            return $provider->refresh();
        });
    }

    public function delete(IdentityProvider $provider): void
    {
        DB::transaction(static fn () => $provider->delete());
    }

    /**
     * @return array{
     *     success: bool,
     *     protocol: string,
     *     checks: list<array{name: string, status: string, message: string}>,
     *     message: string
     * }
     */
    public function testConnection(IdentityProvider $provider): array
    {
        return $this->connectionTester->test($provider);
    }
}
