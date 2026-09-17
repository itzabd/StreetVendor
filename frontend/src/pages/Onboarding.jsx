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
    operating_hours: '07:00 AM – 10:00 PM',
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

      const finalUrl = `${publicUrl}?t=${Date.now()}`;
      update('avatar_url', finalUrl);
      addToast('Profile photograph uploaded successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Upload failed', 'danger');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.agreed) return addToast('Please accept the Municipal Operating Code terms', 'warning');
    
    setLoading(true);
    try {
      const token = await getToken();
      await axios.put(`${import.meta.env.VITE_API_URL}/vendors/profile`, {
        ...form,
        onboarding_completed: true
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      await refreshUser();
      addToast('Merchant identity verified and recorded! Welcome to StreetVendor BD.', 'success');
      navigate('/vendor');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save municipal dossier', 'danger');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sv-canvas)', padding: '48px 20px' }}>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        
        {/* Apple-style Civic Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div className="d-inline-flex align-items-center gap-2 mb-3">
            <span className="apple-pill-badge" style={{ background: 'var(--sv-primary-light)', color: 'var(--sv-primary)', border: '1px solid var(--sv-primary-border)', padding: '5px 14px' }}>
              🏛️ Dhaka City Corporation Official Registration
            </span>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--sv-text-primary)', margin: '0 0 8px' }}>
            Merchant Digital Identity Onboarding
          </h2>
          <p style={{ color: 'var(--sv-text-muted)', fontSize: '14px', maxWidth: '580px', margin: '0 auto' }}>
            Complete your legal merchant profile to unlock spatial zone applications, digital vending license issuance, and municipal rights protection.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
          
          {/* Section 1: Personal Identity */}
          <div className="apple-card p-4">
            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--sv-primary)', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '14px'
              }}>
                1
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
                  Personal Identity & National ID
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                  Your legal identity as verified under Bangladesh national citizenship records.
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  Full Legal Name *
                </label>
                <input 
                  className="form-control" 
                  value={form.full_name} 
                  onChange={e => update('full_name', e.target.value)} 
                  placeholder="As printed on NID" 
                  required 
                />
              </div>

              <div className="col-md-6">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  National ID Number (NID) *
                </label>
                <input 
                  className="form-control" 
                  value={form.nid_number} 
                  onChange={e => update('nid_number', e.target.value)} 
                  placeholder="10 or 17 digit NID number" 
                  required 
                />
              </div>

              <div className="col-md-6">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  Permanent Residential Address *
                </label>
                <input 
                  className="form-control" 
                  placeholder="House, Road, Ward, Dhaka" 
                  value={form.home_address} 
                  onChange={e => update('home_address', e.target.value)} 
                  required 
                />
              </div>

              <div className="col-md-6">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  Active Mobile Contact *
                </label>
                <input 
                  className="form-control" 
                  placeholder="+880 17..." 
                  value={form.phone} 
                  onChange={e => update('phone', e.target.value)} 
                  required 
                />
              </div>

              <div className="col-12 mt-3">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  Official Passport Photograph
                </label>
                <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'var(--sv-surface-subtle)', border: '1px dashed var(--sv-border)' }}>
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Preview" style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', border: '2px solid var(--sv-primary)' }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 14, background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      👤
                    </div>
                  )}
                  <div className="flex-grow-1">
                    <input type="file" className="form-control" accept="image/*" onChange={handleFileUpload} disabled={uploading} style={{ fontSize: '13px' }} />
                    <div style={{ fontSize: '11.5px', color: 'var(--sv-text-muted)', marginTop: '4px' }}>
                      Clean portrait on clear background (JPG/PNG). {uploading && <span className="fw-bold" style={{ color: 'var(--sv-primary)' }}>Uploading to secure vault...</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Commercial Stall Profile */}
          <div className="apple-card p-4">
            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--sv-primary)', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '14px'
              }}>
                2
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
                  Commercial Enterprise & Vending Trade
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                  Details of your stall, trade category, and permitted operating window.
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  Stall / Enterprise Trade Name *
                </label>
                <input 
                  className="form-control" 
                  placeholder="e.g. Karim's Fresh Produce Corner" 
                  value={form.business_name} 
                  onChange={e => update('business_name', e.target.value)} 
                  required 
                />
              </div>

              <div className="col-md-6">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  Commodity Classification *
                </label>
                <select 
                  className="form-select" 
                  value={form.business_type} 
                  onChange={e => update('business_type', e.target.value)} 
                  required
                >
                  <option value="">-- Choose Trade Category --</option>
                  <option value="Food & Beverage">Food & Beverage (Tea, Snacks, Traditional)</option>
                  <option value="Fruits & Vegetables">Produce, Fruits & Seasonal Vegetables</option>
                  <option value="Clothing & Apparel">Apparel, Garments & Textiles</option>
                  <option value="Handicrafts & Artisans">Handicrafts, Pottery & Cultural Artifacts</option>
                  <option value="Electronics & Accessories">Electronics, Mobile Accents & Sundries</option>
                  <option value="General Vending">General Metropolitan Vending</option>
                </select>
              </div>

              <div className="col-md-6">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  TIN (Taxpayer Identification Number)
                </label>
                <input 
                  className="form-control" 
                  placeholder="Optional (Accelerates commercial permit)" 
                  value={form.tin_number} 
                  onChange={e => update('tin_number', e.target.value)} 
                />
              </div>

              <div className="col-md-6">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  Operating Time Window *
                </label>
                <input 
                  className="form-control" 
                  placeholder="e.g. 07:00 AM – 10:00 PM" 
                  value={form.operating_hours} 
                  onChange={e => update('operating_hours', e.target.value)} 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Legal Operating Terms */}
          <div className="apple-card p-4">
            <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--sv-accent)', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '14px'
              }}>
                3
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
                  Municipal Operating Code & Civic Compact
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                  Rules and mutual protection guarantees under the Dhaka City Corporation Spatial Trade Charter.
                </div>
              </div>
            </div>

            <div style={{
              maxHeight: 140,
              overflowY: 'auto',
              background: 'var(--sv-surface-subtle)',
              padding: '14px 18px',
              borderRadius: 'var(--sv-radius)',
              fontSize: '12.5px',
              color: 'var(--sv-text-body)',
              border: '1px solid var(--sv-border)',
              lineHeight: 1.6,
              marginBottom: '16px'
            }}>
              <strong style={{ color: 'var(--sv-primary)' }}>Municipal By-Laws Summary:</strong>
              <ul className="ps-3 mb-0 mt-1">
                <li>Merchants must conduct vending strictly within demarcated GPS polygon coordinates.</li>
                <li>Pedestrian footpath clearances of at least 1.5 meters must be maintained at all times.</li>
                <li>Official QR-coded Digital Vending Certificate must be made accessible upon civic audit.</li>
                <li>Registered merchants enjoy protection against arbitrary extortion, eviction, and harassment.</li>
                <li>Responsible waste disposal and cleanliness within a 3-meter radius is mandatory.</li>
              </ul>
            </div>

            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="agreeCode" 
                checked={form.agreed} 
                onChange={e => update('agreed', e.target.checked)} 
                required 
              />
              <label className="form-check-label" htmlFor="agreeCode" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--sv-text-primary)' }}>
                I solemnly certify that all submitted credentials are valid, and I pledge adherence to the Dhaka Municipal Spatial Trade Code.
              </label>
            </div>
          </div>

          {/* Submission Action */}
          <div className="text-center mt-2 mb-4">
            <button 
              type="submit" 
              className="apple-pill-btn"
              style={{ background: 'var(--sv-primary)', color: '#FFFFFF', padding: '14px 36px', fontSize: '15px', fontWeight: 700, boxShadow: 'var(--sv-shadow-lg)' }}
              disabled={loading}
            >
              {loading ? 'Submitting Official Dossier...' : 'Gazette Merchant Registration 🚀'}
            </button>
            <div className="mt-3">
              <button 
                type="button" 
                onClick={logout} 
                className="btn btn-link text-muted" 
                style={{ fontSize: '12.5px', textDecoration: 'none' }}
              >
                Sign out and complete registration later
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
