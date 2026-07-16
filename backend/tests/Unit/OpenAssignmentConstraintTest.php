<?php

declare(strict_types=1);

namespace Tests\Unit;

use Database\Support\OpenAssignmentConstraint;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Schema\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OpenAssignmentConstraintTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        Schema::clearResolvedInstances();
        DB::clearResolvedInstances();
        parent::tearDown();
    }

    #[Test]
    public function sqlsrv_path_creates_filtered_unique_index(): void
    {
        $connection = Mockery::mock(ConnectionInterface::class);
        $builder = Mockery::mock(Builder::class);

        $builder->shouldReceive('getConnection')->andReturn($connection);
        $connection->shouldReceive('getDriverName')->andReturn('sqlsrv');

        Schema::swap($builder);

        $expectedSql = 'CREATE UNIQUE INDEX '.OpenAssignmentConstraint::INDEX_NAME
            .' ON application_assignments (application_id, user_id)'
            .' WHERE ended_at IS NULL';

        DB::shouldReceive('statement')
            ->once()
            ->with($expectedSql)
            ->andReturn(true);

        OpenAssignmentConstraint::create();

        $this->addToAssertionCount(1);
    }
}
