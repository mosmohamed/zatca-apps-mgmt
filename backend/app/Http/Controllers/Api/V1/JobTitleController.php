<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\JobTitle\StoreJobTitleRequest;
use App\Http\Requests\JobTitle\UpdateJobTitleRequest;
use App\Http\Resources\JobTitleResource;
use App\Models\JobTitle;
use App\Services\JobTitleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JobTitleController extends BaseApiController
{
    public function __construct(
        private readonly JobTitleService $jobTitleService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', JobTitle::class);

        $paginator = $this->jobTitleService->list(
            $this->listFilters($request, 'sort_order')
        );

        return $this->paginatedResponse(
            $paginator,
            JobTitleResource::class,
            __('messages.job_titles.listed'),
        );
    }

    public function store(StoreJobTitleRequest $request): JsonResponse
    {
        $jobTitle = $this->jobTitleService->create($request->validated());

        return $this->resourceResponse(
            new JobTitleResource($jobTitle),
            __('messages.job_titles.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(JobTitle $jobTitle): JsonResponse
    {
        $this->authorize('view', $jobTitle);

        return $this->resourceResponse(
            new JobTitleResource($this->jobTitleService->find($jobTitle->id)),
            __('messages.job_titles.retrieved'),
        );
    }

    public function update(UpdateJobTitleRequest $request, JobTitle $jobTitle): JsonResponse
    {
        $jobTitle = $this->jobTitleService->update($jobTitle, $request->validated());

        return $this->resourceResponse(
            new JobTitleResource($jobTitle),
            __('messages.job_titles.updated'),
        );
    }

    public function destroy(JobTitle $jobTitle): JsonResponse
    {
        $this->authorize('delete', $jobTitle);

        $this->jobTitleService->delete($jobTitle);

        return $this->successResponse(null, __('messages.job_titles.deleted'));
    }
}
