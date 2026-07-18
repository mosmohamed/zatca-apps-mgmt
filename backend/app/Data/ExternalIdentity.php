<?php

declare(strict_types=1);

namespace App\Data;

use Illuminate\Support\Arr;

/**
 * Verified identity payload returned by an OIDC or SAML connector.
 *
 * {@see $subject} is the immutable IdP identifier (OIDC "sub" / SAML NameID) and is
 * persisted as {@see \App\Models\ExternalIdentity::$external_subject}.
 */
final readonly class ExternalIdentity
{
    /**
     * @param  string  $subject  Immutable IdP subject (OIDC sub / SAML NameID).
     * @param  array<string, mixed>  $claims
     */
    public function __construct(
        public string $subject,
        public array $claims,
    ) {}

    public function claim(string $path): mixed
    {
        return Arr::get($this->claims, $path);
    }

    /**
     * @return list<string>
     */
    public function normalizedValues(string $path): array
    {
        $value = $this->claim($path);
        $values = is_array($value) ? Arr::flatten($value) : [$value];

        return array_values(array_unique(array_filter(
            array_map(
                static fn (mixed $item): string => self::normalize($item),
                $values,
            ),
            static fn (string $item): bool => $item !== '',
        )));
    }

    public static function normalize(mixed $value): string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if (! is_scalar($value) && $value !== null) {
            return '';
        }

        return mb_strtolower(trim((string) $value));
    }
}
