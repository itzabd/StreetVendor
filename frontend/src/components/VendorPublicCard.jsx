import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function VendorPublicCard({ vendor, isFavorite, onToggleFavorite, onRate, onSelect }) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const totalRatings = (vendor.ratings?.good || 0) + (vendor.ratings?.worst || 0) + (vendor.ratings?.reasonable || 0);
  const getPct = (val) => totalRatings > 0 ? Math.round((val / totalRatings) * 100) : 0;

  const isUnverified = vendor.is_guest_report || vendor.profiles?.status === 'unverified';
  const spotNumber = vendor.spots?.spot_number || (vendor.is_guest_report ? 'UNMARKED' : 'ALLOC-PENDING');
  const zoneName = vendor.spots?.zones?.name || vendor.spots?.blocks?.zones?.name || vendor.category || 'Dhaka Metropolitan';
  const areaName = vendor.spots?.zones?.area || 'Dhaka Central';

  return (
    <div 
      className="sv-spot-docket-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(vendor)}
      style={{
        borderLeft: isUnverified ? '4px solid var(--sv-danger)' : '4px solid var(--sv-primary)',
        boxShadow: isHovered ? 'var(--sv-hard-shadow)' : 'var(--sv-hard-shadow-sm)',
        transform: isHovered ? 'translate(-1px, -1px)' : 'none'
      }}
    >
      <div className="sv-spot-docket-header">
        <div className="d-flex align-items-start gap-2">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <span className="sv-spot-code">
                {spotNumber}
              </span>
              <span className={`sv-badge ${isUnverified ? 'sv-badge-danger' : 'sv-badge-success'}`}>
                {isUnverified ? '⚠️ Unverified Report' : '✓ Allocated Spot'}
              </span>
              {vendor.rent_amount && (
                <span className="font-monospace text-muted" style={{ fontSize: '11px' }}>
                  ৳{vendor.rent_amount}/mo
                </span>
              )}
            </div>
            <h6 className="sv-vendor-title">
              {vendor.profiles?.business_name || vendor.profiles?.full_name || vendor.vendor_name || 'Dhaka Street Merchant'}
            </h6>
            <div className="sv-vendor-meta font-monospace">
              📍 {zoneName} {areaName ? `• ${areaName}` : ''}
              {vendor.profiles?.operating_hours && ` • ⏱️ ${vendor.profiles.operating_hours}`}
            </div>
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(vendor.vendor_id || vendor.id); }}
          className="btn btn-link p-0 text-decoration-none"
          title={isFavorite ? "Remove from bookmarked spots" : "Save spot to bookmarked ledger"}
          style={{ fontSize: '18px', color: isFavorite ? '#C8372D' : '#D5CFBF', lineHeight: 1 }}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      {/* Ratings Meter */}
      <div className="sv-spot-rating-strip">
        <div style={{ flex: 1 }}>
          <div className="d-flex justify-content-between mb-1 font-monospace" style={{ fontSize: '10px' }}>
            <span style={{ color: 'var(--sv-success)', fontWeight: 700 }}>Good {getPct(vendor.ratings?.good)}% ({vendor.ratings?.good || 0})</span>
            <span style={{ color: 'var(--sv-accent)', fontWeight: 700 }}>Fair {getPct(vendor.ratings?.reasonable)}% ({vendor.ratings?.reasonable || 0})</span>
            <span style={{ color: 'var(--sv-danger)', fontWeight: 700 }}>Flagged {getPct(vendor.ratings?.worst)}% ({vendor.ratings?.worst || 0})</span>
          </div>
          <div className="progress" style={{ height: 4, borderRadius: 0, background: '#EAE6DC' }}>
            <div className="progress-bar" style={{ width: `${getPct(vendor.ratings?.good)}%`, backgroundColor: 'var(--sv-success)' }}></div>
            <div className="progress-bar" style={{ width: `${getPct(vendor.ratings?.reasonable)}%`, backgroundColor: 'var(--sv-accent)' }}></div>
            <div className="progress-bar" style={{ width: `${getPct(vendor.ratings?.worst)}%`, backgroundColor: 'var(--sv-danger)' }}></div>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="d-flex align-items-center justify-content-between mt-2 pt-2 gap-2" style={{ borderTop: '1px solid var(--sv-border-light)' }}>
        <div className="d-flex gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onRate(vendor.vendor_id || vendor.id, 'good'); }}
            className="btn btn-sm py-1 px-2 font-monospace"
            style={{ fontSize: '10.5px', background: 'var(--sv-bg-muted)', border: '1px solid var(--sv-border)', color: 'var(--sv-success)' }}
            title="Submit positive rating"
          >
            +1 Good
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onRate(vendor.vendor_id || vendor.id, 'reasonable'); }}
            className="btn btn-sm py-1 px-2 font-monospace"
            style={{ fontSize: '10.5px', background: 'var(--sv-bg-muted)', border: '1px solid var(--sv-border)', color: 'var(--sv-accent)' }}
            title="Submit reasonable rating"
          >
            Fair
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onRate(vendor.vendor_id || vendor.id, 'worst'); }}
            className="btn btn-sm py-1 px-2 font-monospace"
            style={{ fontSize: '10.5px', background: 'var(--sv-bg-muted)', border: '1px solid var(--sv-border)', color: 'var(--sv-danger)' }}
            title="Flag issues or grievance"
          >
            Flag
          </button>
        </div>

        <span className="font-monospace" style={{ fontSize: '11px', color: 'var(--sv-primary)', fontWeight: 700 }}>
          Inspect On Map →
        </span>
      </div>
    </div>
  );
}
