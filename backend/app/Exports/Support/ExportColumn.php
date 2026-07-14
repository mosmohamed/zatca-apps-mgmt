<?php

declare(strict_types=1);

namespace App\Exports\Support;

use Closure;
use Illuminate\Database\Eloquent\Model;

/**
 * Immutable definition of a single exportable column.
 *
 * The value resolver receives the model instance for the current row and
 * must return a scalar (string|int|float|bool|null) suitable for writing
 * into a spreadsheet cell or a JSON payload.
 *
 * Note: PHP does not allow typed `callable` properties, so the resolver is
 * stored as a Closure.
 */
final readonly class ExportColumn
{
    private Closure $value;

    /**
     * @param  callable(Model): mixed  $value
     */
    public function __construct(
        public string $key,
        public string $header,
        callable $value,
        public ?int $width = null,
        public string $align = 'left',
    ) {
        $this->value = $value(...);
    }

    public function resolve(Model $model): mixed
    {
        return ($this->value)($model);
    }

    /**
     * @param  callable(Model): mixed  $value
     */
    public static function make(
        string $key,
        string $header,
        callable $value,
        ?int $width = null,
        string $align = 'left',
    ): self {
        return new self($key, $header, $value, $width, $align);
    }
}
