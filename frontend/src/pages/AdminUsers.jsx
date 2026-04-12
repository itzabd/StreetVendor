import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { jsPDF } from 'jspdf';
import '../index.css'; // using main styles

export default function AdminUsers() {
  const { session } = useAuth();
  const { addToast } = useToast();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingVendor, setEditingVendor] = useState(null);
  const [editForm, setEditForm] = useState({
    business_name: '',
    phone: '',
    business_type: '',
    operating_hours: '',
    home_address: '',
    nid_number: '',
    full_name: '',
    role: '',
    status: ''
  });

  useEffect(() => {
    if (session) fetchVendors();
  }, [session]);

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/vendors/all`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setVendors(res.data);
    } catch (error) {
      console.error(error);
      addToast('Failed to fetch vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (vendor) => {
    setEditingVendor(vendor.id);
    setEditForm({
      business_name: vendor.business_name || '',
      phone: vendor.phone || '',
      business_type: vendor.business_type || '',
      operating_hours: vendor.operating_hours || '',
      home_address: vendor.home_address || '',
      nid_number: vendor.nid_number || '',
      full_name: vendor.full_name || '',
      role: vendor.role || '',
      status: vendor.status || ''
    });
  };

  const cancelEdit = () => {
    setEditingVendor(null);
  };

  const handleUpdate = async (e, id) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/vendors/admin/${id}`, editForm, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      addToast('Vendor profile updated', 'success');
      setEditingVendor(null);
      fetchVendors();
    } catch (err) {
      console.error(err);
      addToast('Failed to update vendor', 'error');
    }
  };

  const downloadProfile = (vendor) => {
    const doc = new jsPDF();
    const primaryColor = '#1a6b3c';
    const textColor = '#1e293b';
    const mutedColor = '#64748b';

    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor('#ffffff');
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('StreetVendor BD', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Vendor Profile Digital Record', 20, 30);
    
    // Watermark effect
    doc.setTextColor(230, 230, 230);
    doc.setFontSize(60);
    doc.text('VERIFIED', 40, 150, { angle: 45 });

    // Profile Details Section
    doc.setTextColor(textColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Personal Identity & Account', 20, 55);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 58, 190, 58);

    doc.setFontSize(10);
    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('FULL NAME (LEGAL)', 20, 68);
    doc.text('NATIONAL ID (NID)', 110, 68);
    
    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(vendor.full_name || 'N/A', 20, 74);
    doc.text(vendor.nid_number || 'N/A', 110, 74);

    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('ACCOUNT ROLE', 20, 84);
    doc.text('ACCOUNT STATUS', 110, 84);
    
    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'bold');
    doc.text((vendor.role || 'vendor').toUpperCase(), 20, 90);
    doc.text((vendor.status || 'active').toUpperCase(), 110, 90);

    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('PHONE NUMBER', 20, 100);
    doc.text('JOIN DATE', 110, 100);
    
    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(vendor.phone || 'N/A', 20, 106);
    doc.text(new Date(vendor.created_at).toLocaleDateString(), 110, 106);

    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('HOME ADDRESS', 20, 116);
    
    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(vendor.home_address || 'N/A', 20, 122, { maxWidth: 160 });

    // Business details
    doc.setFontSize(16);
    doc.text('2. Business Information', 20, 145);
    doc.line(20, 148, 190, 148);

    doc.setFontSize(10);
    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('SHOP / BUSINESS NAME', 20, 128);
    doc.text('BUSINESS TYPE', 110, 128);

    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(vendor.business_name || 'N/A', 20, 134);
    doc.text(vendor.business_type || 'N/A', 110, 134);

    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('OPERATING HOURS', 20, 144);
    doc.text('TIN (TAX ID)', 110, 144);

    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(vendor.operating_hours || 'N/A', 20, 150);
    doc.text(vendor.tin_number || 'N/A', 110, 150);

    // Footer
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 275, 190, 275);
    doc.setFontSize(8);
    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'italic');
    doc.text(`Record generated on ${new Date().toLocaleString()} | User ID: ${vendor.id}`, 20, 282);
    doc.text('This is a computer generated document. No signature required.', 20, 287);

    doc.save(`vendor_profile_${vendor.id.slice(0, 8)}.pdf`);
    addToast('PDF Profile generated!', 'success');
  };

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="sv-loader"></div>
    </div>
  );

  return (
    <div className="admin-users-container animate-entrance">
      <div className="sv-page-header mb-5">
        <div className="d-flex justify-content-between align-items-end">
          <div>
            <h2 className="fw-900 mb-1" style={{ fontSize: '2.2rem', letterSpacing: '-0.02em' }}>Vendor Hub</h2>
            <p className="text-muted fw-500">Manage the official digital registry of registered street vendors.</p>
          </div>
          <div className="stats-pill">
            <span className="count">{vendors.length}</span>
            <span className="label">Total Vendors</span>
          </div>
        </div>
      </div>
      
      <div className="glass-card overflow-hidden">
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Identity & Shop</th>
                <th>Verification</th>
                <th>Classification</th>
                <th className="text-end">Management</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} className={editingVendor === v.id ? 'editing-row' : ''}>
                  {editingVendor === v.id ? (
                    <td colSpan={4} className="edit-form-cell">
                      <div className="edit-workspace-wrapper animate-entrance">
                        <div className="workspace-header d-flex align-items-center gap-3 mb-4">
                          <div className="avatar-preview">
                            {v.avatar_url ? <img src={v.avatar_url} /> : <span>{v.full_name?.[0] || 'V'}</span>}
                          </div>
                          <div>
                            <h4 className="fw-800 mb-0">Modifying Profile</h4>
                            <p className="small text-muted mb-0">System ID: {v.id.slice(0, 8)}</p>
                          </div>
                        </div>

                        <form onSubmit={(e) => handleUpdate(e, v.id)} className="row g-4">
                          <div className="col-md-4">
                            <div className="form-group-premium">
                              <label>Full Owner Name</label>
                              <input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} placeholder="Legal Name" />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-group-premium">
                              <label>Shop Title</label>
                              <input value={editForm.business_name} onChange={e => setEditForm({...editForm, business_name: e.target.value})} placeholder="Trade Name" />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-group-premium">
                              <label>Mobile Contact</label>
                              <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="+880..." />
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="form-group-premium">
                              <label>Business Type</label>
                              <select value={editForm.business_type} onChange={e => setEditForm({...editForm, business_type: e.target.value})}>
                                <option value="Food & Beverage">Food & Beverage</option>
                                <option value="Clothing & Apparel">Clothing & Apparel</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-group-premium">
                              <label>Operating Hours</label>
                              <input value={editForm.operating_hours} onChange={e => setEditForm({...editForm, operating_hours: e.target.value})} placeholder="e.g. 9AM - 9PM" />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-group-premium">
                              <label>NID / Identification</label>
                              <input value={editForm.nid_number} onChange={e => setEditForm({...editForm, nid_number: e.target.value})} />
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="form-group-premium">
                              <label>Account Status</label>
                              <select className={`status-select ${editForm.status}`} value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                                <option value="active">🟢 Active</option>
                                <option value="pending">🟡 Pending</option>
                                <option value="suspended">🔴 Suspended</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-group-premium">
                              <label>Administrative Role</label>
                              <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                                <option value="vendor">Standard Vendor</option>
                                <option value="admin">System Admin</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-group-premium disabled">
                              <label>Registered Since</label>
                              <input value={new Date(v.created_at).toLocaleDateString()} disabled />
                            </div>
                          </div>

                          <div className="col-12 mt-2">
                             <div className="form-group-premium">
                              <label>Physical Address</label>
                              <input value={editForm.home_address} onChange={e => setEditForm({...editForm, home_address: e.target.value})} placeholder="Full residence details..." />
                            </div>
                          </div>

                          <div className="col-12 d-flex gap-3 justify-content-end mt-5">
                            <button type="button" onClick={cancelEdit} className="btn-modern secondary">Cancel</button>
                            <button type="submit" className="btn-modern primary">Propagate Changes 🚀</button>
                          </div>
                        </form>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="hub-avatar">
                            {v.avatar_url ? <img src={v.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : v.full_name?.[0]}
                          </div>
                          <div>
                            <div className="shop-name">{v.business_name || 'Individual Merchant'}</div>
                            <div className="owner-name small text-muted" style={{ fontSize: 11 }}>{v.full_name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-display">
                          <div className="phone fw-bold" style={{ fontSize: 13, color: '#1e293b' }}>{v.phone || '--'}</div>
                          <div className="nid small text-muted" style={{ fontSize: 11 }}>ID: {v.id.slice(0, 8)}</div>
                        </div>
                      </td>
                      <td>
                        <div className="badge-stack d-flex align-items-center gap-2">
                          <span className="type-badge">{v.business_type || 'General'}</span>
                          <span className={`status-badge-mini ${v.status || 'active'}`}>{v.status || 'active'}</span>
                        </div>
                      </td>
                      <td className="text-end">
                        <div className="action-buttons">
                          <button onClick={() => handleEditClick(v)} className="action-btn edit" title="Edit Profile">
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>
                          </button>
                          <button onClick={() => downloadProfile(v)} className="action-btn download" title="Download PDF">
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .admin-users-container { padding: 40px; max-width: 1240px; margin: 0 auto; min-height: 100vh; background: #fdfdfd; }
        .glass-card { background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #edf2f7; }
        
        .stats-pill { background: #fff; border: 1.5px solid #e2e8f0; padding: 8px 16px; border-radius: 12px; display: flex; align-items: center; gap: 8px; }
        .stats-pill .count { font-size: 18px; font-weight: 800; color: #1a6b3c; }
        .stats-pill .label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

        .premium-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .premium-table th { background: #fcfdfe; padding: 14px 24px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #edf2f7; }
        .premium-table td { padding: 12px 24px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
        
        .hub-avatar { width: 38px; height: 38px; border-radius: 10px; background: #1a6b3c; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; overflow: hidden; flex-shrink: 0; }
        .shop-name { font-weight: 600; color: #1e293b; font-size: 14px; }
        .type-badge { background: #f1f5f9; padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; color: #475569; }
        
        .status-badge-mini { padding: 3px 8px; border-radius: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase; }
        .status-badge-mini.active { background: #dcfce7; color: #166534; }
        .status-badge-mini.pending { background: #fef9c3; color: #854d0e; }
        .status-badge-mini.suspended { background: #fee2e2; color: #991b1b; }

        .action-buttons { display: flex; gap: 6px; justify-content: flex-end; }
        .action-btn { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; background: #fff; color: #94a3b8; transition: 0.2s; cursor: pointer; }
        .action-btn:hover { border-color: #1a6b3c; color: #1a6b3c; background: #f0fdf4; }

        /* Editing Mode */
        .editing-row { background: #fcfdfe !important; }
        .edit-form-cell { padding: 24px !important; }
        .edit-workspace-wrapper { background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; }
        
        .avatar-preview { width: 48px; height: 48px; border-radius: 12px; background: #1a6b3c; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; overflow: hidden; }
        .form-group-premium { display: flex; flex-direction: column; gap: 4px; }
        .form-group-premium label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .form-group-premium input, .form-group-premium select { padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 500; color: #1e293b; transition: 0.2s; width: 100%; }
        .form-group-premium input:focus { outline: none; border-color: #1a6b3c; box-shadow: 0 0 0 3px rgba(26, 107, 60, 0.05); }
        .form-group-premium.disabled input { background: #f8fafc; color: #94a3b8; }

        .btn-modern { padding: 8px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; }
        .btn-modern.primary { background: #1a6b3c; color: #fff; border: none; }
        .btn-modern.primary:hover { background: #155730; }
        .btn-modern.secondary { background: #fff; color: #64748b; border: 1px solid #e2e8f0; }

        .sv-loader { width: 24px; height: 24px; border: 2px solid #f3f3f3; border-top: 2px solid #1a6b3c; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes svIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-entrance { animation: svIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}
