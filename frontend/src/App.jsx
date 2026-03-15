import { useMemo, useState } from 'react'
import './assets/styles/globals.css'

const demoAccounts = {
  superuser: { email: 'wjm@martinsdirect.com', password: 'Renette7', firstLogin: false, displayName: 'Wjm', title: 'System Administrator' },
  franchisee: { email: 'franchisee@martinsdirect.com', password: 'demo123', firstLogin: true, displayName: 'Franchisee User', title: 'Franchise Owner' },
  manager: { email: 'manager@martinsdirect.com', password: 'demo123', firstLogin: false, displayName: 'Manager User', title: 'Franchise Manager' },
  agent: { email: 'agent@martinsdirect.com', password: 'demo123', firstLogin: false, displayName: 'Agent User', title: 'Sales Agent' }
}

const navForRole = {
  superuser: {
    main: ['Dashboard', 'Franchise', 'Payments', 'Admin Settings'],
    franchise: ['Reports Dashboard', 'Upload Bank Statement', 'Auto Match Payments', 'Unmatched Payments', 'Employees'],
    payments: ['Receipt Generation']
  },
  franchisee: {
    main: ['Dashboard', 'Franchise', 'Payments'],
    franchise: ['Reports Dashboard', 'Upload Bank Statement', 'Auto Match Payments', 'Unmatched Payments', 'Employees'],
    payments: ['Receipt Generation']
  },
  manager: {
    main: ['Dashboard', 'Franchise', 'Payments'],
    franchise: ['Upload Bank Statement', 'Auto Match Payments', 'Unmatched Payments', 'Employees'],
    payments: ['Receipt Generation']
  },
  agent: {
    main: ['Dashboard', 'Franchise', 'Payments'],
    franchise: ['Upload Bank Statement', 'Auto Match Payments', 'Unmatched Payments', 'Employees'],
    payments: ['Receipt Generation']
  }
}

const employeesAccess = {
  superuser: 'Can see all franchisees, managers, and agents across the system. View-focused oversight for all records.',
  franchisee: 'Can add, edit, and deactivate any record under their franchise.',
  manager: 'Can add and edit records under their franchise, but cannot deactivate them.',
  agent: 'Can add records only under their franchise.'
}

function toTitleCase(value) {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function Logo({ small = false }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={small ? 'logo-fallback logo-fallback-small' : 'logo-fallback'}>
        MD
      </div>
    )
  }

  return (
    <img
      src="/logo.png"
      alt="Martinsdirect logo"
      className={small ? 'brand-logo-small' : 'brand-logo-large'}
      onError={() => setFailed(true)}
    />
  )
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('wjm@martinsdirect.com')
  const [password, setPassword] = useState('Renette7')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    const adminAccount = demoAccounts.superuser

    if (normalizedEmail === adminAccount.email.toLowerCase() && password === adminAccount.password) {
      setError('')
      onLogin('superuser', { rememberMe })
      return
    }

    setError('Incorrect email or password. Please use your Martinsdirect admin credentials.')
  }

  return (
    <div className="auth-shell">
      <div className="auth-backdrop" />

      <div className="auth-card">
        <section className="auth-brand-panel">
          <div className="auth-brand-top">
            <Logo />
            <span className="auth-badge">Secure Admin Access</span>
          </div>

          <div>
            <p className="auth-eyebrow">Martinsdirect Management Platform</p>
            <h1>Professional admin login for your operations dashboard.</h1>
            <p className="auth-copy">
              Sign in to manage franchise operations, payments, employee records, and platform settings from one secure workspace.
            </p>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <strong>Role-based access</strong>
              <span>Administrator access configured for your Martinsdirect account.</span>
            </div>
            <div className="auth-feature-item">
              <strong>Centralized control</strong>
              <span>Monitor statements, unmatched payments, employees, and receipts.</span>
            </div>
            <div className="auth-feature-item">
              <strong>Trusted sign-in</strong>
              <span>Designed for a polished first impression on desktop and laptop screens.</span>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-header">
            <p className="auth-form-kicker">Administrator sign in</p>
            <h2>Welcome back, Wjm</h2>
            <p>Use your Martinsdirect admin email and password to continue.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group auth-form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="wjm@martinsdirect.com"
                autoComplete="username"
              />
            </div>

            <div className="form-group auth-form-group">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="auth-options-row">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Remember this device</span>
              </label>

              <a href="#" className="reset-link">Forgot password?</a>
            </div>

            {error ? <div className="auth-error">{error}</div> : null}

            <button type="submit" className="primary-auth-btn">Sign in to dashboard</button>
          </form>

          <div className="auth-footer-note">
            <strong>Admin account</strong>
            <span>{demoAccounts.superuser.email}</span>
            <small>Role: {demoAccounts.superuser.title}</small>
          </div>
        </section>
      </div>
    </div>
  )
}

function FirstTimeSetup({ onComplete }) {
  const [franchiseName] = useState('Martins North')
  const [taName, setTaName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('franchisee@martinsdirect.com')
  const [phone, setPhone] = useState('')
  const [hotline, setHotline] = useState('')
  const [officeAddress, setOfficeAddress] = useState('')

  const franchiseCode = useMemo(() => {
    const code = (franchiseName || 'FRA').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
    return `${code || 'FRA'}001`
  }, [franchiseName])

  return (
    <div className="page-shell">
      <div className="setup-header">
        <div>
          <h1>First-Time Franchisee Setup</h1>
          <p>Complete your franchise profile before entering the system.</p>
        </div>
        <span className="pill">Franchise code: {franchiseCode}</span>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Franchise Profile</h2>
            <p>Franchise name is preloaded by superuser. Add the remaining business and banking information.</p>
          </div>
        </div>

        <div className="setup-grid">
          <div className="col-stack">
            <div className="form-group">
              <label>Franchise Name</label>
              <input value={franchiseName} readOnly />
            </div>

            <div className="form-group">
              <label>T/A Name</label>
              <input value={taName} onChange={(e) => setTaName(e.target.value)} />
            </div>

            <div className="grid-two">
              <div className="form-group">
                <label>Pty / CK Number</label>
                <input />
              </div>
              <div className="form-group">
                <label>VAT Number</label>
                <input />
              </div>
            </div>

            <div className="form-group">
              <label>Owner / Full Name and Surname</label>
              <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            </div>

            <div className="grid-two">
              <div className="form-group">
                <label>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="grid-two">
              <div className="form-group">
                <label>24 Hour Number</label>
                <input value={hotline} onChange={(e) => setHotline(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" defaultValue="demo123" />
              </div>
            </div>

            <div className="form-group">
              <label>Office Address</label>
              <input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} />
            </div>
          </div>

          <div className="col-stack">
            <div className="sub-panel">
              <h3>Bank Details: Insurance</h3>
              <div className="form-group"><label>Bank</label><input /></div>
              <div className="form-group"><label>Account Number</label><input /></div>
              <div className="form-group"><label>Branch</label><input /></div>
            </div>

            <div className="sub-panel">
              <h3>Bank Details: Business</h3>
              <div className="form-group"><label>Bank</label><input /></div>
              <div className="form-group"><label>Account Number</label><input /></div>
              <div className="form-group"><label>Branch</label><input /></div>
            </div>

            <div className="sub-panel">
              <h3>Branding</h3>
              <p>Upload your franchise logo to be used on receipts and reports.</p>
              <input type="file" />
            </div>
          </div>
        </div>

        <div className="panel-actions">
          <button className="btn btn-primary" onClick={onComplete}>Save and Continue</button>
        </div>
      </div>
    </div>
  )
}

function DashboardShell({ role, onLogout }) {
  const [activeMain, setActiveMain] = useState('Dashboard')
  const [activeSub, setActiveSub] = useState('Employees')
  const [employeeName, setEmployeeName] = useState('')
  const [employeeEmail, setEmployeeEmail] = useState('')
  const [employeePhone, setEmployeePhone] = useState('')
  const [employeeRole, setEmployeeRole] = useState('agent')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [employees, setEmployees] = useState([
    { id: 1, fullName: 'Sarah Ndlovu', email: 'sarah@martinsdirect.com', role: 'franchisee', phone: '082 555 0142', branch: 'Pretoria East' },
    { id: 2, fullName: 'Michael Jacobs', email: 'michael@martinsdirect.com', role: 'manager', phone: '082 555 0164', branch: 'Pretoria East' },
    { id: 3, fullName: 'Thandi Mokoena', email: 'thandi@martinsdirect.com', role: 'agent', phone: '082 555 0181', branch: 'Pretoria North' }
  ])

  const nav = navForRole[role]
  const roleLabel = role === 'superuser' ? 'Admin' : toTitleCase(role)
  const accountProfile = demoAccounts[role]
  const loggedInName = accountProfile?.displayName || roleLabel

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = [employee.fullName, employee.email, employee.branch]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === 'all' || employee.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleAddEmployee = () => {
    if (!employeeName.trim() || !employeeEmail.trim()) return

    const newEmployee = {
      id: Date.now(),
      fullName: employeeName.trim(),
      email: employeeEmail.trim(),
      role: employeeRole,
      phone: employeePhone.trim() || 'Not provided',
      branch: role === 'superuser' ? 'System-wide' : 'Assigned franchise'
    }

    setEmployees((current) => [newEmployee, ...current])
    setEmployeeName('')
    setEmployeeEmail('')
    setEmployeePhone('')
    setEmployeeRole(role === 'agent' ? 'agent' : 'manager')
  }

  const handleDeleteEmployee = (id) => {
    setEmployees((current) => current.filter((employee) => employee.id !== id))
  }

  const renderContent = () => {
    if (activeMain === 'Dashboard') {
      return (
        <div className="content-grid">
          <div className="stat-card">
            <span>Total Employees</span>
            <strong>{employees.length}</strong>
          </div>
          <div className="stat-card">
            <span>System Role</span>
            <strong>{roleLabel}</strong>
          </div>
          <div className="stat-card">
            <span>Admin Access</span>
            <strong>{role === 'superuser' ? 'Enabled' : 'Limited'}</strong>
          </div>
          <div className="panel full-span">
            <div className="panel-header">
              <div>
                <h2>Welcome to Martinsdirect</h2>
                <p>Use the navigation to manage employees, payments, reports, and platform settings.</p>
              </div>
            </div>
            <div className="badge-row">
              <span className="pill">Role: {roleLabel}</span>
              <span className="pill pill-soft">{employeesAccess[role]}</span>
            </div>
          </div>
        </div>
      )
    }

    if (activeMain === 'Franchise' && activeSub === 'Employees') {
      return (
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Employees</h2>
              <p>{employeesAccess[role]}</p>
            </div>
          </div>

          <div className="employees-grid">
            <div className="sub-panel">
              <h3>Add Employee</h3>
              <div className="form-group">
                <label>Full Name</label>
                <input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Enter full name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)} placeholder="Enter email address" />
              </div>
              <div className="grid-two">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input value={employeePhone} onChange={(e) => setEmployeePhone(e.target.value)} placeholder="Enter phone number" />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select value={employeeRole} onChange={(e) => setEmployeeRole(e.target.value)}>
                    {['franchisee', 'manager', 'agent'].map((option) => (
                      <option key={option} value={option}>{toTitleCase(option)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleAddEmployee}>Add Employee</button>
            </div>

            <div className="sub-panel">
              <div className="toolbar">
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search employees" />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="all">All roles</option>
                  <option value="franchisee">Franchisee</option>
                  <option value="manager">Manager</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              <div className="employee-list">
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="employee-item">
                    <div>
                      <strong>{employee.fullName}</strong>
                      <p>{employee.email}</p>
                      <span>{toTitleCase(employee.role)} · {employee.branch}</span>
                    </div>
                    <button className="btn btn-danger" onClick={() => handleDeleteEmployee(employee.id)}>Delete</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (activeMain === 'Payments') {
      return (
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Receipt Generation</h2>
              <p>Create payment receipts for employee records.</p>
            </div>
          </div>

          <div className="grid-two">
            <div className="form-group"><label>Employee Name</label><input placeholder="Employee name" /></div>
            <div className="form-group"><label>Amount</label><input placeholder="Amount paid" /></div>
            <div className="form-group"><label>Receipt Number</label><input placeholder="Receipt reference" /></div>
            <div className="form-group"><label>Date</label><input type="date" /></div>
          </div>
          <button className="btn btn-primary">Generate Receipt</button>
        </div>
      )
    }

    if (activeMain === 'Admin Settings') {
      return (
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Admin Settings</h2>
              <p>Manage branding, support email, and general platform preferences.</p>
            </div>
          </div>
          <div className="grid-two">
            <div className="form-group"><label>System Name</label><input defaultValue="Martinsdirect Platform" /></div>
            <div className="form-group"><label>Support Email</label><input defaultValue="support@martinsdirect.com" /></div>
            <div className="form-group"><label>Theme</label><select defaultValue="light"><option value="light">Light</option><option value="dark">Dark</option></select></div>
            <div className="form-group"><label>Logo</label><input type="file" /></div>
          </div>
          <button className="btn btn-primary">Save Settings</button>
        </div>
      )
    }

    return (
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>{activeSub}</h2>
            <p>This section is available in the navigation and ready for detailed module development.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo small />
          <div>
            <strong>Martinsdirect</strong>
            <p>Operations Portal</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.main.map((item) => (
            <button key={item} className={`nav-btn ${activeMain === item ? 'nav-btn-active' : ''}`} onClick={() => {
              setActiveMain(item)
              if (item === 'Franchise') setActiveSub('Employees')
              if (item === 'Payments') setActiveSub('Receipt Generation')
            }}>
              {item}
            </button>
          ))}
        </nav>

        {activeMain === 'Franchise' ? (
          <div className="sidebar-group">
            <p>Franchise</p>
            {nav.franchise.map((item) => (
              <button key={item} className={`nav-sub-btn ${activeSub === item ? 'nav-sub-btn-active' : ''}`} onClick={() => setActiveSub(item)}>
                {item}
              </button>
            ))}
          </div>
        ) : null}

        {activeMain === 'Payments' ? (
          <div className="sidebar-group">
            <p>Payments</p>
            {nav.payments.map((item) => (
              <button key={item} className={`nav-sub-btn ${activeSub === item ? 'nav-sub-btn-active' : ''}`} onClick={() => setActiveSub(item)}>
                {item}
              </button>
            ))}
          </div>
        ) : null}

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-brand-mark">MD</div>
            <div>
              <strong>{loggedInName}</strong>
              <p>{accountProfile?.email}</p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onLogout}>Log out</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div>
            <h1>{activeMain}</h1>
            <p>{activeSub === 'Employees' ? 'Manage your employee records and role access.' : 'Martinsdirect admin workspace.'}</p>
          </div>

          <div className="topbar-right">
            <div className="logged-in-user">
              <span>Signed in as</span>
              <strong>{loggedInName}</strong>
            </div>
            <Logo small />
          </div>
        </div>

        {renderContent()}
      </main>
    </div>
  )
}

export default function App() {
  const [role, setRole] = useState(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  const handleLogin = (nextRole) => {
    setRole(nextRole)
    setNeedsSetup(demoAccounts[nextRole]?.firstLogin || false)
  }

  const handleLogout = () => {
    setRole(null)
    setNeedsSetup(false)
  }

  if (!role) return <LoginScreen onLogin={handleLogin} />
  if (role === 'franchisee' && needsSetup) return <FirstTimeSetup onComplete={() => setNeedsSetup(false)} />

  return <DashboardShell role={role} onLogout={handleLogout} />
}
