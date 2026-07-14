<?php

declare(strict_types=1);

namespace App\Exports;

use App\Exports\Contracts\ExportDefinitionInterface;
use App\Exports\Support\ExportColumn;
use Generator;
use Illuminate\Database\Eloquent\Model;
use Maatwebsite\Excel\Concerns\FromGenerator;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Throwable;

/**
 * Configuration-driven, memory-efficient Excel export renderer.
 *
 * Rows are streamed through a PHP generator so large datasets never need to
 * be fully materialised in memory. Layout, styling and branding are entirely
 * driven by the supplied {@see ExportDefinitionInterface} and column list.
 */
final class ProfessionalExcelExport implements FromGenerator, WithCustomStartCell, WithEvents, WithHeadings, WithMapping, WithTitle
{
    private const int HEADING_ROW = 6;

    /**
     * @param  iterable<int, Model>  $rows
     * @param  list<ExportColumn>  $columns
     * @param  array{company_name: string, report_title: string, exported_at: string, filters_summary: string}  $meta
     */
    public function __construct(
        private readonly ExportDefinitionInterface $definition,
        private readonly iterable $rows,
        private readonly array $columns,
        private readonly array $meta,
    ) {
    }

    public function generator(): Generator
    {
        foreach ($this->rows as $row) {
            yield $row;
        }
    }

    /**
     * @return list<string>
     */
    public function headings(): array
    {
        return array_map(static fn (ExportColumn $column): string => $column->header, $this->columns);
    }

    /**
     * @return list<mixed>
     */
    public function map(mixed $row): array
    {
        /** @var Model $row */
        return array_map(static fn (ExportColumn $column): mixed => $column->resolve($row), $this->columns);
    }

    public function title(): string
    {
        return mb_substr($this->definition->sheetName(), 0, 31);
    }

    public function startCell(): string
    {
        return 'A'.self::HEADING_ROW;
    }

    /**
     * @return array<class-string, callable>
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event): void {
                $this->styleSheet($event->sheet->getDelegate());
            },
        ];
    }

    private function styleSheet(Worksheet $sheet): void
    {
        $columnCount = max(count($this->columns), 1);
        $lastColumnLetter = Coordinate::stringFromColumnIndex($columnCount);
        $hasLogo = $this->logoPath() !== null;
        $textStartColumn = ($hasLogo && $columnCount > 1) ? 'B' : 'A';

        $this->writeHeaderBlock($sheet, $textStartColumn, $lastColumnLetter);
        $this->styleHeadingRow($sheet, $lastColumnLetter);
        $this->styleDataRows($sheet, $lastColumnLetter);
        $this->applyColumnWidths($sheet);
        $this->insertLogo($sheet);

        $sheet->freezePane('A'.(self::HEADING_ROW + 1));
        $sheet->setRightToLeft(false);
    }

    private function writeHeaderBlock(Worksheet $sheet, string $startColumn, string $lastColumn): void
    {
        $rows = [
            1 => [$this->meta['company_name'], 14, true],
            2 => [$this->meta['report_title'], 12, true],
            3 => ['Exported At: '.$this->meta['exported_at'], 10, false],
            4 => ['Filters: '.$this->meta['filters_summary'], 10, false],
        ];

        foreach ($rows as $rowNumber => [$value, $fontSize, $bold]) {
            $range = sprintf('%s%d:%s%d', $startColumn, $rowNumber, $lastColumn, $rowNumber);
            $sheet->mergeCells($range);
            $sheet->setCellValue($startColumn.$rowNumber, $value);
            $sheet->getStyle($range)->getFont()->setSize($fontSize)->setBold($bold);
            $sheet->getStyle($range)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        }

        $sheet->getStyle(sprintf('%s1:%s1', $startColumn, $lastColumn))
            ->getFont()->getColor()->setRGB('1F4E79');

        $sheet->getRowDimension(5)->setRowHeight(6);
    }

    private function styleHeadingRow(Worksheet $sheet, string $lastColumn): void
    {
        $range = sprintf('A%d:%s%d', self::HEADING_ROW, $lastColumn, self::HEADING_ROW);

        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => (string) config('export.header_fill_color', '1F4E79')],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'B7C4D1'],
                ],
            ],
        ]);

        $sheet->getRowDimension(self::HEADING_ROW)->setRowHeight(22);
    }

    private function styleDataRows(Worksheet $sheet, string $lastColumn): void
    {
        $firstDataRow = self::HEADING_ROW + 1;
        $highestRow = $sheet->getHighestDataRow();

        if ($highestRow < $firstDataRow) {
            return;
        }

        $altColor = (string) config('export.row_alt_fill_color', 'F5F7FA');

        for ($rowNumber = $firstDataRow; $rowNumber <= $highestRow; $rowNumber++) {
            $range = sprintf('A%d:%s%d', $rowNumber, $lastColumn, $rowNumber);

            $isAlt = ($rowNumber - $firstDataRow) % 2 === 1;

            $style = $sheet->getStyle($range);
            $style->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('E2E8F0');

            if ($isAlt) {
                $style->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB($altColor);
            }

            foreach ($this->columns as $index => $column) {
                if ($column->align === 'left') {
                    continue;
                }

                $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
                $alignment = $column->align === 'center' ? Alignment::HORIZONTAL_CENTER : Alignment::HORIZONTAL_RIGHT;
                $sheet->getStyle($columnLetter.$rowNumber)->getAlignment()->setHorizontal($alignment);
            }
        }
    }

    private function applyColumnWidths(Worksheet $sheet): void
    {
        foreach ($this->columns as $index => $column) {
            $columnLetter = Coordinate::stringFromColumnIndex($index + 1);

            if ($column->width !== null) {
                $sheet->getColumnDimension($columnLetter)->setWidth((float) $column->width);

                continue;
            }

            $sheet->getColumnDimension($columnLetter)->setAutoSize(true);
        }
    }

    private function insertLogo(Worksheet $sheet): void
    {
        $path = $this->logoPath();

        if ($path === null) {
            return;
        }

        try {
            $drawing = new Drawing();
            $drawing->setPath($path);
            $drawing->setHeight(50);
            $drawing->setCoordinates('A1');
            $drawing->setOffsetX(4);
            $drawing->setOffsetY(4);
            $drawing->setWorksheet($sheet);
        } catch (Throwable) {
            // Logo is a purely cosmetic enhancement; skip gracefully on any failure.
        }
    }

    private function logoPath(): ?string
    {
        $configured = config('export.logo_path');

        if (! is_string($configured) || $configured === '') {
            return null;
        }

        return is_file($configured) ? $configured : null;
    }
}
