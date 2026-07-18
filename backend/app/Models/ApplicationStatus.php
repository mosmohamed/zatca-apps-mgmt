<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ApplicationStatusFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApplicationStatus extends Model
{
    /** @use HasFactory<ApplicationStatusFactory> */
    use HasFactory;

    protected $table = 'application_statuses';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name_en',
        'name_ar',
        'code',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<Application, $this>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(Application::class, 'status_id');
    }
}
