# Extension Range Allocation Implementation

## Overview
Implemented **Strategy 1: Extension Range Allocation** for multi-tenant extension management. Each tenant receives a dedicated numeric range for extensions, ensuring isolation and preventing conflicts.

## Strategy Details

### Extension Range Allocation
- **Range Size**: 1000 extensions per tenant
- **Starting Range**: 1000
- **Format**: Pure numeric (e.g., 1001, 2001)
- **Examples**:
  - demo-tenant: 1000-1999
  - acme-corp: 2000-2999
  - next-tenant: 3000-3999

### Benefits
✅ Multi-tenancy support without database schema changes to Asterisk tables  
✅ Pure numeric extensions (SIP standard compliant)  
✅ Prevents duplicate assignments within tenant  
✅ Clear visual separation between tenants  
✅ Scalable (supports 1000+ tenants theoretically)

## Implementation Status

### ✅ Phase 1: Database Schema
- Added `extension_range_start` INT DEFAULT 1000 to tenants table
- Added `extension_range_end` INT DEFAULT 1999 to tenants table
- Added UNIQUE KEY `uk_tenant_extension` on (tenant_id, extension) to user_roles table
- Current state: demo-tenant has range 1000-1999

### ✅ Phase 2: Backend Models & DTOs
**Updated Files:**
- `backend/internal/core/tenant.go` - Added ExtensionRangeStart, ExtensionRangeEnd fields
- `backend/internal/dto/common.go` - Updated TenantResponse, CreateTenantRequest, UpdateTenantRequest

**Model Changes:**
```go
type Tenant struct {
    // ... existing fields ...
    ExtensionRangeStart int `gorm:"column:extension_range_start;default:1000"`
    ExtensionRangeEnd   int `gorm:"column:extension_range_end;default:1999"`
    // ... more fields ...
}
```

### ✅ Phase 3: Service Layer
**Updated Files:**
- `backend/internal/service/tenant_service.go` - All methods now include extension range fields in responses:
  - Create() - ✅ Returns range data
  - GetByID() - ✅ Returns range data
  - GetAll() - ✅ Returns range data
  - Update() - ✅ Returns range data
  - GetByDomain() - ✅ Returns range data

### ✅ Phase 4: Validation Logic
**Updated Files:**
- `backend/internal/service/user_service.go` - Added comprehensive extension validation

**Validation Rules:**
1. **Numeric Check**: Extension must be a valid integer
2. **Range Check**: Extension must be within tenant's allocated range (ExtensionRangeStart to ExtensionRangeEnd)
3. **Existence Check**: Extension must exist in ps_endpoints table before assignment
4. **Uniqueness**: Database constraint prevents duplicate assignments within same tenant

**Implementation:**
```go
func (s *userService) validateExtension(ctx context.Context, tenant *core.Tenant, extension string) error {
    // 1. Validate numeric
    extNum, err := strconv.Atoi(extension)
    if err != nil {
        return errors.NewValidation("extension must be a numeric value")
    }

    // 2. Validate range
    if extNum < tenant.ExtensionRangeStart || extNum > tenant.ExtensionRangeEnd {
        return errors.NewValidation(
            fmt.Sprintf("extension must be between %d and %d for your tenant",
                tenant.ExtensionRangeStart, tenant.ExtensionRangeEnd),
        )
    }

    // 3. Validate exists in ps_endpoints
    endpoint, err := s.endpointRepo.FindByID(ctx, extension)
    if err != nil || endpoint == nil {
        return errors.NewValidation(
            fmt.Sprintf("extension %s does not exist in the system. Please create the extension first.", extension),
        )
    }

    return nil
}
```

**Applied In:**
- User creation (Create method)
- User update (Update method)

### ✅ Phase 5: Service Initialization
**Updated Files:**
- `backend/cmd/api/main.go` - Updated NewUserService to include endpointRepo parameter

```go
userService := service.NewUserService(userRepo, roleRepo, tenantRepo, endpointRepo)
```

## Current Database State

### Tenants Table
```
id: demo-tenant
extension_range_start: 1000
extension_range_end: 1999
```

### Existing Extensions (Need Migration)
```
ps_endpoints:
- id: 1231 (callerid: sfvfsv)
- id: agent100 (should → 1000)
- id: agent101 (should → 1001)
- id: agent105 (should → 1002)
- id: twilio_trunk (trunk, no migration needed)
```

## Next Steps

### ⏳ Phase 6: Auto-Range Assignment (Pending)
Add logic to tenant creation service:
```go
func (s *tenantService) Create(...) {
    if req.ExtensionRangeStart == nil || req.ExtensionRangeEnd == nil {
        // Find max used range_end
        maxEnd := findMaxRangeEnd()
        
        // Assign next range
        tenant.ExtensionRangeStart = maxEnd + 1
        tenant.ExtensionRangeEnd = tenant.ExtensionRangeStart + 999
    }
}
```

### ⏳ Phase 7: Frontend Updates (Pending)
1. **Extension Creation Form**:
   - Change input type to number
   - Set min/max based on tenant range
   - Show placeholder: "1000-1999"
   - Add help text: "Your tenant can use extensions 1000 to 1999"

2. **User Assignment Form**:
   - Filter extension dropdown to show only tenant's range
   - Show "Available: X of Y extensions" counter

3. **Tenant Admin Panel**:
   - Display extension range information
   - Show allocated vs. used extensions

### ⏳ Phase 8: Data Migration (Critical)
Migrate existing alphanumeric extensions to numeric:

```sql
-- Step 1: Update ps_endpoints
UPDATE ps_endpoints SET id = '1000' WHERE id = 'agent100';
UPDATE ps_endpoints SET id = '1001' WHERE id = 'agent101';
UPDATE ps_endpoints SET id = '1002' WHERE id = 'agent105';

-- Step 2: Update ps_auths (auth configs)
UPDATE ps_auths SET id = '1000' WHERE id = 'agent100';
UPDATE ps_auths SET id = '1001' WHERE id = 'agent101';
UPDATE ps_auths SET id = '1002' WHERE id = 'agent105';

-- Step 3: Update ps_aors (AOR records)
UPDATE ps_aors SET id = '1000', aors = '1000' WHERE id = 'agent100';
UPDATE ps_aors SET id = '1001', aors = '1001' WHERE id = 'agent101';
UPDATE ps_aors SET id = '1002', aors = '1002' WHERE id = 'agent105';

-- Step 4: Update user_roles
UPDATE user_roles SET extension = '1000' WHERE extension = 'agent100';
UPDATE user_roles SET extension = '1001' WHERE extension = 'agent101';
UPDATE user_roles SET extension = '1002' WHERE extension = 'agent105';
```

**⚠️ Important**: Test with one extension first before bulk migration!

### ⏳ Phase 9: Testing Checklist
- [ ] Create new tenant → Verify auto-assigned range
- [ ] Create extension in range → Success
- [ ] Create extension out of range → Error with message
- [ ] Assign extension to user → Success
- [ ] Assign same extension twice in tenant → Error (unique constraint)
- [ ] Create extension with same number in different tenant → Success
- [ ] Update user with out-of-range extension → Error
- [ ] Verify Asterisk recognizes migrated numeric extensions

## Error Messages

### User Receives Clear Feedback:
```
❌ "extension must be a numeric value"
❌ "extension must be between 1000 and 1999 for your tenant"
❌ "extension 1234 does not exist in the system. Please create the extension first."
✅ "User created successfully with extension 1001"
```

## Architecture Decisions

### Why Range Allocation?
**Considered Alternatives:**
1. **String Prefix** (e.g., "demo-1001") - ❌ Not SIP compliant
2. **Shared Extension Pool** - ❌ No tenant isolation
3. **Range Allocation** - ✅ Chosen for compliance + isolation

### Why Database Constraints?
- Prevents race conditions
- Enforces uniqueness at DB level
- Fail-fast validation

### Why Separate Validation Method?
- Reusable across Create/Update
- Centralized validation logic
- Easier to test and maintain

## Files Modified

### Database
- `tenants` table - Added extension_range_start, extension_range_end
- `user_roles` table - Added uk_tenant_extension unique constraint

### Backend Code
- `backend/internal/core/tenant.go` (Lines 17-21)
- `backend/internal/dto/common.go` (Lines 119-169)
- `backend/internal/service/tenant_service.go` (Lines 75-247)
- `backend/internal/service/user_service.go` (Lines 3-7, 30-33, 38-47, 108-118, 260-282, 432-458)
- `backend/cmd/api/main.go` (Line 158)

## Deployment

### Build & Deploy
```bash
# Rebuild backend
docker compose build backend

# Restart backend
docker compose up -d backend

# Verify
docker compose logs backend | tail -50
```

### Verification Queries
```sql
-- Check tenant ranges
SELECT id, name, extension_range_start, extension_range_end FROM tenants;

-- Check user-extension assignments
SELECT u.email, r.extension, r.tenant_id 
FROM user_roles r 
JOIN users u ON r.user_id = u.id 
WHERE r.extension IS NOT NULL;

-- Check extensions in ps_endpoints
SELECT id, callerid, context FROM ps_endpoints 
WHERE context IN ('internal', 'from-internal');
```

## Conclusion

✅ **Implementation Status**: Backend validation complete  
⏳ **Remaining Work**: Auto-range assignment, frontend updates, data migration  
🎯 **Next Priority**: Implement auto-range assignment on tenant creation

The foundation for multi-tenant extension management is now in place. All tenant operations include extension range data, and user operations validate extensions against tenant ranges before assignment.
