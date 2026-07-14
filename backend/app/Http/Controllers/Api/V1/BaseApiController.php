<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use App\Traits\PaginationTrait;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;

abstract class BaseApiController extends Controller
{
    use ApiResponseTrait;
    use PaginationTrait;
    use SearchTrait;
    use SortTrait;
}
