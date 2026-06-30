import React, { useEffect, useState } from 'react';
import api from '../services/api';

const STATUS_LABELS = {
  healthy:      { label: 'سالم',           cls: 'badge-success' },
  needs_repair: { label: 'نیاز به تعمیر',  cls: 'badge-warning' },
  broken:       { label: 'خراب',           cls: 'badge-danger'  },
  retired:      { label: 'بازنشسته',       cls: 'badge-gray'    },
};
const LOC_LABELS = {
  in_use:     { label: 'در استفاده', cls: 'badge-success' },
  in_storage: { label: 'در انبار',   cls: 'badge-gray'    },
};
const EMPTY = {
  code: '', serial_number: '', type_id: '', brand: '', model: '',
  cpu: '', ram: '', storage: '', os: '', mac_address: '',
  purchase_price: '', status: 'healthy',
};

// helper: extract display strings from holder object or string
const holderName = (h) => {
  if (!h) return null;
  if (typeof h === 'string') return h;
  return `${h.first_name || ''} ${h.last_name || ''}`.trim() || null;
};
const holderDept = (h) => {
  if (!h) return null;
  if (typeof h === 'object') return h.department?.name || null;
  return null;
};

export default function AssetsPage() {
  const [assets,      setAssets]      = useState([]);
  const [types,       setTypes]       = useState([]);
  const [search,      setSearch]      = useState('');
  const [statusF,     setStatusF]     = useState('');
  const [typeF,       setTypeF]       = useState('');
  const [locF,        setLocF]        = useState('');
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [detailAsset, setDetailAsset] = useState(null);
  const [editing,     setEditing]     = useState(null);
  const [form,        setForm]        = useState(EMPTY);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const load = async () => {
    try {
      const [a, t] = await Promise.all([api.get('/assets/'), api.get('/assets/types/')]);
      setAssets(a.data);
      setTypes(t.data);
    } catch { setAssets([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const name = holderName(a.current_holder) || '';
    return (
      (!search || `${a.code} ${a.brand || ''} ${a.model || ''} ${a.serial_number || ''} ${name}`.toLowerCase().includes(q)) &&
      (!statusF || a.status === statusF) &&
      (!typeF   || String(a.type_id) === typeF) &&
      (!locF    || a.location_status === locF)
    );
  });

  const openAdd = () => {
    setEditing(null); setForm(EMPTY); setError(''); setShowModal(true);
  };
  const openEdit = (a) => {
    setEditing(a);
    setForm({ ...a, type_id: a.type_id || '', purchase_price: a.purchase_price || '' });
    setError(''); setShowModal(true); setDetailAsset(null);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const data = {
        ...form,
        type_id: parseInt(form.type_id),
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      };
      if (editing) await api.put(`/assets/${editing.id}`, data);
      else         await api.post('/assets/', data);
      setShowModal(false);
      load();
      window.showToast?.(editing ? 'تجهیز ویرایش شد' : 'تجهیز جدید اضافه شد', 'success');
    } catch (err) {
      setError(err.response?.data?.detail || 'خطا در ذخیره‌سازی');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این تجهیز مطمئنید؟')) return;
    try {
      await api.delete(`/assets/${id}`);
      load();
      setDetailAsset(null);
      window.showToast?.('تجهیز حذف شد');
    } catch (err) {
      window.showToast?.(err.response?.data?.detail || 'خطا در حذف', 'danger');
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await api.put(`/assets/${id}`, { status });
      setAssets(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      if (detailAsset?.id === id) setDetailAsset(prev => ({ ...prev, status }));
      window.showToast?.('وضعیت بروزرسانی شد', 'success');
    } catch { window.showToast?.('خطا', 'danger'); }
  };

  // summary counts
  const counts = {
    total:    assets.length,
    in_use:   assets.filter(a => a.location_status === 'in_use').length,
    broken:   assets.filter(a => a.status === 'broken').length,
    repair:   assets.filter(a => a.status === 'needs_repair').length,
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">💻 مدیریت تجهیزات</div>
          <div className="page-subtitle">ثبت و پیگیری کلیه دارایی‌های IT سازمان</div>
        </div>
        <button className="btn-primary-custom" onClick={openAdd}>➕ افزودن تجهیز</button>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '.625rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {[
          { label: 'کل تجهیزات',    value: counts.total,  color: '#3b82f6', bg: '#dbeafe' },
          { label: 'در استفاده',    value: counts.in_use, color: '#16a34a', bg: '#dcfce7' },
          { label: 'خراب',          value: counts.broken, color: '#dc2626', bg: '#fee2e2' },
          { label: 'نیاز به تعمیر', value: counts.repair, color: '#d97706', bg: '#fef3c7' },
        ].map(c => (
          <div key={c.label} style={{
            background: c.bg, color: c.color,
            borderRadius: 'var(--radius-sm)',
            padding: '.3rem .75rem',
            fontSize: '.8rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '.35rem',
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 800 }}>{c.value}</span>
            {c.label}
          </div>
        ))}
      </div>

      <div className="card-section">
        <div className="card-section-header">
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="search-input"
              placeholder="🔍 کد، برند، مدل، سریال، کارمند..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="filter-select" value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="">همه وضعیت‌ها</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className="filter-select" value={locF} onChange={e => setLocF(e.target.value)}>
              <option value="">همه مکان‌ها</option>
              <option value="in_use">در استفاده</option>
              <option value="in_storage">در انبار</option>
            </select>
            <select className="filter-select" value={typeF} onChange={e => setTypeF(e.target.value)}>
              <option value="">همه انواع</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{filtered.length} مورد</span>
        </div>

        <div className="card-section-body" style={{ padding: 0 }}>
          {loading
            ? <div className="empty-state"><div className="spinner"></div></div>
            : filtered.length === 0
              ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💾</div>
                  <h4>تجهیزی یافت نشد</h4>
                  <p>فیلتر را تغییر دهید یا تجهیز جدید اضافه کنید.</p>
                  <button className="btn-primary-custom" onClick={openAdd}>➕ افزودن تجهیز</button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>کد</th>
                        <th>نوع</th>
                        <th>برند / مدل</th>
                        <th>دارنده فعلی</th>
                        <th>واحد</th>
                        <th>وضعیت</th>
                        <th>مکان</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(a => (
                        <tr
                          key={a.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setDetailAsset(a)}
                        >
                          <td><code>{a.code}</code></td>
                          <td>{a.asset_type?.name || types.find(t => t.id === a.type_id)?.name || '—'}</td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{a.brand || '—'}</div>
                            {a.model && <small style={{ color: 'var(--text-muted)' }}>{a.model}</small>}
                          </td>
                          <td>
                            {holderName(a.current_holder)
                              ? <span style={{ fontWeight: 500 }}>{holderName(a.current_holder)}</span>
                              : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                          </td>
                          <td>
                            {holderDept(a.current_holder)
                              ? holderDept(a.current_holder)
                              : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <select
                              className="status-select"
                              value={a.status}
                              onChange={e => changeStatus(a.id, e.target.value)}
                            >
                              {Object.entries(STATUS_LABELS).map(([k, v]) =>
                                <option key={k} value={k}>{v.label}</option>
                              )}
                            </select>
                          </td>
                          <td>
                            <span className={`badge ${LOC_LABELS[a.location_status]?.cls || 'badge-gray'}`}>
                              {LOC_LABELS[a.location_status]?.label || '—'}
                            </span>
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '.375rem' }}>
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

      {/* ─── Asset Detail Drawer ─── */}
      {detailAsset && (
        <div className="modal-overlay" onClick={() => setDetailAsset(null)}>
          <div className="modal-box wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">
                  {detailAsset.asset_type?.name || types.find(t => t.id === detailAsset.type_id)?.name || '💻'}{' '}
                  {[detailAsset.brand, detailAsset.model].filter(Boolean).join(' ')}
                </div>
                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <code style={{ fontSize: '.85em' }}>{detailAsset.code}</code>
                  <span className={`badge ${STATUS_LABELS[detailAsset.status]?.cls || 'badge-gray'}`}>
                    {STATUS_LABELS[detailAsset.status]?.label}
                  </span>
                  <span className={`badge ${LOC_LABELS[detailAsset.location_status]?.cls || 'badge-gray'}`}>
                    {LOC_LABELS[detailAsset.location_status]?.label || '—'}
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetailAsset(null)}>✕</button>
            </div>

            <div className="detail-panel">
              {[
                ['نوع تجهیز',       detailAsset.asset_type?.name || types.find(t => t.id === detailAsset.type_id)?.name],
                ['شماره سریال',     detailAsset.serial_number],
                ['پردازنده',        detailAsset.cpu],
                ['حافظه RAM',       detailAsset.ram],
                ['ذخیره‌سازی',      detailAsset.storage],
                ['سیستم‌عامل',      detailAsset.os],
                ['آدرس MAC',        detailAsset.mac_address],
                ['قیمت خرید',       detailAsset.purchase_price
                  ? `${Number(detailAsset.purchase_price).toLocaleString('fa-IR')} تومان`
                  : null],
                ['دارنده فعلی',     holderName(detailAsset.current_holder)],
                ['واحد دارنده',     holderDept(detailAsset.current_holder)],
                ['محل استقرار دارنده',
                  detailAsset.current_holder && typeof detailAsset.current_holder === 'object'
                    ? [
                        detailAsset.current_holder.building,
                        detailAsset.current_holder.floor && `طبقه ${detailAsset.current_holder.floor}`,
                        detailAsset.current_holder.room  && `اتاق ${detailAsset.current_holder.room}`,
                      ].filter(Boolean).join(' / ') || null
                    : null],
              ].filter(([, v]) => v).map(([label, val]) => (
                <div key={label} className="detail-row">
                  <span className="detail-label">{label}</span>
                  <span className="detail-value">{val}</span>
                </div>
              ))}
            </div>

            <hr className="divider" />
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary-custom" onClick={() => setDetailAsset(null)}>بستن</button>
              <button className="btn-edit-custom" onClick={() => openEdit(detailAsset)}>✏️ ویرایش</button>
              <button className="btn-delete-custom" onClick={() => handleDelete(detailAsset.id)}>🗑️ حذف</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add / Edit Modal ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? '✏️ ویرایش تجهیز' : '➕ افزودن تجهیز'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert-box danger">{error}</div>}
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div className="form-group">
                  <label className="form-label">کد دارایی *</label>
                  <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required placeholder="مثال: PC-001" disabled={!!editing} />
                </div>
                <div className="form-group">
                  <label className="form-label">نوع تجهیز *</label>
                  <select className="form-control" value={form.type_id} onChange={e => setForm({ ...form, type_id: e.target.value })} required>
                    <option value="">انتخاب نوع...</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">برند</label>
                  <input className="form-control" value={form.brand || ''} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Dell, HP, Lenovo..." />
                </div>
                <div className="form-group">
                  <label className="form-label">مدل</label>
                  <input className="form-control" value={form.model || ''} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="مثال: Latitude 5520" />
                </div>
                <div className="form-group">
                  <label className="form-label">شماره سریال</label>
                  <input className="form-control" value={form.serial_number || ''} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">وضعیت</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">پردازنده</label>
                  <input className="form-control" value={form.cpu || ''} onChange={e => setForm({ ...form, cpu: e.target.value })} placeholder="Intel i7-1165G7" />
                </div>
                <div className="form-group">
                  <label className="form-label">حافظه RAM</label>
                  <input className="form-control" value={form.ram || ''} onChange={e => setForm({ ...form, ram: e.target.value })} placeholder="16GB DDR4" />
                </div>
                <div className="form-group">
                  <label className="form-label">ذخیره‌سازی</label>
                  <input className="form-control" value={form.storage || ''} onChange={e => setForm({ ...form, storage: e.target.value })} placeholder="512GB SSD" />
                </div>
                <div className="form-group">
                  <label className="form-label">سیستم‌عامل</label>
                  <input className="form-control" value={form.os || ''} onChange={e => setForm({ ...form, os: e.target.value })} placeholder="Windows 11 Pro" />
                </div>
                <div className="form-group">
                  <label className="form-label">آدرس MAC</label>
                  <input className="form-control" value={form.mac_address || ''} onChange={e => setForm({ ...form, mac_address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">قیمت خرید (تومان)</label>
                  <input type="number" className="form-control" value={form.purchase_price || ''} onChange={e => setForm({ ...form, purchase_price: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '.75rem' }}>
                <button type="button" className="btn-secondary-custom" onClick={() => setShowModal(false)}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>
                  {saving ? 'در حال ذخیره...' : editing ? 'ذخیره تغییرات' : 'افزودن تجهیز'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
