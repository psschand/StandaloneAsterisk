# Multi-Tenant User Management Strategy

## Current Schema (Already Correct!)

Your database schema already supports multi-tenant users:

```
users table:
- id (unique across system)
- email (unique across system)
- username (unique across system)
- password_hash (single password for all tenants)
- first_name, last_name, phone

user_roles table (junction table):
- user_id → FK to users
- tenant_id → FK to tenants
- role (superadmin, tenant_admin, manager, agent)
- extension (per-tenant SIP extension)
- is_active (can disable user in specific tenant)
- UNIQUE(user_id, tenant_id) - one role per user per tenant
```

## Key Design Decisions

### ✅ One User Account, Multiple Tenant Memberships
- User has ONE email/password across the entire system
- User can be assigned to MULTIPLE tenants
- User can have DIFFERENT roles in different tenants

### Example:
```
john@example.com:
  - Tenant A: manager
  - Tenant B: agent
  - Tenant C: tenant_admin

mary@example.com:
  - Tenant A: tenant_admin
  - Tenant B: manager
```

---

## User Management Permissions

### 1. Superadmin Can:
✅ Create users in ANY tenant
✅ Assign users to MULTIPLE tenants
✅ Assign ANY role (superadmin, tenant_admin, manager, agent)
✅ View/edit users across ALL tenants
✅ Activate/deactivate users in any tenant

**Use Case**: System administrator managing the entire platform

---

### 2. Tenant Admin (tenant_admin) Can:
✅ Create users in THEIR tenant(s) only
✅ Assign roles: manager, agent (NOT superadmin, NOT tenant_admin)
✅ View/edit users in THEIR tenant(s)
✅ Activate/deactivate users in THEIR tenant(s)
❌ Cannot assign users to OTHER tenants
❌ Cannot create tenant_admin or superadmin roles

**Use Case**: Company owner managing their call center

---

### 3. Manager Can:
✅ Create users in THEIR tenant(s) only
✅ Assign role: agent ONLY
✅ View/edit agents in THEIR tenant(s)
✅ Assign agents to queues
❌ Cannot create manager or admin roles
❌ Cannot assign users to other tenants

**Use Case**: Operations manager adding new call center agents

---

### 4. Agent Can:
❌ Cannot create users
❌ Cannot modify other users
✅ Can update their own profile only

---

## Login Flow

### Step 1: User enters email + password
```
Email: john@example.com
Password: ••••••••
```

### Step 2: Check which tenants user belongs to
```sql
SELECT ur.tenant_id, ur.role, t.name 
FROM user_roles ur
JOIN tenants t ON t.id = ur.tenant_id
WHERE ur.user_id = ? AND ur.is_active = true
```

### Step 3a: If user has ONLY ONE tenant
- Auto-login to that tenant
- JWT contains: user_id, tenant_id, role

### Step 3b: If user has MULTIPLE tenants
**Option 1: Tenant Selector Screen**
```
Welcome john@example.com!

Select tenant to access:
○ Acme Corp (Manager)
○ Tech Support Inc (Agent)
○ Sales Team (Tenant Admin)

[Continue →]
```

**Option 2: Domain-based Selection (Current)**
- Email @acme.com → auto-select Acme tenant
- Email @techsupport.com → auto-select Tech Support tenant

### Step 4: Generate JWT with selected tenant
```json
{
  "user_id": 123,
  "email": "john@example.com",
  "tenant_id": "acme-corp",
  "role": "manager",
  "exp": 1234567890
}
```

---

## Implementation Strategy

### Backend API Endpoints

#### 1. List Users (Role-based filtering)
```
GET /api/v1/users?tenant_id=acme-corp

Permissions:
- Superadmin: Returns all users across all tenants
- Tenant Admin: Returns users in their tenants only
- Manager: Returns agents in their tenants only
- Agent: Forbidden
```

#### 2. Create User
```
POST /api/v1/users
{
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "tenants": [
    {
      "tenant_id": "acme-corp",
      "role": "agent",
      "extension": "1001"
    }
  ]
}

Permissions:
- Superadmin: Can assign to any tenant, any role
- Tenant Admin: Can assign to their tenants only, roles: manager/agent
- Manager: Can assign to their tenants only, role: agent only
```

#### 3. Update User Tenants
```
POST /api/v1/users/{user_id}/tenants
{
  "tenant_id": "new-corp",
  "role": "manager",
  "extension": "2001"
}

Permissions:
- Superadmin: Can add user to any tenant
- Tenant Admin: Can add user to their tenants only
- Manager: Cannot add users to other tenants
```

#### 4. Remove User from Tenant
```
DELETE /api/v1/users/{user_id}/tenants/{tenant_id}

Permissions:
- Superadmin: Can remove from any tenant
- Tenant Admin: Can remove from their tenants only
- Manager: Can remove agents only
```

#### 5. Switch Tenant (For users in multiple tenants)
```
POST /api/v1/auth/switch-tenant
{
  "tenant_id": "new-corp"
}

Returns: New JWT token with updated tenant_id and role
```

---

## Database Queries

### Check if user can manage another user
```sql
-- Superadmin: Always true
-- Tenant Admin: Check if both users share at least one tenant where admin has tenant_admin role
-- Manager: Check if target user is agent in same tenant

SELECT COUNT(*) > 0 as can_manage
FROM user_roles manager_role
JOIN user_roles target_role ON manager_role.tenant_id = target_role.tenant_id
WHERE manager_role.user_id = ? -- Current user
  AND target_role.user_id = ? -- Target user
  AND manager_role.role IN ('tenant_admin', 'manager')
  AND target_role.role IN ('agent', 'manager')
```

### Get all tenants for a user
```sql
SELECT 
  ur.tenant_id,
  ur.role,
  ur.extension,
  ur.is_active,
  t.name as tenant_name,
  t.domain
FROM user_roles ur
JOIN tenants t ON t.id = ur.tenant_id
WHERE ur.user_id = ?
  AND ur.is_active = true
ORDER BY t.name
```

### Get all users in a tenant (with role filtering)
```sql
-- For tenant_admin viewing their tenant
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  ur.role,
  ur.extension,
  ur.is_active
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.tenant_id = ?
  AND ur.is_active = true
ORDER BY u.first_name, u.last_name
```

---

## Frontend Implementation

### 1. UserForm Component Updates

**Add Tenant Selection** (for Superadmin only):
```tsx
// Show for superadmin creating/editing users
<div>
  <label>Tenants & Roles</label>
  {tenantAssignments.map((assignment, index) => (
    <div key={index} className="flex space-x-2">
      <select 
        value={assignment.tenant_id}
        onChange={(e) => updateTenant(index, 'tenant_id', e.target.value)}
      >
        {tenants.map(t => <option value={t.id}>{t.name}</option>)}
      </select>
      
      <select 
        value={assignment.role}
        onChange={(e) => updateTenant(index, 'role', e.target.value)}
      >
        <option value="agent">Agent</option>
        <option value="manager">Manager</option>
        <option value="tenant_admin">Tenant Admin</option>
      </select>
      
      <input 
        type="text"
        placeholder="Extension"
        value={assignment.extension}
        onChange={(e) => updateTenant(index, 'extension', e.target.value)}
      />
      
      <button onClick={() => removeTenant(index)}>Remove</button>
    </div>
  ))}
  
  <button onClick={addTenant}>+ Add Tenant</button>
</div>
```

**For Tenant Admin/Manager**:
- Pre-fill tenant_id with current user's tenant
- Hide tenant selector (cannot assign to other tenants)
- Limit role options based on permission

### 2. Login Flow with Tenant Selector

**TenantSelector Component**:
```tsx
interface TenantOption {
  tenant_id: string;
  tenant_name: string;
  role: string;
}

export default function TenantSelector({ 
  tenants, 
  onSelect 
}: { 
  tenants: TenantOption[]; 
  onSelect: (tenantId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2>Select Tenant</h2>
      {tenants.map(t => (
        <button
          key={t.tenant_id}
          onClick={() => onSelect(t.tenant_id)}
          className="block w-full p-4 border rounded hover:bg-gray-50"
        >
          <div className="font-semibold">{t.tenant_name}</div>
          <div className="text-sm text-gray-600">Role: {t.role}</div>
        </button>
      ))}
    </div>
  );
}
```

### 3. SystemUsers Page Updates

**Show user's tenant memberships**:
```tsx
<td>
  {user.tenants?.map(t => (
    <span key={t.tenant_id} className="badge">
      {t.tenant_name} ({t.role})
    </span>
  ))}
</td>
```

---

## Migration Path

### Step 1: Update Backend User Model
```go
// internal/core/user.go
type User struct {
    ID           int64     `json:"id"`
    Email        string    `json:"email"`
    FirstName    string    `json:"first_name"`
    LastName     string    `json:"last_name"`
    PasswordHash string    `json:"-"` // Hidden
    Tenants      []UserTenantRole `json:"tenants,omitempty"` // NEW
    CreatedAt    time.Time `json:"created_at"`
    UpdatedAt    time.Time `json:"updated_at"`
}

type UserTenantRole struct {
    TenantID   string `json:"tenant_id"`
    TenantName string `json:"tenant_name"`
    Role       string `json:"role"`
    Extension  string `json:"extension"`
    IsActive   bool   `json:"is_active"`
}
```

### Step 2: Update Auth Handler
```go
// internal/handler/auth_handler.go

func (h *AuthHandler) Login(c *gin.Context) {
    // ... validate credentials ...
    
    // Get user's tenant memberships
    tenants, err := h.userRepo.GetUserTenants(user.ID)
    
    if len(tenants) == 0 {
        c.JSON(400, gin.H{"error": "User not assigned to any tenant"})
        return
    }
    
    if len(tenants) == 1 {
        // Auto-select single tenant
        token := generateJWT(user.ID, tenants[0].TenantID, tenants[0].Role)
        c.JSON(200, gin.H{"token": token})
    } else {
        // Return tenant list for selection
        c.JSON(200, gin.H{
            "requires_tenant_selection": true,
            "tenants": tenants,
            "session_token": tempToken, // Short-lived token for tenant selection
        })
    }
}

func (h *AuthHandler) SelectTenant(c *gin.Context) {
    var req struct {
        TenantID string `json:"tenant_id"`
    }
    c.BindJSON(&req)
    
    // Verify user has access to this tenant
    userID := c.GetInt64("user_id") // From temp token
    role, err := h.userRepo.GetUserRoleInTenant(userID, req.TenantID)
    
    token := generateJWT(userID, req.TenantID, role)
    c.JSON(200, gin.H{"token": token})
}
```

### Step 3: Update User Create/Update Handlers
```go
func (h *UserHandler) CreateUser(c *gin.Context) {
    var req struct {
        Email     string `json:"email"`
        Password  string `json:"password"`
        FirstName string `json:"first_name"`
        LastName  string `json:"last_name"`
        Tenants   []struct {
            TenantID  string `json:"tenant_id"`
            Role      string `json:"role"`
            Extension string `json:"extension"`
        } `json:"tenants"`
    }
    c.BindJSON(&req)
    
    // Permission check
    currentRole := c.GetString("role")
    currentTenant := c.GetString("tenant_id")
    
    if currentRole == "manager" {
        // Managers can only create agents in their tenant
        if len(req.Tenants) > 1 || req.Tenants[0].TenantID != currentTenant {
            c.JSON(403, gin.H{"error": "Cannot assign to other tenants"})
            return
        }
        if req.Tenants[0].Role != "agent" {
            c.JSON(403, gin.H{"error": "Can only create agents"})
            return
        }
    }
    
    if currentRole == "tenant_admin" {
        // Tenant admins can create users in their tenants only
        for _, t := range req.Tenants {
            if !h.userRepo.UserBelongsToTenant(c.GetInt64("user_id"), t.TenantID) {
                c.JSON(403, gin.H{"error": "Cannot assign to other tenants"})
                return
            }
            if t.Role == "superadmin" || t.Role == "tenant_admin" {
                c.JSON(403, gin.H{"error": "Cannot create admin roles"})
                return
            }
        }
    }
    
    // Create user
    user, err := h.userRepo.Create(req)
    // ... assign to tenants ...
}
```

---

## Recommended UI Flow

### For Superadmin:
1. Go to "System Users"
2. Click "New User"
3. Fill basic info (email, name, password)
4. **Multi-tenant section**:
   - Add Tenant 1: Select tenant → Select role → Enter extension
   - Add Tenant 2: Select tenant → Select role → Enter extension
   - (Can add multiple)
5. Save

### For Tenant Admin:
1. Go to "Users" (tenant-specific)
2. Click "New User"
3. Fill basic info
4. **Single tenant assignment** (pre-filled with their tenant):
   - Role: [Manager] or [Agent]
   - Extension: [1001]
5. Save

### For Manager:
1. Go to "Agents"
2. Click "Add Agent"
3. Fill basic info
4. **Single tenant, single role** (pre-filled):
   - Tenant: (current tenant, hidden)
   - Role: Agent (locked)
   - Extension: [1001]
5. Save

---

## Summary

### ✅ Current Schema is Correct
Your `user_roles` table already supports multi-tenant users perfectly!

### ✅ Best Practices:
1. **One email/password** per user across all tenants
2. **user_roles junction table** stores tenant-specific roles
3. **Role-based creation permissions**:
   - Superadmin → any tenant, any role
   - Tenant Admin → their tenants, manager/agent roles
   - Manager → their tenants, agent role only
4. **Login flow**:
   - Single tenant → auto-login
   - Multiple tenants → show tenant selector
5. **JWT contains**: user_id + selected tenant_id + role for that tenant

### Next Steps:
1. Update UserForm to support multi-tenant assignment (for superadmin)
2. Add tenant selector screen for multi-tenant users
3. Update backend handlers to enforce role-based permissions
4. Add "Switch Tenant" feature in UI header

Would you like me to implement:
1. The multi-tenant UserForm component?
2. The tenant selector login flow?
3. The backend permission checks?
