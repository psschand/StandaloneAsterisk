# Call Center Role Definitions

## Overview
This document defines the role-based access control (RBAC) structure for the call center system.

---

## Role Structure

### 1. Superadmin (System Administrator)
**Purpose**: Manages the entire multi-tenant platform
**Access Level**: System-wide

#### Permissions:
- ✅ Tenant Management (create, edit, delete tenants)
- ✅ Global User Management (all users across all tenants)
- ✅ System Monitoring (health, logs, metrics)
- ✅ All features of all other roles

#### Navigation Access:
```
- Dashboard (system-wide stats)
- Tenants
- System Users
- [ALL OTHER SECTIONS AS READ-ONLY]
```

---

### 2. Admin (Tenant Administrator)
**Purpose**: Full control over a single tenant's configuration and operations
**Access Level**: Tenant-wide
**Previously**: Combined `tenant_admin` + `manager` roles

#### Permissions:
- ✅ Extensions (SIP/PJSIP configuration)
- ✅ DIDs (phone number management)
- ✅ Queues (create, configure, assign)
- ✅ Users (add/remove agents in their tenant)
- ✅ Reports & Analytics (all reports)
- ✅ Tenant Settings (features, limits, billing)
- ✅ Monitor all calls/chats/tickets
- ❌ Cannot access other tenants
- ❌ Cannot modify system settings

#### Navigation Access:
```
- Dashboard (tenant stats)
- Extensions (SIP configuration)
- DIDs (phone numbers)
- Queues (call routing)
- Agents (team management)
- Calls (monitor all calls)
- CDRs (call records)
- Contacts (customer database)
- Tickets (all tickets)
- Chat (monitor chats)
- Reports (analytics)
- Settings (tenant settings)
```

---

### 3. Manager (Operations Manager)
**Purpose**: Manages call center operations without system configuration access
**Access Level**: Tenant-wide (operational only)

#### Permissions:
- ✅ Queues (create, configure, assign)
- ✅ Agent Management (assign to queues, monitor)
- ✅ Reports & Analytics
- ✅ Monitor calls/chats/tickets
- ❌ Extensions (HIDDEN)
- ❌ DIDs (HIDDEN)
- ❌ System Settings (HIDDEN)

#### Navigation Access:
```
- Dashboard (operational stats)
- Queues (call routing)
- Agents (team management)
- Calls (monitor calls)
- CDRs (call records)
- Contacts (customer database)
- Tickets (monitor tickets)
- Chat (monitor chats)
- Reports (analytics)
- Settings (personal settings only)
```

---

### 4. Agent (Customer Service Representative)
**Purpose**: Handles customer interactions (calls, chats, tickets)
**Access Level**: Personal workspace only

#### Permissions:
- ✅ Calls (make, answer, transfer)
- ✅ Chats (accept, respond)
- ✅ Tickets (view assigned, update status)
- ✅ Contacts (view, search)
- ✅ Personal Status (Available, Break, Away)
- ✅ Personal Stats (my performance)
- ❌ Queues (HIDDEN)
- ❌ Reports (HIDDEN)
- ❌ Other agents' data (HIDDEN)
- ❌ Settings (HIDDEN except personal)

#### Navigation Access:
```
- Dashboard (personal stats only)
- Calls (my calls only)
- Contacts (search customers)
- Tickets (my tickets only)
- Chat (my chats only)
- Settings (personal settings only)
```

---

### 5. Viewer (Optional - Read-Only)
**Purpose**: Executive/stakeholder with report access only
**Access Level**: Tenant-wide (read-only)

#### Permissions:
- ✅ Reports & Analytics (view only)
- ✅ Dashboard (view stats)
- ❌ Cannot make any changes
- ❌ Cannot handle calls/chats/tickets

#### Navigation Access:
```
- Dashboard (view only)
- Reports (view only)
```

**Recommendation**: This role is optional. Remove if not needed.

---

## Recommended Simplification

### Option 1: Keep 4 Roles (Recommended)
1. **Superadmin** - System administrator
2. **Admin** - Full tenant control (merge tenant_admin + manager)
3. **Agent** - Customer service
4. ~~Viewer~~ - Remove if not needed

### Option 2: Keep 5 Roles (Your Current Need)
1. **Superadmin** - System administrator
2. **Admin** (tenant_admin) - Full tenant control INCLUDING extensions
3. **Manager** - Operations only, NO extensions
4. **Agent** - Customer service
5. ~~Viewer~~ - Remove if not needed

---

## Navigation Comparison Table

| Feature | Superadmin | Admin | Manager | Agent | Viewer |
|---------|-----------|-------|---------|-------|--------|
| **Tenants** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **System Users** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Extensions** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **DIDs** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Queues** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Agents** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Calls** | ✅ | ✅ Monitor | ✅ Monitor | ✅ My Calls | ❌ |
| **CDRs** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Contacts** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Tickets** | ✅ | ✅ All | ✅ All | ✅ My Tickets | ❌ |
| **Chat** | ✅ | ✅ Monitor | ✅ Monitor | ✅ My Chats | ❌ |
| **Reports** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Settings** | ✅ All | ✅ Tenant | ✅ Personal | ✅ Personal | ✅ Personal |

---

## Implementation Notes

### Navigation Filtering
The `DashboardLayout.tsx` component filters navigation based on the user's role:

```typescript
const navigation = useMemo(() => {
  const userRole = user?.role;
  return allNavigation.filter(item => {
    if (!item.roles) return true; // No restriction
    return userRole && item.roles.includes(userRole);
  });
}, [user?.role]);
```

### Role Assignment
- **Superadmin**: Assigned to `system` tenant
- **Admin/Manager/Agent**: Assigned to specific tenant (e.g., `test-tenant-001`)
- Role is stored in JWT token and extracted on login

### Access Control
Each page should check permissions:
```typescript
// In Extensions.tsx (Admin only)
if (!['superadmin', 'tenant_admin'].includes(user?.role)) {
  return <Navigate to="/" />;
}

// In Tickets.tsx (Agent sees only their tickets)
const url = user?.role === 'agent' 
  ? '/api/v1/tickets?assigned_to=' + user.id
  : '/api/v1/tickets';
```

---

## Recommendations

1. **Simplify to 4 roles**: Remove `supervisor` and `viewer` if not needed
2. **Merge roles**: Combine `tenant_admin` and `manager` into single `admin` role
3. **Clear separation**:
   - Admin = Configuration + Operations
   - Manager = Operations only (no extensions/DIDs)
   - Agent = Customer service only

Would you like me to:
1. Update the navigation to match the 4-role structure?
2. Remove supervisor and viewer roles from the codebase?
3. Implement the specific navigation restrictions (Admin sees extensions, Manager doesn't)?
