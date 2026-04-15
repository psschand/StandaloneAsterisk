# Extension Assignment Feature for Agent Creation

## Overview
Added auto-assign and manual allocation options for extensions when creating agents in the call center system. This feature allows administrators to either automatically assign the next available extension or manually select a specific extension if available.

## Features

### 1. **Auto-Assign Mode**
- Automatically finds and assigns the next available extension from the tenant's allocated range
- Displays the assigned extension with a green highlighted box
- Allows users to request a different extension with a single click
- Handles cases where no extensions are available gracefully

### 2. **Manual Selection Mode**
- Allows administrators to select from a dropdown of available extensions
- Filters extensions by tenant's allocated range
- Shows helpful messages when no extensions are available

### 3. **Smart Extension Querying**
- Finds unassigned extensions within tenant's allocated range
- Excludes extensions already assigned to users
- Returns extensions in sorted order (numeric)
- Provides clear error messages when allocation fails

## Backend Implementation

### Database Query Changes

**File:** `backend/internal/repository/ps_endpoint_repository.go`

Added two new methods to the `PsEndpointRepository` interface:

```go
FindUnassigned(ctx context.Context, tenantID string, extStart, extEnd int) ([]asterisk.PsEndpoint, error)
FindByIDRange(ctx context.Context, extStart, extEnd int) ([]asterisk.PsEndpoint, error)
```

**Implementation Details:**
- `FindUnassigned`: Queries extensions within tenant's range that are NOT assigned to any user in that tenant
- `FindByIDRange`: Queries extensions within a numeric range, sorted in ascending order

### Service Layer

**File:** `backend/internal/service/user_service.go`

Added method to `UserService` interface:
```go
GetNextAvailableExtension(ctx context.Context, tenantID string) (string, error)
```

**Implementation:**
- Retrieves tenant information to determine extension range
- Calls repository to find unassigned extensions
- Returns the first available extension ID
- Provides clear error message if no extensions are available

### API Endpoint

**File:** `backend/cmd/api/main.go`

Added new route:
```
GET /api/v1/users/available-extension
```

**Handler:** `GetNextAvailableExtension`

**Response:**
```json
{
  "success": true,
  "data": {
    "extension": "100"
  }
}
```

**Handler Implementation:** `backend/internal/handler/user_handler.go`
- Extracts tenant_id from request context
- Calls user service to get next available extension
- Returns extension or error response

## Frontend Implementation

### UI Components

**File:** `frontend/src/components/forms/UserForm.tsx`

#### New State Variables
- `extensionMode`: Tracks whether user selected 'auto' or 'manual' mode
- `autoExtension`: Stores the auto-assigned extension value
- `isLoadingExtension`: Loading state while fetching available extension

#### New Function
```typescript
const getNextAvailableExtension = async () => {
  // Calls GET /api/v1/users/available-extension
  // Updates formData.extension with response
  // Sets extensionMode to 'auto'
}
```

#### Updated UI Section
Replaced simple extension dropdown with dual-mode interface:

**Auto-Assign Mode:**
- Blue "Auto-Assign" toggle button (highlighted when active)
- Green highlighted box showing assigned extension
- "Get different extension" link to fetch another available extension
- "Get Next Available" button to trigger initial assignment

**Manual Select Mode:**
- Blue "Manual Select" toggle button (highlighted when active)
- Standard dropdown showing filtered extensions
- Helpful messages for edge cases (no tenant selected, no extensions available)

#### Icon Dependencies
- `Zap` icon for Auto-Assign button (from lucide-react)
- `Loader2` icon for loading state

## User Experience Flow

### Creating an Agent with Auto-Assign

1. Admin navigates to "Add Agent" form
2. Fills in basic information (email, name, phone)
3. Selects tenant
4. Click "Auto-Assign" button
5. System fetches next available extension automatically
6. Extension displays in green box showing assignment successful
7. Admin can click "Get different extension" to reassign if needed
8. Form is submitted with auto-assigned extension

### Creating an Agent with Manual Selection

1. Admin navigates to "Add Agent" form
2. Fills in basic information (email, name, phone)
3. Selects tenant
4. Click "Manual Select" button
5. Dropdown populates with available extensions
6. Admin selects specific extension from dropdown
7. Form is submitted with selected extension

## Error Handling

### No Available Extensions
- API returns: `"no available extensions in range {start}-{end} for tenant {id}"`
- UI displays: Orange error message in extension section
- User can proceed without assignment or cancel form

### Tenant Not Selected
- Auto-Assign button is disabled
- Manual Select dropdown is disabled
- Clear message: "Select a tenant first"

### API Failures
- Loading state is removed
- Error message displays below mode toggle buttons
- User can retry or switch modes

## Database Considerations

### Query Performance
- The `FindUnassigned` query uses:
  - CAST to convert text ID to SIGNED for range comparison
  - Subquery with NOT IN to exclude assigned extensions
  - ORDER BY CAST for sorted results
- Compatible with MySQL 5.7+

### Extension Assignment Logic
- Extensions are looked up from `ps_endpoints` table
- User assignments are stored in `user_roles.extension` field
- Query checks `user_roles` for the specific tenant

## Validation

### Backend Validation
- Extension exists in `ps_endpoints` table
- Extension is within tenant's allocated range
- Extension is numeric value

### Frontend Validation  
- Tenant must be selected before auto-assign
- Extension is optional (can be null)
- Valid UUID or numeric extension value

## Testing Checklist

- [ ] Auto-assign button fetches next available extension
- [ ] Manual select dropdown shows correct extensions for tenant range
- [ ] Multiple extensions can be auto-assigned without conflicts
- [ ] No extensions available error is handled gracefully
- [ ] Switching between auto and manual modes works correctly
- [ ] Extension persists when form is submitted
- [ ] New agents have correct extension in user_roles table
- [ ] Assigned extensions don't appear in next auto-assign

## Future Enhancements

1. **Bulk Assignment**: Assign extensions to multiple agents at once
2. **Extension Pools**: Create separate pools for different departments
3. **Custom Assignment Rules**: Define assignment preferences (sequential, random, etc.)
4. **Extension Templates**: Pre-configured extension profiles with settings
5. **Assignment History**: Track who assigned extensions and when

## Related Files

- [Extension Management](EXTENSION_MANAGEMENT_COMPLETE.md)
- [User Management](MULTI_TENANT_USER_MANAGEMENT.md)
- [Agents Page](frontend/src/pages/Agents.tsx)
- [User Form Component](frontend/src/components/forms/UserForm.tsx)
- [User Service](backend/internal/service/user_service.go)
- [User Handler](backend/internal/handler/user_handler.go)
