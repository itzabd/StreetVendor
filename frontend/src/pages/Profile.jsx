import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import supabase from '../supabaseClient';

export default function Profile() {
  const { user, profile, getToken, refreshUser } = useAuth();
  const { addToast } = useToast();
  
  // Profile Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    nid_number: '',
    tin_number: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (profile && user) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        nid_number: profile.nid_number || '',
        tin_number: user.user_metadata?.tin_number || '',
        avatar_url: user.user_metadata?.avatar_url || ''
      });
    }
  }, [profile, user]);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Update Core Profile in Postgres
      const token = await getToken();
      await axios.put(`${import.meta.env.VITE_API_URL}/vendors/profile`, {
        full_name: formData.full_name,
        phone: formData.phone,
        nid_number: formData.nid_number
      }, { headers: { Authorization: `Bearer ${token}` } });

      // 2. Update extended meta in Supabase Auth (TIN + Avatar)
      const { error } = await supabase.auth.updateUser({
        data: { 
          tin_number: formData.tin_number, 
          avatar_url: formData.avatar_url 
        }
      });
      if (error) throw error;

      await refreshUser();
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || err.message || 'Update failed', 'danger');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return addToast('Passwords do not match', 'warning');
    }
    setPwdLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new_password });
      if (error) throw error;
      addToast('Password changed successfully!', 'success');
      setPasswordForm({ new_password: '', confirm_password: '' });
    } catch (err) {
      addToast(err.message, 'danger');
    } finally {
      setPwdLoading(false);
    }
  }

  const avatarSrc = formData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name || 'User')}&background=1a6b3c&color=fff`;

  return (
    <div className="p-4" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="sv-page-header mb-4">
        <h3>⚙️ Profile Settings</h3>
        <p>Manage your account, TIN ID, and security preferences.</p>
      </div>

      <div className="row g-4">
        {/* PROFILE INFO CARD */}
        <div className="col-md-8">
          <div className="sv-card mb-4">
            <div className="sv-card-header">
              <h5>Personal Information</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleProfileSubmit}>
                
                <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom">
                  <img 
                    src={avatarSrc} 
                    alt="Avatar" 
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #f0fdf4' }}
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=User` }}
                  />
                  <div className="flex-grow-1">
                    <label className="form-label small fw-semibold">Profile Picture URL</label>
                    <input 
                      type="url" 
                      className="form-control" 
                      placeholder="https://example.com/my-photo.jpg" 
                      value={formData.avatar_url} 
                      onChange={e => setFormData({...formData, avatar_url: e.target.value})} 
                    />
                    <div className="form-text">Leave blank to use initial avatar.</div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Full Name</label>
                    <input type="text" className="form-control" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Phone Number</label>
                    <input type="text" className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">NID / Smart Card ID</label>
                    <input type="text" className="form-control" value={formData.nid_number} onChange={e => setFormData({...formData, nid_number: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">TIN ID (Tax Identification)</label>
                    <input type="text" className="form-control" value={formData.tin_number} onChange={e => setFormData({...formData, tin_number: e.target.value})} placeholder="e.g. 123456789" />
                  </div>
                </div>

                <div className="mt-4 text-end">
                  <button type="submit" className="btn btn-primary px-4" disabled={loading} style={{ borderRadius: 8 }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* SECURITY CARD */}
        <div className="col-md-4">
          <div className="sv-card">
            <div className="sv-card-header">
              <h5>Security</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    required 
                    minLength={6}
                    value={passwordForm.new_password} 
                    onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} 
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-semibold">Confirm Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    required 
                    minLength={6}
                    value={passwordForm.confirm_password} 
                    onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} 
                  />
                </div>
                <button type="submit" className="btn btn-outline-primary w-100" disabled={pwdLoading} style={{ borderRadius: 8 }}>
                  {pwdLoading ? 'Updating...' : 'Change Password'}
                </button>
              </form>
              <div className="mt-4 pt-3 border-top">
                <p className="small text-muted mb-1">Registered Email:</p>
                <div className="fw-semibold" style={{ color: '#1e293b' }}>{user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
