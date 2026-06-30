import React, { useEffect, useState } from 'react';
import api from '../services/api';

const EMPTY = { name: '', description: '' };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dept'); // 'dept' | 'type'

  // Department state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState(EMPTY);
  const [savingDept, setSavingDept] = useState(false);
  const [deptError, setDeptError] = useState('');

  // AssetType state
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '' });
  const [savingType, setSavingType] = useState(false);
  const [typeError, setTypeError] = useState('');

  const load = async () => {
    try {
      const [d, t] = await Promise.all([
        api.get('/employees/departments/'),
        api.get('/assets/types/'),
      ]);
      setDepartments(d.data);
      setAssetTypes(t.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // --- Department handlers ---
  const openAddDept = () => { setEditingDept(null); setDeptForm(EMPTY); setDeptError(''); setShowDeptModal(true); };
  const openEditDept = (d) => { setEditingDept(d); setDeptForm({ name: d.name, description: d.description || '' }); setDeptError(''); setShowDeptModal(true); };

  const handleSaveDept = async (e) => {
    e.preventDefault(); setSavingDept(true); setDeptError('');
    try {
      if (editingDept) await api.put(`/employees/departments/${editingDept.id}`, deptForm);
      else await api.post('/employees/departments/', deptForm);
      setShowDeptModal(false); load();
    } catch (err) {
      setDeptError(err.response?.data?.detail || 'خطا در ذخیره‌سازی');
    } finally { setSavingDept(false); }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('آیا از حذف این واحد مطمئن هستید؟')) return;
    try { await api.delete(`/employees/departments/${id}`); load(); }
    catch (err) { alert(err.response?.data?.detail || 'خطا در حذف'); }
  };

  // --- AssetType handlers ---
  const openAddType = () => { setEditingType(null); setTypeForm({ name: '', description: '' }); setTypeError(''); setShowTypeModal(true); };
  const openEditType = (t) => { setEditingType(t); setTypeForm({ name: t.name, description: t.description || '' }); setTypeError(''); setShowTypeModal(true); };

  const handleSaveType = async (e) => {
    e.preventDefault(); setSavingType(true); setTypeError('');
    try {
      if (editingType) await api.put(`/assets/types/${editingType.id}`, typeForm);
      else await api.post('/assets/types/', typeForm);
      setShowTypeModal(false); load();
    } catch (err) {
      setTypeError(err.response?.data?.detail || 'خطا در ذخیره‌سازی');
    } finally { setSavingType(false); }
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm('آیا از حذف این نوع مطمئن هستید؟')) return;
    try { await api.delete(`/assets/types/${id}`); load(); }
    catch (err) { alert(err.response?.data?.detail || 'خطا در حذف'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">⚙️ تنظیمات پایه</div>
        <div className="page-subtitle">مدیریت واحدهای سازمانی و انواع تجهیزات</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={tab === 'dept' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          onClick={() => setTab('dept')}
        >
          🏢 واحدهای سازمانی
        </button>
        <button
          className={tab === 'type' ? 'btn-primary-custom' : 'btn-secondary-custom'}
          onClick={() => setTab('type')}
        >
          🖥️ انواع تجهیز
        </button>
      </div>

      {/* Departments Tab */}
      {tab === 'dept' && (
        <div className="card-section">
          <div className="card-section-header">
            <span style={{ fontWeight: 700 }}>واحدهای سازمانی ({departments.length})</span>
            <button className="btn-primary-custom" onClick={openAddDept}>➕ افزودن واحد</button>
          </div>
          <div className="card-section-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="empty-state"><div className="spinner"></div></div>
            ) : departments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏢</div>
                <h4>واحدی تعریف نشده</h4>
                <p>اولین واحد سازمانی را اضافه کنید</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>#</th><th>نام واحد</th><th>توضیحات</th><th>تعداد کارمند</th><th>عملیات</th></tr></thead>
                  <tbody>
                    {departments.map((d, i) => (
                      <tr key={d.id}>
                        <td>{i + 1}</td>
                        <td><strong>{d.name}</strong></td>
                        <td>{d.description || '-'}</td>
                        <td><span className="badge badge-gray">کارمند</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button className="btn-edit-custom" onClick={() => openEditDept(d)}>✏️ ویرایش</button>
                            <button className="btn-danger-custom" onClick={() => handleDeleteDept(d.id)}>🗑️</button>
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
      )}

      {/* Asset Types Tab */}
      {tab === 'type' && (
        <div className="card-section">
          <div className="card-section-header">
            <span style={{ fontWeight: 700 }}>انواع تجهیز ({assetTypes.length})</span>
            <button className="btn-primary-custom" onClick={openAddType}>➕ افزودن نوع</button>
          </div>
          <div className="card-section-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="empty-state"><div className="spinner"></div></div>
            ) : assetTypes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🖥️</div>
                <h4>نوعی تعریف نشده</h4>
                <p>اولین نوع تجهیز را اضافه کنید</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>#</th><th>نوع تجهیز</th><th>توضیحات</th><th>عملیات</th></tr></thead>
                  <tbody>
                    {assetTypes.map((t, i) => (
                      <tr key={t.id}>
                        <td>{i + 1}</td>
                        <td><strong>{t.name}</strong></td>
                        <td>{t.description || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button className="btn-edit-custom" onClick={() => openEditType(t)}>✏️ ویرایش</button>
                            <button className="btn-danger-custom" onClick={() => handleDeleteType(t.id)}>🗑️</button>
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
      )}

      {/* Department Modal */}
      {showDeptModal && (
        <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingDept ? '✏️ ویرایش واحد' : '➕ افزودن واحد'}</span>
              <button className="modal-close" onClick={() => setShowDeptModal(false)}>✕</button>
            </div>
            {deptError && <div className="alert-box danger">{deptError}</div>}
            <form onSubmit={handleSaveDept}>
              <div className="form-group">
                <label className="form-label">نام واحد *</label>
                <input className="form-control" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">توضیحات</label>
                <input className="form-control" value={deptForm.description} onChange={e => setDeptForm({...deptForm, description: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-custom" onClick={() => setShowDeptModal(false)}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={savingDept}>{savingDept ? 'در حال ذخیره...' : '💾 ذخیره'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Type Modal */}
      {showTypeModal && (
        <div className="modal-overlay" onClick={() => setShowTypeModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingType ? '✏️ ویرایش نوع تجهیز' : '➕ افزودن نوع تجهیز'}</span>
              <button className="modal-close" onClick={() => setShowTypeModal(false)}>✕</button>
            </div>
            {typeError && <div className="alert-box danger">{typeError}</div>}
            <form onSubmit={handleSaveType}>
              <div className="form-group">
                <label className="form-label">نام نوع *</label>
                <input className="form-control" value={typeForm.name} onChange={e => setTypeForm({...typeForm, name: e.target.value})} required placeholder="مثال: لپ‌تاپ، پرینتر، مانیتور" />
              </div>
              <div className="form-group">
                <label className="form-label">توضیحات</label>
                <input className="form-control" value={typeForm.description} onChange={e => setTypeForm({...typeForm, description: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-custom" onClick={() => setShowTypeModal(false)}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={savingType}>{savingType ? 'در حال ذخیره...' : '💾 ذخیره'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
