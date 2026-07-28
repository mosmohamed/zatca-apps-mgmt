<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class SettingsBrandingFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'settings-admin@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');
    }

    #[Test]
    public function public_settings_include_localized_interface_text(): void
    {
        $this->getJson('/api/v1/settings/public')
            ->assertOk()
            ->assertJsonPath('data.sidebar_tagline_en', '')
            ->assertJsonPath('data.sidebar_tagline_ar', '')
            ->assertJsonPath('data.header_subtitle_en', 'ZATCA Applications Operations');
    }

    #[Test]
    public function administrator_can_update_localized_interface_text(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'sidebar_tagline_en' => 'Application Access',
                'sidebar_tagline_ar' => 'صلاحيات التطبيقات',
                'header_subtitle_en' => 'Application Operations Center',
                'header_subtitle_ar' => 'مركز عمليات التطبيقات',
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.sidebar_tagline_en', 'Application Access')
            ->assertJsonPath('data.header_subtitle_ar', 'مركز عمليات التطبيقات');

        $this->assertDatabaseHas('settings', [
            'key' => 'sidebar_tagline_en',
            'value' => 'Application Access',
        ]);
    }

    #[Test]
    public function branding_settings_reject_missing_required_fields(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'company_name' => '',
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['settings.company_name']);
    }

    #[Test]
    public function branding_settings_allow_empty_sidebar_taglines(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'sidebar_tagline_en' => '',
                'sidebar_tagline_ar' => '',
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.sidebar_tagline_en', '')
            ->assertJsonPath('data.sidebar_tagline_ar', '');
    }
}
