import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { jsPDF } from 'jspdf';

export default function AdminUsers() {
  const { session, getToken, isDemo } = useAuth();
  const { addToast } = useToast();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const fetchVendors = useCallback(async () => {
    try {
      const token = (await getToken()) || session?.access_token;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/vendors/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let list = res.data || [];
      if (isDemo && list.length === 0) {
        list = [
          {
            id: 'demo-user-01',
            full_name: 'Rahim Uddin',
            business_name: "Rahim's Tea & Fuchka Corner",
            phone: '+880 1711-234567',
            nid_number: '1988269012345678',
            business_type: 'Food & Beverage',
            operating_hours: '07:00 AM - 10:30 PM',
            home_address: 'Section 10, Mirpur, Dhaka',
            role: 'vendor',
            status: 'active',
            created_at: '2026-01-10T10:00:00Z',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
          },
          {
            id: 'demo-user-02',
            full_name: 'Abdul Malek',
            business_name: 'Bismillah Fresh Fruit & Juice Bar',
            phone: '+880 1812-345678',
            nid_number: '1992145098765432',
            business_type: 'Produce & Fruits',
            operating_hours: '08:00 AM - 11:00 PM',
            home_address: 'Tejgaon Industrial Area, Dhaka',
            role: 'vendor',
            status: 'active',
            created_at: '2026-01-15T12:30:00Z',
            avatar_url: ''
          },
          {
            id: 'demo-user-03',
            full_name: 'Khadija Begum',
            business_name: 'Sonar Bangla Traditional Handicrafts',
            phone: '+880 1913-987654',
            nid_number: '1985456012398765',
            business_type: 'Handicrafts & Textiles',
            operating_hours: '10:00 AM - 08:30 PM',
            home_address: 'Dhanmondi Road 27, Dhaka',
            role: 'vendor',
            status: 'pending',
            created_at: '2026-02-01T09:15:00Z',
            avatar_url: ''
          }
        ];
      }
      setVendors(list);
    } catch {
      if (isDemo) {
        setVendors([
          {
            id: 'demo-user-01',
            full_name: 'Rahim Uddin',
            business_name: "Rahim's Tea & Fuchka Corner",
            phone: '+880 1711-234567',
            nid_number: '1988269012345678',
            business_type: 'Food & Beverage',
            operating_hours: '07:00 AM - 10:30 PM',
            home_address: 'Section 10, Mirpur, Dhaka',
            role: 'vendor',
            status: 'active',
            created_at: '2026-01-10T10:00:00Z',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
          },
          {
            id: 'demo-user-02',
            full_name: 'Abdul Malek',
            business_name: 'Bismillah Fresh Fruit & Juice Bar',
            phone: '+880 1812-345678',
            nid_number: '1992145098765432',
            business_type: 'Produce & Fruits',
            operating_hours: '08:00 AM - 11:00 PM',
            home_address: 'Tejgaon Industrial Area, Dhaka',
            role: 'vendor',
            status: 'active',
            created_at: '2026-01-15T12:30:00Z',
            avatar_url: ''
          }
        ]);
      } else {
        addToast('Failed to fetch merchant registry', 'danger');
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, session?.access_token, isDemo, addToast]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

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
      const token = (await getToken()) || session?.access_token;
      await axios.put(`${import.meta.env.VITE_API_URL}/vendors/admin/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Municipal vendor profile updated', 'success');
      setEditingVendor(null);
      fetchVendors();
    } catch {
      addToast('Failed to update vendor record', 'danger');
    }
  };

  const downloadProfile = (vendor) => {
    const doc = new jsPDF();
    const primaryColor = '#1E4A4A';
    const textColor = '#322D29';
    const mutedColor = '#4A6E6E';

    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 42, 'F');
    doc.setTextColor('#ffffff');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DHAKA CITY CORPORATION', 20, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Municipal Spatial Trade Ledger · Merchant Verification Record', 20, 28);
    doc.setFontSize(8);
    doc.text('OFFICIAL CIVIC ARCHIVE · DIGITAL IDENTITY PASSPORT', 20, 36);

    // Watermark
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(55);
    doc.text('VERIFIED NID', 30, 150, { angle: 45 });

    // Section 1
    doc.setTextColor(textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Personal Identity & Account Dossier', 20, 56);
    doc.setDrawColor(209, 199, 189);
    doc.line(20, 60, 190, 60);

    doc.setFontSize(9);
    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('LEGAL FULL NAME', 20, 70);
    doc.text('NATIONAL IDENTITY (NID)', 110, 70);

    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(vendor.full_name || 'N/A', 20, 76);
    doc.text(vendor.nid_number || 'N/A', 110, 76);

    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('ACCOUNT ROLE', 20, 86);
    doc.text('MUNICIPAL STATUS', 110, 86);

    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'bold');
    doc.text((vendor.role || 'vendor').toUpperCase(), 20, 92);
    doc.text((vendor.status || 'active').toUpperCase(), 110, 92);

    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('TELEPHONE CONTACT', 20, 102);
    doc.text('REGISTRATION DATE', 110, 102);

    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(vendor.phone || 'N/A', 20, 108);
    doc.text(new Date(vendor.created_at || Date.now()).toLocaleDateString('en-GB'), 110, 108);

    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('RESIDENTIAL ADDRESS', 20, 118);

    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(vendor.home_address || 'Dhaka Metropolitan Area', 20, 124, { maxWidth: 160 });

    // Section 2
    doc.setFontSize(14);
    doc.text('2. Trade & Business Classification', 20, 142);
    doc.setDrawColor(209, 199, 189);
    doc.line(20, 146, 190, 146);

    doc.setFontSize(9);
    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('ENTERPRISE / TRADE NAME', 20, 156);
    doc.text('COMMERCIAL CATEGORY', 110, 156);

    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(vendor.business_name || 'N/A', 20, 162);
    doc.text(vendor.business_type || 'N/A', 110, 162);

    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('PERMITTED OPERATING HOURS', 20, 172);
    doc.text('SYSTEM IDENTIFIER', 110, 172);

    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(vendor.operating_hours || 'N/A', 20, 178);
    doc.text(vendor.id?.slice(0, 12).toUpperCase() || 'N/A', 110, 178);

    // Footer
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 275, 190, 275);
    doc.setFontSize(8);
    doc.setTextColor(mutedColor);
    doc.setFont('helvetica', 'italic');
    doc.text(`Official Municipal Verification Record · Generated ${new Date().toLocaleString()} · ID: ${vendor.id}`, 20, 282);
    doc.text('Authenticated via Dhaka City Corporation Spatial Trade Ledger Platform.', 20, 287);

    doc.save(`merchant_dossier_${vendor.id.slice(0, 8)}.pdf`);
    addToast('Official Merchant PDF Dossier downloaded!', 'success');
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchSearch = !searchQuery || 
        (v.full_name && v.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.business_name && v.business_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.phone && v.phone.includes(searchQuery)) ||
        (v.nid_number && v.nid_number.includes(searchQuery));
      return matchStatus && matchSearch;
    });
  }, [vendors, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border text-success" role="status"></div>
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--sv-text-muted)' }}>
            Loading municipal merchant ledger...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-entrance" style={{ maxWidth: 1440, margin: '0 auto', paddingBottom: '48px' }}>
      {/* Header */}
      <div className="sv-page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="apple-pill-badge" style={{ background: 'var(--sv-primary-light)', color: 'var(--sv-primary)', border: '1px solid var(--sv-primary-border)' }}>
              🏛️ Municipal Civic Registry
            </span>
            <span className="apple-pill-badge" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.25)' }}>
              Merchant Identity Verification
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>
            Merchant & Officer Registry
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--sv-text-muted)', margin: '4px 0 0' }}>
            Official digital identity records, National ID verifications, and spatial vending permit credentials.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="apple-card px-3 py-2 text-center" style={{ minWidth: 120 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--sv-text-subtle)', textTransform: 'uppercase' }}>Total Merchants</div>
            <div className="sv-mono-data" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--sv-primary)' }}>{vendors.length}</div>
          </div>
          <div className="apple-card px-3 py-2 text-center" style={{ minWidth: 120 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--sv-text-subtle)', textTransform: 'uppercase' }}>NID Verified</div>
            <div className="sv-mono-data" style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>
              {vendors.filter(v => v.nid_number).length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="apple-card p-3 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="apple-segmented-bar">
          <button 
            className={`apple-segmented-item ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Accounts ({vendors.length})
          </button>
          <button 
            className={`apple-segmented-item ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active
          </button>
          <button 
            className={`apple-segmented-item ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending Verification
          </button>
        </div>

        <div style={{ maxWidth: '320px', width: '100%' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by name, trade, NID, phone..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          />
        </div>
      </div>

      {/* Merchant Ledger Table */}
      <div className="apple-card p-4">
        <div className="table-responsive">
          <table className="sv-table mb-0">
            <thead>
              <tr>
                <th>Merchant & Enterprise</th>
                <th>Identity & NID</th>
                <th>Classification</th>
                <th>Status & Role</th>
                <th className="text-end">Administrative Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map(v => (
                editingVendor === v.id ? (
                  <tr key={v.id}>
                    <td colSpan={5} style={{ padding: '24px', background: 'var(--sv-surface-subtle)' }}>
                      <div className="apple-card p-4" style={{ background: '#FFFFFF' }}>
                        <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: 'var(--sv-primary)', color: '#FFFFFF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px', fontWeight: 700
                          }}>
                            {v.full_name?.[0] || 'M'}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
                              Modifying Municipal Dossier: {v.full_name}
                            </h4>
                            <div className="sv-mono-data" style={{ fontSize: '11.5px', color: 'var(--sv-text-subtle)' }}>
                              System UID: {v.id}
                            </div>
                          </div>
                        </div>

                        <form onSubmit={(e) => handleUpdate(e, v.id)} className="row g-3">
                          <div className="col-md-4">
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                              Full Legal Name
                            </label>
                            <input 
                              className="form-control form-control-sm" 
                              value={editForm.full_name} 
                              onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} 
                              required 
                            />
                          </div>

                          <div className="col-md-4">
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                              Trade / Shop Name
                            </label>
                            <input 
                              className="form-control form-control-sm" 
                              value={editForm.business_name} 
                              onChange={e => setEditForm({ ...editForm, business_name: e.target.value })} 
                            />
                          </div>

                          <div className="col-md-4">
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                              Mobile Contact
                            </label>
                            <input 
                              className="form-control form-control-sm" 
                              value={editForm.phone} 
                              onChange={e => setEditForm({ ...editForm, phone: e.target.value })} 
                            />
                          </div>

                          <div className="col-md-4">
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                              Trade Category
                            </label>
                            <select 
                              className="form-select form-select-sm" 
                              value={editForm.business_type} 
                              onChange={e => setEditForm({ ...editForm, business_type: e.target.value })}
                            >
                              <option value="Food & Beverage">Food & Beverage</option>
                              <option value="Produce & Fruits">Produce & Fruits</option>
                              <option value="Handicrafts & Textiles">Handicrafts & Textiles</option>
                              <option value="Electronics & Accessories">Electronics & Accessories</option>
                              <option value="General Vending">General Vending</option>
                            </select>
                          </div>

                          <div className="col-md-4">
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                              Permitted Operating Hours
                            </label>
                            <input 
                              className="form-control form-control-sm" 
                              value={editForm.operating_hours} 
                              onChange={e => setEditForm({ ...editForm, operating_hours: e.target.value })} 
                            />
                          </div>

                          <div className="col-md-4">
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                              National ID (NID)
                            </label>
                            <input 
                              className="form-control form-control-sm" 
                              value={editForm.nid_number} 
                              onChange={e => setEditForm({ ...editForm, nid_number: e.target.value })} 
                            />
                          </div>

                          <div className="col-md-4">
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                              Standing Status
                            </label>
                            <select 
                              className="form-select form-select-sm" 
                              value={editForm.status} 
                              onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                            >
                              <option value="active">Active / Verified</option>
                              <option value="pending">Pending Document Verification</option>
                              <option value="suspended">Suspended / Under Audit</option>
                            </select>
                          </div>

                          <div className="col-md-4">
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                              Administrative Role
                            </label>
                            <select 
                              className="form-select form-select-sm" 
                              value={editForm.role} 
                              onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                            >
                              <option value="vendor">Merchant (Vendor)</option>
                              <option value="admin">Municipal Officer (Admin)</option>
                            </select>
                          </div>

                          <div className="col-md-4">
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                              Residential Address
                            </label>
                            <input 
                              className="form-control form-control-sm" 
                              value={editForm.home_address} 
                              onChange={e => setEditForm({ ...editForm, home_address: e.target.value })} 
                              placeholder="Address in Dhaka"
                            />
                          </div>

                          <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                            <button 
                              type="button" 
                              onClick={cancelEdit} 
                              className="apple-pill-btn"
                              style={{ background: 'var(--sv-surface-subtle)', border: '1px solid var(--sv-border)', color: 'var(--sv-text-secondary)' }}
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              className="apple-pill-btn"
                              style={{ background: 'var(--sv-primary)', color: '#FFFFFF' }}
                            >
                              Save Official Changes
                            </button>
                          </div>
                        </form>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={v.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '12px',
                          background: 'var(--sv-primary-light)', color: 'var(--sv-primary)',
                          border: '1.5px solid var(--sv-primary-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '14px', flexShrink: 0, overflow: 'hidden'
                        }}>
                          {v.avatar_url ? (
                            <img src={v.avatar_url} alt={v.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            v.full_name?.[0] || 'M'
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--sv-text-primary)' }}>
                            {v.business_name || 'Sole Street Merchant'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                            Owner: <strong>{v.full_name}</strong>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="sv-mono-data" style={{ fontWeight: 600, color: 'var(--sv-text-secondary)', fontSize: '12.5px' }}>
                        {v.nid_number ? `NID: ${v.nid_number}` : 'NID: Pending'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--sv-text-muted)', marginTop: '2px' }}>
                        📞 {v.phone || 'No phone'}
                      </div>
                    </td>

                    <td>
                      <span className="apple-pill-badge" style={{ background: 'var(--sv-surface-subtle)', color: 'var(--sv-text-secondary)', border: '1px solid var(--sv-border)' }}>
                        {v.business_type || 'General'}
                      </span>
                    </td>

                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`apple-pill-badge ${v.status === 'active' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}>
                          ● {(v.status || 'active').toUpperCase()}
                        </span>
                        {v.role === 'admin' && (
                          <span className="sv-badge sv-badge-primary" style={{ fontSize: '9px' }}>OFFICER</span>
                        )}
                      </div>
                    </td>

                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button 
                          onClick={() => handleEditClick(v)} 
                          className="apple-pill-btn"
                          style={{ background: 'var(--sv-surface-subtle)', border: '1px solid var(--sv-border)', color: 'var(--sv-text-secondary)', padding: '5px 12px', fontSize: '12px' }}
                          title="Edit Merchant Dossier"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => downloadProfile(v)} 
                          className="apple-pill-btn"
                          style={{ background: 'var(--sv-primary-light)', border: '1px solid var(--sv-primary-border)', color: 'var(--sv-primary)', padding: '5px 12px', fontSize: '12px' }}
                          title="Generate PDF Dossier"
                        >
                          📄 Dossier
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5" style={{ color: 'var(--sv-text-subtle)' }}>
                    No merchant records match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
