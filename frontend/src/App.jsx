import { useEffect, useMemo, useState } from 'react'
import './assets/styles/globals.css'
import { apiFetch } from "./api"

const ENV_API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim()

function stripTrailingSlash(value) {
  return (value || '').replace(/\/$/, '')
}

function inferRenderBackendUrl(hostname) {
  if (!hostname || !hostname.endsWith('.onrender.com')) return ''

  if (hostname.includes('frontend')) {
    return `https://${hostname.replace('frontend', 'backend')}`
  }

  if (hostname.includes('site')) {
    return `https://${hostname.replace('site', 'backend')}`
  }

  return ''
}

function resolveApiBaseUrl() {
  if (ENV_API_BASE_URL) return stripTrailingSlash(ENV_API_BASE_URL)

  if (typeof window === 'undefined') return ''

  const { protocol, hostname, origin } = window.location

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000'
  }

  const inferredRenderUrl = inferRenderBackendUrl(hostname)
  if (inferredRenderUrl) return inferredRenderUrl

  if (protocol.startsWith('http')) {
    return stripTrailingSlash(origin)
  }

  return ''
}

const API_BASE_URL = resolveApiBaseUrl()
const STORAGE_KEY = 'martinsdirect_auth'
const MEMBERS_KEY = 'martinsdirect_members_data'

const MEMBER_TABS = [
  { key: 'insMembers', label: 'Ins Members' },
  { key: 'membershipClub', label: 'Membership Club' },
  { key: 'society', label: 'Society' },
]

const SERVICE_TABS = [
  { key: 'funerals', label: 'Funerals' },
  { key: 'cremations', label: 'Cremations' },
  { key: 'repatriations', label: 'Repatriations' },
]

const PAYMENT_TABS = [
  { key: 'insReceipt', label: 'Ins Receipt' },
  { key: 'clubReceipt', label: 'Club Receipt' },
  { key: 'societyReceipt', label: 'Society Receipt' },
  { key: 'cashSale', label: 'Cash Sale' },
  { key: 'funeralReceipt', label: 'Funeral Receipt' },
]

const SERVICE_CONTENT = {
  funerals: {
    title: 'Funerals',
    description: 'Track funeral service requests, linked paperwork, and case progress.',
    documents: ['Death notice', 'Service order', 'Burial permit', 'Policy confirmation'],
  },
  cremations: {
    title: 'Cremations',
    description: 'Manage cremation case intake and monitor required compliance documents.',
    documents: ['Cremation consent', 'Medical certificate', 'Collection order', 'Invoice'],
  },
  repatriations: {
    title: 'Repatriations',
    description: 'Follow transport cases and monitor each supporting document before release.',
    documents: ['Passport / ID copy', 'Transit permit', 'Transport booking', 'Receiving undertaker note'],
  },
}

function apiUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
}

async function apiFetch(path, options = {}, token) {
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  }

  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
    mode: 'cors',
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed.')
  }

  return data
}

function Logo({ small = false, className = '' }) {
  return (
    <div className={`brand-lockup ${small ? 'brand-lockup-small' : ''} ${className}`.trim()} aria-label="Martinsdirect">
      <img className="brand-image" src="/logo.png" alt="Martinsdirect logo" />
    </div>
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
      const message = err?.message || 'Login failed'
      setError(
        message === 'Failed to fetch'
          ? `Unable to reach the sign-in service at ${apiUrl('/api/auth/login')}. Check VITE_API_URL on the frontend and FRONTEND_URL on the backend.`
          : message
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-backdrop" />
      <div className="auth-card">
        <section className="auth-brand-panel auth-brand-panel-refined">
          <div className="auth-brand-orb auth-brand-orb-top" />
          <div className="auth-brand-orb auth-brand-orb-bottom" />

          <div className="auth-brand-content">
            <div className="auth-brand-top">
              <Logo className="auth-logo" />
              <span className="auth-badge">Secure admin access</span>
            </div>

            <div className="auth-brand-copy auth-fade-up auth-fade-delay-1">
              <p className="auth-eyebrow auth-eyebrow-light">Martin's Funerals</p>
              <h1 className="auth-brand-title">Management Platform</h1>
              <p className="auth-copy auth-copy-refined">
                Manage operations, payments, employee records, and platform settings from one secure, centralized dashboard.
              </p>
            </div>
          </div>

          <div className="auth-brand-footer auth-fade-up auth-fade-delay-2">
            Martin's funerals Franchising professionals nationwide
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-header">
            <p className="auth-form-kicker">Administrator sign in</p>
            <h2>Welcome back</h2>
            <p>Use your Martinsdirect admin email and password to continue.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group auth-form-group">
              <label htmlFor="email">Email address</label>
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
            <button className="primary-auth-btn" type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in to dashboard'}</button>
          </form>
          <div className="auth-footer-note">
            <strong>Admin account</strong>
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
      <StatCard label="Signed in role" value={user?.role || '-'} />
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

function PaymentsPanel({ token, role, activeSubtab, setActiveSubtab }) {
  const [payments, setPayments] = useState([])
  const [error, setError] = useState('')
  const [uploadRows, setUploadRows] = useState('[{"payer_name":"Delta Retail","reference":"DELTA-1004","amount":1499.99,"franchise_name":"Pretoria West"}]')
  const [statementFile, setStatementFile] = useState(null)
  const [franchiseName, setFranchiseName] = useState('')
  const [bankName, setBankName] = useState('')
  const [uploadMode, setUploadMode] = useState('file')
  const canEdit = role === 'admin' || role === 'franchisee'
  const activeLabel = PAYMENT_TABS.find((item) => item.key === activeSubtab)?.label || 'Payments'

  const loadPayments = async () => {
    try {
      const paymentData = await apiFetch('/api/payments', {}, token)
      setPayments(Array.isArray(paymentData) ? paymentData : [])
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
        formData.append('receipt_type', activeSubtab)
        await apiFetch('/api/payments/upload-statement', { method: 'POST', body: formData }, token)
        setStatementFile(null)
      } else {
        const rows = JSON.parse(uploadRows)
        await apiFetch('/api/payments/upload-statement', {
          method: 'POST',
          body: JSON.stringify({ filename: `${activeSubtab}.json`, receipt_type: activeSubtab, transactions: rows }),
        }, token)
      }
      loadPayments()
    } catch (err) {
      setError(err.message)
    }
  }

  const allocate = async (payment) => {
    const allocatedTo = window.prompt('Allocate to', payment.allocated_to || activeLabel)
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
      body: JSON.stringify({ reference, status: 'edited', receipt_type: activeSubtab }),
    }, token)
    loadPayments()
  }

  if (!canEdit) return <div className="panel"><h2>Payments</h2><p>Users can view the dashboard but cannot manage payment records.</p></div>

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel-header"><div><h2>{activeLabel}</h2><p>Import and manage transactions for the selected receipt type.</p></div></div>
        <div className="subtab-row">
          {PAYMENT_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`subtab-btn ${activeSubtab === tab.key ? 'subtab-btn-active' : ''}`}
              onClick={() => setActiveSubtab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><div><h2>Upload bank statement</h2><p>Upload a text-based bank statement PDF or switch to manual JSON import.</p></div></div>
        <div className="badge-row">
          <button className={`btn ${uploadMode === 'file' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setUploadMode('file')}>Statement upload</button>
          <button className={`btn ${uploadMode === 'json' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setUploadMode('json')}>Manual JSON</button>
        </div>
        {uploadMode === 'file' ? (
          <>
            <div className="grid-two">
              <div className="form-group">
                <label>Statement file</label>
                <input type="file" accept=".pdf,.csv,.xlsx,.xls" onChange={(e) => setStatementFile(e.target.files?.[0] || null)} />
              </div>
              <div className="form-group">
                <label>Bank name (optional)</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Nedbank / ABSA / FNB" />
              </div>
            </div>
            <div className="form-group">
              <label>Branch / franchise (optional)</label>
              <input value={franchiseName} onChange={(e) => setFranchiseName(e.target.value)} placeholder="Pretoria West" />
            </div>
          </>
        ) : (
          <div className="form-group"><label>Transactions JSON</label><textarea className="text-area" value={uploadRows} onChange={(e) => setUploadRows(e.target.value)} /></div>
        )}
        <button className="btn btn-primary" type="button" onClick={uploadStatement}>Import transactions</button>
        {error ? <div className="auth-error top-gap">{error}</div> : null}
      </div>

      <div className="panel">
        <div className="panel-header"><div><h2>{activeLabel} transactions</h2><p>Allocate or edit imported transactions.</p></div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Payer</th><th>Reference</th><th>Amount</th><th>Status</th><th>Allocated</th><th>Actions</th></tr></thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.payer_name}</td>
                  <td>{payment.reference}</td>
                  <td>R {Number(payment.amount || 0).toFixed(2)}</td>
                  <td>{payment.status}</td>
                  <td>{payment.allocated_to || '-'}</td>
                  <td className="action-cell">
                    <button className="btn btn-secondary btn-small" type="button" onClick={() => allocate(payment)}>Allocate</button>
                    <button className="btn btn-secondary btn-small" type="button" onClick={() => editPayment(payment)}>Edit</button>
                  </td>
                </tr>
              ))}
              {!payments.length ? <tr><td colSpan="6" className="empty-row">No payments loaded yet.</td></tr> : null}
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
      method: 'PUT',
      body: JSON.stringify({ new_password: newPassword }),
    }, token)
  }

  const toggleActive = async (user) => {
    await apiFetch(`/api/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: !user.is_active }),
    }, token)
    loadUsers()
  }

  if (role !== 'admin') return <div className="panel"><h2>User management</h2><p>Only admin can manage platform users.</p></div>

  return (
    <div className="employees-grid">
      <div className="panel">
        <div className="panel-header"><div><h2>Create user</h2><p>Add admins, franchisees, or basic users.</p></div></div>
        <div className="form-group"><label>Name</label><input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
        <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} /></div>
        <div className="form-group"><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} /></div>
        <div className="grid-two">
          <div className="form-group">
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}>
              <option value="user">User</option>
              <option value="franchisee">Franchisee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={String(form.is_active)} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === 'true' }))}>
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="button" onClick={createUser}>Create user</button>
        {error ? <div className="auth-error top-gap">{error}</div> : null}
      </div>

      <div className="panel">
        <div className="panel-header"><div><h2>Existing users</h2><p>Reset passwords or disable access.</p></div></div>
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
              {!users.length ? <tr><td colSpan="5" className="empty-row">No users available.</td></tr> : null}
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

  if (role !== 'admin') return <div className="panel"><h2>Reports</h2><p>Only admin can view summary reports.</p></div>

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

function MembersPanel({ data, activeSubtab, setActiveSubtab }) {
  const rows = data[activeSubtab] || []
  const activeLabel = MEMBER_TABS.find((item) => item.key === activeSubtab)?.label || 'Members'

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel-header"><div><h2>Members</h2><p>View imported member records by section.</p></div></div>
        <div className="subtab-row">
          {MEMBER_TABS.map((category) => (
            <button
              key={category.key}
              type="button"
              className={`subtab-btn ${activeSubtab === category.key ? 'subtab-btn-active' : ''}`}
              onClick={() => setActiveSubtab(category.key)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><div><h2>{activeLabel}</h2><p>{rows.length} record{rows.length === 1 ? '' : 's'} loaded.</p></div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((row, index) => (
                <tr key={`${row.member_id || row.email || 'member'}-${index}`}>
                  <td>{row.member_id || '-'}</td>
                  <td>{row.name || '-'}</td>
                  <td>{row.surname || '-'}</td>
                  <td>{row.email || '-'}</td>
                  <td>{row.phone || '-'}</td>
                  <td>{row.status || '-'}</td>
                </tr>
              )) : <tr><td colSpan="6" className="empty-row">No records loaded yet for this subtab.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ServicesPanel({ activeSubtab, setActiveSubtab }) {
  const activeService = SERVICE_CONTENT[activeSubtab] || SERVICE_CONTENT.funerals

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel-header"><div><h2>Services</h2><p>Select a service section to review linked documents and workflow requirements.</p></div></div>
        <div className="subtab-row">
          {SERVICE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`subtab-btn ${activeSubtab === tab.key ? 'subtab-btn-active' : ''}`}
              onClick={() => setActiveSubtab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="content-grid service-grid">
        <div className="panel">
          <div className="panel-header"><div><h2>{activeService.title}</h2><p>{activeService.description}</p></div></div>
          <div className="badge-row">
            <span className="pill">Case intake</span>
            <span className="pill">Documents linked</span>
            <span className="pill">Ready for workflow rules</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><div><h2>Required documents</h2><p>Use this as the linked checklist for the selected service type.</p></div></div>
          <div className="document-list">
            {activeService.documents.map((document) => <span key={document} className="document-chip">{document}</span>)}
          </div>
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
  const [activeMemberSubtab, setActiveMemberSubtab] = useState('insMembers')
  const [activeServiceSubtab, setActiveServiceSubtab] = useState('funerals')
  const [activePaymentSubtab, setActivePaymentSubtab] = useState('insReceipt')
  const [reports, setReports] = useState(null)
  const [memberData, setMemberData] = useState(() => {
    try {
      const stored = localStorage.getItem(MEMBERS_KEY)
      return stored ? JSON.parse(stored) : { insMembers: [], membershipClub: [], society: [] }
    } catch {
      return { insMembers: [], membershipClub: [], society: [] }
    }
  })

  const menuSections = useMemo(() => {
    const sections = [
      { key: 'overview', label: 'Overview' },
      { key: 'members', label: 'Members', items: MEMBER_TABS },
      { key: 'services', label: 'Services', items: SERVICE_TABS },
      { key: 'payments', label: 'Payments', items: PAYMENT_TABS },
    ]
    if (user?.role === 'admin') sections.push({ key: 'users', label: 'User Management' }, { key: 'reports', label: 'Reports' })
    return sections
  }, [user?.role])

  useEffect(() => {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(memberData))
  }, [memberData])

  useEffect(() => {
    if (active !== 'members') return
    const loadMembers = async () => {
      try {
        const data = await apiFetch('/api/members', {}, token)
        if (data && typeof data === 'object') {
          setMemberData({
            insMembers: data.insMembers || data.ins_members || [],
            membershipClub: data.membershipClub || data.membership_club || [],
            society: data.society || [],
          })
        }
      } catch {
        // keep local fallback data if endpoint is unavailable
      }
    }
    loadMembers()
  }, [active, token])

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

  const headingMap = {
    overview: 'Overview',
    members: 'Members',
    services: 'Services',
    payments: 'Payments',
    users: 'User Management',
    reports: 'Reports',
  }

  const subtitleMap = {
    overview: 'Admin and franchisee rules are active in both UI and backend routes.',
    members: 'Review and manage member records by section from the left sidebar.',
    services: 'Service subtabs now align cleanly and group linked documents by workflow.',
    payments: 'Payment receipt subtabs are fixed and grouped professionally in the left sidebar.',
    users: 'Create and manage portal access for admins, franchisees, and users.',
    reports: 'Summary reporting remains available for admin access.',
  }

  const openSection = (sectionKey, subtabKey) => {
    setActive(sectionKey)
    if (sectionKey === 'members' && subtabKey) setActiveMemberSubtab(subtabKey)
    if (sectionKey === 'services' && subtabKey) setActiveServiceSubtab(subtabKey)
    if (sectionKey === 'payments' && subtabKey) setActivePaymentSubtab(subtabKey)
    setSidebarOpen(false)
  }

  const renderPanel = () => {
    if (active === 'payments') return <PaymentsPanel token={token} role={user?.role} activeSubtab={activePaymentSubtab} setActiveSubtab={setActivePaymentSubtab} />
    if (active === 'members') return <MembersPanel data={memberData} activeSubtab={activeMemberSubtab} setActiveSubtab={setActiveMemberSubtab} />
    if (active === 'services') return <ServicesPanel activeSubtab={activeServiceSubtab} setActiveSubtab={setActiveServiceSubtab} />
    if (active === 'users') return <UserManagementPanel token={token} role={user?.role} />
    if (active === 'reports') return <ReportsPanel token={token} role={user?.role} reports={reports} onRefresh={refreshReports} />
    return <OverviewPanel user={user} reports={reports} />
  }

  return (
    <div className="dashboard-shell">
      <button className="mobile-menu-btn" type="button" onClick={() => setSidebarOpen(true)}>Menu</button>
      {sidebarOpen ? <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} /> : null}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Logo small className="sidebar-logo-only" />
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-copy">
            <strong>{user?.name || 'User'}</strong>
            <p>{user?.email || ''}</p>
            <span className="pill">{user?.role || 'unknown'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuSections.map((section) => (
            <div key={section.key} className={`nav-group ${active === section.key ? 'nav-group-active' : ''}`}>
              <button
                className={`nav-btn ${active === section.key ? 'nav-btn-active' : ''}`}
                type="button"
                onClick={() => openSection(section.key)}
              >
                {section.label}
              </button>

              {section.items ? (
                <div className="sidebar-subnav">
                  {section.items.map((item) => {
                    const isActive =
                      (section.key === 'members' && active === 'members' && activeMemberSubtab === item.key) ||
                      (section.key === 'services' && active === 'services' && activeServiceSubtab === item.key) ||
                      (section.key === 'payments' && active === 'payments' && activePaymentSubtab === item.key)

                    return (
                      <button
                        key={item.key}
                        className={`subnav-btn ${isActive ? 'subnav-btn-active' : ''}`}
                        type="button"
                        onClick={() => openSection(section.key, item.key)}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-secondary full-width" type="button" onClick={onLogout}>Log out</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div className="topbar-title-wrap">
            <h1>{headingMap[active] || 'Dashboard'}</h1>
            <p>{subtitleMap[active] || 'Martinsdirect Operations Portal'}</p>
          </div>
          <div className="topbar-right"><Logo small className="topbar-logo-only" /></div>
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
