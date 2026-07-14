Future RoadmapOnce Version 1.0 is stable and deployed, the following advanced enterprise features are scheduled:
Phase 2
1. Single Sign-On (SSO):Integrate with Azure AD (Microsoft Entra ID) or Okta via SAML/OAuth2 to replace local password management for internal employees.
2. Advanced Auditing Dashboard:Create a dedicated UI to view the spatie/activitylog histories, showing exactly what fields changed (old value vs. new value) and who changed them.
Phase 3
3. Automated Access Reviews (AAR):Implement scheduled jobs (php artisan schedule:run) to email Business Owners every 90 days with a summary of users assigned to their applications, requiring an approval/rejection response to maintain compliance.
4. Webhooks & API Integration:Expose secure webhooks to notify other internal enterprise systems when an employee is assigned or removed from a critical application.