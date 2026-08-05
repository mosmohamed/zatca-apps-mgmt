<?php

declare(strict_types=1);

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Escalation-matrix workbook matching the original infra_info layout:
 * Escalation Stream | L0 Name/Email/Phone | L1–L4 stacked contact cells.
 */
final class InfraEscalationMatrixExport implements FromArray, ShouldAutoSize, WithEvents, WithTitle
{
    /**
     * @param  list<array<int, string>>  $rows
     * @param  list<array{start: int, end: int}>  $streamMerges  1-based data row ranges (excluding header rows)
     * @param  list<string>  $levelHeaders  L1–Ln header labels (column E onward)
     */
    public function __construct(
        private readonly array $rows,
        private readonly array $streamMerges,
        private readonly array $levelHeaders,
        private readonly string $sheetTitle = 'Escalation Matrix',
    ) {}

    /**
     * @return list<array<int, string>>
     */
    public function array(): array
    {
        return $this->rows;
    }

    public function title(): string
    {
        return mb_substr($this->sheetTitle, 0, 31);
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
        $lastColumnIndex = 4 + count($this->levelHeaders); // A + BCD + levels
        $lastColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($lastColumnIndex);
        $lastRow = max(count($this->rows), 2);

        $sheet->mergeCells('B1:D1');

        $sheet->getStyle("A1:{$lastColumn}2")->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
        ]);

        $sheet->getStyle('A1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1F4E79'],
            ],
        ]);
        $sheet->getStyle('B1:D2')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '548235'],
            ],
        ]);

        for ($index = 0; $index < count($this->levelHeaders); $index++) {
            $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(5 + $index);
            $color = $index === 0 ? 'C65911' : '5B9BD5';
            $sheet->mergeCells("{$column}1:{$column}2");
            $sheet->getStyle("{$column}1")->applyFromArray([
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => $color],
                ],
            ]);
        }

        $sheet->mergeCells('A1:A2');

        $sheet->getRowDimension(1)->setRowHeight(28);
        $sheet->getRowDimension(2)->setRowHeight(22);

        if ($lastRow >= 3) {
            $sheet->getStyle("A3:{$lastColumn}{$lastRow}")->applyFromArray([
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => true,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'B4B4B4'],
                    ],
                ],
            ]);
        }

        $sheet->getStyle("A1:{$lastColumn}2")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
            ],
        ]);

        foreach ($this->streamMerges as $merge) {
            $start = $merge['start'];
            $end = $merge['end'];
            if ($end <= $start) {
                continue;
            }

            $sheet->mergeCells("A{$start}:A{$end}");

            for ($index = 0; $index < count($this->levelHeaders); $index++) {
                $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(5 + $index);
                $sheet->mergeCells("{$column}{$start}:{$column}{$end}");
            }
        }

        $sheet->getColumnDimension('A')->setWidth(28);
        $sheet->getColumnDimension('B')->setWidth(22);
        $sheet->getColumnDimension('C')->setWidth(28);
        $sheet->getColumnDimension('D')->setWidth(18);

        for ($index = 0; $index < count($this->levelHeaders); $index++) {
            $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(5 + $index);
            $sheet->getColumnDimension($column)->setWidth(28);
        }

        $sheet->freezePane('A3');
    }
}
