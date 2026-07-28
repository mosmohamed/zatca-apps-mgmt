<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\Application;
use App\Models\ApplicationEnvironment;
use App\Models\Environment;
use App\Models\InfrastructureComponent;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Business logic of the application infrastructure module: reading the full
 * environment tree, upserting one environment profile together with its nested
 * collections, and cloning a profile from one environment into another.
 */
class ApplicationInfrastructureService
{
    /**
     * Request payload key => relationship name on ApplicationEnvironment.
     *
     * @var array<string, string>
     */
    private const COLLECTIONS = [
        'servers' => 'servers',
        'databases' => 'databases',
        'networks' => 'networks',
        'dns_records' => 'dnsRecords',
        'listeners' => 'listeners',
        'load_balancers' => 'loadBalancers',
        'integrations' => 'integrations',
        'message_brokers' => 'messageBrokers',
        'storage_resources' => 'storageResources',
    ];

    /**
     * Profile sections accepted by the upsert payload. All of them are flat
     * column groups on `application_environments`.
     *
     * @var list<string>
     */
    private const SECTIONS = ['hosting', 'internet', 'operational'];

    /**
     * @return array{
     *     application: Application,
     *     environments: Collection<int, Environment>,
     *     profiles: Collection<int, ApplicationEnvironment>
     * }
     */
    public function getInfrastructure(Application $application): array
    {
        $profiles = ApplicationEnvironment::query()
            ->where('application_id', $application->getKey())
            ->with($this->nestedRelations())
            ->orderBy('environment_id')
            ->get();

        $describedEnvironmentIds = $profiles
            ->pluck('environment_id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->all();

        $environments = Environment::query()
            ->where(static function (Builder $query) use ($describedEnvironmentIds): void {
                $query->where('is_active', true)
                    ->orWhereIn('id', $describedEnvironmentIds);
            })
            ->orderBy('sort_order')
            ->orderBy('code')
            ->get();

        return [
            'application' => $application,
            'environments' => $environments,
            'profiles' => $profiles,
        ];
    }

    /**
     * Creates or updates the profile of one application inside one environment
     * and synchronises every nested collection that is present in the payload.
     *
     * @param  array<string, mixed>  $data
     */
    public function upsertProfile(
        Application $application,
        Environment $environment,
        array $data,
        User $actor,
    ): ApplicationEnvironment {
        return DB::transaction(function () use ($application, $environment, $data, $actor): ApplicationEnvironment {
            $profile = $this->resolveProfile($application, (int) $environment->getKey(), $actor);

            $attributes = [];

            foreach (self::SECTIONS as $section) {
                $attributes = array_merge($attributes, $this->sectionAttributes($data, $section));
            }

            $profile->fill($attributes);
            $profile->updated_by = $actor->getKey();
            $profile->save();

            $sync = ! array_key_exists('sync', $data) || (bool) $data['sync'];

            foreach (self::COLLECTIONS as $key => $relation) {
                if (! array_key_exists($key, $data)) {
                    continue;
                }

                $this->syncCollection(
                    $profile,
                    $relation,
                    is_array($data[$key]) ? $data[$key] : [],
                    $actor,
                    $sync,
                );
            }

            return $this->loadProfile($profile);
        });
    }

    /**
     * Soft deletes an environment profile together with every component that
     * belongs to it, so the removal stays auditable and restorable.
     */
    public function deleteProfile(Application $application, Environment $environment): void
    {
        $profile = ApplicationEnvironment::query()
            ->where('application_id', $application->getKey())
            ->where('environment_id', $environment->getKey())
            ->first();

        if ($profile === null) {
            throw new DomainException(__('messages.application_infrastructure.profile_missing'));
        }

        DB::transaction(function () use ($profile): void {
            foreach (self::COLLECTIONS as $relation) {
                foreach ($this->relation($profile, $relation)->get() as $component) {
                    $component->delete();
                }
            }

            $profile->delete();
        });
    }

    /**
     * Clones the source environment profile, including every nested
     * collection, into the target environment of the same application.
     */
    public function copyEnvironment(
        Application $application,
        int $sourceEnvironmentId,
        int $targetEnvironmentId,
        bool $overwrite,
        User $actor,
    ): ApplicationEnvironment {
        if ($sourceEnvironmentId === $targetEnvironmentId) {
            throw new DomainException(__('messages.application_infrastructure.copy_same_environment'));
        }

        $source = ApplicationEnvironment::query()
            ->where('application_id', $application->getKey())
            ->where('environment_id', $sourceEnvironmentId)
            ->with($this->nestedRelations())
            ->first();

        if ($source === null) {
            throw new DomainException(__('messages.application_infrastructure.copy_source_missing'));
        }

        $existingTarget = ApplicationEnvironment::query()
            ->withTrashed()
            ->where('application_id', $application->getKey())
            ->where('environment_id', $targetEnvironmentId)
            ->first();

        if ($existingTarget !== null && ! $existingTarget->trashed() && ! $overwrite) {
            throw new DomainException(__('messages.application_infrastructure.copy_requires_overwrite'));
        }

        return DB::transaction(function () use (
            $application,
            $source,
            $targetEnvironmentId,
            $overwrite,
            $actor,
        ): ApplicationEnvironment {
            $target = $this->resolveProfile($application, $targetEnvironmentId, $actor);

            $target->fill(Arr::except(
                $source->getAttributes(),
                ApplicationEnvironment::NON_COPYABLE_COLUMNS,
            ));
            $target->updated_by = $actor->getKey();
            $target->save();

            foreach (self::COLLECTIONS as $relation) {
                $this->copyComponents($source, $target, $relation, $actor);
            }

            activity('application_infrastructure')
                ->causedBy($actor)
                ->performedOn($target)
                ->withProperties([
                    'application_id' => $application->getKey(),
                    'source_environment_id' => $source->environment_id,
                    'target_environment_id' => $target->environment_id,
                    'overwrite' => $overwrite,
                ])
                ->log('application_infrastructure.environment_copied');

            return $this->loadProfile($target);
        });
    }

    /**
     * Returns the existing profile (restoring it when it was soft deleted) or
     * a new unsaved profile for the given application/environment pair.
     */
    private function resolveProfile(Application $application, int $environmentId, User $actor): ApplicationEnvironment
    {
        $profile = ApplicationEnvironment::query()
            ->withTrashed()
            ->where('application_id', $application->getKey())
            ->where('environment_id', $environmentId)
            ->first();

        if ($profile === null) {
            $profile = new ApplicationEnvironment([
                'application_id' => $application->getKey(),
                'environment_id' => $environmentId,
            ]);
            $profile->created_by = $actor->getKey();

            return $profile;
        }

        if ($profile->trashed()) {
            $profile->restore();
        }

        return $profile;
    }

    /**
     * Updates rows that carry an id, creates rows without one and — when
     * syncing is enabled — soft deletes the rows that were left out.
     *
     * @param  array<array-key, mixed>  $rows
     */
    private function syncCollection(
        ApplicationEnvironment $profile,
        string $relation,
        array $rows,
        User $actor,
        bool $sync,
    ): void {
        $keptIds = [];

        foreach (array_values($rows) as $index => $row) {
            if (! is_array($row)) {
                continue;
            }

            $id = isset($row['id']) ? (int) $row['id'] : 0;
            unset($row['id']);

            if (! isset($row['sort_order'])) {
                $row['sort_order'] = $index;
            }

            $component = $id > 0
                ? $this->relation($profile, $relation)->whereKey($id)->first()
                : null;

            if ($component === null) {
                $component = $this->relation($profile, $relation)->make($row);
                $component->created_by = $actor->getKey();
            } else {
                $component->fill($row);
            }

            $component->updated_by = $actor->getKey();
            $component->save();

            $keptIds[] = (int) $component->getKey();
        }

        if (! $sync) {
            return;
        }

        $stale = $this->relation($profile, $relation)
            ->when($keptIds !== [], static fn (Builder $query): Builder => $query->whereKeyNot($keptIds))
            ->get();

        foreach ($stale as $component) {
            $component->delete();
        }
    }

    /**
     * Replaces the target components of one relation with copies of the source
     * components. Existing target rows are soft deleted so the change stays
     * auditable.
     */
    private function copyComponents(
        ApplicationEnvironment $source,
        ApplicationEnvironment $target,
        string $relation,
        User $actor,
    ): void {
        foreach ($this->relation($target, $relation)->get() as $obsolete) {
            $obsolete->delete();
        }

        /** @var Collection<int, InfrastructureComponent> $components */
        $components = $source->getRelation($relation);

        foreach ($components as $component) {
            $attributes = Arr::except(
                $component->getAttributes(),
                InfrastructureComponent::NON_COPYABLE_COLUMNS,
            );
            $attributes['created_by'] = $actor->getKey();
            $attributes['updated_by'] = $actor->getKey();

            $this->relation($target, $relation)->create($attributes);
        }
    }

    private function loadProfile(ApplicationEnvironment $profile): ApplicationEnvironment
    {
        return $profile->load($this->nestedRelations());
    }

    /**
     * A fresh relation instance for every call, so query constraints of one
     * operation never leak into the next one.
     *
     * @return HasMany<InfrastructureComponent, ApplicationEnvironment>
     */
    private function relation(ApplicationEnvironment $profile, string $relation): HasMany
    {
        /** @var HasMany<InfrastructureComponent, ApplicationEnvironment> $instance */
        $instance = $profile->{$relation}();

        return $instance;
    }

    /**
     * Eager load map for every nested collection, ordered by the explicit sort
     * order and then by id so the payload is stable.
     *
     * @return array<string, callable>
     */
    private function nestedRelations(): array
    {
        $relations = [];

        foreach (self::COLLECTIONS as $relation) {
            $relations[$relation] = static fn (HasMany $query): HasMany => $query
                ->orderBy('sort_order')
                ->orderBy('id');
        }

        return $relations;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function sectionAttributes(array $data, string $section): array
    {
        $values = $data[$section] ?? null;

        return is_array($values) ? $values : [];
    }
}
