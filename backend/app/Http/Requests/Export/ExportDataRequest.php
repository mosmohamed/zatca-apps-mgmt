<?php

declare(strict_types=1);

namespace App\Http\Requests\Export;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExportDataRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'format' => ['required', 'string', Rule::in(['xlsx', 'json'])],
            'scope' => ['required', 'string', Rule::in(['current_page', 'selected', 'filtered', 'all'])],
            'ids' => ['required_if:scope,selected', 'array'],
            'ids.*' => ['integer', 'min:1'],
            'search' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'columns' => ['nullable', 'array'],
            'columns.*' => ['string'],
            'filters_summary' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        return [
            'format' => (string) $this->validated('format'),
            'scope' => (string) $this->validated('scope'),
            'ids' => array_map('intval', (array) $this->input('ids', [])),
            'search' => $this->input('search'),
            'sort' => $this->input('sort'),
            'page' => $this->input('page'),
            'per_page' => $this->input('per_page'),
            'columns' => $this->input('columns'),
            'filters_summary' => $this->input('filters_summary'),
        ];
    }
}
