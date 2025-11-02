# Implementation Guide: Multi-Tenant User Management

## Summary

Your schema is **already correct**! The `user_roles` table supports multi-tenant users. This guide shows how to implement the UI and backend logic.

## Database Status: ✅ Ready

```
users: Global user accounts (one email, one password)
  └─ user_roles: Tenant-specific role assignments (many-to-many)
       ├─ user_id → FK to users
       ├─ tenant_id → FK to tenants
       ├─ role (superadmin, tenant_admin, manager, agent)
       └─ endpoint_id (SIP extension per tenant)
```

---

## Implementation Checklist

### Phase 1: Backend Updates ✅ (Schema Ready)
- [x] user_roles table exists
- [ ] Add helper methods to UserRepository
- [ ] Update auth handler for multi-tenant login
- [ ] Add permission middleware
- [ ] Update user CRUD endpoints

### Phase 2: Frontend Updates
- [ ] Update UserForm for multi-tenant assignment (superadmin)
- [ ] Add TenantSelector component for login
- [ ] Update SystemUsers to show user's tenants
- [ ] Add "Switch Tenant" feature in header
- [ ] Update types to include user.tenants array

### Phase 3: Testing
- [ ] Test user with multiple tenants
- [ ] Test role-based creation permissions
- [ ] Test tenant switching
- [ ] Test permission enforcement

---

## Code Implementation

### 1. Backend: User Repository Methods

Add these methods to `internal/repository/user_repository.go`:

\`\`\`go
// GetUserTenants returns all tenants a user belongs to
func (r *UserRepository) GetUserTenants(userID int64) ([]UserTenantInfo, error) {
    var tenantInfos []UserTenantInfo
    
    err := r.db.Table("user_roles ur").
        Select("ur.tenant_id, ur.role, ur.endpoint_id, t.name as tenant_name, t.domain").
        Joins("JOIN tenants t ON t.id = ur.tenant_id").
        Where("ur.user_id = ?", userID).
        Scan(&tenantInfos).Error
    
    return tenantInfos, err
}

// GetUserRoleInTenant returns user's role in a specific tenant
func (r *UserRepository) GetUserRoleInTenant(userID int64, tenantID string) (string, error) {
    var role string
    err := r.db.Table("user_roles").
        Select("role").
        Where("user_id = ? AND tenant_id = ?", userID, tenantID).
        Scan(&role).Error
    
    return role, err
}

// UserBelongsToTenant checks if user has access to tenant
func (r *UserRepository) UserBelongsToTenant(userID int64, tenantID string) bool {
    var count int64
    r.db.Table("user_roles").
        Where("user_id = ? AND tenant_id = ?", userID, tenantID).
        Count(&count)
    
    return count > 0
}

// AssignUserToTenant creates a role assignment
func (r *UserRepository) AssignUserToTenant(userID int64, tenantID, role, extension string) error {
    userRole := &core.UserRole{
        UserID:     userID,
        TenantID:   tenantID,
        Role:       common.UserRole(role),
        EndpointID: &extension,
    }
    
    return r.db.Create(userRole).Error
}

// RemoveUserFromTenant removes role assignment
func (r *UserRepository) RemoveUserFromTenant(userID int64, tenantID string) error {
    return r.db.Where("user_id = ? AND tenant_id = ?", userID, tenantID).
        Delete(&core.UserRole{}).Error
}

// GetUsersInTenant returns all users in a tenant (with role filtering)
func (r *UserRepository) GetUsersInTenant(tenantID string, roleFilter string) ([]UserWithRole, error) {
    var users []UserWithRole
    
    query := r.db.Table("users u").
        Select("u.*, ur.role, ur.endpoint_id as extension, ur.tenant_id").
        Joins("JOIN user_roles ur ON ur.user_id = u.id").
        Where("ur.tenant_id = ?", tenantID)
    
    if roleFilter != "" {
        query = query.Where("ur.role = ?", roleFilter)
    }
    
    err := query.Scan(&users).Error
    return users, err
}

// DTO structs
type UserTenantInfo struct {
    TenantID   string \`json:"tenant_id"\`
    TenantName string \`json:"tenant_name"\`
    Domain     string \`json:"domain"\`
    Role       string \`json:"role"\`
    Extension  string \`json:"extension"\`
}

type UserWithRole struct {
    core.User
    Role      string \`json:"role"\`
    Extension string \`json:"extension"\`
    TenantID  string \`json:"tenant_id"\`
}
\`\`\`

---

### 2. Backend: Auth Handler Updates

Update `internal/handler/auth_handler.go`:

\`\`\`go
// LoginRequest structure
type LoginRequest struct {
    Email    string \`json:"email" binding:"required,email"\`
    Password string \`json:"password" binding:"required"\`
    TenantID string \`json:"tenant_id"\` // Optional: for multi-tenant selection
}

// LoginResponse structure
type LoginResponse struct {
    RequiresTenantSelection bool               \`json:"requires_tenant_selection,omitempty"\`
    Tenants                 []UserTenantInfo   \`json:"tenants,omitempty"\`
    SessionToken            string             \`json:"session_token,omitempty"\`
    AccessToken             string             \`json:"access_token,omitempty"\`
    RefreshToken            string             \`json:"refresh_token,omitempty"\`
    User                    UserInfo           \`json:"user,omitempty"\`
}

// Login handler
func (h *AuthHandler) Login(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // 1. Validate credentials
    user, err := h.userRepo.GetByEmail(req.Email)
    if err != nil {
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }
    
    if !bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) {
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }
    
    // 2. Get user's tenant memberships
    tenants, err := h.userRepo.GetUserTenants(user.ID)
    if err != nil || len(tenants) == 0 {
        c.JSON(400, gin.H{"error": "User not assigned to any tenant"})
        return
    }
    
    // 3. Single tenant: auto-login
    if len(tenants) == 1 {
        token, refreshToken := h.generateTokens(user.ID, tenants[0].TenantID, tenants[0].Role)
        
        c.JSON(200, LoginResponse{
            AccessToken:  token,
            RefreshToken: refreshToken,
            User: UserInfo{
                ID:        user.ID,
                Email:     user.Email,
                FirstName: *user.FirstName,
                LastName:  *user.LastName,
                TenantID:  tenants[0].TenantID,
                Role:      tenants[0].Role,
            },
        })
        return
    }
    
    // 4. Multiple tenants: require selection
    if req.TenantID == "" {
        // Return tenant list
        sessionToken := h.generateSessionToken(user.ID) // Short-lived temp token
        
        c.JSON(200, LoginResponse{
            RequiresTenantSelection: true,
            Tenants:                 tenants,
            SessionToken:            sessionToken,
        })
        return
    }
    
    // 5. Tenant selected: validate and generate tokens
    var selectedTenant *UserTenantInfo
    for _, t := range tenants {
        if t.TenantID == req.TenantID {
            selectedTenant = &t
            break
        }
    }
    
    if selectedTenant == nil {
        c.JSON(400, gin.H{"error": "Invalid tenant selection"})
        return
    }
    
    token, refreshToken := h.generateTokens(user.ID, selectedTenant.TenantID, selectedTenant.Role)
    
    c.JSON(200, LoginResponse{
        AccessToken:  token,
        RefreshToken: refreshToken,
        User: UserInfo{
            ID:        user.ID,
            Email:     user.Email,
            FirstName: *user.FirstName,
            LastName:  *user.LastName,
            TenantID:  selectedTenant.TenantID,
            Role:      selectedTenant.Role,
        },
    })
}

// SwitchTenant allows users with multiple tenant access to switch
func (h *AuthHandler) SwitchTenant(c *gin.Context) {
    userID := c.GetInt64("user_id")
    
    var req struct {
        TenantID string \`json:"tenant_id" binding:"required"\`
    }
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // Verify user has access to this tenant
    role, err := h.userRepo.GetUserRoleInTenant(userID, req.TenantID)
    if err != nil {
        c.JSON(403, gin.H{"error": "Access denied to this tenant"})
        return
    }
    
    // Generate new tokens
    token, refreshToken := h.generateTokens(userID, req.TenantID, role)
    
    c.JSON(200, gin.H{
        "access_token":  token,
        "refresh_token": refreshToken,
    })
}
\`\`\`

---

### 3. Backend: User CRUD with Permissions

Update `internal/handler/user_handler.go`:

\`\`\`go
// CreateUserRequest with multi-tenant support
type CreateUserRequest struct {
    Email     string \`json:"email" binding:"required,email"\`
    Password  string \`json:"password" binding:"required,min=8"\`
    FirstName string \`json:"first_name" binding:"required"\`
    LastName  string \`json:"last_name" binding:"required"\`
    Phone     string \`json:"phone"\`
    Tenants   []TenantAssignment \`json:"tenants" binding:"required,min=1"\`
}

type TenantAssignment struct {
    TenantID  string \`json:"tenant_id" binding:"required"\`
    Role      string \`json:"role" binding:"required"\`
    Extension string \`json:"extension"\`
}

// CreateUser with permission checks
func (h *UserHandler) CreateUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    currentUserID := c.GetInt64("user_id")
    currentRole := c.GetString("role")
    currentTenantID := c.GetString("tenant_id")
    
    // Permission validation
    if err := h.validateUserCreation(currentRole, currentTenantID, currentUserID, req.Tenants); err != nil {
        c.JSON(403, gin.H{"error": err.Error()})
        return
    }
    
    // Create user
    hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    
    user := &core.User{
        Email:        req.Email,
        PasswordHash: string(hashedPassword),
        FirstName:    &req.FirstName,
        LastName:     &req.LastName,
        Phone:        &req.Phone,
        Status:       common.UserStatusActive,
    }
    
    if err := h.userRepo.Create(user); err != nil {
        c.JSON(500, gin.H{"error": "Failed to create user"})
        return
    }
    
    // Assign to tenants
    for _, t := range req.Tenants {
        h.userRepo.AssignUserToTenant(user.ID, t.TenantID, t.Role, t.Extension)
    }
    
    c.JSON(201, gin.H{"user": user})
}

// validateUserCreation checks permissions
func (h *UserHandler) validateUserCreation(currentRole, currentTenantID string, currentUserID int64, tenants []TenantAssignment) error {
    switch currentRole {
    case "superadmin":
        // Superadmin can do anything
        return nil
        
    case "tenant_admin":
        // Can only assign to tenants they belong to
        // Cannot create superadmin or tenant_admin roles
        for _, t := range tenants {
            if !h.userRepo.UserBelongsToTenant(currentUserID, t.TenantID) {
                return fmt.Errorf("cannot assign users to other tenants")
            }
            if t.Role == "superadmin" || t.Role == "tenant_admin" {
                return fmt.Errorf("cannot create admin roles")
            }
        }
        return nil
        
    case "manager":
        // Can only create agents in their own tenant
        if len(tenants) != 1 {
            return fmt.Errorf("can only assign to one tenant")
        }
        if tenants[0].TenantID != currentTenantID {
            return fmt.Errorf("can only assign to your tenant")
        }
        if tenants[0].Role != "agent" {
            return fmt.Errorf("can only create agents")
        }
        return nil
        
    default:
        return fmt.Errorf("insufficient permissions")
    }
}

// ListUsers with tenant filtering
func (h *UserHandler) ListUsers(c *gin.Context) {
    currentRole := c.GetString("role")
    currentTenantID := c.GetString("tenant_id")
    currentUserID := c.GetInt64("user_id")
    
    tenantFilter := c.Query("tenant_id")
    roleFilter := c.Query("role")
    
    var users []UserWithRole
    var err error
    
    switch currentRole {
    case "superadmin":
        // Can see all users
        if tenantFilter != "" {
            users, err = h.userRepo.GetUsersInTenant(tenantFilter, roleFilter)
        } else {
            users, err = h.userRepo.GetAllUsers()
        }
        
    case "tenant_admin", "manager":
        // Can only see users in their tenants
        if tenantFilter == "" {
            tenantFilter = currentTenantID
        }
        
        // Verify access
        if !h.userRepo.UserBelongsToTenant(currentUserID, tenantFilter) {
            c.JSON(403, gin.H{"error": "Access denied"})
            return
        }
        
        users, err = h.userRepo.GetUsersInTenant(tenantFilter, roleFilter)
        
    default:
        c.JSON(403, gin.H{"error": "Insufficient permissions"})
        return
    }
    
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to fetch users"})
        return
    }
    
    c.JSON(200, gin.H{"data": users})
}
\`\`\`

---

### 4. Frontend: Updated Types

Update `frontend/src/types/index.ts`:

\`\`\`typescript
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  created_at: string;
  updated_at: string;
  
  // Multi-tenant support
  tenants?: UserTenant[];  // NEW: List of tenant memberships
  
  // Current session (from JWT)
  role?: UserRole;      // Role in CURRENT tenant
  tenant_id?: string;   // CURRENT tenant
}

export interface UserTenant {
  tenant_id: string;
  tenant_name: string;
  domain?: string;
  role: UserRole;
  extension?: string;
}

export interface LoginResponse {
  requires_tenant_selection?: boolean;
  tenants?: UserTenant[];
  session_token?: string;
  
  access_token?: string;
  refresh_token?: string;
  user?: User;
}
\`\`\`

---

### 5. Frontend: TenantSelector Component

Create `frontend/src/components/auth/TenantSelector.tsx`:

\`\`\`typescript
import { useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import type { UserTenant } from '../../types';

interface TenantSelectorProps {
  tenants: UserTenant[];
  sessionToken: string;
  onSelect: (tenantId: string) => void;
}

export default function TenantSelector({ tenants, sessionToken, onSelect }: TenantSelectorProps) {
  const [selected, setSelected] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setIsLoading(true);
    onSelect(selected);
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      superadmin: 'bg-purple-100 text-purple-800',
      tenant_admin: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      agent: 'bg-gray-100 text-gray-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Select Tenant</h2>
          <p className="text-gray-600 mt-2">Choose which organization to access</p>
        </div>

        <div className="space-y-3">
          {tenants.map((tenant) => (
            <label
              key={tenant.tenant_id}
              className={\`block p-4 border-2 rounded-lg cursor-pointer transition-all \${
                selected === tenant.tenant_id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }\`}
            >
              <input
                type="radio"
                name="tenant"
                value={tenant.tenant_id}
                checked={selected === tenant.tenant_id}
                onChange={(e) => setSelected(e.target.value)}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{tenant.tenant_name}</div>
                  {tenant.domain && (
                    <div className="text-sm text-gray-500">{tenant.domain}</div>
                  )}
                </div>
                <span className={\`px-3 py-1 rounded-full text-xs font-medium \${getRoleBadge(tenant.role)}\`}>
                  {tenant.role.replace('_', ' ')}
                </span>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || isLoading}
          className="btn-primary w-full mt-6 flex items-center justify-center space-x-2"
        >
          <span>{isLoading ? 'Loading...' : 'Continue'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
\`\`\`

---

### 6. Frontend: Updated Login Flow

Update `frontend/src/pages/auth/Login.tsx`:

\`\`\`typescript
const [showTenantSelector, setShowTenantSelector] = useState(false);
const [tenants, setTenants] = useState<UserTenant[]>([]);
const [sessionToken, setSessionToken] = useState('');

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    const response = await apiClient.post<LoginResponse>(config.api.auth.login, {
      email: formData.email,
      password: formData.password,
    });

    const data = response.data;

    // Multi-tenant selection required
    if (data.requires_tenant_selection && data.tenants) {
      setTenants(data.tenants);
      setSessionToken(data.session_token!);
      setShowTenantSelector(true);
      return;
    }

    // Single tenant or tenant selected
    if (data.access_token && data.user) {
      setTokens(data.access_token, data.refresh_token!);
      navigate('/');
    }
  } catch (err: any) {
    setError(err.response?.data?.message || 'Login failed');
  } finally {
    setIsLoading(false);
  }
};

const handleTenantSelect = async (tenantId: string) => {
  try {
    const response = await apiClient.post<LoginResponse>(
      config.api.auth.login,
      {
        email: formData.email,
        password: formData.password,
        tenant_id: tenantId,
      }
    );

    if (response.data.access_token) {
      setTokens(response.data.access_token, response.data.refresh_token!);
      navigate('/');
    }
  } catch (err: any) {
    setError('Tenant selection failed');
  }
};

// In render:
if (showTenantSelector) {
  return (
    <TenantSelector
      tenants={tenants}
      sessionToken={sessionToken}
      onSelect={handleTenantSelect}
    />
  );
}
\`\`\`

---

## Next Steps

1. **Test with existing data**: Your current users already have entries in `user_roles` table
2. **Add tenant switching**: Header dropdown to switch between tenants
3. **Update UserForm**: Add multi-tenant assignment UI for superadmin
4. **Add permission middleware**: Protect routes based on role

Would you like me to implement:
1. The multi-tenant UserForm component?
2. The tenant switcher in the header?
3. The backend permission middleware?
