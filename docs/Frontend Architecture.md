Frontend Architecture (React 19)We implement a strictly Feature-Based Architecture.1. Directory Structuresrc/
├── app/                  # Global providers (QueryClient, Router config, Store)
├── components/           # Global shared UI (shadcn base components, layouts)
├── features/
│   ├── applications/
│   │   ├── components/   # Feature-specific UI (e.g., ApplicationForm)
│   │   ├── hooks/        # React Query hooks (e.g., useApplications)
│   │   ├── services/     # Axios API calls (e.g., createApplication)
│   │   ├── types/        # TypeScript interfaces mapping to Backend Resources
│   │   └── pages/        # Route-level components (e.g., ApplicationsPage)
│   ├── vendors/
│   ├── users/
│   └── assignments/
├── lib/                  # Utilities (axios instance, tailwind cn merger)
└── locales/              # i18next translation files (ar.json, en.json)
2. State Management & FetchingServer State: Managed exclusively by TanStack Query (useQuery, useMutation).Global UI State: Managed by React Context or Zustand (e.g., Auth state, current language).Form State: Managed by React Hook Form paired with Zod resolvers.3. Data FlowUser interacts with UI (shadcn component).React Hook Form validates against Zod schema.Form submission triggers a TanStack useMutation.Mutation calls Axios service.On success, Sonner toast appears, and Query cache is invalidated to refresh the DataTable.