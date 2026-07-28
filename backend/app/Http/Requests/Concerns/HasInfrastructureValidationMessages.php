<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

/**
 * Extends the shared localized messages with the rules used by the deeply
 * nested infrastructure payloads, and resolves attribute names from the last
 * segment of a dotted rule key so that `servers.*.private_ip` and
 * `hosting.cluster_ip` both read naturally in error messages.
 */
trait HasInfrastructureValidationMessages
{
    use HasLocalizedValidationMessages {
        messages as localizedMessages;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return array_merge($this->localizedMessages(), [
            'array' => __('messages.validation.array'),
            'ip' => __('messages.validation.ip'),
            'different' => __('messages.validation.different'),
            'required_if' => __('messages.validation.required_if'),
            'max.numeric' => __('messages.validation.max.numeric'),
            'min.numeric' => __('messages.validation.min.numeric'),
        ]);
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        $attributes = [];

        foreach (array_keys($this->rules()) as $field) {
            $field = (string) $field;
            $segments = explode('.', $field);
            $leaf = (string) end($segments);

            if ($leaf === '*') {
                continue;
            }

            $translationKey = 'messages.attributes.'.$leaf;
            $translated = __($translationKey);

            if (is_string($translated) && $translated !== $translationKey) {
                $attributes[$field] = $translated;
            }
        }

        return $attributes;
    }
}
