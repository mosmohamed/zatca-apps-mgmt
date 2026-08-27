<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\JobTitle;
use App\Models\ServiceDeskCategory;
use App\Models\ServiceDeskLevel;
use App\Models\ServiceDeskLicense;
use App\Models\ServiceDeskTeamAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class ServiceDeskSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $levels = [
            [
                'code' => 'L0',
                'name_en' => 'Level 0',
                'name_ar' => 'المستوى 0',
                'note_en' => 'First-line service desk response',
                'note_ar' => 'استجابة الخط الأول لمكتب الخدمة',
                'sort_order' => 0,
            ],
            [
                'code' => 'L1',
                'name_en' => 'Level 1',
                'name_ar' => 'المستوى 1',
                'note_en' => 'Escalate to service desk lead',
                'note_ar' => 'التصعيد إلى قائد مكتب الخدمة',
                'sort_order' => 1,
            ],
            [
                'code' => 'L2',
                'name_en' => 'Level 2',
                'name_ar' => 'المستوى 2',
                'note_en' => 'Escalate to operations lead',
                'note_ar' => 'التصعيد إلى قائد العمليات',
                'sort_order' => 2,
            ],
            [
                'code' => 'L3',
                'name_en' => 'Level 3',
                'name_ar' => 'المستوى 3',
                'note_en' => 'Escalate to section manager',
                'note_ar' => 'التصعيد إلى مدير القسم',
                'sort_order' => 3,
            ],
            [
                'code' => 'L4',
                'name_en' => 'Level 4',
                'name_ar' => 'المستوى 4',
                'note_en' => 'Escalate to IT Ops Director',
                'note_ar' => 'التصعيد إلى مدير عمليات تقنية المعلومات',
                'sort_order' => 4,
            ],
        ];

        foreach ($levels as $level) {
            ServiceDeskLevel::query()->updateOrCreate(
                ['code' => $level['code']],
                [
                    ...$level,
                    'is_active' => true,
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );
        }

        $serviceDesk = ServiceDeskCategory::query()->updateOrCreate(
            ['code' => 'SERVICE-DESK'],
            [
                'parent_id' => null,
                'name_en' => 'Service Desk',
                'name_ar' => 'مكتب الخدمة',
                'description' => 'ITIL service desk streams',
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        foreach (
            [
                ['code' => 'SD-INCIDENT', 'name_en' => 'Incident Management', 'name_ar' => 'إدارة الحوادث', 'sort_order' => 1],
                ['code' => 'SD-REQUEST', 'name_en' => 'Service Request', 'name_ar' => 'طلبات الخدمة', 'sort_order' => 2],
                ['code' => 'SD-ACCESS', 'name_en' => 'Access Management', 'name_ar' => 'إدارة الصلاحيات', 'sort_order' => 3],
                ['code' => 'SD-CHANGE', 'name_en' => 'Change Support', 'name_ar' => 'دعم التغييرات', 'sort_order' => 4],
            ] as $child
        ) {
            ServiceDeskCategory::query()->updateOrCreate(
                ['code' => $child['code']],
                [
                    'parent_id' => $serviceDesk->id,
                    'name_en' => $child['name_en'],
                    'name_ar' => $child['name_ar'],
                    'description' => null,
                    'sort_order' => $child['sort_order'],
                    'is_active' => true,
                ],
            );
        }

        ServiceDeskCategory::query()->updateOrCreate(
            ['code' => 'SD-KNOWLEDGE'],
            [
                'parent_id' => null,
                'name_en' => 'Knowledge & FAQ',
                'name_ar' => 'المعرفة والأسئلة الشائعة',
                'description' => 'Knowledge base and FAQ support stream',
                'sort_order' => 2,
                'is_active' => true,
            ],
        );

        $this->seedEscalationMatrixAssignments();
        $this->seedServiceDeskLicenses();
    }

    /**
     * Creates missing service-desk users only (does not overwrite existing users).
     * Assignments are merged idempotently by category/user/level.
     */
    private function seedEscalationMatrixAssignments(): void
    {
        $people = $this->escalationMatrixPeople();
        $matrix = $this->escalationMatrix();

        $jobTitleId = JobTitle::query()
            ->where('name_en', 'Support Specialist')
            ->value('id')
            ?? JobTitle::query()->orderBy('id')->value('id');

        $employeeRole = Role::findOrCreate('employee', 'web');

        /** @var array<string, User> $usersByEmail */
        $usersByEmail = [];

        foreach ($people as $person) {
            $email = mb_strtolower($person['email'], 'UTF-8');
            [$firstName, $lastName] = $this->splitFullName($person['name']);

            $user = User::query()->firstOrCreate(
                ['email' => $email],
                [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'password' => 'password',
                    'phone' => $person['phone'],
                    'teams' => $person['teams'],
                    'whatsapp' => $person['phone'],
                    'extension' => $person['extension'],
                    'job_title_id' => $jobTitleId,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ],
            );

            if (! $user->hasRole('employee') && ! $user->hasRole('super_admin')) {
                $user->assignRole($employeeRole);
            }

            $usersByEmail[$email] = $user;
        }

        $categoriesByCode = ServiceDeskCategory::query()
            ->whereIn('code', array_keys($matrix))
            ->get()
            ->keyBy('code');
        $levelsByCode = ServiceDeskLevel::query()->get()->keyBy('code');

        DB::transaction(function () use (
            $matrix,
            $categoriesByCode,
            $levelsByCode,
            $usersByEmail,
        ): void {
            foreach ($matrix as $categoryCode => $levelAssignments) {
                $category = $categoriesByCode->get($categoryCode);
                if ($category === null) {
                    continue;
                }

                foreach ($levelAssignments as $levelCode => $emails) {
                    $level = $levelsByCode->get($levelCode);
                    if ($level === null) {
                        continue;
                    }

                    foreach ($emails as $sortOrder => $email) {
                        $user = $usersByEmail[mb_strtolower($email, 'UTF-8')] ?? null;
                        if ($user === null) {
                            continue;
                        }

                        ServiceDeskTeamAssignment::query()->updateOrCreate(
                            [
                                'service_desk_category_id' => $category->id,
                                'user_id' => $user->id,
                                'service_desk_level_id' => $level->id,
                            ],
                            [
                                'sort_order' => $sortOrder,
                            ],
                        );
                    }
                }
            }
        });
    }

    private function seedServiceDeskLicenses(): void
    {
        $licenses = [
            [
                'publisher' => 'ServiceNow',
                'name' => 'ITSM Professional',
                'product' => 'ServiceNow ITSM',
                'version' => 'Washington',
                'description' => 'Service desk ITSM agent licenses',
                'environment' => 'Production',
                'licensed' => 120,
                'used' => 98,
                'proof_of_entitlement' => 'Available with SD team',
                'start_date' => '2025-01-01',
                'end_date' => '2026-12-31',
            ],
            [
                'publisher' => 'Microsoft',
                'name' => 'Dynamics 365 Customer Service',
                'product' => 'Dynamics 365',
                'version' => null,
                'description' => 'Customer service workspace seats for service desk',
                'environment' => 'Production',
                'licensed' => 80,
                'used' => 64,
                'proof_of_entitlement' => null,
                'start_date' => '2025-03-01',
                'end_date' => '2026-03-01',
            ],
            [
                'publisher' => 'Freshworks',
                'name' => 'Freshservice',
                'product' => 'Freshservice Enterprise',
                'version' => null,
                'description' => 'Secondary ticket tooling for overflow queues',
                'environment' => 'Production',
                'licensed' => 40,
                'used' => 22,
                'proof_of_entitlement' => null,
                'start_date' => '2025-06-01',
                'end_date' => '2026-06-01',
            ],
            [
                'publisher' => 'Zoom',
                'name' => 'Contact Center',
                'product' => 'Zoom Contact Center',
                'version' => null,
                'description' => 'Voice channel seats for service desk agents',
                'environment' => 'Production',
                'licensed' => 50,
                'used' => 50,
                'proof_of_entitlement' => 'Available with SD team',
                'start_date' => '2024-09-01',
                'end_date' => '2025-09-01',
            ],
        ];

        foreach ($licenses as $license) {
            $licensed = (int) $license['licensed'];
            $used = (int) $license['used'];

            ServiceDeskLicense::query()->updateOrCreate(
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

    /**
     * @return list<array{name: string, email: string, phone: string, teams: string, extension: string}>
     */
    private function escalationMatrixPeople(): array
    {
        return [
            [
                'name' => 'Noura Alharbi',
                'email' => 'nalharbi-sd@zatca.gov.sa',
                'phone' => '966500100101',
                'teams' => 'nalharbi-sd',
                'extension' => '3101',
            ],
            [
                'name' => 'Fahad Almutairi',
                'email' => 'falmutairi-sd@zatca.gov.sa',
                'phone' => '966500100102',
                'teams' => 'falmutairi-sd',
                'extension' => '3102',
            ],
            [
                'name' => 'Sara Alqahtani',
                'email' => 'salqahtani-sd@zatca.gov.sa',
                'phone' => '966500100103',
                'teams' => 'salqahtani-sd',
                'extension' => '3103',
            ],
            [
                'name' => 'Omar Alshamrani',
                'email' => 'oalshamrani-sd@zatca.gov.sa',
                'phone' => '966500100104',
                'teams' => 'oalshamrani-sd',
                'extension' => '3104',
            ],
            [
                'name' => 'Lina Aldosari',
                'email' => 'laldosari-sd@zatca.gov.sa',
                'phone' => '966500100105',
                'teams' => 'laldosari-sd',
                'extension' => '3105',
            ],
            [
                'name' => 'Yousef Alotaibi',
                'email' => 'yalotaibi-sd@zatca.gov.sa',
                'phone' => '966500100106',
                'teams' => 'yalotaibi-sd',
                'extension' => '3106',
            ],
            [
                'name' => 'Huda Alangari',
                'email' => 'halangari-sd@zatca.gov.sa',
                'phone' => '966500100107',
                'teams' => 'halangari-sd',
                'extension' => '3107',
            ],
            [
                'name' => 'Majed Alghamdi',
                'email' => 'malghamdi-sd@zatca.gov.sa',
                'phone' => '966500100108',
                'teams' => 'malghamdi-sd',
                'extension' => '3108',
            ],
            [
                'name' => 'Reem Aljohani',
                'email' => 'raljohani-sd@zatca.gov.sa',
                'phone' => '966500100109',
                'teams' => 'raljohani-sd',
                'extension' => '3109',
            ],
            [
                'name' => 'Khaled Alzahrani',
                'email' => 'kalzahrani-sd@zatca.gov.sa',
                'phone' => '966500100110',
                'teams' => 'kalzahrani-sd',
                'extension' => '3110',
            ],
            [
                'name' => 'Amal Alharthi',
                'email' => 'aalharthi-sd@zatca.gov.sa',
                'phone' => '966500100111',
                'teams' => 'aalharthi-sd',
                'extension' => '3201',
            ],
            [
                'name' => 'Turki Alsubaie',
                'email' => 'talsubaie-sd@zatca.gov.sa',
                'phone' => '966500100112',
                'teams' => 'talsubaie-sd',
                'extension' => '3202',
            ],
            [
                'name' => 'Mona Alshehri',
                'email' => 'malshehri-sd@zatca.gov.sa',
                'phone' => '966500100113',
                'teams' => 'malshehri-sd',
                'extension' => '3203',
            ],
            [
                'name' => 'Abdullah Alqahtani',
                'email' => 'aalqahtani-sd@zatca.gov.sa',
                'phone' => '966500100114',
                'teams' => 'aalqahtani-sd',
                'extension' => '3204',
            ],
            [
                'name' => 'SD Admin',
                'email' => 'sd_admin@zatca.gov.sa',
                'phone' => '966500100199',
                'teams' => 'sd_admin',
                'extension' => '3299',
            ],
        ];
    }

    /**
     * @return array<string, array<string, list<string>>>
     */
    private function escalationMatrix(): array
    {
        return [
            'SD-INCIDENT' => [
                'L0' => [
                    'nalharbi-sd@zatca.gov.sa',
                    'falmutairi-sd@zatca.gov.sa',
                    'salqahtani-sd@zatca.gov.sa',
                ],
                'L1' => ['aalharthi-sd@zatca.gov.sa'],
                'L2' => ['talsubaie-sd@zatca.gov.sa'],
                'L3' => ['malshehri-sd@zatca.gov.sa'],
                'L4' => ['aalqahtani-sd@zatca.gov.sa'],
            ],
            'SD-REQUEST' => [
                'L0' => [
                    'oalshamrani-sd@zatca.gov.sa',
                    'laldosari-sd@zatca.gov.sa',
                ],
                'L1' => ['aalharthi-sd@zatca.gov.sa'],
                'L2' => ['talsubaie-sd@zatca.gov.sa'],
                'L3' => ['malshehri-sd@zatca.gov.sa'],
                'L4' => ['aalqahtani-sd@zatca.gov.sa'],
            ],
            'SD-ACCESS' => [
                'L0' => [
                    'yalotaibi-sd@zatca.gov.sa',
                    'halangari-sd@zatca.gov.sa',
                ],
                'L1' => ['aalharthi-sd@zatca.gov.sa'],
                'L2' => ['talsubaie-sd@zatca.gov.sa'],
                'L3' => ['malshehri-sd@zatca.gov.sa'],
                'L4' => ['sd_admin@zatca.gov.sa'],
            ],
            'SD-CHANGE' => [
                'L0' => [
                    'malghamdi-sd@zatca.gov.sa',
                    'raljohani-sd@zatca.gov.sa',
                ],
                'L1' => ['kalzahrani-sd@zatca.gov.sa'],
                'L2' => ['talsubaie-sd@zatca.gov.sa'],
                'L3' => ['malshehri-sd@zatca.gov.sa'],
                'L4' => ['aalqahtani-sd@zatca.gov.sa'],
            ],
            'SD-KNOWLEDGE' => [
                'L0' => [
                    'nalharbi-sd@zatca.gov.sa',
                    'laldosari-sd@zatca.gov.sa',
                ],
                'L1' => ['aalharthi-sd@zatca.gov.sa'],
                'L2' => ['talsubaie-sd@zatca.gov.sa'],
                'L3' => ['malshehri-sd@zatca.gov.sa'],
                'L4' => ['aalqahtani-sd@zatca.gov.sa'],
            ],
        ];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitFullName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];
        $firstName = $parts[0] ?? 'User';
        $lastName = trim(implode(' ', array_slice($parts, 1)));

        if ($lastName === '') {
            $lastName = 'ServiceDesk';
        }

        return [$firstName, $lastName];
    }
}
