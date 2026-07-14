<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\Activitylog\Models\Activity;

/**
 * @mixin Activity
 */
class ActivityLogResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'log_name' => $this->log_name,
            'description' => $this->description,
            'event' => $this->event,
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,
            'subject_label' => $this->subjectLabel(),
            'causer' => $this->when(
                $this->relationLoaded('causer') && $this->causer instanceof User,
                fn () => [
                    'id' => $this->causer->id,
                    'full_name' => $this->causer->full_name,
                    'email' => $this->causer->email,
                ],
            ),
            'properties' => $this->properties?->toArray(),
            'created_at' => $this->formatDate($this->created_at),
        ];
    }

    private function subjectLabel(): ?string
    {
        if (! $this->relationLoaded('subject') || $this->subject === null) {
            return null;
        }

        $subject = $this->subject;

        foreach (['name_en', 'name', 'full_name', 'code', 'key'] as $attribute) {
            if (isset($subject->{$attribute})) {
                return (string) $subject->{$attribute};
            }
        }

        return null;
    }
}
