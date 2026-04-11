import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import supabase from '../supabaseClient';
import { generateLicensePDF } from '../utils/LicensePDF';

export default function Profile() {
  const { user, profile, getToken, refreshUser } = useAuth();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [activeAssignment, setActiveAssignment] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '', phone: '', nid_number: '', tin_number: '',
    home_address: '', business_name: '', business_type: '',
    operating_hours: '', avatar_url: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new_password: '', confirm_password: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        nid_number: profile.nid_number || '',
        tin_number: profile.tin_number || '',
        home_address: profile.home_address || '',
        business_name: profile.business_name || '',
        business_type: profile.business_type || '',
        operating_hours: profile.operating_hours || '',
        avatar_url: profile.avatar_url || ''
      });
      fetchAssignments();
    }
  }, [profile]);

  async function fetchAssignments() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(res.data);
      // Find one active assignment to authorize license
      const active = res.data.find(a => a.status === 'active');
      setActiveAssignment(active);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    }
  }

  async function handleProfileSubmit(e) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      await axios.put(`${import.meta.env.VITE_API_URL}/vendors/profile`, { ...formData }, { headers: { Authorization: `Bearer ${token}` } });
      await refreshUser();
      setIsEditing(false); // Switch back to View mode
      addToast('Profile updated!', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Update failed', 'danger');
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const finalUrl = `${publicUrl}?t=${Date.now()}`;
      setFormData(prev => ({ ...prev, avatar_url: finalUrl }));
      const token = await getToken();
      await axios.put(`${import.meta.env.VITE_API_URL}/vendors/profile`, { ...formData, avatar_url: finalUrl }, { headers: { Authorization: `Bearer ${token}` } });
      await refreshUser();
      addToast('Photo updated!', 'success');
    } catch (err) {
      addToast(err.message || 'Upload failed', 'danger');
    } finally {
      setUploading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) return addToast('Passwords mismatch', 'warning');
    setPwdLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new_password });
      if (error) throw error;
      addToast('Password changed!', 'success');
      setPasswordForm({ new_password: '', confirm_password: '' });
      setIsEditing(false);
    } catch (err) {
      addToast(err.message, 'danger');
    } finally {
      setPwdLoading(false);
    }
  }

  const handleDownloadLicense = async () => {
    if (!activeAssignment) return;
    try {
      addToast('Preparing your official license...', 'info');
      await generateLicensePDF({
        vendorName: profile?.full_name,
        nidNumber: profile?.nid_number,
        phone: profile?.phone,
        address: profile?.home_address,
        businessName: profile?.business_name,
        businessType: profile?.business_type,
        tinNumber: profile?.tin_number,
        operatingHours: profile?.operating_hours,
        avatar_url: profile?.avatar_url,
        licenseId: activeAssignment.id, // Use assignment ID for license
        zoneName: activeAssignment.spots?.zones?.name,
        spotNumber: activeAssignment.spots?.spot_number,
        latitude: activeAssignment.spots?.latitude,
        longitude: activeAssignment.spots?.longitude,
        validFrom: activeAssignment.start_date,
        validUntil: activeAssignment.end_date
      });
      addToast('License downloaded!', 'success');
    } catch (err) {
      addToast('Failed to generate PDF', 'danger');
    }
  };

  const initialsFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name || 'User')}&background=1a6b3c&color=fff`;
  const avatarSrc = formData.avatar_url || initialsFallback;

  return (
    <div className="container-fluid p-0 animate-entrance">
      
      {/* ── TOP IDENTITY BAR ── */}
      <div className="bg-white border-bottom py-3 px-4 mb-4 d-flex align-items-center justify-content-between shadow-sm rounded-bottom-4">
         <div className="d-flex align-items-center gap-3">
            <h5 className="mb-0 fw-800" style={{ color: '#1a6b3c' }}>Profile Dashboard</h5>
            <span className="badge bg-light text-dark border px-3" style={{ fontSize: 10 }}>Enterprise ID: #{profile?.id?.slice(0,8).toUpperCase()}</span>
         </div>
         <div className="d-flex gap-2">
            {!isEditing ? (
              <button 
                onClick={() => { setIsEditing(true); setActiveTab('details'); }} 
                className="btn btn-outline-primary btn-sm px-4 fw-700 shadow-sm" style={{ borderRadius: 8 }}
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="btn btn-light btn-sm px-4 fw-700" style={{ borderRadius: 8 }}>Cancel</button>
                <button onClick={handleProfileSubmit} className="btn btn-primary btn-sm px-4 fw-700 shadow-sm" style={{ borderRadius: 8 }} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
         </div>
      </div>

      <div className="row g-4 px-4 pb-5">
        
        {/* LEFT: NAV TABS */}
        <div className="col-lg-2">
          <div className="d-flex flex-column gap-2">
            <button 
              onClick={() => setActiveTab('details')}
              className={`btn text-start py-3 px-4 fw-700 transition-all ${activeTab === 'details' ? 'btn-primary shadow' : 'btn-light border-0'}`}
              style={{ borderRadius: 16, fontSize: 14 }}
            >
              👤 Profile Details
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`btn text-start py-3 px-4 fw-700 transition-all ${activeTab === 'documents' ? 'btn-primary shadow' : 'btn-light border-0'}`}
              style={{ borderRadius: 16, fontSize: 14 }}
            >
              📄 License & Docs
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`btn text-start py-3 px-4 fw-700 transition-all ${activeTab === 'security' ? 'btn-primary shadow' : 'btn-light border-0'}`}
              style={{ borderRadius: 16, fontSize: 14 }}
            >
              🛡️ Security Settings
            </button>
          </div>
        </div>

        {/* CENTER: CONTENT AREA */}
        <div className="col-lg-7">
          <div className="sv-card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 28 }}>
            
            {activeTab === 'details' && (
              <div className="p-4 p-md-5">
                <div className="mb-5 pb-4 border-bottom d-flex align-items-center gap-4">
                  <div className="position-relative">
                    <img src={avatarSrc} alt="Avatar" style={{ width: 100, height: 100, borderRadius: 24, objectFit: 'cover', border: '4px solid #f1f5f9' }} />
                    {isEditing && (
                      <label className="position-absolute shadow-sm" style={{ bottom: -8, right: -8, width: 36, height: 36, borderRadius: 12, background: '#1a6b3c', color: '#fff', cursor: 'pointer', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <input type="file" className="d-none" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                        {uploading ? <span className="spinner-border spinner-border-sm"></span> : '📷'}
                      </label>
                    )}
                  </div>
                  <div>
                    <h5 className="fw-800 mb-1 text-dark">Identity Information</h5>
                    <p className="small text-muted mb-0">{isEditing ? 'Modify your legal and contact metadata below.' : 'Your official identity details.'}</p>
                  </div>
                </div>

                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label small fw-700 text-muted mb-1">Full Legal Name</label>
                    <input type="text" disabled={!isEditing} className={`form-control border-light ${!isEditing ? 'bg-transparent border-0 px-0 fw-bold' : 'bg-light'}`} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-700 text-muted mb-1">Registered Phone</label>
                    <input type="text" disabled={!isEditing} className={`form-control border-light ${!isEditing ? 'bg-transparent border-0 px-0 fw-bold' : 'bg-light'}`} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-700 text-muted mb-1">NID / Smart Card Number</label>
                    <input type="text" disabled={!isEditing} className={`form-control border-light ${!isEditing ? 'bg-transparent border-0 px-0 fw-bold' : 'bg-light'}`} value={formData.nid_number} onChange={e => setFormData({...formData, nid_number: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-700 text-muted mb-1">TIN (Tax Identification)</label>
                    <input type="text" disabled={!isEditing} className={`form-control border-light ${!isEditing ? 'bg-transparent border-0 px-0 fw-bold' : 'bg-light'}`} value={formData.tin_number} onChange={e => setFormData({...formData, tin_number: e.target.value})} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-700 text-muted mb-1">Residential Address</label>
                    <input type="text" disabled={!isEditing} className={`form-control border-light ${!isEditing ? 'bg-transparent border-0 px-0 fw-bold' : 'bg-light'}`} value={formData.home_address} onChange={e => setFormData({...formData, home_address: e.target.value})} />
                  </div>
                </div>

                <div className="mt-5 pt-3 border-top">
                   <h6 className="fw-800 mb-4 text-dark opacity-75">Business Profile</h6>
                   <div className="row g-4">
                     <div className="col-md-7">
                       <label className="form-label small fw-700 text-muted mb-1">Stall / Business Name</label>
                       <input type="text" disabled={!isEditing} className={`form-control border-light ${!isEditing ? 'bg-transparent border-0 px-0 fw-bold' : 'bg-light'}`} value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})} />
                     </div>
                     <div className="col-md-5">
                       <label className="form-label small fw-700 text-muted mb-1">Category</label>
                       <input type="text" disabled={!isEditing} className={`form-control border-light ${!isEditing ? 'bg-transparent border-0 px-0 fw-bold' : 'bg-light'}`} value={formData.business_type} onChange={e => setFormData({...formData, business_type: e.target.value})} />
                     </div>
                     <div className="col-12">
                       <label className="form-label small fw-700 text-muted mb-1">Official Hours</label>
                       <input type="text" disabled={!isEditing} className={`form-control border-light ${!isEditing ? 'bg-transparent border-0 px-0 fw-bold' : 'bg-light'}`} value={formData.operating_hours} onChange={e => setFormData({...formData, operating_hours: e.target.value})} />
                     </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="p-5 text-center">
                 <div className="display-4 mb-4">📜</div>
                 <h4 className="fw-800 mb-2">Vending License & Approval</h4>
                 
                 {activeAssignment ? (
                    <>
                      <p className="text-muted mb-5">Your official digital license is issued for <b>Spot #{activeAssignment.spots?.spot_number}</b> in <b>{activeAssignment.spots?.zones?.name}</b>.</p>
                      
                      <div className="p-4 rounded-4 bg-light border border-dashed mb-5">
                         <div className="d-flex align-items-center justify-content-between text-start mb-3">
                            <div>
                              <div className="small fw-700 text-muted text-uppercase">License Status</div>
                              <div className="fw-800 text-success">ACTIVE & VERIFIED</div>
                            </div>
                            <div className="h1 mb-0">✅</div>
                         </div>
                         <p className="small text-muted mb-0">Your license is valid from {new Date(activeAssignment.start_date).toLocaleDateString()} until {activeAssignment.end_date ? new Date(activeAssignment.end_date).toLocaleDateString() : 'Renewal'}.</p>
                      </div>

                      <button onClick={handleDownloadLicense} className="btn btn-dark px-5 py-3 fw-800 rounded-pill shadow-lg hover-lift">
                        📥 Download Professional PDF License
                      </button>
                    </>
                 ) : (
                    <div className="py-5">
                       <div className="p-4 rounded-4 bg-light border border-dashed mb-3">
                          <h6 className="fw-800 text-warning mb-2">Awaiting Spot Assignment</h6>
                          <p className="small text-muted mb-0">Your profile is verified, but you haven't been assigned an official vending spot by the administrator yet.</p>
                       </div>
                       <p className="small text-muted">A license will only be generated once your application is approved and a physical spot is reserved for you.</p>
                       <button onClick={() => setActiveTab('details')} className="btn btn-outline-secondary btn-sm mt-3">Check Application Status</button>
                    </div>
                 )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-5">
                 <div className="mb-5 d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="fw-800 mb-1">Account Security</h5>
                      <p className="small text-muted mb-0">Manage your authentication credentials.</p>
                    </div>
                    {!isEditing && (
                      <button onClick={() => setIsEditing(true)} className="btn btn-sm btn-outline-dark">Unlock Details</button>
                    )}
                 </div>
                 
                 <form onSubmit={handlePasswordSubmit} style={{ maxWidth: 400 }}>
                   <div className="mb-4">
                     <label className="form-label small fw-700">New Secret Password</label>
                     <input type="password" required minLength={6} disabled={!isEditing} className="form-control form-control-lg border-light bg-light" value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} />
                   </div>
                   <div className="mb-4">
                     <label className="form-label small fw-700">Confirm Secret Password</label>
                     <input type="password" required minLength={6} disabled={!isEditing} className="form-control form-control-lg border-light bg-light" value={passwordForm.confirm_password} onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} />
                   </div>
                   {isEditing && (
                     <button type="submit" className="btn btn-primary px-5 py-2 fw-800 rounded-3" disabled={pwdLoading}>
                       {pwdLoading ? 'Processing...' : 'Update Password'}
                     </button>
                   )}
                 </form>

                 <div className="mt-5 p-4 rounded-4 bg-light">
                    <div className="small fw-700 text-muted text-uppercase mb-2">Managed Email</div>
                    <div className="fw-700 text-dark">{user?.email}</div>
                    <p className="small text-muted mt-1 mb-0">Public notifications and government alerts are sent to this verified address.</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: LIVE CARD PREVIEW */}
        <div className="col-lg-3">
           <div className="sticky-top" style={{ top: '100px' }}>
              <div className="small fw-800 text-muted opacity-50 mb-3 text-uppercase letter-spacing-1">Digital Card Preview</div>
              
              <div className="sv-card border-0 shadow-lg p-0 overflow-hidden" style={{ borderRadius: 24, background: '#fff' }}>
                 <div style={{ height: 80, background: 'linear-gradient(135deg, #1a6b3c, #0d3d22)' }}></div>
                 <div className="text-center px-4 pb-4" style={{ marginTop: -40 }}>
                    <img src={avatarSrc} alt="Preview" style={{ width: 80, height: 80, borderRadius: 20, border: '4px solid #fff', objectFit: 'cover', background: '#eee' }} />
                    <h6 className="fw-800 mt-3 mb-0 text-dark">{formData.full_name || 'No Name Set'}</h6>
                    <div className="small text-muted mb-3">{formData.business_type || 'General Vendor'}</div>
                    
                    <div className="bg-light p-3 rounded-4 text-start mb-3">
                       <div className="small fw-700 text-muted mb-1" style={{ fontSize: 9 }}>TRADING AS</div>
                       <div className="fw-800 text-dark small">{formData.business_name || 'Business Name'}</div>
                    </div>

                    <div className="p-2 rounded-3 mb-2" style={{ background: activeAssignment ? '#f0fdf4' : '#fef2f2', border: `1px solid ${activeAssignment ? '#dcfce7' : '#fee2e2'}` }}>
                      <div className="fw-bold d-flex align-items-center justify-content-center gap-1" style={{ fontSize: 10, color: activeAssignment ? '#166534' : '#991b1b' }}>
                        {activeAssignment ? '✅ ASSIGNED: '+activeAssignment.spots?.spot_number : '⏳ UNASSIGNED'}
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-center gap-1 text-success fw-bold small">
                       <span>🛡️</span> OFFICIAL IDENTITY
                    </div>
                 </div>
              </div>

              <div className="mt-4 p-4 rounded-4 text-center" style={{ background: 'rgba(26, 107, 60, 0.05)', border: '1px dashed #1a6b3c' }}>
                 <p className="small text-muted mb-0">This card updates in real-time as you refine your profile details.</p>
              </div>
           </div>
        </div>

      </div>

      <style>{`
        .fw-700 { font-weight: 700; }
        .fw-800 { font-weight: 800; }
        .letter-spacing-1 { letter-spacing: 1px; }
        .transition-all { transition: all 0.3s ease; }
        .hover-lift { transition: all 0.3s ease; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.12); }
        .animate-entrance { animation: svIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes svIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>
    </div>
  );
}
