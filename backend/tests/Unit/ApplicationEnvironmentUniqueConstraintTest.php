<?php

declare(strict_types=1);

namespace Tests\Unit;

use Database\Support\ApplicationEnvironmentUniqueConstraint;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Schema\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ApplicationEnvironmentUniqueConstraintTest extends TestCase
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

        $expectedSql = 'CREATE UNIQUE INDEX '.ApplicationEnvironmentUniqueConstraint::INDEX_NAME
            .' ON application_environments (application_id, environment_id)'
            .' WHERE deleted_at IS NULL';

        DB::shouldReceive('statement')
            ->once()
            ->with($expectedSql)
            ->andReturn(true);

        ApplicationEnvironmentUniqueConstraint::create();

        $this->addToAssertionCount(1);
    }

    #[Test]
    public function sqlsrv_path_drops_filtered_unique_index(): void
    {
        $connection = Mockery::mock(ConnectionInterface::class);
        $builder = Mockery::mock(Builder::class);

        $builder->shouldReceive('getConnection')->andReturn($connection);
        $connection->shouldReceive('getDriverName')->andReturn('sqlsrv');

        Schema::swap($builder);

        $expectedSql = 'DROP INDEX IF EXISTS '.ApplicationEnvironmentUniqueConstraint::INDEX_NAME
            .' ON application_environments';

        DB::shouldReceive('statement')
            ->once()
            ->with($expectedSql)
            ->andReturn(true);

        ApplicationEnvironmentUniqueConstraint::drop();

        $this->addToAssertionCount(1);
    }

    #[Test]
    public function mysql_path_uses_schema_builder_not_raw_sql(): void
    {
        $connection = Mockery::mock(ConnectionInterface::class);
        $builder = Mockery::mock(Builder::class);

        $builder->shouldReceive('getConnection')->andReturn($connection);
        $connection->shouldReceive('getDriverName')->andReturn('mysql');

        Schema::swap($builder);

        $builder->shouldReceive('table')
            ->once()
            ->withArgs(function (string $table, mixed $callback): bool {
                return $table === 'application_environments'
                    && $callback instanceof \Closure;
            });

        DB::shouldReceive('statement')->never();

        ApplicationEnvironmentUniqueConstraint::create();

        $this->addToAssertionCount(1);
    }

    #[Test]
    public function sqlite_path_uses_schema_builder_not_raw_sql(): void
    {
        $connection = Mockery::mock(ConnectionInterface::class);
        $builder = Mockery::mock(Builder::class);

        $builder->shouldReceive('getConnection')->andReturn($connection);
        $connection->shouldReceive('getDriverName')->andReturn('sqlite');

        Schema::swap($builder);

        $builder->shouldReceive('table')
            ->once()
            ->withArgs(function (string $table, mixed $callback): bool {
                return $table === 'application_environments'
                    && $callback instanceof \Closure;
            });

        DB::shouldReceive('statement')->never();

        ApplicationEnvironmentUniqueConstraint::create();

        $this->addToAssertionCount(1);
    }
}
