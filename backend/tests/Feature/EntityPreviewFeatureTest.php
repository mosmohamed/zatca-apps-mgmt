<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Application;
use App\Models\ApplicationAssignment;
use App\Models\AppRole;
use App\Models\Department;
use App\Models\JobTitle;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class EntityPreviewFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'preview-admin@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');
    }

    #[Test]
    public function authorized_user_can_preview_a_user(): void
    {
        Sanctum::actingAs($this->admin);

        $vendor = Vendor::factory()->create(['name' => 'Contoso Systems']);
        $jobTitle = JobTitle::factory()->create([
            'name_en' => 'Solution Architect',
            'name_ar' => 'مهندس حلول',
        ]);

        $user = User::factory()->create([
            'first_name' => 'Layla',
            'last_name' => 'Hassan',
            'email' => 'layla.hassan@zatca.sa',
            'phone' => '+966500000001',
            'extension' => '4821',
            'vendor_id' => $vendor->id,
            'job_title_id' => $jobTitle->id,
            'is_active' => true,
        ]);
        $user->assignRole('employee');

        ApplicationAssignment::factory()->create([
            'application_id' => Application::factory()->create()->id,
            'user_id' => $user->id,
            'app_role_id' => AppRole::factory()->create()->id,
            'ended_at' => null,
        ]);

        $response = $this->getJson("/api/v1/users/{$user->id}/preview");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.full_name', 'Layla Hassan')
            ->assertJsonPath('data.initials', 'LH')
            ->assertJsonPath('data.email', 'layla.hassan@zatca.sa')
            ->assertJsonPath('data.extension', '4821')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.job_title.name_en', 'Solution Architect')
            ->assertJsonPath('data.vendor.name', 'Contoso Systems')
            ->assertJsonPath('data.roles.0', 'employee')
            ->assertJsonPath('data.active_assignments_count', 1);

        $this->assertArrayNotHasKey('password', (array) $response->json('data'));
        $this->assertArrayNotHasKey('remember_token', (array) $response->json('data'));
    }

    #[Test]
    public function authorized_user_can_preview_a_vendor(): void
    {
        Sanctum::actingAs($this->admin);

        $vendor = Vendor::factory()->create([
            'name' => 'Northern Gate Technologies',
            'email' => 'hello@northern-gate.sa',
            'phone' => '+966112223344',
            'contact_person_email' => 'support@northern-gate.sa',
            'contact_person_phone' => '+966112223355',
            'status' => true,
        ]);

        User::factory()->count(2)->create(['vendor_id' => $vendor->id, 'is_active' => true]);
        User::factory()->create(['vendor_id' => $vendor->id, 'is_active' => false]);

        $this->getJson("/api/v1/vendors/{$vendor->id}/preview")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $vendor->id)
            ->assertJsonPath('data.name', 'Northern Gate Technologies')
            ->assertJsonPath('data.initials', 'NG')
            ->assertJsonPath('data.email', 'hello@northern-gate.sa')
            ->assertJsonPath('data.contact_person_email', 'support@northern-gate.sa')
            ->assertJsonPath('data.status', true)
            ->assertJsonPath('data.users_count', 3)
            ->assertJsonPath('data.active_users_count', 2);
    }

    #[Test]
    public function authorized_user_can_preview_an_application(): void
    {
        Sanctum::actingAs($this->admin);

        $department = Department::factory()->create([
            'name_en' => 'Information Technology',
            'name_ar' => 'تقنية المعلومات',
        ]);

        $owner = User::factory()->create([
            'first_name' => 'Business',
            'last_name' => 'Office',
            'email' => 'business.office@zatca.sa',
        ]);
        $tech = User::factory()->create([
            'first_name' => 'Platform',
            'last_name' => 'Team',
            'email' => 'platform.team@zatca.sa',
        ]);

        $application = Application::factory()->create([
            'department_id' => $department->id,
            'name_en' => 'Tax Filing Portal',
            'name_ar' => 'بوابة الإقرارات',
            'code' => 'PREVIEW-APP-001',
            'documentation_url' => 'https://docs.example.sa/tax-filing',
        ]);
        $application->businessOwners()->sync([$owner->id]);
        $application->technicalOwners()->sync([$tech->id]);

        ApplicationAssignment::factory()->create([
            'application_id' => $application->id,
            'user_id' => User::factory()->create()->id,
            'app_role_id' => AppRole::factory()->create()->id,
            'ended_at' => null,
        ]);
        ApplicationAssignment::factory()->ended()->create([
            'application_id' => $application->id,
            'user_id' => User::factory()->create()->id,
            'app_role_id' => AppRole::factory()->create()->id,
        ]);

        $this->getJson("/api/v1/applications/{$application->id}/preview")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $application->id)
            ->assertJsonPath('data.name_en', 'Tax Filing Portal')
            ->assertJsonPath('data.name_ar', 'بوابة الإقرارات')
            ->assertJsonPath('data.code', 'PREVIEW-APP-001')
            ->assertJsonPath('data.business_owners.0.id', $owner->id)
            ->assertJsonPath('data.business_owners.0.full_name', 'Business Office')
            ->assertJsonPath('data.technical_owners.0.id', $tech->id)
            ->assertJsonPath('data.technical_owners.0.full_name', 'Platform Team')
            ->assertJsonPath('data.documentation_url', 'https://docs.example.sa/tax-filing')
            ->assertJsonPath('data.department.name_en', 'Information Technology')
            ->assertJsonPath('data.active_assignments_count', 1)
            ->assertJsonStructure([
                'data' => ['status', 'criticality', 'support_type', 'ha_model'],
            ]);
    }

    #[Test]
    public function authorized_user_can_preview_a_department(): void
    {
        Sanctum::actingAs($this->admin);

        $department = Department::factory()->create([
            'name_en' => 'Finance Operations',
            'name_ar' => 'العمليات المالية',
        ]);

        Application::factory()->count(2)->create(['department_id' => $department->id]);

        $this->getJson("/api/v1/departments/{$department->id}/preview")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $department->id)
            ->assertJsonPath('data.name_en', 'Finance Operations')
            ->assertJsonPath('data.initials', 'FO')
            ->assertJsonPath('data.applications_count', 2);
    }

    #[Test]
    public function preview_endpoints_are_forbidden_without_the_matching_view_permission(): void
    {
        $restricted = $this->userWithPermissions('preview-users-only', ['users.view']);

        Sanctum::actingAs($restricted);

        $target = User::factory()->create();
        $vendor = Vendor::factory()->create();
        $application = Application::factory()->create();
        $department = Department::factory()->create();

        $this->getJson("/api/v1/users/{$target->id}/preview")->assertOk();
        $this->getJson("/api/v1/vendors/{$vendor->id}/preview")->assertForbidden();
        $this->getJson("/api/v1/applications/{$application->id}/preview")->assertForbidden();
        $this->getJson("/api/v1/departments/{$department->id}/preview")->assertForbidden();
    }

    #[Test]
    public function preview_endpoints_require_authentication(): void
    {
        $target = User::factory()->create();

        $this->getJson("/api/v1/users/{$target->id}/preview")->assertUnauthorized();
    }

    #[Test]
    public function preview_endpoints_return_not_found_for_unknown_records(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/v1/users/999999/preview')->assertNotFound();
        $this->getJson('/api/v1/vendors/999999/preview')->assertNotFound();
        $this->getJson('/api/v1/applications/999999/preview')->assertNotFound();
        $this->getJson('/api/v1/departments/999999/preview')->assertNotFound();
    }

    #[Test]
    public function authorized_user_can_preview_a_user_by_display_name(): void
    {
        Sanctum::actingAs($this->admin);

        $target = User::factory()->create([
            'first_name' => 'Noura',
            'last_name' => 'AlHarbi',
            'email' => 'noura.preview@zatca.sa',
        ]);

        $this->getJson('/api/v1/users/preview-by-name?name='.urlencode('Noura AlHarbi'))
            ->assertOk()
            ->assertJsonPath('data.id', $target->id)
            ->assertJsonPath('data.email', 'noura.preview@zatca.sa');
    }

    #[Test]
    public function preview_by_name_returns_null_payload_when_unmatched(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/v1/users/preview-by-name?name='.urlencode('Nobody Here'))
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    /**
     * @param  list<string>  $permissions
     */
    private function userWithPermissions(string $roleName, array $permissions): User
    {
        $role = Role::findOrCreate($roleName, 'web');
        $role->syncPermissions($permissions);

        $user = User::factory()->create();
        $user->assignRole($role);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return $user;
    }
}
