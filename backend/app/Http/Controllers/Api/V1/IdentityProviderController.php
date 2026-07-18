<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\IdentityProvider\StoreIdentityProviderRequest;
use App\Http\Requests\IdentityProvider\UpdateIdentityProviderRequest;
use App\Http\Resources\IdentityProviderResource;
use App\Models\IdentityProvider;
use App\Services\IdentityProviderService;
use App\Support\IdentityProviderPresets;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentityProviderController extends BaseApiController
{
    public function __construct(private readonly IdentityProviderService $service) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', IdentityProvider::class);

        return $this->paginatedResponse(
            $this->service->list($this->listFilters($request, 'name')),
            IdentityProviderResource::class,
            __('messages.identity_providers.listed'),
        );
    }

    public function store(StoreIdentityProviderRequest $request): JsonResponse
    {
        return $this->resourceResponse(
            new IdentityProviderResource($this->service->create($request->validated())),
            __('messages.identity_providers.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(IdentityProvider $identityProvider): JsonResponse
    {
        $this->authorize('view', $identityProvider);

        return $this->resourceResponse(
            new IdentityProviderResource($identityProvider),
            __('messages.identity_providers.retrieved'),
        );
    }

    public function update(
        UpdateIdentityProviderRequest $request,
        IdentityProvider $identityProvider,
    ): JsonResponse {
        return $this->resourceResponse(
            new IdentityProviderResource($this->service->update($identityProvider, $request->validated())),
            __('messages.identity_providers.updated'),
        );
    }

    public function destroy(IdentityProvider $identityProvider): JsonResponse
    {
        $this->authorize('delete', $identityProvider);
        $this->service->delete($identityProvider);

        return $this->successResponse(null, __('messages.identity_providers.deleted'));
    }

    public function testConnection(IdentityProvider $identityProvider): JsonResponse
    {
        $this->authorize('update', $identityProvider);

        return $this->successResponse($this->service->testConnection($identityProvider));
    }

    public function presets(): JsonResponse
    {
        $this->authorize('create', IdentityProvider::class);

        return $this->successResponse(
            IdentityProviderPresets::catalog(),
            __('messages.identity_providers.presets_listed'),
        );
    }

    public function buildPreset(Request $request): JsonResponse
    {
        $this->authorize('create', IdentityProvider::class);
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:microsoft_entra,auth0,keycloak,okta,generic_oidc,generic_saml'],
            'tenant_id' => ['nullable', 'string', 'max:255'],
            'domain' => ['nullable', 'string', 'max:255'],
            'discovery_url' => ['nullable', 'string', 'max:2048'],
            'client_id' => ['nullable', 'string', 'max:255'],
            'client_secret' => ['nullable', 'string', 'max:2048'],
            'issuer' => ['nullable', 'string', 'max:2048'],
            'authorization_endpoint' => ['nullable', 'string', 'max:2048'],
            'token_endpoint' => ['nullable', 'string', 'max:2048'],
            'userinfo_endpoint' => ['nullable', 'string', 'max:2048'],
            'jwks_uri' => ['nullable', 'string', 'max:2048'],
            'idp_entity_id' => ['nullable', 'string', 'max:2048'],
            'sso_url' => ['nullable', 'string', 'max:2048'],
            'slo_url' => ['nullable', 'string', 'max:2048'],
            'x509_certificate' => ['nullable', 'string'],
            'sp_entity_id' => ['nullable', 'string', 'max:2048'],
            'acs_url' => ['nullable', 'string', 'max:2048'],
        ]);

        $built = IdentityProviderPresets::build(
            (string) $validated['type'],
            $validated,
        );

        return $this->successResponse($built, __('messages.identity_providers.preset_built'));
    }
}
