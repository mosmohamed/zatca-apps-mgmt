<?php

declare(strict_types=1);

namespace App\Http\Resources\Concerns;

use Illuminate\Support\Str;

trait BuildsInitials
{
    /**
     * Builds a two-letter avatar fallback from the given name parts.
     */
    protected function buildInitials(?string ...$parts): string
    {
        $initials = '';

        foreach ($parts as $part) {
            $trimmed = trim((string) $part);

            if ($trimmed === '') {
                continue;
            }

            $initials .= Str::upper(Str::substr($trimmed, 0, 1));

            if (Str::length($initials) === 2) {
                break;
            }
        }

        return $initials;
    }

    /**
     * Builds initials from a single free-text label such as a vendor name.
     */
    protected function buildInitialsFromLabel(?string $label): string
    {
        $words = preg_split('/\s+/u', trim((string) $label), -1, PREG_SPLIT_NO_EMPTY);

        if ($words === false || $words === []) {
            return '';
        }

        return $this->buildInitials(...$words);
    }
}
