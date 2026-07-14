<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Vendor;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = [
            [
                'name' => 'STC Solutions',
                'email' => 'contact@stc.sa',
                'phone' => '+966511000001',
                'contact_person_email' => 'ops@@stc.sa',
                'contact_person_phone' => '+966511000002',
                'remarks' => 'Primary infrastructure vendor.',
                'status' => true,
            ],
            [
                'name' => 'Tata Consultancy Services',
                'email' => 'hello@tcs.com',
                'phone' => '+966511000011',
                'contact_person_email' => 'account@tcs.com',
                'contact_person_phone' => '+966511000012',
                'remarks' => 'Cloud hosting and managed services.',
                'status' => true,
            ],
            [
                'name' => 'ELM',
                'email' => 'info@elm.sa',
                'phone' => '+966511000021',
                'contact_person_email' => 'delivery@elm.sa',
                'contact_person_phone' => '+966511000022',
                'remarks' => 'Integration and data migration partner.',
                'status' => true,
            ],
            [
                'name' => 'Enovation Group',
                'email' => 'security@enovation.com',
                'phone' => '+966511000031',
                'contact_person_email' => 'lead@enovation.com',
                'contact_person_phone' => '+966511000032',
                'remarks' => 'Cybersecurity assessment services.',
                'status' => true,
            ],
            [
                'name' => 'Ebttikar Technology',
                'email' => 'support@ebttikar.sa',
                'phone' => '+966511000041',
                'contact_person_email' => null,
                'contact_person_phone' => null,
                'remarks' => 'Inactive historical vendor retained for archive references.',
                'status' => false,
            ],
        ];

        foreach ($vendors as $vendor) {
            Vendor::query()->firstOrCreate(
                ['name' => $vendor['name']],
                $vendor,
            );
        }
    }
}
