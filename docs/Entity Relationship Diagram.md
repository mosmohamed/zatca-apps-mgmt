Entity Relationship DiagramerDiagram
    DEPARTMENT ||--o{ APPLICATION : "has"
    APPLICATION_TYPE ||--o{ APPLICATION : "categorizes"
    VENDOR ||--o{ USER : "employs"
    
    USER ||--o{ APPLICATION_ASSIGNMENT : "assigned via"
    APPLICATION ||--o{ APPLICATION_ASSIGNMENT : "assigned via"
    APP_ROLE ||--o{ APPLICATION_ASSIGNMENT : "defines permissions for"

    USER {
        bigint id PK
        bigint vendor_id FK
        string first_name
        string email
        boolean is_active
    }

    VENDOR {
        bigint id PK
        string name
        boolean status
    }

    APPLICATION {
        bigint id PK
        bigint department_id FK
        bigint application_type_id FK
        string code
        string status
        string criticality
    }

    APPLICATION_ASSIGNMENT {
        bigint id PK
        bigint application_id FK
        bigint user_id FK
        bigint app_role_id FK
        timestamp assigned_at
        timestamp ended_at
    }
