import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function VendorPublicCard({ vendor, isFavorite, onToggleFavorite, onRate, onSelect }) {

  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const base = import.meta.env.VITE_API_URL;

  const totalRatings = (vendor.ratings?.good || 0) + (vendor.ratings?.worst || 0) + (vendor.ratings?.reasonable || 0);
  
  // Calculate percentage for a simple bar
  const getPct = (val) => totalRatings > 0 ? (val / totalRatings) * 100 : 0;

  return (
    <div 
      className="sv-card mb-3 overflow-hidden animate-entrance"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(vendor)}
      style={{ 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px)' : 'none',
        boxShadow: isHovered ? '0 12px 24px -10px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.05)',
        border: isHovered ? '1px solid #1a6b3c' : '1px solid #f1f5f9',
        cursor: 'pointer'
      }}
    >
      <div className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center gap-3">
            <div style={{ 
              width: 48, height: 48, background: '#f8fafc', borderRadius: 12, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              border: '1px solid #e2e8f0'
            }}>
              🏪
            </div>
            <div>
              <h6 className="mb-0 fw-800 text-dark" style={{ fontSize: 15 }}>
                {vendor.profiles?.business_name || vendor.profiles?.full_name}
                {vendor.profiles?.status === 'unverified' && (
                  <span className="badge bg-danger ms-2" style={{ fontSize: 8, verticalAlign: 'middle' }}>UNVERIFIED</span>
                )}
              </h6>
              <div className="text-muted small">
                {vendor.is_guest_report ? (
                  <>📂 {vendor.category || 'Street Vendor'} • Reported Spot</>
                ) : (
                  <>📍 {vendor.spots?.blocks?.zones?.name} • {vendor.spots?.blocks?.block_name}</>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(vendor.vendor_id || vendor.id); }}
            className="btn btn-link p-0 text-decoration-none"
            style={{ fontSize: 20, color: isFavorite ? '#ef4444' : '#cbd5e1', transition: 'all 0.2s' }}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>


        {/* Rating Bars */}
        <div className="mt-3 mb-3">
          <div className="progress mb-1" style={{ height: 6, borderRadius: 3, background: '#f1f5f9' }}>
            <div className="progress-bar bg-success" style={{ width: `${getPct(vendor.ratings?.good)}%` }}></div>
            <div className="progress-bar bg-warning" style={{ width: `${getPct(vendor.ratings?.reasonable)}%` }}></div>
            <div className="progress-bar bg-danger" style={{ width: `${getPct(vendor.ratings?.worst)}%` }}></div>
          </div>
          <div className="d-flex justify-content-between text-muted" style={{ fontSize: 10, fontWeight: 600 }}>
            <span className="text-success">Good: {vendor.ratings?.good || 0}</span>
            <span className="text-warning">Reasonable: {vendor.ratings?.reasonable || 0}</span>
            <span className="text-danger">Worst: {vendor.ratings?.worst || 0}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onRate(vendor.vendor_id || vendor.id, 'good'); }}
            className="btn btn-outline-success btn-sm flex-grow-1"
            style={{ fontSize: 11, borderRadius: 8, fontWeight: 600 }}
          >
            👍 Good
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onRate(vendor.vendor_id || vendor.id, 'reasonable'); }}
            className="btn btn-outline-warning btn-sm"
            style={{ fontSize: 11, borderRadius: 8, fontWeight: 600 }}
          >
            ⚖️ Reasonable
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onRate(vendor.vendor_id || vendor.id, 'worst'); }}
            className="btn btn-outline-danger btn-sm"
            style={{ fontSize: 11, borderRadius: 8, fontWeight: 600 }}
          >
            👎 Bad
          </button>
        </div>
      </div>
    </div>
  );
}
