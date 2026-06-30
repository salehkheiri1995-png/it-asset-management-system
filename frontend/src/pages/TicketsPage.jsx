import React, { useEffect, useState } from 'react';
import api from '../services/api';

const PRIORITY_MAP = {
  low:    { label: 'کم',     cls: 'badge priority-low'    },
  medium: { label: 'متوسط', cls: 'badge priority-medium'  },
  high:   { label: 'بالا',  cls: 'badge priority-high'   },
  urgent: { label: 'فوری',  cls: 'badge priority-urgent' },
};
const STATUS_MAP = {
  opened:      { label: 'ثبت‌شده',    header: 'ثبت‌شده',    cls: 'opened'      },
  in_review:   { label: 'در بررسی',  header: 'در بررسی',  cls: 'in_review'   },
  in_progress: { label: 'در انجام',  header: 'در انجام',  cls: 'in_progress' },
  done:        { label: 'انجام‌شده', header: 'انجام‌شده', cls: 'done'        },
  closed:      { label: 'بسته',      header: 'بسته',      cls: 'closed'      },
};
const STATUSES = Object.keys(STATUS_MAP);

const EMPTY = { title: '', description: '', priority: 'medium', asset_id: '' };

export default function TicketsPage() {
  const [tickets, setTickets]   = useState([]);
  const [assets,  setAssets]    = useState([]);
  const [loading, setLoading]   = useState(true);
  const [view,    setView]      = useState('kanban'); // 'kanban' | 'table'
  const [search,  setSearch]    = useState('');
  const [filterP, setFilterP]   = useState('');
  const [showModal, setShowModal] = useState(false);
  const [detail,    setDetail]    = useState(null);   // ticket being viewed
  const [form, setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const load = async () => {
    try {
      const [t, a] = await Promise.all([api.get('/tickets/'), api.get('/assets/')]);
      setTickets(t.data); setAssets(a.data);
    } catch { setTickets([]); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    return (!search || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
      && (!filterP || t.priority === filterP);
  });

  const byStatus = (s) => filtered.filter(t => t.status === s);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/tickets/', { ...form, asset_id: form.asset_id ? parseInt(form.asset_id) : null });
      setShowModal(false); setForm(EMPTY); load();
      window.showToast?.('تیکت با موفقیت ثبت شد', 'success');
    } catch (err) { setError(err.response?.data?.detail || 'خطا'); }
    finally { setSaving(false); }
  };

  const changeStatus = async (id, status) => {
    try {
      await api.put(`/tickets/${id}`, { status });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      if (detail?.id === id) setDetail(prev => ({ ...prev, status }));
      window.showToast?.('وضعیت تیکت بروزرسانی شد', 'success');
    } catch { window.showToast?.('خطا در بروزرسانی', 'danger'); }
  };

  const deleteTicket = async (id) => {
    if (!window.confirm('حذف این تیکت؟')) return;
    try { await api.delete(`/tickets/${id}`); load(); window.showToast?.('تیکت حذف شد'); }
    catch { window.showToast?.('خطا در حذف', 'danger'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">🎫 تیکت‌های پشتیبانی</div>
          <div className="page-subtitle">مدیریت درخواست‌های پشتیبانی فنی</div>
        </div>
        <button className="btn-primary-custom" onClick={() => { setForm(EMPTY); setError(''); setShowModal(true); }}>➕ ثبت تیکت جدید</button>
      </div>

      {/* Toolbar */}
      <div className="card-section" style={{ marginBottom: '1rem' }}>
        <div className="card-section-body" style={{ padding: '.75rem 1.125rem' }}>
          <div style={{ display: 'flex', gap: '.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="search-input" placeholder="🔍 جستجو در تیکت‌ها..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
            <select className="filter-select" value={filterP} onChange={e => setFilterP(e.target.value)}>
              <option value="">همه اولویت‌ها</option>
              {Object.entries(PRIORITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {['kanban', 'table'].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: '.375rem .75rem', border: 'none', fontFamily: 'inherit',
                  fontSize: '.8rem', cursor: 'pointer', fontWeight: view === v ? 600 : 400,
                  background: view === v ? 'var(--orange)' : 'transparent',
                  color: view === v ? '#fff' : 'var(--text-muted)',
                  transition: 'var(--transition)',
                }}>
                  {v === 'kanban' ? '📋 کانبان' : '📄 جدول'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? <div className="loading-screen" style={{ height: 200 }}><div className="spinner"></div></div> : (
        view === 'kanban' ? (
          /* ─── KANBAN ─── */
          <div className="kanban-board">
            {STATUSES.map(s => {
              const cols = byStatus(s);
              return (
                <div key={s} className="kanban-col">
                  <div className={`kanban-col-header ${s}`}>
                    <span>{STATUS_MAP[s].header}</span>
                    <span className="kanban-col-count">{cols.length}</span>
                  </div>
                  <div className="kanban-cards">
                    {cols.length === 0
                      ? <div style={{ color: 'var(--text-faint)', fontSize: '.78rem', textAlign: 'center', padding: '.75rem 0' }}>خالی</div>
                      : cols.map(t => (
                        <div key={t.id} className="kanban-card" onClick={() => setDetail(t)}>
                          <div className="kanban-card-title">{t.title}</div>
                          <div className="kanban-card-meta">
                            <span className={PRIORITY_MAP[t.priority]?.cls}>{PRIORITY_MAP[t.priority]?.label}</span>
                            <span style={{ fontSize: '.72rem', color: 'var(--text-faint)' }}>{new Date(t.created_at).toLocaleDateString('fa-IR')}</span>
                          </div>
                          {t.asset && <div className="kanban-card-asset">💻 {t.asset.code}</div>}
                        </div>
                      ))
                    }
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── TABLE ─── */
          <div className="card-section">
            <div className="card-section-body" style={{ padding: 0 }}>
              {filtered.length === 0
                ? <div className="empty-state"><div className="empty-state-icon">🎫</div><h4>تیکتی یافت نشد</h4></div>
                : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead><tr><th>#</th><th>عنوان</th><th>تجهیز</th><th>اولویت</th><th>وضعیت</th><th>تاریخ</th><th>عملیات</th></tr></thead>
                      <tbody>
                        {filtered.map(t => (
                          <tr key={t.id} className="clickable" onClick={() => setDetail(t)}>
                            <td style={{ color: 'var(--text-faint)' }}>#{t.id}</td>
                            <td style={{ fontWeight: 500, maxWidth: 200 }}>{t.title}</td>
                            <td>{t.asset ? <code>{t.asset.code}</code> : <span className="text-faint">—</span>}</td>
                            <td><span className={PRIORITY_MAP[t.priority]?.cls}>{PRIORITY_MAP[t.priority]?.label}</span></td>
                            <td onClick={e => e.stopPropagation()}>
                              <select className="status-select" value={t.status} onChange={e => changeStatus(t.id, e.target.value)}>
                                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            </td>
                            <td style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString('fa-IR')}</td>
                            <td onClick={e => e.stopPropagation()}>
                              <button className="btn-delete-custom" onClick={() => deleteTicket(t.id)}>🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          </div>
        )
      )}

      {/* Ticket Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{detail.title}</div>
                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.375rem', flexWrap: 'wrap' }}>
                  <span className={PRIORITY_MAP[detail.priority]?.cls}>{PRIORITY_MAP[detail.priority]?.label}</span>
                  <span className={`badge badge-${STATUS_MAP[detail.status]?.cls === 'done' ? 'success' : STATUS_MAP[detail.status]?.cls === 'closed' ? 'gray' : 'orange'}`}>{STATUS_MAP[detail.status]?.label}</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            {detail.description && (
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '.75rem 1rem', fontSize: '.875rem', marginBottom: '1rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                {detail.description}
              </div>
            )}
            <div className="detail-panel">
              {detail.asset && <div className="detail-row"><span className="detail-label">تجهیز</span><span className="detail-value"><code>{detail.asset.code}</code></span></div>}
              <div className="detail-row"><span className="detail-label">تاریخ ثبت</span><span className="detail-value">{new Date(detail.created_at).toLocaleDateString('fa-IR')}</span></div>
              {detail.closed_at && <div className="detail-row"><span className="detail-label">تاریخ بسته‌شدن</span><span className="detail-value">{new Date(detail.closed_at).toLocaleDateString('fa-IR')}</span></div>}
            </div>
            <hr className="divider" />
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '.855rem', fontWeight: 600, color: 'var(--text-muted)' }}>تغییر وضعیت:</span>
              {STATUSES.map(s => (
                <button key={s} onClick={() => changeStatus(detail.id, s)} style={{
                  padding: '.3rem .75rem', borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${detail.status === s ? 'var(--orange)' : 'var(--border)'}`,
                  background: detail.status === s ? 'var(--orange-light)' : 'var(--surface-2)',
                  color: detail.status === s ? 'var(--orange-dark)' : 'var(--text-muted)',
                  fontFamily: 'inherit', fontSize: '.8rem', cursor: 'pointer', fontWeight: detail.status === s ? 700 : 400,
                  transition: 'var(--transition)',
                }}>{STATUS_MAP[s].label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🎫 ثبت تیکت جدید</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert-box danger">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">عنوان تیکت *</label>
                <input className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="خلاصه‌ای از مشکل..." required />
              </div>
              <div className="form-group">
                <label className="form-label">شرح مشکل</label>
                <textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="توضیحات بیشتر..." rows={3} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div className="form-group">
                  <label className="form-label">اولویت</label>
                  <select className="form-control" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    {Object.entries(PRIORITY_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">تجهیز مرتبط</label>
                  <select className="form-control" value={form.asset_id} onChange={e => setForm({...form, asset_id: e.target.value})}>
                    <option value="">-- اختیاری --</option>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.code} — {a.brand || ''} {a.model || ''}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                <button type="button" className="btn-secondary-custom" onClick={() => setShowModal(false)}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>{saving ? 'در حال ذخیره...' : 'ثبت تیکت'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
