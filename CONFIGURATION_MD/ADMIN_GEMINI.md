# ADMIN_GEMINI.md - Admin Panel Specification

## 🎯 Purpose
Complete system control and management interface for administrators.

## 🔐 Access Level
**HIGHEST** - Full CRUD operations on all resources

## 📍 Route Structure
```
/admin
├── /dashboard
├── /schools
│   ├── /create
│   ├── /[id]/edit
│   └── /[id]/view
├── /users
│   ├── /teachers
│   ├── /students
│   └── /manage-roles
├── /exams
│   └── /all-exams
├── /results
│   └── /analytics
├── /settings
│   ├── /system
│   └── /omr-config
└── /logs
```

## 🎨 UI Components Needed

### 1. Dashboard
```typescript
// Components to create:
- StatsCard (Total Schools, Teachers, Students, Exams)
- RecentActivityFeed
- SystemHealthMonitor
- QuickActionButtons
- AnalyticsChart (exam trends)
```

**Features**:
- Overview statistics with real-time data
- Recent system activities
- Quick access shortcuts
- System performance metrics

### 2. School Management
```typescript
// Features:
- Create new school
- Edit school details
- Upload/change school logos (left & right)
- Assign teachers to schools
- View school statistics
- Deactivate/Activate schools
```

**Database Integration**:
```sql
-- schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  logo_left_url TEXT,
  logo_right_url TEXT,
  address TEXT,
  city TEXT,
  principal_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. User Management

#### Teachers Management
```typescript
// Features:
- Create teacher accounts
- Assign to schools
- Set permissions
- View teacher activity
- Reset passwords
- Suspend/Reactivate accounts
```

#### Students Management
```typescript
// Features:
- Bulk import students (CSV/Excel)
- Manual student creation
- Assign to classes/exams
- View student results
- Transfer between schools
```

**Database Schema**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'teacher', 'student')),
  school_id UUID REFERENCES schools(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  profile_picture_url TEXT
);
```

### 4. Exam Management
```typescript
// Features:
- View all exams across schools
- Monitor exam status
- Access all results
- Generate system-wide reports
- Override/Edit any exam
- Delete exams (with confirmation)
```

### 5. Analytics & Reports
```typescript
// Reports to Generate:
- School-wise performance
- Teacher activity reports
- Student pass/fail rates
- OMR processing success rates
- System usage statistics
- Monthly/Yearly trends
```

**Charts Needed**:
- Line charts (trends over time)
- Bar charts (school comparisons)
- Pie charts (pass/fail distribution)
- Heatmaps (activity patterns)

### 6. System Settings

#### OMR Configuration
```typescript
interface OMRSettings {
  maxQuestionsPerSheet: number;
  bubbleDetectionThreshold: number;
  imageQualityMinimum: number;
  enableGeminiAIFallback: boolean;
  geminiAPIKey: string;
  maxFileSize: number; // in MB
  allowedImageFormats: string[];
}
```

#### System Configuration
- Email SMTP settings
- Backup schedules
- Security policies
- API rate limits
- Storage quotas

### 7. Audit Logs
```typescript
// Log all critical actions:
- User created/deleted
- School created/modified
- Exam created/deleted
- Results modified
- Settings changed
- Failed login attempts
```

**Database Schema**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔒 Security Features

### Admin Authentication
```typescript
// Middleware for admin routes
export async function adminMiddleware(req: NextRequest) {
  const user = await getUser();
  
  if (!user || user.role !== 'admin') {
    return redirect('/unauthorized');
  }
  
  // Log admin access
  await logAuditEvent({
    userId: user.id,
    action: 'ADMIN_ACCESS',
    resourceType: req.nextUrl.pathname
  });
  
  return NextResponse.next();
}
```

### Action Confirmations
- Delete operations require double confirmation
- Bulk actions show preview before execution
- Critical changes require password re-entry

## 📊 Dashboard Widgets

### 1. System Health Widget
```typescript
interface SystemHealth {
  databaseStatus: 'healthy' | 'degraded' | 'down';
  storageUsed: number; // percentage
  apiStatus: 'operational' | 'issues';
  lastBackup: Date;
  pendingTasks: number;
}
```

### 2. Quick Stats
- Total schools: X
- Active teachers: Y
- Total students: Z
- Exams this month: N
- OMR processing success rate: XX%

### 3. Recent Activities
- Last 10 system events
- Real-time updates
- Filter by activity type

## 🎨 UI/UX Guidelines

### Color Scheme
```css
/* Admin Panel Colors */
--admin-primary: #1e40af; /* Blue */
--admin-danger: #dc2626;  /* Red */
--admin-success: #16a34a; /* Green */
--admin-warning: #f59e0b; /* Amber */
--admin-neutral: #6b7280; /* Gray */
```

### Layout
- Sidebar navigation (collapsible)
- Top bar with user profile & notifications
- Breadcrumb navigation
- Responsive grid system

### Components Library
```typescript
// Use shadcn/ui components:
- DataTable (with sorting, filtering, pagination)
- Dialog/Modal
- AlertDialog (confirmations)
- Toast (notifications)
- Card (dashboard widgets)
- Badge (status indicators)
- Tabs (organized sections)
```

## 📱 Responsive Design
- Desktop: Full sidebar + main content
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation + hamburger menu

## ⚡ Performance Optimizations
- Lazy load dashboard widgets
- Virtual scrolling for large tables
- Debounced search inputs
- Cached statistics (5-minute refresh)
- Optimistic UI updates

## 🔔 Notifications System
```typescript
// Admin receives notifications for:
- Failed OMR processing (>5 in 1 hour)
- New school registration requests
- System errors/warnings
- Security alerts
- Backup status
```

## 🧪 Testing Checklist
- [ ] Can create/edit/delete schools
- [ ] Can manage users (all roles)
- [ ] Can view all exams and results
- [ ] Analytics load correctly
- [ ] Audit logs capture all actions
- [ ] Settings persist correctly
- [ ] Bulk operations work
- [ ] Export functions work
- [ ] Search and filters work
- [ ] Role-based access enforced

## 📚 API Endpoints Needed

```typescript
// Admin-specific API routes
POST   /api/admin/schools
GET    /api/admin/schools
PUT    /api/admin/schools/[id]
DELETE /api/admin/schools/[id]

POST   /api/admin/users
GET    /api/admin/users?role=teacher
PUT    /api/admin/users/[id]
DELETE /api/admin/users/[id]

GET    /api/admin/analytics/dashboard
GET    /api/admin/analytics/schools
GET    /api/admin/analytics/exams

GET    /api/admin/logs?page=1&limit=50
GET    /api/admin/system/health

PUT    /api/admin/settings/omr
PUT    /api/admin/settings/system
```

## 🚀 Implementation Priority
1. ✅ Authentication & RBAC
2. ✅ Dashboard with basic stats
3. ✅ School management
4. ✅ User management (teachers)
5. ✅ User management (students)
6. ✅ System settings
7. ✅ Audit logs
8. ✅ Analytics & reports

---
**Admin Panel: Full Control, Maximum Responsibility! 👑**