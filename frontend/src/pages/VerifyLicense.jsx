import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function VerifyLicense() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const res = await axios.get(`${base}/public/verify/${id}`);
        setData(res.data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchLicense();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div className="spinner-border mb-3" style={{ color: '#1a6b3c' }} role="status"></div>
          <div>Verifying Official License...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', padding: 20 }}>
        <div className="card text-center" style={{ maxWidth: 400, width: '100%', padding: '40px 20px', borderRadius: 20, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 60, marginBottom: 10 }}>❌</div>
          <h3 style={{ color: '#ef4444', fontWeight: 700 }}>Invalid License</h3>
          <p style={{ color: '#64748b' }}>The license ID provided is invalid, does not exist, or has been revoked.</p>
          <Link to="/" className="btn mt-4" style={{ background: '#1a6b3c', color: '#fff', borderRadius: 10, padding: '10px 20px', fontWeight: 600 }}>Return Home</Link>
        </div>
      </div>
    );
  }

  const isValid = new Date() <= new Date(data.valid_until) && data.status === 'active';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', padding: 20 }}>
      <div className="card shadow-lg" style={{ maxWidth: 400, width: '100%', borderRadius: 20, overflow: 'hidden', border: 'none' }}>
        <div style={{ background: isValid ? '#10b981' : '#ef4444', padding: '30px 20px', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 48, marginBottom: 5 }}>{isValid ? '✅' : '⚠️'}</div>
          <h3 style={{ margin: '0', fontWeight: 700, fontSize: 24 }}>{isValid ? 'License Verified' : 'Inactive License'}</h3>
          <p style={{ margin: '5px 0 0', opacity: 0.9, fontSize: 13 }}>Dhaka City Corporation</p>
        </div>

        <div style={{ padding: '30px 20px' }}>
          {data.profiles?.avatar_url && (
            <div style={{ textAlign: 'center', marginBottom: 20, marginTop: -60 }}>
              <img 
                src={data.profiles.avatar_url} 
                alt="Vendor" 
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', background: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
              />
            </div>
          )}

          <div style={{ marginBottom: 15 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vendor Name</div>
            <div style={{ fontSize: 18, color: '#1e293b', fontWeight: 700 }}>{data.profiles?.full_name}</div>
          </div>

          <div style={{ marginBottom: 15 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Business</div>
            <div style={{ fontSize: 15, color: '#334155' }}>{data.profiles?.business_name || data.permission_type}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Zone</div>
              <div style={{ fontSize: 15, color: '#334155' }}>{data.zones?.name || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Spot Number</div>
              <div style={{ fontSize: 15, color: '#334155', fontWeight: 600 }}>{data.spots?.spot_number || 'N/A'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Valid From</div>
              <div style={{ fontSize: 14, color: '#334155' }}>{new Date(data.valid_from).toLocaleDateString('en-GB')}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Expires</div>
              <div style={{ fontSize: 14, color: isValid ? '#10b981' : '#ef4444', fontWeight: isValid ? 700 : 700 }}>{new Date(data.valid_until).toLocaleDateString('en-GB')}</div>
            </div>
          </div>
          
          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 15, marginTop: 15, fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
            License ID: {data.id}<br/>
            Approved By: {data.issuer?.full_name || 'City Corporation'}
          </div>
        </div>
      </div>
    </div>
  );
}
