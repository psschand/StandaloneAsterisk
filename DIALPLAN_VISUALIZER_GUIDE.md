# Dialplan Visualizer - User Guide

## Overview
The Dialplan Visualizer provides a complete visual representation and management system for both inbound and outbound call routing flows. You can now view, edit, and manage your entire dialplan from a single interface.

## Features

### 1. **Complete Outbound Routing Management**
- Access via **Settings → Outbound Routes** menu
- Full CRUD operations for outbound dial rules
- Features:
  - Create routing patterns with regex (e.g., `^1[2-9]\d{9}$` for US/Canada)
  - Set priority (lower number = higher priority)
  - Select trunk for each route
  - Enable/disable routes
  - Digit manipulation (prepend/strip)
  - Caller ID override

### 2. **Visual Dialplan Flow**
- Navigate to **Dialplan Visualizer**
- Toggle between **Inbound** and **Outbound** views
- Interactive flow diagrams showing:
  - Inbound: DID → IVR/Queue → Extensions
  - Outbound: Pattern matching → Trunk selection

### 3. **Interactive Editing** ✨ NEW!

#### How to Edit Routing Inline:
1. **Navigate to Dialplan Visualizer**
2. **Select flow mode**: Inbound or Outbound
3. **Double-click any editable node** (DID, Queue, or IVR)
4. **Edit modal opens** with quick-edit form
5. **Save changes** - visualizer refreshes automatically

#### Editable Nodes:

**DID Nodes (Inbound Entry Points)**
- Change route type (Queue, Extension, IVR, Webhook, etc.)
- Select new destination from dropdown
- Instantly redirect incoming calls

**Queue Nodes**
- Modify ring strategy (Ring All, Least Recent, Fewest Calls, Random, Round Robin)
- Adjust max wait time
- Fine-tune queue behavior

**IVR Nodes**
- Set timeout duration
- Configure timeout destination
- Optimize IVR flow

#### Visual Indicators:
- **Hover over nodes** - "Double-click to edit" tooltip appears
- **Single click** - View node details in sidebar
- **Double click** - Open quick-edit modal
- **Color coding**:
  - 🔵 Blue: DIDs (inbound entry)
  - 🟢 Green: Queues
  - 🟣 Purple: IVRs
  - 🟡 Yellow: Extensions
  - 🟠 Orange: Outbound rules
  - ⚪ Gray: External/PSTN

## Common Workflows

### Workflow 1: Redirect a DID to Different Queue
1. Open **Dialplan Visualizer** → **Inbound** mode
2. Select DID from dropdown (e.g., +14155551234)
3. **Double-click the DID node** (first blue box)
4. Select "Queue" as route type
5. Choose new queue from dropdown
6. Click **Save Changes**
7. Flow diagram updates instantly

### Workflow 2: Change Queue Ring Strategy
1. Open **Dialplan Visualizer** → **Inbound** mode
2. Find the queue in the flow
3. **Double-click the queue node** (green box)
4. Select new strategy (e.g., "Least Recent")
5. Adjust max wait time if needed
6. Click **Save Changes**

### Workflow 3: Create New Outbound Route
1. Navigate to **Settings → Outbound Routes**
2. Click **+ Add Outbound Route**
3. Fill in details:
   - Name: "UK Mobile"
   - Pattern: `^44[0-9]{10}$`
   - Select trunk: "UK-SIP-Provider"
   - Priority: 30
   - Enable the route
4. Click **Create**
5. Go to **Dialplan Visualizer → Outbound** to see it in action

### Workflow 4: Test Routing Pattern
1. Go to **Dialplan Visualizer → Outbound**
2. View the flow sequence (pattern priority order)
3. Verify your route appears in correct order
4. Patterns are evaluated top-to-bottom (by priority)
5. First match wins

## Data Sources

### Real-Time Data
All visualizer data is **fetched live from the database**:
- ✅ **DIDs** - `/api/v1/dids`
- ✅ **Queues** - `/api/v1/queues`
- ✅ **IVR Menus** - `/api/v1/ivr-menus`
- ✅ **Extensions** - `/api/v1/extensions`
- ✅ **SIP Trunks** - `/api/v1/trunks`
- ✅ **Outbound Routes** - `/api/v1/outbound-routes`

### Auto-Refresh
- Click **Refresh** button to reload all data
- Changes made via edit modals auto-refresh the visualizer
- No need to reload the page

## Statistics Dashboard

The visualizer displays real-time metrics:
- **Inbound Routes**: Total configured DIDs
- **Outbound Rules**: Total active routing patterns
- **IVR Menus**: Total interactive voice menus
- **Call Queues**: Total agent queues

## Tips & Best Practices

### Outbound Route Priority
- Lower number = Higher priority
- Reserve 1-10 for emergency/special routes
- Use 10-50 for geographic routes
- Use 90-99 for catch-all/international

### Pattern Testing
- Test regex patterns before saving
- Use online regex testers for complex patterns
- Common patterns:
  - US/Canada: `^1[2-9]\d{9}$`
  - UK: `^44[0-9]{10}$`
  - International: `^00[1-9]\d{7,14}$`

### Queue Strategy Selection
- **Ring All**: Best for small teams
- **Least Recent**: Fair distribution
- **Fewest Calls**: Balanced workload
- **Round Robin**: Sequential distribution

### IVR Timeout Configuration
- 10 seconds: Good for simple menus
- 15-20 seconds: Complex multi-level menus
- Always configure timeout destination to avoid dead ends

## Troubleshooting

### Node Won't Edit
- Only DID, Queue, and IVR nodes are editable
- Extensions, Trunks, and Outbound Rules are read-only
- Edit those via their dedicated management pages

### Changes Not Appearing
- Click **Refresh** button
- Check browser console for errors
- Verify you have edit permissions

### Pattern Not Matching
- Test pattern with online regex tool
- Check priority order (lower = higher)
- Ensure route is enabled
- Verify trunk is connected

## Next Steps

Want more features? The visualizer roadmap includes:
- ⏳ Zoom and pan controls
- ⏳ Export flow as image
- ⏳ Search and filter nodes
- ⏳ Drag-and-drop routing
- ⏳ Real-time call flow visualization

## Related Pages

- **Outbound Routes**: Full management interface
- **DIDs Management**: Configure inbound numbers
- **Queue Management**: Agent assignment and settings
- **IVR Designer**: Build voice menus

---

**Last Updated**: December 2024  
**Version**: 1.1 (Interactive Editing Release)
