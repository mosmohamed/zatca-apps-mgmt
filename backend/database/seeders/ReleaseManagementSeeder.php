<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\JobTitle;
use App\Models\ReleaseManagementCategory;
use App\Models\ReleaseManagementLevel;
use App\Models\ReleaseManagementTeamAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class ReleaseManagementSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $levels = [
            [
                'code' => 'L0',
                'name_en' => 'Level 0',
                'name_ar' => 'المستوى 0',
                'note_en' => 'First-line release management response',
                'note_ar' => 'استجابة الخط الأول لمكتب الخدمة',
                'sort_order' => 0,
            ],
            [
                'code' => 'L1',
                'name_en' => 'Level 1',
                'name_ar' => 'المستوى 1',
                'note_en' => 'Escalate to release management lead',
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
            ReleaseManagementLevel::query()->updateOrCreate(
                ['code' => $level['code']],
                [
                    ...$level,
                    'is_active' => true,
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );
        }

        $root = ReleaseManagementCategory::query()->updateOrCreate(
            ['code' => 'RELEASE-MANAGEMENT'],
            [
                'parent_id' => null,
                'name_en' => 'Release Management',
                'name_ar' => 'مكتب الخدمة',
                'description' => 'ITIL release management streams',
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        foreach (
            [
                ['code' => 'RM-INCIDENT', 'name_en' => 'Incident Management', 'name_ar' => 'إدارة الحوادث', 'sort_order' => 1],
                ['code' => 'RM-REQUEST', 'name_en' => 'Service Request', 'name_ar' => 'طلبات الخدمة', 'sort_order' => 2],
                ['code' => 'RM-ACCESS', 'name_en' => 'Access Management', 'name_ar' => 'إدارة الصلاحيات', 'sort_order' => 3],
                ['code' => 'RM-CHANGE', 'name_en' => 'Change Support', 'name_ar' => 'دعم التغييرات', 'sort_order' => 4],
            ] as $child
        ) {
            ReleaseManagementCategory::query()->updateOrCreate(
                ['code' => $child['code']],
                [
                    'parent_id' => $root->id,
                    'name_en' => $child['name_en'],
                    'name_ar' => $child['name_ar'],
                    'description' => null,
                    'sort_order' => $child['sort_order'],
                    'is_active' => true,
                ],
            );
        }

        ReleaseManagementCategory::query()->updateOrCreate(
            ['code' => 'RM-KNOWLEDGE'],
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
    }

    /**
     * Creates missing release-management users only (does not overwrite existing users).
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

        $categoriesByCode = ReleaseManagementCategory::query()
            ->whereIn('code', array_keys($matrix))
            ->get()
            ->keyBy('code');
        $levelsByCode = ReleaseManagementLevel::query()->get()->keyBy('code');

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

                        ReleaseManagementTeamAssignment::query()->updateOrCreate(
                            [
                                'release_management_category_id' => $category->id,
                                'user_id' => $user->id,
                                'release_management_level_id' => $level->id,
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

    /**
     * @return list<array{name: string, email: string, phone: string, teams: string, extension: string}>
     */
    private function escalationMatrixPeople(): array
    {
        return [
            [
                'name' => 'Noura Alharbi',
                'email' => 'nalharbi-rm@zatca.gov.sa',
                'phone' => '966500100101',
                'teams' => 'nalharbi-rm',
                'extension' => '3101',
            ],
            [
                'name' => 'Fahad Almutairi',
                'email' => 'falmutairi-rm@zatca.gov.sa',
                'phone' => '966500100102',
                'teams' => 'falmutairi-rm',
                'extension' => '3102',
            ],
            [
                'name' => 'Sara Alqahtani',
                'email' => 'salqahtani-rm@zatca.gov.sa',
                'phone' => '966500100103',
                'teams' => 'salqahtani-rm',
                'extension' => '3103',
            ],
            [
                'name' => 'Omar Alshamrani',
                'email' => 'oalshamrani-rm@zatca.gov.sa',
                'phone' => '966500100104',
                'teams' => 'oalshamrani-rm',
                'extension' => '3104',
            ],
            [
                'name' => 'Lina Aldosari',
                'email' => 'laldosari-rm@zatca.gov.sa',
                'phone' => '966500100105',
                'teams' => 'laldosari-rm',
                'extension' => '3105',
            ],
            [
                'name' => 'Yousef Alotaibi',
                'email' => 'yalotaibi-rm@zatca.gov.sa',
                'phone' => '966500100106',
                'teams' => 'yalotaibi-rm',
                'extension' => '3106',
            ],
            [
                'name' => 'Huda Alangari',
                'email' => 'halangari-rm@zatca.gov.sa',
                'phone' => '966500100107',
                'teams' => 'halangari-rm',
                'extension' => '3107',
            ],
            [
                'name' => 'Majed Alghamdi',
                'email' => 'malghamdi-rm@zatca.gov.sa',
                'phone' => '966500100108',
                'teams' => 'malghamdi-rm',
                'extension' => '3108',
            ],
            [
                'name' => 'Reem Aljohani',
                'email' => 'raljohani-rm@zatca.gov.sa',
                'phone' => '966500100109',
                'teams' => 'raljohani-rm',
                'extension' => '3109',
            ],
            [
                'name' => 'Khaled Alzahrani',
                'email' => 'kalzahrani-rm@zatca.gov.sa',
                'phone' => '966500100110',
                'teams' => 'kalzahrani-rm',
                'extension' => '3110',
            ],
            [
                'name' => 'Amal Alharthi',
                'email' => 'aalharthi-rm@zatca.gov.sa',
                'phone' => '966500100111',
                'teams' => 'aalharthi-rm',
                'extension' => '3201',
            ],
            [
                'name' => 'Turki Alsubaie',
                'email' => 'talsubaie-rm@zatca.gov.sa',
                'phone' => '966500100112',
                'teams' => 'talsubaie-rm',
                'extension' => '3202',
            ],
            [
                'name' => 'Mona Alshehri',
                'email' => 'malshehri-rm@zatca.gov.sa',
                'phone' => '966500100113',
                'teams' => 'malshehri-rm',
                'extension' => '3203',
            ],
            [
                'name' => 'Abdullah Alqahtani',
                'email' => 'aalqahtani-rm@zatca.gov.sa',
                'phone' => '966500100114',
                'teams' => 'aalqahtani-rm',
                'extension' => '3204',
            ],
            [
                'name' => 'Release Management Admin',
                'email' => 'release_management_admin@zatca.gov.sa',
                'phone' => '966500100199',
                'teams' => 'release_management_admin',
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
            'RM-INCIDENT' => [
                'L0' => [
                    'nalharbi-rm@zatca.gov.sa',
                    'falmutairi-rm@zatca.gov.sa',
                    'salqahtani-rm@zatca.gov.sa',
                ],
                'L1' => ['aalharthi-rm@zatca.gov.sa'],
                'L2' => ['talsubaie-rm@zatca.gov.sa'],
                'L3' => ['malshehri-rm@zatca.gov.sa'],
                'L4' => ['aalqahtani-rm@zatca.gov.sa'],
            ],
            'RM-REQUEST' => [
                'L0' => [
                    'oalshamrani-rm@zatca.gov.sa',
                    'laldosari-rm@zatca.gov.sa',
                ],
                'L1' => ['aalharthi-rm@zatca.gov.sa'],
                'L2' => ['talsubaie-rm@zatca.gov.sa'],
                'L3' => ['malshehri-rm@zatca.gov.sa'],
                'L4' => ['aalqahtani-rm@zatca.gov.sa'],
            ],
            'RM-ACCESS' => [
                'L0' => [
                    'yalotaibi-rm@zatca.gov.sa',
                    'halangari-rm@zatca.gov.sa',
                ],
                'L1' => ['aalharthi-rm@zatca.gov.sa'],
                'L2' => ['talsubaie-rm@zatca.gov.sa'],
                'L3' => ['malshehri-rm@zatca.gov.sa'],
                'L4' => ['release_management_admin@zatca.gov.sa'],
            ],
            'RM-CHANGE' => [
                'L0' => [
                    'malghamdi-rm@zatca.gov.sa',
                    'raljohani-rm@zatca.gov.sa',
                ],
                'L1' => ['kalzahrani-rm@zatca.gov.sa'],
                'L2' => ['talsubaie-rm@zatca.gov.sa'],
                'L3' => ['malshehri-rm@zatca.gov.sa'],
                'L4' => ['aalqahtani-rm@zatca.gov.sa'],
            ],
            'RM-KNOWLEDGE' => [
                'L0' => [
                    'nalharbi-rm@zatca.gov.sa',
                    'laldosari-rm@zatca.gov.sa',
                ],
                'L1' => ['aalharthi-rm@zatca.gov.sa'],
                'L2' => ['talsubaie-rm@zatca.gov.sa'],
                'L3' => ['malshehri-rm@zatca.gov.sa'],
                'L4' => ['aalqahtani-rm@zatca.gov.sa'],
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
            $lastName = 'ReleaseManagement';
        }

        return [$firstName, $lastName];
    }
}
