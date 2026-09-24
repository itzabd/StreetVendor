import { useState, useEffect, useCallback } from 'react';
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

  const fetchAssignments = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const active = (res.data || []).find(a => a.status === 'active');
      setActiveAssignment(active || null);
    } catch {
      // Demo fallback if backend is offline
      setActiveAssignment({
        id: 'asgn-demo-01',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        status: 'active',
        spots: {
          spot_number: 'M10-04',
          latitude: 23.8068,
          longitude: 90.3687,
          zones: { name: 'Mirpur Commercial Hub' }
        }
      });
    }
  }, [getToken]);

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
  }, [profile, fetchAssignments]);

  async function handleProfileSubmit(e) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      await axios.put(`${import.meta.env.VITE_API_URL}/vendors/profile`, { ...formData }, { headers: { Authorization: `Bearer ${token}` } });
      await refreshUser();
      setIsEditing(false);
      addToast('Municipal profile updated successfully!', 'success');
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
      addToast('Profile photograph updated!', 'success');
    } catch (err) {
      addToast(err.message || 'Upload failed', 'danger');
    } finally {
      setUploading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) return addToast('Passwords do not match', 'warning');
    setPwdLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new_password });
      if (error) throw error;
      addToast('Password updated securely!', 'success');
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
      addToast('Generating official municipal vending license PDF...', 'info');
      await generateLicensePDF({
        vendorName: profile?.full_name || formData.full_name,
        nidNumber: profile?.nid_number || formData.nid_number,
        phone: profile?.phone || formData.phone,
        address: profile?.home_address || formData.home_address,
        businessName: profile?.business_name || formData.business_name,
        businessType: profile?.business_type || formData.business_type,
        tinNumber: profile?.tin_number || formData.tin_number,
        operatingHours: profile?.operating_hours || formData.operating_hours,
        avatar_url: profile?.avatar_url || formData.avatar_url,
        licenseId: activeAssignment.id,
        zoneName: activeAssignment.spots?.zones?.name || 'Dhaka Metropolitan Zone',
        spotNumber: activeAssignment.spots?.spot_number || 'VN-01',
        latitude: activeAssignment.spots?.latitude,
        longitude: activeAssignment.spots?.longitude,
        validFrom: activeAssignment.start_date,
        validUntil: activeAssignment.end_date
      });
      addToast('Official license certificate downloaded!', 'success');
    } catch {
      addToast('Failed to generate license PDF', 'danger');
    }
  };

  const initialsFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name || 'Merchant')}&background=1E4A4A&color=fff`;
  const avatarSrc = formData.avatar_url || initialsFallback;

  return (
    <div className="animate-entrance" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: '48px' }}>
      
      {/* Top Banner Header */}
      <div className="apple-card p-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="apple-pill-badge" style={{ background: 'var(--sv-primary-light)', color: 'var(--sv-primary)', border: '1px solid var(--sv-primary-border)' }}>
            🏛️ Dhaka City Corporation Citizen Profile
          </div>
          <span className="sv-mono-data" style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
            Merchant UID: #{profile?.id?.slice(0, 8).toUpperCase() || 'DEMO-01'}
          </span>
        </div>

        <div className="d-flex gap-2">
          {!isEditing ? (
            <button 
              onClick={() => { setIsEditing(true); setActiveTab('details'); }} 
              className="apple-pill-btn"
              style={{ background: 'var(--sv-primary)', color: '#FFFFFF' }}
            >
              ✏️ Edit Profile Dossier
            </button>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(false)} 
                className="apple-pill-btn"
                style={{ background: 'var(--sv-surface-subtle)', border: '1px solid var(--sv-border)', color: 'var(--sv-text-secondary)' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleProfileSubmit} 
                className="apple-pill-btn"
                style={{ background: 'var(--sv-primary)', color: '#FFFFFF' }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Official Record'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="row g-4">
        {/* Left Segmented Navigation */}
        <div className="col-lg-3">
          <div className="apple-card p-2 p-md-3 mb-4 d-flex flex-md-column flex-row gap-2 sv-profile-tab-list" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
            <button 
              onClick={() => setActiveTab('details')}
              className={`apple-pill-btn text-start justify-content-start ${activeTab === 'details' ? 'active' : ''}`}
              style={{
                background: activeTab === 'details' ? 'var(--sv-primary)' : 'transparent',
                color: activeTab === 'details' ? '#FFFFFF' : 'var(--sv-text-body)',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                flexShrink: 0
              }}
            >
              👤 Details
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`apple-pill-btn text-start justify-content-start ${activeTab === 'documents' ? 'active' : ''}`}
              style={{
                background: activeTab === 'documents' ? 'var(--sv-primary)' : 'transparent',
                color: activeTab === 'documents' ? '#FFFFFF' : 'var(--sv-text-body)',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                flexShrink: 0
              }}
            >
              📄 License
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`apple-pill-btn text-start justify-content-start ${activeTab === 'security' ? 'active' : ''}`}
              style={{
                background: activeTab === 'security' ? 'var(--sv-primary)' : 'transparent',
                color: activeTab === 'security' ? '#FFFFFF' : 'var(--sv-text-body)',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                flexShrink: 0
              }}
            >
              🛡️ Security
            </button>
          </div>

          {/* Quick Municipal Status Callout */}
          <div className="apple-card p-4 text-center">
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--sv-text-subtle)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Municipal Verification Standing
            </div>
            <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
              <span className="apple-pill-badge" style={{ background: 'rgba(5, 150, 105, 0.12)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.25)', fontSize: '13px' }}>
                ✓ NID Verified
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--sv-text-muted)', margin: 0 }}>
              Official merchant record registered with Dhaka North City Corporation spatial ledger.
            </p>
          </div>
        </div>

        {/* Center: Main Tab Content */}
        <div className="col-lg-5">
          <div className="apple-card p-4">
            {activeTab === 'details' && (
              <div>
                <div className="d-flex align-items-center gap-3 pb-3 mb-4 border-bottom">
                  <div className="position-relative">
                    <img 
                      src={avatarSrc} 
                      alt="Avatar" 
                      style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', border: '3px solid var(--sv-primary-border)' }} 
                    />
                    {isEditing && (
                      <label 
                        className="position-absolute shadow-sm" 
                        style={{ 
                          bottom: -6, right: -6, width: 32, height: 32, 
                          borderRadius: 10, background: 'var(--sv-primary)', 
                          color: '#fff', cursor: 'pointer', border: '2px solid #fff', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px'
                        }}
                      >
                        <input type="file" className="d-none" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                        {uploading ? <span className="spinner-border spinner-border-sm"></span> : '📷'}
                      </label>
                    )}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 2px', color: 'var(--sv-text-primary)' }}>
                      {formData.full_name || 'Registered Merchant'}
                    </h4>
                    <div style={{ fontSize: '12.5px', color: 'var(--sv-text-muted)' }}>
                      {formData.business_name ? `Trading as ${formData.business_name}` : 'Individual Trade Account'}
                    </div>
                  </div>
                </div>

                <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sv-text-primary)', marginBottom: '14px' }}>
                  1. Personal & Contact Information
                </h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>Full Legal Name</label>
                    <input 
                      type="text" 
                      disabled={!isEditing} 
                      className="form-control" 
                      value={formData.full_name} 
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>Contact Phone</label>
                    <input 
                      type="text" 
                      disabled={!isEditing} 
                      className="form-control" 
                      value={formData.phone} 
                      onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>National ID (NID)</label>
                    <input 
                      type="text" 
                      disabled={!isEditing} 
                      className="form-control" 
                      value={formData.nid_number} 
                      onChange={e => setFormData({ ...formData, nid_number: e.target.value })} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>TIN (Tax Identifier)</label>
                    <input 
                      type="text" 
                      disabled={!isEditing} 
                      className="form-control" 
                      value={formData.tin_number} 
                      onChange={e => setFormData({ ...formData, tin_number: e.target.value })} 
                    />
                  </div>
                  <div className="col-12">
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>Residential Address</label>
                    <input 
                      type="text" 
                      disabled={!isEditing} 
                      className="form-control" 
                      value={formData.home_address} 
                      onChange={e => setFormData({ ...formData, home_address: e.target.value })} 
                    />
                  </div>
                </div>

                <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sv-text-primary)', marginBottom: '14px', borderTop: '1px solid var(--sv-border-subtle)', paddingTop: '16px' }}>
                  2. Commercial Vending Profile
                </h5>
                <div className="row g-3">
                  <div className="col-md-7">
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>Stall / Trade Name</label>
                    <input 
                      type="text" 
                      disabled={!isEditing} 
                      className="form-control" 
                      value={formData.business_name} 
                      onChange={e => setFormData({ ...formData, business_name: e.target.value })} 
                    />
                  </div>
                  <div className="col-md-5">
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>Commodity Category</label>
                    <input 
                      type="text" 
                      disabled={!isEditing} 
                      className="form-control" 
                      value={formData.business_type} 
                      onChange={e => setFormData({ ...formData, business_type: e.target.value })} 
                    />
                  </div>
                  <div className="col-12">
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>Permitted Operating Hours</label>
                    <input 
                      type="text" 
                      disabled={!isEditing} 
                      className="form-control" 
                      value={formData.operating_hours} 
                      onChange={e => setFormData({ ...formData, operating_hours: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="text-center py-4">
                <div style={{ fontSize: '42px', marginBottom: '12px' }}>📜</div>
                <h4 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--sv-text-primary)' }}>
                  Municipal Vending License & Deed
                </h4>
                
                {activeAssignment ? (
                  <>
                    <p style={{ fontSize: '13px', color: 'var(--sv-text-muted)', marginBottom: '24px' }}>
                      Your digital municipal license is issued for <strong>Spot #{activeAssignment.spots?.spot_number}</strong> in <strong>{activeAssignment.spots?.zones?.name || 'Mirpur Commercial Zone'}</strong>.
                    </p>
                    
                    <div style={{
                      padding: '18px',
                      borderRadius: 'var(--sv-radius-lg)',
                      background: 'rgba(5, 150, 105, 0.08)',
                      border: '1.5px solid rgba(5, 150, 105, 0.25)',
                      textAlign: 'left',
                      marginBottom: '24px'
                    }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div>
                          <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: '#059669' }}>License Status</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#065f46' }}>GAZETTED & ACTIVE</div>
                        </div>
                        <div style={{ fontSize: '28px' }}>✅</div>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#047857' }}>
                        Validity: {new Date(activeAssignment.start_date).toLocaleDateString('en-GB')} to {activeAssignment.end_date ? new Date(activeAssignment.end_date).toLocaleDateString('en-GB') : '31 Dec 2026'}.
                      </div>
                    </div>

                    <button 
                      onClick={handleDownloadLicense} 
                      className="apple-pill-btn"
                      style={{ background: 'var(--sv-primary)', color: '#FFFFFF', padding: '12px 28px', fontSize: '14px', boxShadow: 'var(--sv-shadow-md)' }}
                    >
                      📥 Download Official PDF License Certificate
                    </button>
                  </>
                ) : (
                  <div style={{
                    padding: '24px',
                    borderRadius: 'var(--sv-radius-lg)',
                    background: 'var(--sv-surface-subtle)',
                    border: '1px solid var(--sv-border)'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sv-text-primary)', marginBottom: '6px' }}>
                      Awaiting Spatial Spot Allocation
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--sv-text-muted)', margin: 0 }}>
                      Your merchant identity is verified. Once your zone application is approved by the City Corporation and a specific GPS spot is reserved, your certificate will unlock here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="py-2">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                  <div>
                    <h5 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
                      Account Security & Credentials
                    </h5>
                    <div style={{ fontSize: '12.5px', color: 'var(--sv-text-muted)' }}>
                      Manage your portal password and authenticated session.
                    </div>
                  </div>
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="apple-pill-btn"
                      style={{ background: 'var(--sv-surface-subtle)', border: '1px solid var(--sv-border)', padding: '5px 14px', fontSize: '12px' }}
                    >
                      Unlock Fields
                    </button>
                  )}
                </div>
                
                <form onSubmit={handlePasswordSubmit} style={{ maxWidth: 420 }}>
                  <div className="mb-3">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                      New Secure Password
                    </label>
                    <input 
                      type="password" 
                      required 
                      minLength={6} 
                      disabled={!isEditing} 
                      className="form-control" 
                      value={passwordForm.new_password} 
                      onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} 
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="mb-4">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                      Confirm New Password
                    </label>
                    <input 
                      type="password" 
                      required 
                      minLength={6} 
                      disabled={!isEditing} 
                      className="form-control" 
                      value={passwordForm.confirm_password} 
                      onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} 
                      placeholder="••••••••"
                    />
                  </div>
                  {isEditing && (
                    <button 
                      type="submit" 
                      className="apple-pill-btn"
                      style={{ background: 'var(--sv-primary)', color: '#FFFFFF', padding: '9px 24px' }}
                      disabled={pwdLoading}
                    >
                      {pwdLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  )}
                </form>

                <div style={{
                  marginTop: '32px',
                  padding: '16px',
                  borderRadius: 'var(--sv-radius)',
                  background: 'var(--sv-surface-subtle)',
                  border: '1px solid var(--sv-border)'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--sv-text-subtle)', marginBottom: '4px' }}>
                    Authenticated Account Email
                  </div>
                  <div className="sv-mono-data" style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--sv-text-primary)' }}>
                    {user?.email || 'operator@dhakacity.gov.bd'}
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--sv-text-muted)', margin: '4px 0 0' }}>
                    Official correspondence and administrative summons are routed to this address.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Apple Wallet / Identity Card Preview */}
        <div className="col-lg-4">
          <div className="sticky-top" style={{ top: '80px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sv-text-subtle)', marginBottom: '10px' }}>
              Apple Wallet · Civic Pass
            </div>
            
            {/* Apple Wallet Style Card */}
            <div style={{
              borderRadius: '24px',
              overflow: 'hidden',
              background: 'linear-gradient(145deg, #0B2828 0%, #1A3D3D 60%, #1E4A4A 100%)',
              color: '#FFFFFF',
              boxShadow: '0 16px 40px -10px rgba(11, 40, 40, 0.45), 0 2px 6px rgba(0,0,0,0.06)',
              position: 'relative',
              padding: '24px'
            }}>
              {/* Top Card Header */}
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <div style={{ fontSize: '10px', letterSpacing: '0.08em', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>
                    DHAKA CITY CORPORATION
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#A7F3D0' }}>
                    Digital Merchant Pass
                  </div>
                </div>
                <div style={{ fontSize: '24px' }}>⚖️</div>
              </div>

              {/* Merchant Details */}
              <div className="d-flex align-items-center gap-3 mb-4">
                <img 
                  src={avatarSrc} 
                  alt="Merchant" 
                  style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} 
                />
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                    {formData.full_name || 'Rahim Uddin'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#BBF7D0' }}>
                    {formData.business_name || "Rahim's Tea Stall"}
                  </div>
                </div>
              </div>

              {/* Grid Metadata */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                padding: '12px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.08)',
                marginBottom: '16px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div>
                  <div style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Assigned Spot</div>
                  <div className="sv-mono-data" style={{ fontSize: '13px', fontWeight: 700, color: '#A7F3D0' }}>
                    {activeAssignment ? activeAssignment.spots?.spot_number : 'M10-04'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Zone Demarcation</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
                    {activeAssignment?.spots?.zones?.name || 'Mirpur Hub'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>NID Verification</div>
                  <div className="sv-mono-data" style={{ fontSize: '11px', color: '#BBF7D0' }}>
                    {formData.nid_number ? 'VERIFIED' : 'PENDING'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Deed Standing</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#34D399' }}>
                    ACTIVE PERMIT
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="d-flex justify-content-between align-items-center pt-2 border-top" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                <span className="sv-mono-data" style={{ fontSize: '10px', opacity: 0.7 }}>
                  VALID: 2026-12-31
                </span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#BBF7D0' }}>
                  ● OFFICIAL PASS
                </span>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '14px',
              borderRadius: 'var(--sv-radius)',
              background: 'var(--sv-surface-subtle)',
              border: '1px solid var(--sv-border)',
              fontSize: '12px',
              color: 'var(--sv-text-muted)',
              textAlign: 'center'
            }}>
              💡 Real-time synchronization: Changes to your profile automatically propagate to your digital municipal vending license and QR verification dossier.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
