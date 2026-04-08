## Web Application directory structure usage

-src/
-  components/      — UI components: each component renders one thing
-  services/        — Business logic: each service owns one domain
-  api/             — HTTP handlers: each handler manages one route group
-  db/              — Data access: each module owns one entity
-  utils/           — Pure utility functions: no side effects, no state
-  config/          — All configuration: no configuration scattered elsewhere

## Naming Conventions

- Components: PascalCase, descriptive noun (UserProfileCard, TaskListItem)
- Services: camelCase, domain noun (authService, notificationService)
- Utilities: camelCase, descriptive of the concern (dateFormatters, currencyUtils)
- API handlers: camelCase, resource-oriented (userHandlers, taskHandlers)
- Test files: same name as the file being tested, with `.test.js` suffix

## Definition of Done

A feature is complete when:

1. The specified behavior works correctly across all described scenarios
2. Edge cases identified in the specification are handled
3. All new functions have JSDoc comments
4. A corresponding unit test exists and passes
5. No linting errors are introduced
6. The feature works correctly at desktop and mobile viewport widths