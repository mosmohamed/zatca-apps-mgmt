<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

trait HasLocalizedValidationMessages
{
    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'required' => __('messages.validation.required'),
            'string' => __('messages.validation.string'),
            'email' => __('messages.validation.email'),
            'unique' => __('messages.validation.unique'),
            'exists' => __('messages.validation.exists'),
            'boolean' => __('messages.validation.boolean'),
            'integer' => __('messages.validation.integer'),
            'numeric' => __('messages.validation.numeric'),
            'url' => __('messages.validation.url'),
            'max.string' => __('messages.validation.max.string'),
            'min.string' => __('messages.validation.min.string'),
            'in' => __('messages.validation.in'),
            'confirmed' => __('messages.validation.confirmed'),
            'date' => __('messages.validation.date'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        $attributes = [];

        foreach (array_keys($this->rules()) as $field) {
            $key = str_replace('.', '_', (string) $field);
            $translationKey = 'messages.attributes.'.$key;

            if (__($translationKey) !== $translationKey) {
                $attributes[$field] = __($translationKey);
            }
        }

        return $attributes;
    }
}
