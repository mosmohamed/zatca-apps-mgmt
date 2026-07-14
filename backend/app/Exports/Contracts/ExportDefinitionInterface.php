<?php

declare(strict_types=1);

namespace App\Exports\Contracts;

use App\Exports\Support\ExportColumn;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

interface ExportDefinitionInterface
{
    /**
     * Unique registry key, e.g. "applications".
     */
    public function key(): string;

    /**
     * Spatie permission name required to export this entity, e.g. "applications.export".
     */
    public function permission(): string;

    /**
     * Prefix used to build the downloaded file name, e.g. "Applications".
     */
    public function filenamePrefix(): string;

    /**
     * Human readable report title shown in the export header block.
     */
    public function reportTitle(): string;

    /**
     * Excel worksheet name.
     */
    public function sheetName(): string;

    /**
     * Columns eligible for free-text search filtering.
     *
     * @return list<string>
     */
    public function searchColumns(): array;

    /**
     * Columns eligible for sorting.
     *
     * @return list<string>
     */
    public function sortableColumns(): array;

    /**
     * Default sort expression, e.g. "-created_at".
     */
    public function defaultSort(): string;

    /**
     * Ordered list of exportable columns.
     *
     * @return list<ExportColumn>
     */
    public function columns(): array;

    /**
     * Base Eloquent query builder with eager loads applied.
     *
     * @return Builder<Model>
     */
    public function query(): Builder;
}
