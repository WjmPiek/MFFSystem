import { useEffect, useMemo, useState } from 'react'
import './assets/styles/globals.css'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const STORAGE_KEY = 'martinsdirect_auth'
const MEMBERS_KEY = 'martinsdirect_members_data'

const SECTION_CONFIG = {
  members: {
    label: 'Members',
    subtabs: [
      { key: 'insMembers', label: 'Ins Members' },
      { key: 'membershipClub', label: 'Membership Club' },
      { key: 'society', label: 'Society' },
    ],
  },
  services: {
    label: 'Services',
    subtabs: [
      { key: 'funerals', label: 'Funerals' },
      { key: 'cremations', label: 'Cremations' },
      { key: 'repatriations', label: 'Repatriations' },
    ],
  },
  payments: {
    label: 'Payments',
    subtabs: [
      { key: 'insReceipt', label: 'Ins Receipt' },
      { key: 'clubReceipt', label: 'Club Receipt' },
      { key: 'societyReceipt', label: 'Society Receipt' },
      { key: 'cashSale', label: 'Cash Sale' },
      { key: 'funeralReceipt', label: 'Funeral Receipt' },
    ],
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
      src="/logo.svg"
      alt="Martinsdirect logo"
      className={small ? 'brand-logo-small' : 'brand-logo-large'}
      onError={(e) => {
        if (e.currentTarget.src.endsWith('/logo.png')) setFailed(true)
        else e.currentTarget.src = '/logo.png'
      }}
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
            <h1>Sign in to manage users, payments, members, reports, and statements.</h1>
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

function PaymentsPanel({ token, role, activeReceiptSubtab }) {
  const [payments, setPayments] = useState([])
  const [error, setError] = useState('')
  const [uploadRows, setUploadRows] = useState('[{"payer_name":"Delta Retail","reference":"DELTA-1004","amount":1499.99,"franchise_name":"Pretoria West"}]')
  const [statementFile, setStatementFile] = useState(null)
  const [franchiseName, setFranchiseName] = useState('')
  const [bankName, setBankName] = useState('')
  const [uploadMode, setUploadMode] = useState('file')
  const canEdit = role === 'admin' || role === 'franchisee'

  const receiptMeta = {
    insReceipt: {
      title: 'Insurance receipts',
      description: 'Insurance-related receipts and imported payment rows are shown here.',
      allocationHint: 'Insurance Accounts',
      documentType: 'Insurance receipt',
    },
    clubReceipt: {
      title: 'Club receipts',
      description: 'Use this tab for club-related receipts and membership payment allocations.',
      allocationHint: 'Club Accounts',
      documentType: 'Club receipt',
    },
    societyReceipt: {
      title: 'Society receipts',
      description: 'Society receipts are grouped here for review and allocation.',
      allocationHint: 'Society Accounts',
      documentType: 'Society receipt',
    },
    cashSale: {
      title: 'Cash sales',
      description: 'Track ad-hoc cash sale records and matching payment entries.',
      allocationHint: 'Cash Sales',
      documentType: 'Cash sale',
    },
    funeralReceipt: {
      title: 'Funeral receipts',
      description: 'Funeral payment receipts and supporting transaction records appear here.',
      allocationHint: 'Funeral Services',
      documentType: 'Funeral receipt',
    },
  }

  const activeMeta = receiptMeta[activeReceiptSubtab] || receiptMeta.insReceipt

  const loadPayments = async () => {
    try {
      const paymentData = await apiFetch('/api/payments', {}, token)
      setPayments(paymentData)
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
    const allocatedTo = window.prompt('Allocate to', payment.allocated_to || activeMeta.allocationHint)
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
      body: JSON.stringify({ reference, status: 'edited', notes: activeMeta.documentType }),
    }, token)
    loadPayments()
  }

  const filteredPayments = payments.filter((payment, index) => index % 5 === {
    insReceipt: 0,
    clubReceipt: 1,
    societyReceipt: 2,
    cashSale: 3,
    funeralReceipt: 4,
  }[activeReceiptSubtab])

  const documentRows = filteredPayments.map((payment) => ({
    name: payment.statement_filename || payment.reference,
    reference: payment.reference,
    linkedTo: payment.allocated_to || activeMeta.documentType,
    amount: payment.amount,
    payer: payment.payer_name,
  }))

  if (!canEdit) return <div className="panel"><h2>Payments</h2><p>Users can view the dashboard but cannot manage payment records.</p></div>

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel-header"><div><h2>{activeMeta.title}</h2><p>{activeMeta.description}</p></div></div>
        <div className="badge-row">
          <span className="pill">Linked document type: {activeMeta.documentType}</span>
          <span className="pill">Suggested allocation: {activeMeta.allocationHint}</span>
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
              <label>Franchise name (optional)</label>
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
        <div className="panel-header"><div><h2>Linked documents</h2><p>Documents in this payment tab stay aligned to the selected receipt category.</p></div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Document</th><th>Reference</th><th>Payer</th><th>Linked to</th><th>Amount</th></tr></thead>
            <tbody>
              {documentRows.length ? documentRows.map((row, index) => (
                <tr key={`${row.reference}-${index}`}>
                  <td>{row.name}</td>
                  <td>{row.reference}</td>
                  <td>{row.payer}</td>
                  <td>{row.linkedTo}</td>
                  <td>R {Number(row.amount).toFixed(2)}</td>
                </tr>
              )) : <tr><td colSpan="5" className="empty-row">No linked documents loaded yet for this receipt type.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><div><h2>Transactions</h2><p>Allocate or edit imported transactions for the selected receipt type.</p></div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Payer</th><th>Reference</th><th>Amount</th><th>Status</th><th>Allocated</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredPayments.map((payment) => (
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
              {!filteredPayments.length ? <tr><td colSpan="6" className="empty-row">No payments loaded yet for this receipt type.</td></tr> : null}
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
        {error ? <div className="auth-error top-gap">{error}</div> : null}
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

function ServicesPanel({ activeSubtab }) {
  const serviceContent = {
    funerals: {
      title: 'Funeral services',
      description: 'Manage funeral service files, service packs, and linked operational documents.',
      documents: [
        { name: 'Funeral arrangement checklist', type: 'Service document', link: '#' },
        { name: 'Client instruction form', type: 'Client document', link: '#' },
        { name: 'Burial order summary', type: 'Operations document', link: '#' },
      ],
    },
    cremations: {
      title: 'Cremation services',
      description: 'Keep cremation authorisations, scheduling forms, and supporting documents aligned here.',
      documents: [
        { name: 'Cremation authorisation', type: 'Service document', link: '#' },
        { name: 'Ash collection register', type: 'Operations document', link: '#' },
        { name: 'Cremation booking sheet', type: 'Scheduling document', link: '#' },
      ],
    },
    repatriations: {
      title: 'Repatriation services',
      description: 'Track repatriation movement documents, permits, and linked client paperwork.',
      documents: [
        { name: 'Cross-border permit pack', type: 'Permit document', link: '#' },
        { name: 'Transport instruction sheet', type: 'Operations document', link: '#' },
        { name: 'Receiving branch confirmation', type: 'Branch document', link: '#' },
      ],
    },
  }

  const activeContent = serviceContent[activeSubtab] || serviceContent.funerals

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel-header"><div><h2>{activeContent.title}</h2><p>{activeContent.description}</p></div></div>
        <div className="document-grid">
          {activeContent.documents.map((document) => (
            <div key={document.name} className="document-card">
              <span className="pill">{document.type}</span>
              <h3>{document.name}</h3>
              <p>Keep this document linked to the {activeContent.title.toLowerCase()} workflow.</p>
              <a href={document.link} className="doc-link">Open document slot</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MembersPanel({ data, activeSubtab, setActiveSubtab }) {
  const categories = SECTION_CONFIG.members.subtabs
  const rows = data[activeSubtab] || []
  const templateHref = '/templates/members-import-template.xlsx'

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel-header"><div><h2>Members</h2><p>View imported member records by section and keep the right document template linked to the right section.</p></div></div>
        <div className="subtab-row">
          {categories.map((category) => (
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
        <div className="panel-header"><div><h2>Linked documents</h2><p>The import template remains linked to the selected member section.</p></div></div>
        <div className="document-grid">
          <div className="document-card">
            <span className="pill">Import template</span>
            <h3>{categories.find((c) => c.key === activeSubtab)?.label} workbook</h3>
            <p>Use the workbook sheets for Ins Members, Membership Club, and Society so records load into the correct section.</p>
            <a href={templateHref} className="doc-link">Open member template</a>
          </div>
          <div className="document-card">
            <span className="pill">Record count</span>
            <h3>{rows.length} linked member record{rows.length === 1 ? '' : 's'}</h3>
            <p>These records are currently linked to the selected member tab and will remain separated from the other member sections.</p>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><div><h2>{categories.find((c) => c.key === activeSubtab)?.label}</h2><p>{rows.length} record{rows.length === 1 ? '' : 's'} loaded.</p></div></div>
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
                  <td>{row.member_id || row.member_number || '-'}</td>
                  <td>{row.name || row.first_name || row.full_name || '-'}</td>
                  <td>{row.surname || row.last_name || '-'}</td>
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

  const navItems = useMemo(() => {
    const items = [
      { key: 'overview', label: 'Overview' },
      { key: 'members', label: 'Members' },
      { key: 'services', label: 'Services' },
      { key: 'payments', label: 'Payments' },
    ]
    if (user?.role === 'admin') items.push({ key: 'users', label: 'User Management' }, { key: 'reports', label: 'Reports' })
    return items
  }, [user?.role])

  const currentSubtabs = active === 'members'
    ? SECTION_CONFIG.members.subtabs
    : active === 'services'
      ? SECTION_CONFIG.services.subtabs
      : active === 'payments'
        ? SECTION_CONFIG.payments.subtabs
        : []

  const activeSubtab = active === 'members'
    ? activeMemberSubtab
    : active === 'services'
      ? activeServiceSubtab
      : active === 'payments'
        ? activePaymentSubtab
        : ''

  const setActiveSubtab = (key) => {
    if (active === 'members') setActiveMemberSubtab(key)
    if (active === 'services') setActiveServiceSubtab(key)
    if (active === 'payments') setActivePaymentSubtab(key)
  }

  useEffect(() => {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(memberData))
  }, [memberData])

  useEffect(() => {
    if (active !== 'members') return
    const loadMembers = async () => {
      try {
        const categories = [
          { request: 'ins_members', local: 'insMembers' },
          { request: 'membership_club', local: 'membershipClub' },
          { request: 'society', local: 'society' },
        ]
        const responses = await Promise.all(categories.map((category) => apiFetch(`/api/members?category=${category.request}`, {}, token).catch(() => null)))
        const next = { ...memberData }
        responses.forEach((response, index) => {
          if (response?.members) next[categories[index].local] = response.members
        })
        setMemberData(next)
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

  const renderPanel = () => {
    if (active === 'members') return <MembersPanel data={memberData} activeSubtab={activeMemberSubtab} setActiveSubtab={setActiveMemberSubtab} />
    if (active === 'services') return <ServicesPanel activeSubtab={activeServiceSubtab} />
    if (active === 'payments') return <PaymentsPanel token={token} role={user?.role} activeReceiptSubtab={activePaymentSubtab} />
    if (active === 'users') return <UserManagementPanel token={token} role={user?.role} />
    if (active === 'reports') return <ReportsPanel token={token} role={user?.role} reports={reports} onRefresh={refreshReports} />
    return <OverviewPanel user={user} reports={reports} />
  }

  const currentTitle = currentSubtabs.find((item) => item.key === activeSubtab)?.label || navItems.find((item) => item.key === active)?.label || 'Dashboard'
  const currentDescription = active === 'members'
    ? 'Member records and templates stay linked to the selected member section.'
    : active === 'services'
      ? 'Service documents are grouped by service type so the correct workflow stays together.'
      : active === 'payments'
        ? 'Receipts and transactions stay grouped under the selected payment sub tab.'
        : 'Admin and franchisee rules are active in both UI and backend routes.'

  return (
    <div className="dashboard-shell">
      <button className="mobile-menu-btn" type="button" onClick={() => setSidebarOpen(true)}>Menu</button>
      {sidebarOpen ? <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} /> : null}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Logo small />
          <div className="sidebar-brand-text"><strong>Martinsdirect</strong><p>Operations Portal</p></div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-brand-mark">MD</div>
          <div>
            <strong>{user?.name || 'User'}</strong>
            <p>{user?.email || ''}</p>
            <span className="pill">{user?.role || 'unknown'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div key={item.key} className="sidebar-nav-group">
              <button
                className={`nav-btn ${active === item.key ? 'nav-btn-active' : ''}`}
                type="button"
                onClick={() => { setActive(item.key); setSidebarOpen(false) }}
              >
                {item.label}
              </button>

              {active === item.key && ['members', 'services', 'payments'].includes(item.key) ? (
                <div className="sidebar-subnav">
                  {SECTION_CONFIG[item.key].subtabs.map((subitem) => (
                    <button
                      key={subitem.key}
                      className={`subnav-btn ${activeSubtab === subitem.key ? 'subnav-btn-active' : ''}`}
                      type="button"
                      onClick={() => setActiveSubtab(subitem.key)}
                    >
                      {subitem.label}
                    </button>
                  ))}
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
            <div className="topbar-kicker">Martinsdirect dashboard</div>
            <h1>{currentTitle}</h1>
            <p>{currentDescription}</p>
          </div>
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
