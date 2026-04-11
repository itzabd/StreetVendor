import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import supabase from '../supabaseClient';

export default function Onboarding() {
  const { profile, getToken, refreshUser, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    nid_number: profile?.nid_number || '',
    home_address: '',
    tin_number: '',
    business_name: '',
    business_type: '',
    operating_hours: '6:00 AM – 9:00 PM',
    avatar_url: '',
    agreed: false
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { user } = (await supabase.auth.getUser()).data;
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add a cache buster to ensure the browser reloads the image
      const finalUrl = `${publicUrl}?t=${Date.now()}`;
      update('avatar_url', finalUrl);
      addToast('Photograph uploaded successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Upload failed', 'danger');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.agreed) return addToast('Please agree to the terms and conditions', 'warning');
    
    setLoading(true);
    try {
      const token = await getToken();
      await axios.put(`${import.meta.env.VITE_API_URL}/vendors/profile`, {
        ...form,
        onboarding_completed: true
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      await refreshUser();
      addToast('Onboarding completed! Welcome to StreetVendor BD.', 'success');
      navigate('/vendor');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save profile', 'danger');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
          <h2 style={{ fontWeight: 800, color: '#1a6b3c' }}>Vendor Onboarding</h2>
          <p style={{ color: '#64748b' }}>Please complete your official profile to start applying for vending zones.</p>
        </div>

        <form onSubmit={handleSubmit} className="row g-4">
          
          {/* Section 1: Identity */}
          <div className="col-12">
            <div className="sv-card p-4">
              <h5 className="mb-4" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: '#1a6b3c', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>1</span> 
                Personal Identity
              </h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Full Name (Legal)</label>
                  <input className="form-control" value={form.full_name} onChange={e => update('full_name', e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">National ID (NID)</label>
                  <input className="form-control" value={form.nid_number} onChange={e => update('nid_number', e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Resident Address</label>
                  <input className="form-control" placeholder="House, Road, Area, City" value={form.home_address} onChange={e => update('home_address', e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Phone Number</label>
                  <input className="form-control" value={form.phone} onChange={e => update('phone', e.target.value)} required />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-bold">Passport Photograph (Upload)</label>
                  <div className="d-flex align-items-center gap-3">
                    {form.avatar_url && (
                      <img src={form.avatar_url} alt="Preview" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', border: '2px solid #1a6b3c' }} />
                    )}
                    <div className="flex-grow-1">
                      <input type="file" className="form-control" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                      <div className="form-text">Choose a professional photo (JPG/PNG). {uploading && <span className="text-primary fw-bold">Uploading...</span>}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Business details */}
          <div className="col-12">
            <div className="sv-card p-4">
              <h5 className="mb-4" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: '#1a6b3c', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>2</span> 
                Business Details
              </h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Business / Stall Name</label>
                  <input className="form-control" placeholder="e.g. Karim's Fruit Corner" value={form.business_name} onChange={e => update('business_name', e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Business Type</label>
                  <select className="form-select" value={form.business_type} onChange={e => update('business_type', e.target.value)} required>
                    <option value="">-- Select Type --</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Clothing & Apparel">Clothing & Apparel</option>
                    <option value="Electronics & Accessories">Electronics & Accessories</option>
                    <option value="Household Goods">Household Goods</option>
                    <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">TIN Number (Tax ID)</label>
                  <input className="form-control" placeholder="Optional but recommended" value={form.tin_number} onChange={e => update('tin_number', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Expected Operating Hours</label>
                  <input className="form-control" placeholder="e.g. 8:00 AM - 10:00 PM" value={form.operating_hours} onChange={e => update('operating_hours', e.target.value)} required />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Terms */}
          <div className="col-12">
            <div className="sv-card p-4" style={{ borderLeft: '4px solid #f59e0b' }}>
              <h5 className="mb-3" style={{ fontWeight: 700 }}>Legal Agreement</h5>
              <div style={{ maxHeight: 150, overflowY: 'auto', background: '#fefce8', padding: 16, borderRadius: 8, fontSize: 13, color: '#854d0e', border: '1px solid #fef08a', marginBottom: 20 }}>
                <p className="fw-bold mb-2">Terms & Conditions:</p>
                <ul className="ps-3 mb-0">
                  <li>Vendor must operate only in the approved location.</li>
                  <li>Vendor must not block roads or public pathways.</li>
                  <li>License must be displayed during operation.</li>
                  <li>Violation may result in suspension or cancellation.</li>
                  <li>All products sold must be legal and safe for consumption.</li>
                  <li>Waste management is the responsibility of the vendor.</li>
                </ul>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="agree" checked={form.agreed} onChange={e => update('agreed', e.target.checked)} required />
                <label className="form-check-label fw-semibold" htmlFor="agree" style={{ fontSize: 14 }}>
                  I confirm that all provided information is accurate and I agree to the Operating Terms.
                </label>
              </div>
            </div>
          </div>

          <div className="col-12 text-center mt-5 mb-5">
            <button type="submit" className="btn btn-primary px-5 py-3 shadow-lg" style={{ borderRadius: 12, fontWeight: 700, fontSize: 16 }} disabled={loading}>
              {loading ? 'Processing...' : 'Complete My Registration 🚀'}
            </button>
            <div className="mt-3">
              <button type="button" onClick={logout} className="btn btn-link text-muted" style={{ fontSize: 13 }}>Logout and finish later</button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
