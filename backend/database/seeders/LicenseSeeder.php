<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\License;
use Illuminate\Database\Seeder;

class LicenseSeeder extends Seeder
{
    public function run(): void
    {
        $licenses = [
            [
                'publisher' => 'Microsoft',
                'name' => 'Power BI',
                'product' => 'Power BI',
                'version' => null,
                'description' => 'Power BI licenses for servers for a period of one year. SQL Server Enterprise Edition with Software Assurance 2 Cores',
                'environment' => 'Production',
                'licensed' => 2,
                'used' => 4,
                'proof_of_entitlement' => 'Available with OPS team',
                'start_date' => '2024-08-08',
                'end_date' => '2026-08-08',
            ],
            [
                'publisher' => 'Cisco',
                'name' => 'AppDynamics APM',
                'product' => 'AppDynamics APM',
                'version' => 'Cisco AppDynamics Controller build 24.7.3-10102',
                'description' => 'AppD Pro Ed - APM Any Language Microsrv (5-pack) - Onprem',
                'environment' => 'Production',
                'licensed' => 165,
                'used' => 825,
                'proof_of_entitlement' => null,
                'start_date' => '2025-11-07',
                'end_date' => '2026-11-07',
            ],
            [
                'publisher' => 'Cisco',
                'name' => 'AppDynamics APM',
                'product' => 'AppDynamics APM',
                'version' => 'Cisco AppDynamics Controller build 24.7.3-10102',
                'description' => 'AppD Adv Ed - APM Any Language - On-Prem',
                'environment' => 'Production',
                'licensed' => 313,
                'used' => 313,
                'proof_of_entitlement' => null,
                'start_date' => '2025-11-07',
                'end_date' => '2026-11-07',
            ],
            [
                'publisher' => 'SAP',
                'name' => 'SuccessFactors',
                'product' => 'SuccessFactors',
                'version' => null,
                'description' => 'SAP SFSF Learning Analytics',
                'environment' => '15001',
                'licensed' => 0,
                'used' => 0,
                'proof_of_entitlement' => 'تحليل شخصي',
                'start_date' => '2025-01-01',
                'end_date' => '2026-12-31',
            ],
            [
                'publisher' => 'SAP',
                'name' => 'SuccessFactors',
                'product' => 'SuccessFactors',
                'version' => null,
                'description' => 'SAP SFSF Learning',
                'environment' => '15001',
                'licensed' => 15001,
                'used' => 12290,
                'proof_of_entitlement' => 'تحليل شخصي',
                'start_date' => '2025-01-01',
                'end_date' => '2026-12-31',
            ],
            [
                'publisher' => 'SAP',
                'name' => 'SuccessFactors',
                'product' => 'SuccessFactors',
                'version' => null,
                'description' => 'SAP SFSF Succession & Development',
                'environment' => '15001',
                'licensed' => 15001,
                'used' => 11065,
                'proof_of_entitlement' => 'تحليل شخصي',
                'start_date' => '2025-01-01',
                'end_date' => '2026-12-31',
            ],
        ];

        foreach ($licenses as $license) {
            $licensed = (int) $license['licensed'];
            $used = (int) $license['used'];

            License::query()->updateOrCreate(
                [
                    'publisher' => $license['publisher'],
                    'name' => $license['name'],
                    'product' => $license['product'],
                    'version' => $license['version'],
                    'description' => $license['description'],
                    'environment' => $license['environment'],
                    'start_date' => $license['start_date'],
                    'end_date' => $license['end_date'],
                ],
                [
                    'licensed' => $licensed,
                    'used' => $used,
                    'available' => max(0, $licensed - $used),
                    'proof_of_entitlement' => $license['proof_of_entitlement'],
                ],
            );
        }
    }
}
