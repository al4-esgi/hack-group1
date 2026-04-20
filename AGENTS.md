# AGENTS.md

This file contains guidelines for agentic coding agents working in this NestJS codebase.

## Build, Lint, and Test Commands

```bash
# Build the project
pnpm run build

# Run linter with auto-fix
pnpm run lint

# Format code with Prettier
pnpm run format

# Development mode (with watch)
pnpm run start:dev

# Debug mode (with watch)
pnpm run start:debug

# Production mode
pnpm run start:prod
```

**Note:** No test scripts are currently configured in package.json.

## Code Style Guidelines

### Imports

- Use absolute imports starting with `src/` for cross-file references (e.g., `src/users/users.repository`)
- Module-relative imports for within-module files (e.g., `'./users.service'`)
- NestJS decorators from `@nestjs/common`
- Use `forwardRef()` for circular dependency resolution
- Group imports: external libs first, then internal modules, then relative imports

### Formatting Rules

- Single quotes (`'`)
- Trailing commas: `all`
- Max line length: 120 characters (imports excluded)
- 2-space indentation (no tabs)
- Semicolons required
- No parentheses around arrow function parameters when possible
- LF line endings

### TypeScript Configuration

- Strict mode enabled
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Target: ES2023
- Module system: CommonJS
- Output directory: `dist/`
- No implicit any, strict null checks enabled

### Naming Conventions

- **Classes:** PascalCase (e.g., `UsersService`, `UsersController`)
- **Services:** `XxxService` suffix
- **Controllers:** `XxxController` suffix
- **Modules:** `XxxModule` suffix
- **Repositories:** `XxxRepository` suffix
- **Mappers:** `XxxMapper` suffix
- **Schemas:** `xxx.schema.ts` (export class `Xxx` and `XxxSchema`)
- **DTOs:** Grouped by request/response folders, PascalCase class names
- **Enums:** PascalCase with `Enum` suffix (e.g., `UserRoleEnum`)
- **Interfaces:** PascalCase (often no suffix when using TypeScript interfaces)
- **Decorators:** PascalCase functions, use function exports for reusable decorators

### File Structure

```
src/
  auth/
    auth.controller.ts
    auth.service.ts
    auth.module.ts
    _utils/
      decorator/
      dto/
        request/
        response/
      interfaces/
      user-role.enum.ts
  users/
    users.controller.ts
    users.service.ts
    users.module.ts
    users.repository.ts
    users.mapper.ts
    users.schema.ts
    _utils/
  _utils/  # Shared utilities across modules
    config/
    decorators/
    functions/
  main.ts
  app.module.ts
```

### Architecture Patterns

**Repository Pattern:**

- Create `XxxRepository` for all database operations
- Use `findOneById`, `findOneByIdOrThrow` pattern
- `_orThrow` methods use `NotFoundException`
- Use `ExistsCheck` type methods for boolean checks

**Service Layer:**

- Business logic belongs in `XxxService`
- Methods should use arrow functions when simple (e.g., `getUser = (id) => ...`)
- Keep controllers thin - delegate to services

**Controller Pattern:**

- Routes use decorators: `@Get`, `@Post`, `@Delete`, etc.
- Use `@Protect()` decorator for authentication/authorization
- Accept optional roles: `@Protect(UserRoleEnum.ADMIN)`
- Use custom pipes for document retrieval by ID
- Use Swagger decorators: `@ApiTags`, `@ApiOperation`, `@ApiParam`, `@ApiResponse`

**DTO Pattern:**

- Request DTOs in `_utils/dto/request/`
- Response DTOs in `_utils/dto/response/`
- Use class-validator decorators for validation
- Use `@ApiProperty` from `@nestjs/swagger` for documentation

**Mapper Pattern:**

- Create `XxxMapper` with `toXxxDto` methods
- Convert documents to response DTOs, exclude sensitive fields

### Error Handling

- Use NestJS built-in exceptions: `NotFoundException`, `BadRequestException`, `UnauthorizedException`
- Create reusable error instances in repositories (e.g., `private readonly orFailNotFound`)
- Use consistent error messages (e.g., `'User not found'`, `'WRONG_CREDENTIALS'`)
- Return 204 status for DELETE operations with `@HttpCode(204)`

### MongoDB/Mongoose Patterns

- Schema uses `@Prop` decorator with options
- Use `HydratedDocument<Xxx>` type for documents
- Schema options: `{ versionKey: false, timestamps: true }`
- Soft delete pattern: use `deletedAt` property with type `Date | null`
- When excluding deleted records in queries: `{ deletedAt: null }`

### Authentication & Authorization

- Use `@Protect()` decorator on routes requiring authentication
- Pass roles to `@Protect()` for authorization (e.g., `@Protect(UserRoleEnum.ADMIN)`)
- Use `@ConnectedUser()` decorator to inject current user from JWT
- JWT payload includes: `email`, `id`, `role`
- Passwords encrypted with `EncryptionService` using pluggable encrypters

### Validation

- Use class-validator decorators in DTOs
- Custom validators in `_utils/decorators/`
- Use `@IsUnique()` for uniqueness checks on models
- Use `@IsExisting()` for foreign key existence checks
- Validation options support: `excludeDeleted`, custom `queries`, custom `property`
- Global validation pipe configured in main.ts with options from `_utils/config/validation-pipe-options.config`

### Configuration

- Environment variables validated using class-validator
- Configuration schema in `_utils/config/env.config.ts`
- Use `@IsOptional()` for optional env vars with defaults
- Access via `ConfigService<EnvironmentVariables, true>`
- Required env vars: `PORT`, `FRONT_URL`, `JWT_SECRET`, `MONGODB_URL`

### API Documentation

- Swagger OpenAPI documentation available at `/api/doc`
- API global prefix: `/api/v1`
- Use Bearer auth for protected routes
- Add `@ApiTags()` to controllers
- Add `@ApiOperation()` to each route
- Add `@ApiResponse()` for documented responses

### General Guidelines

- Use dependency injection for all services/providers
- Use `kebab-case` for API route parameters
- Use `camelCase` for property names in DTOs and schemas
- Prefer async/await over `.then()` except for simple one-liners
- Use `Types.ObjectId` for MongoDB IDs
- Convert `ObjectId` to string in response DTOs
- Use consistent date handling (dayjs preferred for date utilities)
- Keep modules loosely coupled - export only what's needed
