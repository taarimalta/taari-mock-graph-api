# User and Domain Security

## Overview

The `taari-mock-graph-api` implements a comprehensive domain-based access control system that restricts data visibility and mutation capabilities based on user domain permissions. This document describes the security model, implementation details, and usage patterns.

## Security Model

### Core Principles

1. **Zero Privilege Escalation**: Users cannot access data or perform operations outside their assigned domains
2. **Fail-Safe Defaults**: Unauthorized access attempts result in empty results (queries) or errors (mutations)
3. **Hierarchical Inheritance**: Domain access follows a downward-only inheritance pattern
4. **Explicit Authorization**: All operations require valid user identification and domain permissions

### Domain Access Rules

#### Records with `domainId: null`
- **Not accessible** to any user
- Treated as orphaned data and excluded from all queries
- Cannot be created through the API

#### Users with no domain assignments
- Cannot see any data (all queries return empty results)
- Cannot perform any mutations
- Must be explicitly assigned to domains via `UserDomainAccess`

#### Hierarchical Access Pattern
Users assigned to a domain can access:
- **Assigned domain's data**: Direct access to records in their domain
- **Child domain data**: Recursive access to all descendant domains
- **No parent access**: Cannot see data from parent or sibling domains

**Example Hierarchy:**
```
Domain 1 (Corporate)
├── Domain 2 (North America)
│   ├── Domain 4 (USA)
│   └── Domain 5 (Canada)
└── Domain 3 (Europe)
    └── Domain 6 (UK)
```

- User assigned to Domain 1: Can see data from domains 1, 2, 3, 4, 5, 6
- User assigned to Domain 2: Can see data from domains 2, 4, 5 only
- User assigned to Domain 4: Can see data from domain 4 only

## Authentication & Headers

### Required Headers

#### User Authentication
```http
x-user-id: "123"
```
- **Required** for all GraphQL operations except introspection
- Must be a valid positive integer
- User must exist in the database

#### Domain Selection (Optional)

##### View Domain Selection
```http
x-view-domains: "1,2,3"
```
- Specifies which domains to include in query results
- Comma-separated list of domain IDs
- **Security**: Server validates ALL requested domains against user's accessible domains
- **Behavior**: Unauthorized domains are silently filtered out
- **Default**: If not provided, returns data from all accessible domains

##### Create Domain Assignment
```http
x-create-domain: "2"
```
- Specifies which domain new records should be assigned to
- Single domain ID only
- **Security**: Server validates domain against user's accessible domains
- **Behavior**: Unauthorized domain causes mutation to fail with error
- **Default**: If not provided, uses input.domainId or fails if not specified

## API Security Implementation

### Query Operations

All query operations are automatically filtered by domain access:

```graphql
# Only returns countries from user's accessible domains
query {
  countriesPaginated(args: { first: 10 }) {
    data { id name domainId }
    pagination { hasNext endCursor }
  }
}
```

**Domain Filtering Logic:**
1. Extract user ID from `x-user-id` header
2. Get user's accessible domains (including hierarchy)
3. Parse `x-view-domains` header if provided
4. Filter requested domains to only include accessible ones
5. Apply `WHERE domainId IN (effectiveDomains)` to query
6. Return filtered results

### Mutation Operations

All mutation operations validate domain permissions:

```graphql
# Create operation with domain validation
mutation {
  createCountry(input: { 
    name: "New Country"
    domainId: 2 
  }) {
    id name domainId
  }
}
```

**Domain Assignment Logic:**
1. Extract user ID from `x-user-id` header
2. Determine target domain: `x-create-domain` header OR `input.domainId`
3. Validate user has access to target domain
4. If unauthorized: throw error and abort operation
5. If authorized: proceed with domain assignment

## Security Enforcement Points

### Context Layer (`src/context.ts`)
- Parses and validates headers
- Extracts user ID, view domains, and create domain
- Provides normalized context to resolvers

### Domain Access Utilities (`src/utils/domainAccess.ts`)
- `getUserAccessibleDomains()`: Gets all domains user can access (with hierarchy)
- `getEffectiveViewDomains()`: Filters requested view domains to accessible ones
- `validateCreateDomain()`: Validates create domain or throws error
- `isUserDomainAccessible()`: Checks if user can access specific domain

### Resolver Layer
- Query resolvers apply domain filtering automatically
- Mutation resolvers validate domain permissions before operations
- All resolvers require valid user authentication

## Security Guarantees

### Data Isolation
✅ **Users can only see data from their accessible domains**
✅ **Cross-domain data leakage is prevented**
✅ **Orphaned records (domainId: null) are hidden**

### Authorization
✅ **All operations require valid user authentication**
✅ **Domain permissions are validated for all mutations**
✅ **Unauthorized domain access attempts are blocked**

### Audit & Monitoring
✅ **Domain access attempts are logged**
✅ **Security violations are captured in error logs**
✅ **User activities are traceable via headers**

## Common Security Scenarios

### Unauthorized Domain Access Attempt
```http
# User 123 has access to domains [1, 2]
x-user-id: "123"
x-view-domains: "1,3,4"  # Domains 3,4 unauthorized
```
**Result**: Query returns data from domain 1 only (3,4 filtered out)

### Invalid Create Domain
```http
# User 123 has access to domains [1, 2]  
x-user-id: "123"
x-create-domain: "3"  # Domain 3 unauthorized
```
**Result**: Mutation fails with "Access denied to domain 3" error

### No Domain Assignment
```http
# User 456 has no domain assignments
x-user-id: "456"
```
**Result**: All queries return empty results, mutations fail

## Security Testing

The codebase includes comprehensive security tests:

- **Domain isolation tests**: Verify users only see their accessible data
- **Header validation tests**: Confirm unauthorized domains are filtered/blocked
- **Hierarchy tests**: Validate parent/child domain access patterns
- **Mutation security tests**: Ensure domain assignment validation works
- **Edge case tests**: Handle null domains, invalid users, malformed headers

## Best Practices

### For API Consumers

1. **Always include x-user-id**: Required for all operations
2. **Use specific view domains**: Include `x-view-domains` to limit scope when needed
3. **Specify create domains**: Use `x-create-domain` for explicit domain assignment
4. **Handle authorization errors**: Implement proper error handling for domain access failures
5. **Validate user permissions**: Check domain assignments before attempting operations

### For Developers

1. **Use context utilities**: Always use `getEffectiveViewDomains()` and `validateCreateDomain()`
2. **Apply domain filtering**: All query resolvers must filter by accessible domains
3. **Validate mutations**: All mutation resolvers must validate domain permissions
4. **Test security**: Include domain access tests for all new features
5. **Log security events**: Capture unauthorized access attempts for monitoring

## Limitations & Future Enhancements

### Current Limitations
- No role-based permissions within domains
- No temporal access controls
- No cross-domain query federation
- No granular field-level permissions

### Planned Enhancements
- **Role-based domain access**: Different permission levels per domain
- **Temporal permissions**: Time-based domain access
- **Cross-domain queries**: Federated queries across accessible domains
- **Field-level security**: Granular permissions for sensitive fields
- **Performance optimization**: Domain query caching and batch operations

## Security Contacts

For security-related questions or concerns:
- Review the implementation in `src/utils/domainAccess.ts`
- Check test cases in `tests/domain/` directory
- Refer to the domain access plan in `plan.md`
- Examine integration tests for real-world scenarios

This security model provides robust protection while maintaining API flexibility and performance.
