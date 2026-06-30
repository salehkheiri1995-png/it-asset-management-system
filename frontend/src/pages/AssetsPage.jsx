import React, { useEffect, useState } from 'react';
import api from '../services/api';

const EMPTY = { code: '', serial_number: '', type_id: '', brand: '', model: '', cpu: '', ram: '', storage: '', os: '', mac_address: '', purchase_price: '', status: 'healthy' };
const STATUS_LABELS = { healthy: { label: 'سالم', cls: 'badge-success' }, needs_repair: { label: 'نیاز به تعمیر', cls: 'badge-warning' }, broken: { label: 'خراب', cls: 'badge-danger' }, retired: { label: 'بازنشسته', cls: 'badge-gray' } };

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [a, t] = await Promise.all([api.get('/assets/'), api.get('/assets/types/')]);
      setAssets(a.data); setTypes(t.data);
    } catch { setAssets([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = assets.filter(a => {
    const matchSearch = !search || `${a.code} ${a.brand || ''} ${a.model || ''} ${a.serial_number || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    const matchLoc = !locationFilter || a.location_status === locationFilter;
    return matchSearch && matchStatus && matchLoc;
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true); };
  const openEdit = (a) => { setEditing(a); setForm({ ...a, type_id: a.type_id || '', purchase_price: a.purchase_price || '' }); setError(''); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const data = { ...form, type_id: parseInt(form.type_id), purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null };
      if (editing) await api.put(`/assets/${editing.id}`, data);
      else await api.post('/assets/', data);
      setShowModal(false); load();
    } catch (err) {
      setError(err.response?.data?.detail || 'خطا در ذخیره‌سازی');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این تجهیز مطمئنید؟')) return;
    try { await api.delete(`/assets/${id}`); load(); } catch { alert('خطا در حذف'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">💻 مدیریت تجهیزات</div>
        <div className="page-subtitle">ثبت و پیگیری کلیه دارایی‌های IT سازمان</div>
      </div>

      <div className="card-section">
        <div className="card-section-header">
          <div className="toolbar" style={{ marginBottom: 0, display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="search-input" placeholder="🔍 جستجو: کد، برند، مدل، سریال..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">همه وضعیت‌ها</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className="filter-select" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
              <option value="">همه مکان‌ها</option>
              <option value="in_use">در استفاده</option>
              <option value="in_storage">در انبار</option>
            </select>
          </div>
          <button className="btn-primary-custom" onClick={openAdd}>➕ افزودن تجهیز</button>
        </div>

        <div className="card-section-body" style={{ padding: 0 }}>
          {loading ? <div className="empty-state"><div className="spinner"></div></div>
          : filtered.length === 0 ? <div className="empty-state"><div className="empty-state-icon">💾</div><h4>تجهیزی یافت نشد</h4></div>
          : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>کد</th>
                    <th>نوع</th>
                    <th>برند / مدل</th>
                    <th>دارنده فعلی</th>
                    <th>واحد</th>
                    <th>مکان</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id}>
                      <td><code>{a.code}</code>{a.serial_number && <div><small style={{ color: 'var(--color-text-muted)' }}>S/N: {a.serial_number}</small></div>}</td>
                      <td>{a.asset_type?.name || types.find(t => t.id === a.type_id)?.name || '-'}</td>
                      <td>{[a.brand, a.model].filter(Boolean).join(' / ') || '-'}</td>
                      <td>{a.current_holder ? `${a.current_holder.first_name} ${a.current_holder.last_name}` : <span style={{ color: 'var(--color-text-faint)' }}>—</span>}</td>
                      <td>{a.current_holder?.department?.name || <span style={{ color: 'var(--color-text-faint)' }}>—</span>}</td>
                      <td>
                        <span className={`badge ${a.location_status === 'in_use' ? 'badge-success' : 'badge-gray'}`}>
                          {a.location_status === 'in_use' ? 'در استفاده' : 'انبار'}
                        </span>
                      </td>
                      <td><span className={`badge ${STATUS_LABELS[a.status]?.cls || 'badge-gray'}`}>{STATUS_LABELS[a.status]?.label || a.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button className="btn-edit-custom" onClick={() => openEdit(a)}>✏️</button>
                          <button className="btn-delete-custom" onClick={() => handleDelete(a.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? '✏️ ویرایش تجهیز' : '➕ افزودن تجهیز'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert-box danger">{error}</div>}
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">کد شناسایی *</label>
                  <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required disabled={!!editing} />
                </div>
                <div className="form-group">
                  <label className="form-label">نوع تجهیز *</label>
                  <select className="form-control" value={form.type_id} onChange={e => setForm({ ...form, type_id: e.target.value })} required>
                    <option value="">-- انتخاب کنید --</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {types.length === 0 && <small style={{ color: 'var(--color-warning)' }}>ابتدا نوع تجهیز را در تنظیمات تعریف کنید.</small>}
                </div>
                <div className="form-group">
                  <label className="form-label">سریال نامبر</label>
                  <input className="form-control" value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">برند</label>
                  <input className="form-control" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">مدل</label>
                  <input className="form-control" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">CPU</label>
                  <input className="form-control" value={form.cpu} onChange={e => setForm({ ...form, cpu: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">RAM</label>
                  <input className="form-control" value={form.ram} onChange={e => setForm({ ...form, ram: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">حافظه</label>
                  <input className="form-control" value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">سیستم عامل</label>
                  <input className="form-control" value={form.os} onChange={e => setForm({ ...form, os: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">MAC Address</label>
                  <input className="form-control" value={form.mac_address} onChange={e => setForm({ ...form, mac_address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">قیمت خرید (تومان)</label>
                  <input type="number" className="form-control" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">وضعیت</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary-custom" onClick={() => setShowModal(false)}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>{saving ? 'در حال ذخیره...' : editing ? 'ذخیره تغییرات' : 'افزودن تجهیز'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
