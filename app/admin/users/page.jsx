'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layout.jsx';
import IconActionButton from '../../components/IconActionButton.jsx';


export default function AdminUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Viewer' });

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          if (data.user.role !== 'Admin') {
            router.push('/dashboard');
            return;
          }
          setCurrentUser(data.user);
          fetchUsers();
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'));
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.message || 'Failed to create user');
        return;
      }
      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'Viewer' });
      await fetchUsers();
    } catch (e) {
      alert('Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role
        })
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.message || 'Failed to update user');
        return;
      }
      setEditingUser(null);
      await fetchUsers();
    } catch (e) {
      alert('Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
       is_active: !user.isActive 
        })
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.message || 'Failed to update user status');
        return;
      }
      await fetchUsers();
    } catch (e) {
      alert('Failed to update user status');
    }
  }

  async function handleDelete(user) {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id })
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.message || 'Failed to delete user');
        return;
      }
      await fetchUsers();
    } catch (e) {
      alert('Failed to delete user');
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) return null;

  return (
    <Layout current="/admin/users">
      <div style={s.page}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>User Management</h1>
            <p style={s.pageSub}>Create, edit, and manage system access — Sun Pharma Industries Ltd.</p>
          </div>
          <button style={s.primaryBtn} onClick={() => setShowAddModal(true)}>
            + Add User
          </button>
        </div>

        <div style={s.card}>
          <div style={s.filterRow}>
            <div style={s.searchWrap}>
              <span style={s.searchIcon}>🔍︎</span>
              <input
                style={s.searchInput}
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={s.countBadge}>
              {filtered.length} user{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>

          {loading ? (
            <div style={s.empty}>
              <div style={s.emptyText}>Loading...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>👤</div>
              <div style={s.emptyText}>No users found</div>
            </div>
          ) : (
            <div>
              {filtered.map((u, i) => (
                <div key={u.id} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
                  <div style={s.rowLeft}>
                    <div style={s.avatar}>{u.name?.charAt(0) || 'U'}</div>
                    <div>
                      <div style={s.rowName}>
                        {u.name}
                        {String(u.id) === String(currentUser.id) && (
                          <span style={s.youTag}>You</span>
                        )}
                      </div>
                      <div style={s.rowMeta}>{u.email}</div>
                    </div>
                  </div>
                  <div style={s.rowRight}>
                    <span style={s.roleBadge}>{u.role}</span>
                  <span style={u.isActive ? s.badgeActive : s.badgeInactive}>
  {u.isActive ? 'Active' : 'Inactive'}
</span>
                  <button
  style={{
    ...s.toggleBtn,
    color: u.isActive ? '#C4520A' : '#2D6A4F',
    borderColor: u.isActive ? '#F0997B' : '#97C459',
  }}
  onClick={() => handleToggleActive(u)}
  disabled={String(u.id) === String(currentUser.id)}
>
  {u.isActive ? 'Deactivate' : 'Reactivate'}
</button>
                   <IconActionButton icon="✎" label="Edit" onClick={() => setEditingUser({ ...u })} />
                   <IconActionButton
  icon="🗑"
  label="Delete"
  color="#991B1B"
  onClick={() => handleDelete(u)}
  disabled={String(u.id) === String(currentUser.id)}
/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <h2 style={s.modalTitle}>Add User</h2>
                <p style={s.modalSub}>Create a new system account</p>
              </div>
              <button style={s.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddUser} style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Full Name</label>
                <input
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  style={s.input}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={s.input}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Temporary Password</label>
                <input
                  required
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={s.input}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  style={s.input}
                >
                  <option value="Viewer">Viewer</option>
                  <option value="SPOC">SPOC</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div style={{ ...s.modalFooter, gridColumn: '1 / -1' }}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowAddModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" style={s.saveBtn} disabled={saving}>
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <h2 style={s.modalTitle}>Edit User</h2>
                <p style={s.modalSub}>Update account details</p>
              </div>
              <button style={s.closeBtn} onClick={() => setEditingUser(null)}>×</button>
            </div>

            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Full Name</label>
                <input
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  style={s.input}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  style={s.input}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Role</label>
                <select
                  value={editingUser.role || 'Viewer'}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  style={s.input}
                  disabled={String(editingUser.id) === String(currentUser.id)}
                >
                  <option value="Viewer">Viewer</option>
                  <option value="SPOC">SPOC</option>
                  <option value="Admin">Admin</option>
                </select>
                {String(editingUser.id) === String(currentUser.id) && (
                  <span style={s.helper}>You cannot change your own role.</span>
                )}
              </div>

              <div style={{ ...s.modalFooter, gridColumn: '1 / -1' }}>
                <button style={s.cancelBtn} onClick={() => setEditingUser(null)} disabled={saving}>
                  Cancel
                </button>
                <button style={s.saveBtn} onClick={handleSaveEdit} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const s = {
  page: { padding: '32px' },
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px', letterSpacing: '-0.3px' },
  pageSub: { fontSize: '13px', color: '#999' },
  primaryBtn: { padding: '9px 18px', background: '#E8650A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 },
  card: { background: 'white', borderRadius: '12px', border: '1px solid #EDE8E0', overflow: 'hidden' },
  filterRow: { padding: '14px 20px', borderBottom: '1px solid #EDE8E0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  searchWrap: { flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', background: '#FAF8F5', border: '1.5px solid #EDE8E0', borderRadius: '8px', padding: '0 12px' },
  searchIcon: { fontSize: '14px', flexShrink: 0 },
  searchInput: { flex: 1, padding: '9px 0', border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', color: '#1A1A1A' },
  countBadge: { fontSize: '12px', color: '#AAA', whiteSpace: 'nowrap' },
  rowEven: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F5F2ED', background: 'white' },
  rowOdd: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F5F2ED', background: '#FDFCFA' },
  rowLeft: { display: 'flex', gap: '12px', alignItems: 'center' },
  avatar: { width: '34px', height: '34px', borderRadius: '50%', background: '#E8650A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 },
  rowName: { fontSize: '14px', fontWeight: '600', color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '8px' },
  youTag: { fontSize: '10px', fontWeight: '700', color: '#C4520A', background: '#FFF0E6', padding: '2px 7px', borderRadius: '10px' },
  rowMeta: { fontSize: '12px', color: '#999', marginTop: '2px' },
  rowRight: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  roleBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#F5F3EF', color: '#666' },
  badgeActive: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#F0F7F4', color: '#2D6A4F' },
  badgeInactive: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#FEF2F2', color: '#991B1B' },
  editBtn: { padding: '7px 12px', border: '1.5px solid #EDE8E0', borderRadius: '7px', fontSize: '12px', fontWeight: '600', background: '#fff', color: '#444', cursor: 'pointer' },
  toggleBtn: { padding: '7px 12px', border: '1.5px solid', borderRadius: '7px', fontSize: '12px', fontWeight: '600', background: 'transparent', cursor: 'pointer' },
  deleteBtn: { padding: '7px 12px', border: '1.5px solid #FECACA', borderRadius: '7px', fontSize: '12px', fontWeight: '600', background: 'transparent', color: '#991B1B', cursor: 'pointer' },
  empty: { padding: '60px 24px', textAlign: 'center' },
  emptyIcon: { fontSize: '32px', marginBottom: '12px' },
  emptyText: { fontSize: '14px', fontWeight: '600', color: '#1A1A1A' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { width: '100%', maxWidth: '500px', background: '#fff', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 24px', borderBottom: '1px solid #EDE8E0' },
  modalTitle: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#1A1A1A' },
  modalSub: { margin: '5px 0 0', fontSize: '12px', color: '#999' },
  closeBtn: { border: 'none', background: 'transparent', fontSize: '24px', color: '#777', cursor: 'pointer', lineHeight: 1 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '16px', padding: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#444' },
  input: { padding: '10px 14px', border: '1px solid #EDE8E0', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', color: '#1A1A1A' },
  helper: { fontSize: '10px', color: '#999' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' },
  cancelBtn: { padding: '9px 16px', border: '1px solid #D6D0C7', borderRadius: '8px', background: '#fff', color: '#444', fontSize: '13px', cursor: 'pointer' },
  saveBtn: { padding: '9px 18px', border: 'none', borderRadius: '8px', background: '#E8650A', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
};