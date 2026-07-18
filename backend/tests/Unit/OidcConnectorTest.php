<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\OidcConnector;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class OidcConnectorTest extends TestCase
{
    public function test_it_rejects_unsigned_id_tokens_before_fetching_keys(): void
    {
        $header = rtrim(strtr(base64_encode(json_encode(['alg' => 'none'], JSON_THROW_ON_ERROR)), '+/', '-_'), '=');
        $payload = rtrim(strtr(base64_encode(json_encode(['sub' => 'subject'], JSON_THROW_ON_ERROR)), '+/', '-_'), '=');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('unsupported signing algorithm');

        (new OidcConnector)->validateIdToken(
            $header.'.'.$payload.'.',
            [
                'jwks_uri' => 'https://id.example.com/jwks',
                'issuer' => 'https://id.example.com',
                'client_id' => 'client',
            ],
            'nonce',
        );
    }
}
