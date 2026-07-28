<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

/**
 * Normalizes loosely typed boolean input ("1", "true", "on", 0, ...) into real
 * booleans before validation runs, so conditional rules such as
 * `required_if:...,true` behave the same for every client.
 *
 * Paths use dot notation and support the `*` wildcard for collections, e.g.
 * `servers.*.tls_enabled`.
 */
trait NormalizesBooleanInput
{
    /**
     * @param  list<string>  $paths
     */
    protected function normalizeBooleanInput(array $paths): void
    {
        $data = $this->all();

        foreach ($paths as $path) {
            $data = $this->normalizeBooleanPath($data, explode('.', $path));
        }

        $this->replace($data);
    }

    /**
     * @param  array<array-key, mixed>  $data
     * @param  list<string>  $segments
     * @return array<array-key, mixed>
     */
    private function normalizeBooleanPath(array $data, array $segments): array
    {
        $segment = array_shift($segments);

        if ($segment === null) {
            return $data;
        }

        if ($segment === '*') {
            foreach ($data as $key => $value) {
                if (is_array($value)) {
                    $data[$key] = $this->normalizeBooleanPath($value, $segments);
                }
            }

            return $data;
        }

        if (! array_key_exists($segment, $data)) {
            return $data;
        }

        if ($segments === []) {
            $data[$segment] = $this->toBoolean($data[$segment]);

            return $data;
        }

        if (is_array($data[$segment])) {
            $data[$segment] = $this->normalizeBooleanPath($data[$segment], $segments);
        }

        return $data;
    }

    /**
     * Values that cannot be interpreted are returned untouched so validation
     * still reports them as invalid.
     */
    private function toBoolean(mixed $value): mixed
    {
        if (is_bool($value)) {
            return $value;
        }

        if ($value === null) {
            return false;
        }

        if (is_array($value)) {
            return $value;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $value;
    }
}
