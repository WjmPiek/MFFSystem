import { useEffect, useMemo, useState } from 'react'
import './assets/styles/globals.css'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const STORAGE_KEY = 'martinsdirect_auth'
const MEMBER_CATEGORIES = [
  { key: 'ins_members', label: 'Ins Members' },
  { key: 'membership_club', label: 'Membership Club' },
  { key: 'society', label: 'Society' },
]

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

  const response = await fetch(apiUrl(path), { ...options, headers })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed.')
  }

  return data
}

function Logo({ small = false }) {
  const [failed, setFailed] = useState(false)

  if (failed) return <div className={small ? 'logo-fallback logo-fallback-small' : 'logo-fallback'}>MD</div>

  return <img src="/logo.png" alt="Martinsdirect logo" className={small ? 'brand-logo-small' : 'brand-logo-large'} onError={() => setFailed(true)} />
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
            <h1>Sign in to manage users, payments, members, reports, and imports.</h1>
            <p className="auth-copy">
              Admin manages the full platform. Franchisees can upload bank statements, import member data, allocate payments, and edit transactions.
            </p>
          </div>
          <div className="auth-feature-list">
            <div className="auth-feature-item"><strong>Admin</strong><span>Full editing, user management, reports, password resets.</span></div>
            <div className="auth-feature-item"><strong>Franchisee</strong><span>Statement uploads, member imports, payment allocation, transaction edits.</span></div>
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
      <StatCard label="Signed in role" value={user?.role || '-'} />
      <StatCard label="Users" value={reports?.totals?.users ?? '-'} />
      <StatCard label="Payments" value={reports?.totals?.payments ?? '-'} />
      <div className="panel full-span">
        <div className="panel-header"><div><h2>Role access</h2><p>Platform permissions are enforced on the backend and reflected in the UI.</p></div></div>
        <div className="badge-row">
          <span className="pill">Admin: full control</span>
          <span className="pill">Franchisee: upload bank statements, import members, allocate payments, edit transactions</span>
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
        await apiFetch('/api/payments/upload-statement', { method: 'POST', body: formData }, token)
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
    await apiFetch(`/api/payments/${payment.id}/allocate`, { method: 'PUT', body: JSON.stringify({ allocated_to: allocatedTo }) }, token)
    loadPayments()
  }

  const editPayment = async (payment) => {
    const reference = window.prompt('New reference', payment.reference)
    if (!reference) return
    await apiFetch(`/api/payments/${payment.id}`, { method: 'PUT', body: JSON.stringify({ reference, status: 'edited' }) }, token)
    loadPayments()
  }

  if (!canEdit) return <div className="panel"><h2>Payments</h2><p>Users can view the dashboard but cannot manage payment records.</p></div>

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel-header"><div><h2>Upload bank statement</h2><p>Upload PDF, CSV, or Excel bank statements for supported banks, or switch to manual JSON import.</p></div></div>
        <div className="badge-row">
          <button className={`btn ${uploadMode === 'file' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setUploadMode('file')}>Statement file</button>
          <button className={`btn ${uploadMode === 'json' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setUploadMode('json')}>Manual JSON</button>
        </div>
        {uploadMode === 'file' ? (
          <>
            <div className="form-group">
              <label>Statement file</label>
              <input type="file" accept=".pdf,.csv,.xlsx,.xls" onChange={(e) => setStatementFile(e.target.files?.[0] || null)} />
            </div>
            <div className="grid-two">
              <div className="form-group">
                <label>Franchise name (optional)</label>
                <input value={franchiseName} onChange={(e) => setFranchiseName(e.target.value)} placeholder="Pretoria West" />
              </div>
              <div className="form-group">
                <label>Bank (optional)</label>
                <select value={bankName} onChange={(e) => setBankName(e.target.value)}>
                  <option value="">Auto detect</option>
                  {importOptions.supported_banks.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
                </select>
              </div>
            </div>
            <p className="helper-text">Supported types: {(importOptions.supported_extensions || []).join(', ') || '.pdf, .csv, .xlsx, .xls'}.</p>
          </>
        ) : (
          <div className="form-group"><label>Transactions JSON</label><textarea className="text-area" value={uploadRows} onChange={(e) => setUploadRows(e.target.value)} /></div>
        )}
        <button className="btn btn-primary" type="button" onClick={uploadStatement}>Import transactions</button>
        {error ? <div className="auth-error">{error}</div> : null}
      </div>
      <div className="panel">
        <div className="panel-header"><div><h2>Transactions</h2><p>Allocate or edit imported transactions.</p></div></div>
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
    await apiFetch(`/api/users/${user.id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password: newPassword }) }, token)
    loadUsers()
  }

  const toggleActive = async (user) => {
    await apiFetch(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ is_active: !user.is_active }) }, token)
    loadUsers()
  }

  if (role !== 'admin') return <div className="panel"><h2>User management</h2><p>Only admin can manage users and reset passwords.</p></div>

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

function MembersPanel({ token, role, category, onCategoryChange }) {
  const [data, setData] = useState({ members: [], label: 'Members' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const canView = role === 'admin' || role === 'franchisee'

  const loadMembers = async () => {
    if (!canView) return
    setLoading(true)
    try {
      const result = await apiFetch(`/api/members?category=${category}`, {}, token)
      setData(result)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [token, role, category])

  if (!canView) return <div className="panel"><h2>Members</h2><p>Only admin and franchisee users can view imported member records.</p></div>

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel-header"><div><h2>Members</h2><p>Imported member records are grouped by category.</p></div></div>
        <div className="subtab-row">
          {MEMBER_CATEGORIES.map((item) => (
            <button key={item.key} className={`subtab-btn ${category === item.key ? 'subtab-btn-active' : ''}`} type="button" onClick={() => onCategoryChange(item.key)}>{item.label}</button>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="panel-header"><div><h2>{data.label}</h2><p>{loading ? 'Loading imported members...' : `${data.members.length} record(s) loaded from imports.`}</p></div></div>
        {error ? <div className="auth-error">{error}</div> : null}
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Member ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Join date</th><th>Status</th><th>Group</th></tr></thead>
            <tbody>
              {data.members.map((member) => (
                <tr key={member.id}>
                  <td>{member.member_number || '-'}</td>
                  <td>{member.full_name}</td>
                  <td>{member.email || '-'}</td>
                  <td>{member.phone || '-'}</td>
                  <td>{member.join_date || '-'}</td>
                  <td>{member.status || '-'}</td>
                  <td>{member.organisation_name || '-'}</td>
                </tr>
              ))}
              {!data.members.length ? <tr><td colSpan="7" className="empty-cell">No member records imported yet for this section.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ImportDataPanel({ token, role, onImported, selectedCategory }) {
  const [templateInfo, setTemplateInfo] = useState(null)
  const [file, setFile] = useState(null)
  const [csvCategory, setCsvCategory] = useState(selectedCategory || 'ins_members')
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [working, setWorking] = useState(false)
  const canImport = role === 'admin' || role === 'franchisee'

  useEffect(() => {
    if (!canImport) return
    apiFetch('/api/members/import-template-info', {}, token)
      .then(setTemplateInfo)
      .catch(() => setTemplateInfo(null))
  }, [token, role])

  const runWithProgress = async (action) => {
    setWorking(true)
    setProgress(12)
    setError('')
    setMessage('')
    try {
      await new Promise((resolve) => setTimeout(resolve, 180))
      setProgress(38)
      const result = await action()
      setProgress(100)
      return result
    } finally {
      setTimeout(() => {
        setWorking(false)
        setProgress(0)
      }, 300)
    }
  }

  const buildForm = () => {
    const formData = new FormData()
    formData.append('file', file)
    if (file?.name?.toLowerCase().endsWith('.csv')) formData.append('category', csvCategory)
    return formData
  }

  const previewImport = async () => {
    if (!file) {
      setError('Choose an Excel or CSV file first.')
      return
    }
    try {
      const result = await runWithProgress(() => apiFetch('/api/members/import/preview', { method: 'POST', body: buildForm() }, token))
      setPreview(result)
      setMessage('Preview ready. Review duplicates and validation errors before saving.')
    } catch (err) {
      setError(err.message)
    }
  }

  const commitImport = async () => {
    if (!file) {
      setError('Choose an Excel or CSV file first.')
      return
    }
    try {
      const result = await runWithProgress(() => apiFetch('/api/members/import/commit', { method: 'POST', body: buildForm() }, token))
      setPreview(null)
      setMessage(result.message)
      onImported(csvCategory)
    } catch (err) {
      setError(err.message)
    }
  }

  if (!canImport) return <div className="panel"><h2>Import Data</h2><p>Only admin and franchisee users can import member data.</p></div>

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel-header"><div><h2>Import portal</h2><p>Download the Excel workbook, fill in the member sheets, preview the import, then save it to the Members subtabs.</p></div></div>
        <div className="download-bar">
          <div>
            <strong>Template workbook</strong>
            <p>Sheets: Ins Members, Membership Club, Society.</p>
          </div>
          <div className="download-actions">
            <a className="btn btn-secondary" href="/templates/members-import-template.xlsx" download>Download Excel template</a>
          </div>
        </div>
        <div className="helper-card-grid">
          {(templateInfo?.notes || []).map((note) => <div key={note} className="helper-card">{note}</div>)}
        </div>
        <div className="form-group">
          <label>Import file</label>
          <input type="file" accept=".xlsx,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="grid-two">
          <div className="form-group">
            <label>CSV category</label>
            <select value={csvCategory} onChange={(e) => setCsvCategory(e.target.value)}>
              {MEMBER_CATEGORIES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Selected file</label>
            <input value={file?.name || 'No file chosen'} readOnly />
          </div>
        </div>
        <div className="panel-actions">
          <button className="btn btn-secondary" type="button" onClick={previewImport} disabled={working}>Preview import</button>
          <button className="btn btn-primary" type="button" onClick={commitImport} disabled={working}>Save import</button>
        </div>
        <div className="progress-shell"><div className="progress-bar" style={{ width: `${progress}%` }} /></div>
        {message ? <div className="auth-error auth-info">{message}</div> : null}
        {error ? <div className="auth-error">{error}</div> : null}
      </div>

      <div className="content-grid import-summary-grid">
        {MEMBER_CATEGORIES.map((category) => {
          const stats = preview?.summary?.[category.key]
          return <StatCard key={category.key} label={category.label} value={stats ? `${stats.valid} valid / ${stats.duplicates} duplicates / ${stats.errors} errors` : 'No preview yet'} />
        })}
      </div>

      {preview ? (
        <>
          <div className="panel">
            <div className="panel-header"><div><h2>Preview rows</h2><p>These rows will be imported into the matching Members subtab.</p></div></div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Category</th><th>Member ID</th><th>Name</th><th>Email</th><th>Status</th><th>Group</th></tr></thead>
                <tbody>
                  {preview.rows.slice(0, 20).map((row, index) => (
                    <tr key={`${row.category}-${row.row_number}-${index}`}>
                      <td>{MEMBER_CATEGORIES.find((item) => item.key === row.category)?.label || row.category}</td>
                      <td>{row.member_number || '-'}</td>
                      <td>{row.full_name}</td>
                      <td>{row.email || '-'}</td>
                      <td>{row.status || '-'}</td>
                      <td>{row.organisation_name || '-'}</td>
                    </tr>
                  ))}
                  {!preview.rows.length ? <tr><td colSpan="6" className="empty-cell">No valid rows in preview.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel">
            <div className="panel-header"><div><h2>Validation results</h2><p>Fix these rows before saving if you want them included.</p></div></div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Type</th><th>Category</th><th>Row</th><th>Name</th><th>Details</th></tr></thead>
                <tbody>
                  {preview.errors.map((row, index) => (
                    <tr key={`error-${index}`}>
                      <td>Error</td>
                      <td>{MEMBER_CATEGORIES.find((item) => item.key === row.category)?.label || row.category}</td>
                      <td>{row.row_number}</td>
                      <td>{row.full_name || '-'}</td>
                      <td>{(row.errors || []).join(', ')}</td>
                    </tr>
                  ))}
                  {preview.duplicates.map((row, index) => (
                    <tr key={`duplicate-${index}`}>
                      <td>Duplicate</td>
                      <td>{MEMBER_CATEGORIES.find((item) => item.key === row.category)?.label || row.category}</td>
                      <td>{row.row_number}</td>
                      <td>{row.full_name || '-'}</td>
                      <td>Existing Email/Member ID already loaded.</td>
                    </tr>
                  ))}
                  {!preview.errors.length && !preview.duplicates.length ? <tr><td colSpan="5" className="empty-cell">No duplicates or validation issues found.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function DashboardShell({ auth, onLogout }) {
  const user = auth?.user || {}
  const token = auth?.token || ''
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [active, setActive] = useState('overview')
  const [reports, setReports] = useState(null)
  const [memberCategory, setMemberCategory] = useState('ins_members')

  const navItems = useMemo(() => {
    const items = [
      { key: 'overview', label: 'Overview' },
      { key: 'payments', label: 'Payments' },
      { key: 'members', label: 'Members' },
      { key: 'import-data', label: 'Import Data' },
    ]
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
    if (active === 'members') return <MembersPanel token={token} role={user?.role} category={memberCategory} onCategoryChange={setMemberCategory} />
    if (active === 'import-data') return <ImportDataPanel token={token} role={user?.role} selectedCategory={memberCategory} onImported={(category) => { setMemberCategory(category || memberCategory); setActive('members') }} />
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
          {active === 'members' ? (
            <div className="sidebar-subnav">
              {MEMBER_CATEGORIES.map((item) => (
                <button key={item.key} className={`subnav-btn ${memberCategory === item.key ? 'subnav-btn-active' : ''}`} type="button" onClick={() => { setMemberCategory(item.key); setSidebarOpen(false) }}>
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
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
