<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Application;
use App\Models\ApplicationEnvironment;
use App\Models\Environment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The complete infrastructure tree of one application: every active
 * environment from the master list, each with its profile or `null` when the
 * application has not been described in that environment yet.
 */
class ApplicationInfrastructureResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /**
         * @var array{
         *     application: Application,
         *     environments: Collection<int, Environment>,
         *     profiles: Collection<int, ApplicationEnvironment>
         * } $payload
         */
        $payload = $this->resource;

        $application = $payload['application'];
        $profiles = $payload['profiles']->keyBy('environment_id');

        $environments = [];

        foreach ($payload['environments'] as $environment) {
            $profile = $profiles->get($environment->getKey());

            $environments[] = [
                'environment' => (new EnvironmentResource($environment))->resolve($request),
                'profile' => $profile instanceof ApplicationEnvironment
                    ? (new ApplicationEnvironmentResource($profile))->resolve($request)
                    : null,
            ];
        }

        return [
            'application' => [
                'id' => $application->id,
                'code' => $application->code,
                'name_en' => $application->name_en,
                'name_ar' => $application->name_ar,
            ],
            'environments' => $environments,
        ];
    }
}
