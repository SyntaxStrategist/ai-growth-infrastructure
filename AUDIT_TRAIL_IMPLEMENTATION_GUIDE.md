# 📋 Complete Audit Trail Implementation Guide

## ✅ Completed So Far

### **1. Database Schema** ✅
- Added `deleted BOOLEAN DEFAULT FALSE` column
- Added `current_tag TEXT` column for tag badges
- Created indexes on `deleted` and `current_tag`
- Migration scripts for existing databases

### **2. API Route** ✅
- Changed delete to soft delete (`deleted = true`)
- Added `reactivate` action (sets `archived = false` and `deleted = false`)
- Tag action now updates `current_tag` in lead_memory
- Comprehensive logging for all operations

### **3. Supabase Functions** ✅
- `getRecentLeads()` - Active leads only (not archived, not deleted)
- `getArchivedLeads()` - Archived but not deleted
- `getDeletedLeads()` - All deleted leads
- Updated `LeadMemoryRecord` type with new fields

---

## 🔄 Dashboard Changes Needed

### **Main Updates:**

1. **Add View Tabs**:
   - Active Leads (default)
   - Archived Leads
   - Deleted Leads

2. **Tag Filter Dropdown**:
   - Filter by: All, Contacted, High Value, Not Qualified, Follow-Up

3. **Show Tag Badges**:
   - Display `current_tag` as a colored badge on each lead card

4. **Reactivate Button**:
   - Show on archived/deleted leads
   - Moves lead back to Active

5. **Enhanced Activity Log**:
   - Show all action types (Archive, Delete, Tag, Reactivate)
   - Color-code by action type
   - Display tag names

6. **Bilingual Support**:
   - "Archived Leads" / "Leads archivés"
   - "Deleted Leads" / "Leads supprimés"
   - "Reactivated" / "Réactivé"
   - "Tag Filters" / "Filtres d'étiquettes"

---

## 🎨 UI Design

### **Tab Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ [Active Leads] [Archived Leads] [Deleted Leads]         │
├─────────────────────────────────────────────────────────┤
│ Tag Filter: [All ▼]                                      │
├─────────────────────────────────────────────────────────┤
│ LEAD CARD 1                                              │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Name: John Doe     [High Value]  ← TAG BADGE      │  │
│ │ Message: "I need AI automation..."                 │  │
│ │ Actions: [🏷️ Tag] [📦 Archive] [🗑️ Delete]        │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### **Archived/Deleted Tab:**
```
┌─────────────────────────────────────────────────────────┐
│ [Active Leads] [Archived Leads] [Deleted Leads]         │
├─────────────────────────────────────────────────────────┤
│ LEAD CARD (Archived)                                     │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Name: Jane Smith                                   │  │
│ │ Actions: [🔄 Reactivate]                           │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### **Tag Badges:**
- **Contacted**: Blue badge
- **High Value**: Gold/yellow badge
- **Not Qualified**: Gray badge
- **Follow-Up**: Purple badge

### **Activity Log Colors:**
- **Archived**: Yellow
- **Deleted**: Red
- **Tagged**: Blue
- **Reactivated**: Green

---

## 📝 Implementation Steps

### **Step 1: Add State for Tabs**
```typescript
const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'deleted'>('active');
const [tagFilter, setTagFilter] = useState<string>('all');
```

### **Step 2: Create fetchLeads Function**
```typescript
async function fetchLeads() {
  let fetchFunction;
  switch (activeTab) {
    case 'active':
      fetchFunction = fetch(`/api/leads?limit=100&locale=${locale}`);
      break;
    case 'archived':
      fetchFunction = fetch(`/api/leads/archived?limit=100&locale=${locale}`);
      break;
    case 'deleted':
      fetchFunction = fetch(`/api/leads/deleted?limit=100&locale=${locale}`);
      break;
  }
  // ... handle response
}
```

### **Step 3: Create API Routes**
- `/api/leads/archived/route.ts` (calls `getArchivedLeads`)
- `/api/leads/deleted/route.ts` (calls `getDeletedLeads`)

### **Step 4: Add Reactivate Handler**
```typescript
async function handleReactivate(leadId: string) {
  const res = await fetch('/api/lead-actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead_id: leadId, action: 'reactivate' }),
  });
  // ... handle response
}
```

### **Step 5: Show Tag Badges**
```typescript
{lead.current_tag && (
  <span className={`px-2 py-1 text-xs rounded ${getTagColor(lead.current_tag)}`}>
    {lead.current_tag}
  </span>
)}
```

### **Step 6: Tag Filter**
```typescript
const filteredLeads = leads.filter(lead => {
  if (tagFilter !== 'all' && lead.current_tag !== tagFilter) return false;
  // ... other filters
  return true;
});
```

---

## 🌐 Bilingual Translations

```typescript
const t = {
  activeLeads: locale === 'fr' ? 'Leads actifs' : 'Active Leads',
  archivedLeads: locale === 'fr' ? 'Leads archivés' : 'Archived Leads',
  deletedLeads: locale === 'fr' ? 'Leads supprimés' : 'Deleted Leads',
  tagFilter: locale === 'fr' ? 'Filtre d\'étiquettes' : 'Tag Filter',
  reactivate: locale === 'fr' ? 'Réactiver' : 'Reactivate',
  reactivated: locale === 'fr' ? 'Réactivé' : 'Reactivated',
  all: locale === 'fr' ? 'Tous' : 'All',
};
```

---

## 🎯 Files to Modify

1. **`src/app/[locale]/dashboard/page.tsx`**:
   - Add tab state and switching
   - Add tag filter dropdown
   - Show tag badges on lead cards
   - Add reactivate button for archived/deleted
   - Refetch on tab change

2. **`src/app/api/leads/archived/route.ts`** (NEW):
   - Call `getArchivedLeads` with server-side translation

3. **`src/app/api/leads/deleted/route.ts`** (NEW):
   - Call `getDeletedLeads` with server-side translation

4. **`src/components/ActivityLog.tsx`**:
   - Add "Reactivated" action type
   - Color-code each action
   - Display tag name in entries

---

## ✅ Testing Checklist

- [ ] Active tab shows only non-archived, non-deleted leads
- [ ] Archived tab shows only archived (not deleted) leads
- [ ] Deleted tab shows all deleted leads
- [ ] Tag filter works on all tabs
- [ ] Tag badges display correctly
- [ ] Reactivate moves leads back to Active tab
- [ ] Activity Log shows all action types
- [ ] All translations work (EN/FR)
- [ ] Build passes with no errors

---

**Next: Implement dashboard changes with tabs, filters, and badges!** 🚀
