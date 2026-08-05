<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\InfraCategory;
use App\Models\InfraLevel;
use App\Models\InfraTeamAssignment;
use App\Models\JobTitle;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class OperationInfraSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $levels = [
            [
                'code' => 'L0',
                'name_en' => 'Level 0',
                'name_ar' => 'المستوى 0',
                'note_en' => 'Initial response by Engineer',
                'note_ar' => 'الاستجابة الأولية من المهندس',
                'sort_order' => 0,
            ],
            [
                'code' => 'L1',
                'name_en' => 'Level 1',
                'name_ar' => 'المستوى 1',
                'note_en' => 'Escalate to Vendor Lead',
                'note_ar' => 'التصعيد إلى قائد المورد',
                'sort_order' => 1,
            ],
            [
                'code' => 'L2',
                'name_en' => 'Level 2',
                'name_ar' => 'المستوى 2',
                'note_en' => 'Escalate to Leaders',
                'note_ar' => 'التصعيد إلى القيادات',
                'sort_order' => 2,
            ],
            [
                'code' => 'L3',
                'name_en' => 'Level 3',
                'name_ar' => 'المستوى 3',
                'note_en' => 'Escalate to System and Database Section Manager',
                'note_ar' => 'التصعيد إلى مدير قسم الأنظمة وقواعد البيانات',
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
            InfraLevel::query()->updateOrCreate(
                ['code' => $level['code']],
                [
                    ...$level,
                    'is_active' => true,
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );
        }

        $database = InfraCategory::query()->updateOrCreate(
            ['code' => 'DATABASE'],
            [
                'parent_id' => null,
                'name_en' => 'Database',
                'name_ar' => 'قواعد البيانات',
                'description' => null,
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        foreach (
            [
                ['code' => 'DB-ORACLE', 'name_en' => 'Oracle', 'name_ar' => 'أوراكل', 'sort_order' => 1],
                ['code' => 'DB-SQL', 'name_en' => 'SQL', 'name_ar' => 'SQL', 'sort_order' => 2],
                ['code' => 'DB-HANA', 'name_en' => 'HANA', 'name_ar' => 'HANA', 'sort_order' => 3],
            ] as $child
        ) {
            InfraCategory::query()->updateOrCreate(
                ['code' => $child['code']],
                [
                    'parent_id' => $database->id,
                    'name_en' => $child['name_en'],
                    'name_ar' => $child['name_ar'],
                    'sort_order' => $child['sort_order'],
                    'is_active' => true,
                ],
            );
        }

        InfraCategory::query()->updateOrCreate(
            ['code' => 'SERVERS-VMWARE'],
            [
                'parent_id' => null,
                'name_en' => 'Servers & VMware',
                'name_ar' => 'الخوادم و VMware',
                'sort_order' => 2,
                'is_active' => true,
            ],
        );

        $systems = InfraCategory::query()->updateOrCreate(
            ['code' => 'SYSTEMS'],
            [
                'parent_id' => null,
                'name_en' => 'Systems',
                'name_ar' => 'الأنظمة',
                'sort_order' => 3,
                'is_active' => true,
            ],
        );

        InfraCategory::query()->updateOrCreate(
            ['code' => 'SYS-MICROSOFT'],
            [
                'parent_id' => $systems->id,
                'name_en' => 'Microsoft',
                'name_ar' => 'مايكروسوفت',
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        $this->seedEscalationMatrixAssignments();
    }

    /**
     * Escalation matrix transcribed from infa_info.png.
     *
     * Creates missing spreadsheet users only (does not overwrite existing users
     * from LegacyApplicationImportSeeder or other seeders). Assignments are
     * merged idempotently by category/user/level.
     */
    private function seedEscalationMatrixAssignments(): void
    {
        $people = $this->escalationMatrixPeople();
        $matrix = $this->escalationMatrix();

        $jobTitleId = JobTitle::query()
            ->where('name_en', 'Infrastructure Engineer')
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

        $categoriesByCode = InfraCategory::query()
            ->whereIn('code', array_keys($matrix))
            ->get()
            ->keyBy('code');
        $levelsByCode = InfraLevel::query()->get()->keyBy('code');

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

                        InfraTeamAssignment::query()->updateOrCreate(
                            [
                                'infra_category_id' => $category->id,
                                'user_id' => $user->id,
                                'infra_level_id' => $level->id,
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
                'name' => 'Arif Basharat Shah',
                'email' => 'ashah-c@zatca.gov.sa',
                'phone' => '966569136855',
                'teams' => 'ashah-c',
                'extension' => '1001',
            ],
            [
                'name' => 'Sohail Ahmed Siddiqui',
                'email' => 'sasohail@zatca.gov.sa',
                'phone' => '966556807749',
                'teams' => 'sasohail',
                'extension' => '1002',
            ],
            [
                'name' => 'Ashraf Shawky',
                'email' => 'ashraf.shawky@zatca.gov.sa',
                'phone' => '966556352732',
                'teams' => 'ashraf.shawky',
                'extension' => '1003',
            ],
            [
                'name' => 'Saleemuddin Ahmad',
                'email' => 's.ahmad@zatca.gov.sa',
                'phone' => '966507904221',
                'teams' => 's.ahmad',
                'extension' => '1004',
            ],
            [
                'name' => 'Shariq Basheer',
                'email' => 'bshariq-c@zatca.gov.sa',
                'phone' => '966595597927',
                'teams' => 'bshariq-c',
                'extension' => '1005',
            ],
            [
                'name' => 'Khan Arif',
                'email' => 'mkhan-c@zatca.gov.sa',
                'phone' => '966546035340',
                'teams' => 'mkhan-c',
                'extension' => '1006',
            ],
            [
                'name' => 'Azmal Khan',
                'email' => 'azkhan-c@zatca.gov.sa',
                'phone' => '966531279862',
                'teams' => 'azkhan-c',
                'extension' => '1007',
            ],
            [
                'name' => 'Tawseef Khan',
                'email' => 'tkhan-c@zatca.gov.sa',
                'phone' => '966538841343',
                'teams' => 'tkhan-c',
                'extension' => '1008',
            ],
            [
                'name' => 'Ganesan S. Sathish',
                'email' => 'gsathish-c@zatca.gov.sa',
                'phone' => '966507094006',
                'teams' => 'gsathish-c',
                'extension' => '1009',
            ],
            [
                'name' => 'Aljhorara Naser A Alqiraini',
                'email' => 'aqraini-c@zatca.gov.sa',
                'phone' => '966539303041',
                'teams' => 'aqraini-c',
                'extension' => '1010',
            ],
            [
                'name' => 'Mohammed Amir Eqbal',
                'email' => 'meqbal@zatca.gov.sa',
                'phone' => '966537167189',
                'teams' => 'meqbal',
                'extension' => '1011',
            ],
            [
                'name' => 'Faisal Hussain',
                'email' => 'fhussain-c@zatca.gov.sa',
                'phone' => '966537269330',
                'teams' => 'fhussain-c',
                'extension' => '1012',
            ],
            [
                'name' => 'Mohammed Mumtaz Ali',
                'email' => 'mali@zatca.gov.sa',
                'phone' => '966552280614',
                'teams' => 'mali',
                'extension' => '1013',
            ],
            [
                'name' => 'Salih Sidahmed Salih',
                'email' => 'salih@zatca.gov.sa',
                'phone' => '966502953082',
                'teams' => 'salih',
                'extension' => '1014',
            ],
            [
                'name' => 'Mohamed Bilal',
                'email' => 'kbilal-c@zatca.gov.sa',
                'phone' => '966557610330',
                'teams' => 'kbilal-c',
                'extension' => '1015',
            ],
            [
                'name' => 'Syed Yusuf Hameed',
                'email' => 'shameed-c@zatca.gov.sa',
                'phone' => '966555506891',
                'teams' => 'shameed-c',
                'extension' => '1016',
            ],
            [
                'name' => 'Mahmoud S Haroun',
                'email' => 'mharoun-c@zatca.gov.sa',
                'phone' => '966546932826',
                'teams' => 'mharoun-c',
                'extension' => '1017',
            ],
            [
                'name' => 'Abid B. Ahmad',
                'email' => 'abahmad-c@zatca.gov.sa',
                'phone' => '966559770648',
                'teams' => 'abahmad-c',
                'extension' => '1018',
            ],
            [
                'name' => 'Arshad Nihal',
                'email' => 'arshad.nihal@tcs.com',
                'phone' => '966558018627',
                'teams' => 'arshad.nihal',
                'extension' => '1019',
            ],
            [
                'name' => 'Hafeezuddin',
                'email' => 'mhafeezuddin-c@zatca.gov.sa',
                'phone' => '966538481478',
                'teams' => 'mhafeezuddin-c',
                'extension' => '1020',
            ],
            [
                'name' => 'Abdul Kareem',
                'email' => 'aaziz-c@zatca.gov.sa',
                'phone' => '966558297437',
                'teams' => 'aaziz-c',
                'extension' => '1021',
            ],
            [
                'name' => 'Khalid M. Alqahtani',
                'email' => 'kqahtani@zatca.gov.sa',
                'phone' => '966533751359',
                'teams' => 'kqahtani',
                'extension' => '1022',
            ],
            [
                'name' => 'Romiya Sharma',
                'email' => 'romsharma-c@zatca.gov.sa',
                'phone' => '966533466879',
                'teams' => 'romsharma-c',
                'extension' => '1023',
            ],
            [
                'name' => 'Mohammed Razi Khan',
                'email' => 'razikhan@zatca.gov.sa',
                'phone' => '966566035364',
                'teams' => 'razikhan',
                'extension' => '2001',
            ],
            [
                'name' => 'Abdulrahman M. Almunif',
                'email' => 'amunif@zatca.gov.sa',
                'phone' => '966504172770',
                'teams' => 'amunif',
                'extension' => '2002',
            ],
            [
                'name' => 'Abdulaziz M. Bayamin',
                'email' => 'bayamenam@zatca.gov.sa',
                'phone' => '966504701395',
                'teams' => 'bayamenam',
                'extension' => '2003',
            ],
            [
                'name' => 'Abdulrahman S. Alotaibi',
                'email' => 'asaotaibi@zatca.gov.sa',
                'phone' => '966568411160',
                'teams' => 'asaotaibi',
                'extension' => '2004',
            ],
            [
                'name' => 'Mohammed F. Baeeinh',
                'email' => 'mbaeeinh@zatca.gov.sa',
                'phone' => '966566994877',
                'teams' => 'mbaeeinh',
                'extension' => '2005',
            ],
        ];
    }

    /**
     * @return array<string, array<string, list<string>>>
     */
    private function escalationMatrix(): array
    {
        return [
            'DB-ORACLE' => [
                'L0' => [
                    'ashah-c@zatca.gov.sa',
                    'sasohail@zatca.gov.sa',
                    'ashraf.shawky@zatca.gov.sa',
                    's.ahmad@zatca.gov.sa',
                    'bshariq-c@zatca.gov.sa',
                    'mkhan-c@zatca.gov.sa',
                ],
                'L1' => ['razikhan@zatca.gov.sa'],
                'L2' => ['amunif@zatca.gov.sa'],
                'L3' => ['bayamenam@zatca.gov.sa'],
                'L4' => ['asaotaibi@zatca.gov.sa'],
            ],
            'DB-SQL' => [
                'L0' => [
                    'azkhan-c@zatca.gov.sa',
                    'tkhan-c@zatca.gov.sa',
                    'gsathish-c@zatca.gov.sa',
                    'aqraini-c@zatca.gov.sa',
                ],
                'L1' => ['razikhan@zatca.gov.sa'],
                'L2' => ['amunif@zatca.gov.sa'],
                'L3' => ['bayamenam@zatca.gov.sa'],
                'L4' => ['asaotaibi@zatca.gov.sa'],
            ],
            'DB-HANA' => [
                'L0' => [
                    'meqbal@zatca.gov.sa',
                    'fhussain-c@zatca.gov.sa',
                ],
                'L1' => ['razikhan@zatca.gov.sa'],
                'L2' => ['amunif@zatca.gov.sa'],
                'L3' => ['bayamenam@zatca.gov.sa'],
                'L4' => ['asaotaibi@zatca.gov.sa'],
            ],
            'SERVERS-VMWARE' => [
                'L0' => [
                    'mali@zatca.gov.sa',
                    'salih@zatca.gov.sa',
                    'kbilal-c@zatca.gov.sa',
                    'shameed-c@zatca.gov.sa',
                ],
                'L1' => ['razikhan@zatca.gov.sa'],
                'L2' => ['bayamenam@zatca.gov.sa'],
                'L3' => ['bayamenam@zatca.gov.sa'],
                'L4' => ['asaotaibi@zatca.gov.sa'],
            ],
            'SYS-MICROSOFT' => [
                'L0' => [
                    'mharoun-c@zatca.gov.sa',
                    'abahmad-c@zatca.gov.sa',
                    'arshad.nihal@tcs.com',
                    'mhafeezuddin-c@zatca.gov.sa',
                    'aaziz-c@zatca.gov.sa',
                    'kqahtani@zatca.gov.sa',
                    'romsharma-c@zatca.gov.sa',
                ],
                'L1' => ['razikhan@zatca.gov.sa'],
                'L2' => ['mbaeeinh@zatca.gov.sa'],
                'L3' => ['bayamenam@zatca.gov.sa'],
                'L4' => ['asaotaibi@zatca.gov.sa'],
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
            $lastName = 'Infra';
        }

        return [$firstName, $lastName];
    }
}
