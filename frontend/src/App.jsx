import { useEffect, useMemo, useState } from 'react'
import './assets/styles/globals.css'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const STORAGE_KEY = 'martinsdirect_auth'

function apiUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
}

async function apiFetch(path, options = {}, token) {
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(apiUrl(path), { ...options, headers })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed.')
  }

  return data
}

function Logo({ small = false }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <div className={small ? 'logo-fallback logo-fallback-small' : 'logo-fallback'}>MD</div>
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

function LoginScreen({ onLogin, onOpenReset }) {
  const [email, setEmail] = useState('wjm@martinsdirect.com')
  const [password, setPassword] = useState('Renette7')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
  event.preventDefault()
  setSubmitting(true)
  setError('')

  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    const safeAuth = {
      token: data?.token || data?.access_token,
      user: data?.user,
    }

    if (!safeAuth.token || !safeAuth.user) {
      throw new Error('Invalid login response from server')
    }

    onLogin(safeAuth)
  } catch (err) {
    setError(err.message || 'Login failed')
  } finally {
    setSubmitting(false)
  }
}

  return (
    <div className="auth-shell">
      <div className="auth-backdrop" />
      <div className="auth-card">
        <section className="auth-brand-panel">
          <div className="auth-brand-top">
            <Logo />
            <span className="auth-badge">Mobile-ready secure dashboard</span>
          </div>
          <div>
            <p className="auth-eyebrow">Martinsdirect Management Platform</p>
            <h1>Sign in to manage users, payments, reports, and statements.</h1>
            <p className="auth-copy">
              Admin manages the full platform. Franchisees can upload bank PDF, CSV, and Excel statements, allocate payments, and edit transactions.
            </p>
          </div>
          <div className="auth-feature-list">
            <div className="auth-feature-item"><strong>Admin</strong><span>Full editing, user management, reports, password resets.</span></div>
            <div className="auth-feature-item"><strong>Franchisee</strong><span>Statement uploads, payment allocation, transaction edits.</span></div>
            <div className="auth-feature-item"><strong>User</strong><span>Read-only dashboard access.</span></div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-header">
            <p className="auth-form-kicker">Secure sign in</p>
            <h2>Welcome back</h2>
            <p>Use your Martinsdirect account details.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group auth-form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </div>
            <div className="form-group auth-form-group">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {error ? <div className="auth-error">{error}</div> : null}
            <button className="primary-auth-btn" type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}</button>
          </form>
          <div className="auth-footer-note">
            <strong>Default seeded admin</strong>
            <span>wjm@martinsdirect.com</span>
            <small>Use Forgot password to generate a reset token in non-production mode.</small>
            <button type="button" className="link-btn" onClick={onOpenReset}>Forgot password?</button>
          </div>
        </section>
      </div>
    </div>
  )
}

function ResetPasswordModal({ open, onClose, token, onTokenChange }) {
  const [email, setEmail] = useState('wjm@martinsdirect.com')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const requestReset = async () => {
    setLoading(true)
    setMessage('')
    try {
      const data = await apiFetch('/api/auth/request-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      if (data.reset_token) onTokenChange(data.reset_token)
      setMessage(data.reset_token ? `Reset token: ${data.reset_token}` : data.message)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    setLoading(true)
    setMessage('')
    try {
      const data = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: newPassword }),
      })
      setMessage(data.message)
      setNewPassword('')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header"><div><h2>Password reset</h2><p>Generate a token, then reset the password.</p></div></div>
        <div className="form-group"><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <button className="btn btn-secondary" type="button" onClick={requestReset} disabled={loading}>Generate reset token</button>
        <div className="grid-two">
          <div className="form-group"><label>Token</label><input value={token} onChange={(e) => onTokenChange(e.target.value)} /></div>
          <div className="form-group"><label>New password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
        </div>
        <div className="panel-actions">
          <button className="btn btn-primary" type="button" onClick={resetPassword} disabled={loading}>Reset password</button>
          <button className="btn btn-secondary" type="button" onClick={onClose}>Close</button>
        </div>
        {message ? <div className="auth-error auth-info">{message}</div> : null}
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>
}

function OverviewPanel({ user, reports }) {
  return (
    <div className="content-grid">
      <StatCard label="Signed in role" value={user.role} />
      <StatCard label="Users" value={reports?.totals?.users ?? '-'} />
      <StatCard label="Payments" value={reports?.totals?.payments ?? '-'} />
      <div className="panel full-span">
        <div className="panel-header"><div><h2>Role access</h2><p>Platform permissions are enforced on the backend and reflected in the UI.</p></div></div>
        <div className="badge-row">
          <span className="pill">Admin: full control</span>
          <span className="pill">Franchisee: upload bank PDF, CSV, and Excel statements, allocate payments, edit transactions</span>
          <span className="pill">User: read only</span>
        </div>
      </div>
    </div>
  )
}

function PaymentsPanel({ token, role }) {
  const [payments, setPayments] = useState([])
  const [error, setError] = useState('')
  const [uploadRows, setUploadRows] = useState('[{"payer_name":"Delta Retail","reference":"DELTA-1004","amount":1499.99,"franchise_name":"Pretoria West"}]')
  const [statementFile, setStatementFile] = useState(null)
  const [franchiseName, setFranchiseName] = useState('')
  const [bankName, setBankName] = useState('')
  const [uploadMode, setUploadMode] = useState('file')
  const [importOptions, setImportOptions] = useState({ supported_banks: [], supported_extensions: [] })
  const canEdit = role === 'admin' || role === 'franchisee'

  const loadPayments = async () => {
    try {
      const [paymentData, optionData] = await Promise.all([
        apiFetch('/api/payments', {}, token),
        apiFetch('/api/payments/import-options', {}, token).catch(() => ({ supported_banks: [], supported_extensions: [] })),
      ])
      setPayments(paymentData)
      setImportOptions(optionData)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (canEdit) loadPayments()
  }, [token, role])

  const uploadStatement = async () => {
    try {
      setError('')
      if (uploadMode === 'file') {
        if (!statementFile) throw new Error('Choose a bank statement file first.')
        const formData = new FormData()
        formData.append('statement', statementFile)
        if (franchiseName.trim()) formData.append('franchise_name', franchiseName.trim())
        if (bankName.trim()) formData.append('bank_name', bankName.trim())
        await apiFetch('/api/payments/upload-statement', {
          method: 'POST',
          body: formData,
        }, token)
        setStatementFile(null)
      } else {
        const rows = JSON.parse(uploadRows)
        await apiFetch('/api/payments/upload-statement', {
          method: 'POST',
          body: JSON.stringify({ filename: 'manual-import.json', transactions: rows }),
        }, token)
      }
      loadPayments()
    } catch (err) {
      setError(err.message)
    }
  }

  const allocate = async (payment) => {
    const allocatedTo = window.prompt('Allocate to', payment.allocated_to || 'Franchise Fee')
    if (!allocatedTo) return
    await apiFetch(`/api/payments/${payment.id}/allocate`, {
      method: 'PUT',
      body: JSON.stringify({ allocated_to: allocatedTo }),
    }, token)
    loadPayments()
  }

  const editPayment = async (payment) => {
    const reference = window.prompt('New reference', payment.reference)
    if (!reference) return
    await apiFetch(`/api/payments/${payment.id}`, {
      method: 'PUT',
      body: JSON.stringify({ reference, status: 'edited' }),
    }, token)
    loadPayments()
  }

  if (!canEdit) {
    return <div className="panel"><h2>Payments</h2><p>Users can view the dashboard but cannot manage payment records.</p></div>
  }

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel-header"><div><h2>Upload bank statement</h2><p>Upload a text-based bank statement PDF for extraction, or switch to manual JSON import.</p></div></div>
        <div className="badge-row">
          <button className={`btn ${uploadMode === 'pdf' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setUploadMode('pdf')}>PDF upload</button>
          <button className={`btn ${uploadMode === 'json' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setUploadMode('json')}>Manual JSON</button>
        </div>
        {uploadMode === 'pdf' ? (
          <>
            <div className="form-group">
              <label>Statement PDF</label>
              <input type="file" accept="application/pdf,.pdf" onChange={(e) => setStatementFile(e.target.files?.[0] || null)} />
            </div>
            <div className="form-group">
              <label>Franchise name (optional)</label>
              <input value={franchiseName} onChange={(e) => setFranchiseName(e.target.value)} placeholder="Pretoria West" />
            </div>
            <p className="helper-text">Best results come from text-based bank statement PDFs with date, description, and amount columns.</p>
          </>
        ) : (
          <div className="form-group"><label>Transactions JSON</label><textarea className="text-area" value={uploadRows} onChange={(e) => setUploadRows(e.target.value)} /></div>
        )}
        <button className="btn btn-primary" type="button" onClick={uploadStatement}>Import transactions</button>
      </div>
      <div className="panel">
        <div className="panel-header"><div><h2>Transactions</h2><p>Allocate or edit imported transactions.</p></div></div>
        {error ? <div className="auth-error">{error}</div> : null}
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Payer</th><th>Reference</th><th>Amount</th><th>Status</th><th>Allocated</th><th>Actions</th></tr></thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.payer_name}</td>
                  <td>{payment.reference}</td>
                  <td>R {Number(payment.amount).toFixed(2)}</td>
                  <td>{payment.status}</td>
                  <td>{payment.allocated_to || '-'}</td>
                  <td className="action-cell">
                    <button className="btn btn-secondary btn-small" type="button" onClick={() => allocate(payment)}>Allocate</button>
                    <button className="btn btn-secondary btn-small" type="button" onClick={() => editPayment(payment)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function UserManagementPanel({ token, role }) {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', is_active: true })
  const [error, setError] = useState('')

  const loadUsers = async () => {
    try {
      const data = await apiFetch('/api/users', {}, token)
      setUsers(data)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (role === 'admin') loadUsers()
  }, [token, role])

  const createUser = async () => {
    try {
      await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(form) }, token)
      setForm({ name: '', email: '', password: '', role: 'user', is_active: true })
      loadUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const resetPassword = async (user) => {
    const newPassword = window.prompt(`New password for ${user.email}`)
    if (!newPassword) return
    await apiFetch(`/api/users/${user.id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    }, token)
    loadUsers()
  }

  const toggleActive = async (user) => {
    await apiFetch(`/api/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: !user.is_active }),
    }, token)
    loadUsers()
  }

  if (role !== 'admin') {
    return <div className="panel"><h2>User management</h2><p>Only admin can manage users and reset passwords.</p></div>
  }

  return (
    <div className="employees-grid">
      <div className="panel">
        <div className="panel-header"><div><h2>Create user</h2><p>Add admin, franchisee, or user accounts.</p></div></div>
        <div className="form-group"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="form-group"><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="grid-two">
          <div className="form-group"><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div className="form-group"><label>Role</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="user">User</option><option value="franchisee">Franchisee</option><option value="admin">Admin</option></select></div>
        </div>
        <button className="btn btn-primary" type="button" onClick={createUser}>Create user</button>
        {error ? <div className="auth-error">{error}</div> : null}
      </div>
      <div className="panel">
        <div className="panel-header"><div><h2>Existing users</h2><p>Admin-only account management.</p></div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{user.is_active ? 'Active' : 'Disabled'}</td>
                  <td className="action-cell">
                    <button className="btn btn-secondary btn-small" type="button" onClick={() => toggleActive(user)}>{user.is_active ? 'Disable' : 'Enable'}</button>
                    <button className="btn btn-secondary btn-small" type="button" onClick={() => resetPassword(user)}>Reset password</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ReportsPanel({ token, role, reports, onRefresh }) {
  useEffect(() => {
    if (role === 'admin') onRefresh()
  }, [token, role])

  if (role !== 'admin') {
    return <div className="panel"><h2>Reports</h2><p>Only admin can view summary reports.</p></div>
  }

  return (
    <div className="content-grid">
      <StatCard label="Total users" value={reports?.totals?.users ?? 0} />
      <StatCard label="Payment records" value={reports?.totals?.payments ?? 0} />
      <StatCard label="Allocated amount" value={`R ${(reports?.totals?.allocated_amount ?? 0).toFixed(2)}`} />
      <StatCard label="Unmatched" value={reports?.totals?.unmatched_count ?? 0} />
      <div className="panel full-span">
        <div className="panel-header"><div><h2>Role breakdown</h2><p>Admin-only reporting panel.</p></div></div>
        <div className="badge-row">
          {Object.entries(reports?.role_breakdown || {}).map(([key, value]) => <span key={key} className="pill">{key}: {value}</span>)}
        </div>
      </div>
    </div>
  )
}

function DashboardShell({ auth, onLogout }) {
  const user = auth?.user || {}
  const token = auth?.token || ''
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [active, setActive] = useState('overview')
  const [reports, setReports] = useState(null)

  const navItems = useMemo(() => {
    const items = [{ key: 'overview', label: 'Overview' }, { key: 'payments', label: 'Payments' }]
if (user?.role === 'admin') items.push({ key: 'users', label: 'User Management' }, { key: 'reports', label: 'Reports' })
    return items
  }, [user?.role])

  const refreshReports = async () => {
    try {
      const data = await apiFetch('/api/reports/summary', {}, token)
      setReports(data)
    } catch {
      setReports(null)
    }
  }

  useEffect(() => {
    refreshReports()
  }, [token])

  const renderPanel = () => {
    if (active === 'payments') return <PaymentsPanel token={token} role={user?.role} />
    if (active === 'users') return <UserManagementPanel token={token} role={user?.role} />
    if (active === 'reports') return <ReportsPanel token={token} role={user?.role} reports={reports} onRefresh={refreshReports} />
    return <OverviewPanel user={user} reports={reports} />
  }

  return (
    <div className="dashboard-shell dashboard-mobile-shell">
      <button className="mobile-menu-btn" type="button" onClick={() => setSidebarOpen(true)}>Menu</button>
      {sidebarOpen ? <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} /> : null}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Logo small />
          <div><strong>Martinsdirect</strong><p>Operations Portal</p></div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-brand-mark">MD</div>
          <div><strong>{user?.name || 'User'}</strong><p>{user?.email || ''}</p><span className="pill">{user?.role || 'unknown'}</span></div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button key={item.key} className={`nav-btn ${active === item.key ? 'nav-btn-active' : ''}`} type="button" onClick={() => { setActive(item.key); setSidebarOpen(false) }}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn btn-secondary" type="button" onClick={onLogout}>Log out</button>
        </div>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <div><h1>{navItems.find((item) => item.key === active)?.label || 'Dashboard'}</h1><p>Admin and franchisee rules are active in both UI and backend routes.</p></div>
          <div className="topbar-right"><Logo small /></div>
        </div>
        {renderPanel()}
      </main>
    </div>
  )
}

export default function App() {
  const [auth, setAuth] = useState(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : null
    return parsed?.token && parsed?.user ? parsed : null
  } catch {
    return null
  }
})
  const [resetOpen, setResetOpen] = useState(false)
  const [resetToken, setResetToken] = useState('')

  useEffect(() => {
    if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    else localStorage.removeItem(STORAGE_KEY)
  }, [auth])

  if (!auth) {
    return (
      <>
        <LoginScreen onLogin={setAuth} onOpenReset={() => setResetOpen(true)} />
        <ResetPasswordModal open={resetOpen} onClose={() => setResetOpen(false)} token={resetToken} onTokenChange={setResetToken} />
      </>
    )
  }

  return <DashboardShell auth={auth} onLogout={() => setAuth(null)} />
}
