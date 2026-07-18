<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\SamlConnector;
use PHPUnit\Framework\TestCase;

class SamlConnectorTest extends TestCase
{
    public function test_it_normalizes_single_and_multi_value_attributes(): void
    {
        $claims = (new SamlConnector)->normalizeAttributes([
            'email' => ['person@example.com'],
            'groups' => ['employees', 'auditors'],
        ], 'external-subject');

        $this->assertSame('external-subject', $claims['sub']);
        $this->assertSame('external-subject', $claims['name_id']);
        $this->assertSame('person@example.com', $claims['email']);
        $this->assertSame(['employees', 'auditors'], $claims['groups']);
    }
}
