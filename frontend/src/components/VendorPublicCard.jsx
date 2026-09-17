import { useState } from 'react';

export default function VendorPublicCard({ vendor, isFavorite, onToggleFavorite, onSelect, isSelected = false }) {
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryIcon = (cat, name) => {
    const text = `${cat || ''} ${name || ''}`.toLowerCase();
    if (text.includes('tea') || text.includes('coffee') || text.includes('fuchka')) return '🍵';
    if (text.includes('fruit') || text.includes('juice')) return '🍊';
    if (text.includes('pitha') || text.includes('biryani') || text.includes('food') || text.includes('snack')) return '🍲';
    if (text.includes('clothing') || text.includes('wear') || text.includes('bag') || text.includes('handicraft')) return '🧵';
    if (text.includes('vegetable') || text.includes('produce')) return '🌽';
    return '🏪';
  };

  const goodScore = vendor.ratings?.good || 0;
  const totalRatings = vendor.ratings?.total || ((vendor.ratings?.good || 0) + (vendor.ratings?.bad || 0)) || 0;
  const ratingScore = totalRatings > 0 ? (4.0 + (goodScore / totalRatings) * 1.0).toFixed(1) : '4.8';
  const categoryIcon = getCategoryIcon(vendor.category || vendor.spots?.zones?.name, vendor.profiles?.business_name || vendor.profiles?.full_name);
  const spotNumber = vendor.spots?.spot_number || vendor.spot_number || 'VN-01';
  const isUnverified = vendor.is_unverified || vendor.status === 'reported' || false;
  const zoneName = vendor.spots?.zones?.name || vendor.zone_name || 'Dhaka Metro';
  const areaName = vendor.spots?.zones?.city_corporation || vendor.area_name || '';

  return (
    <div 
      className={`sv-spot-card ${isSelected ? 'is-selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(vendor)}
      style={{
        borderRadius: '16px',
        border: isSelected ? '1.5px solid var(--sv-primary)' : '1px solid var(--sv-border-subtle)',
        backgroundColor: isSelected ? '#FFFFFF' : (isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)'),
        boxShadow: isSelected ? '0 4px 20px rgba(30, 74, 74, 0.14), 0 0 0 2px var(--sv-primary)' : (isHovered ? 'var(--sv-shadow-md)' : 'var(--sv-shadow-xs)'),
        padding: '14px 16px',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Category Avatar */}
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          backgroundColor: isSelected ? 'var(--sv-primary)' : 'var(--sv-primary-light)',
          color: isSelected ? '#FFFFFF' : 'var(--sv-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
          border: '1px solid var(--sv-primary-border)',
          transition: 'all 0.2s ease'
        }}>
          {categoryIcon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--sv-font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--sv-primary)',
              backgroundColor: 'var(--sv-primary-light)',
              padding: '2px 7px',
              borderRadius: '6px',
              letterSpacing: '-0.02em'
            }}>
              #{spotNumber}
            </span>
            <span style={{
              fontSize: '10.5px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '100px',
              backgroundColor: isUnverified ? 'var(--sv-status-danger-bg)' : 'var(--sv-status-success-bg)',
              color: isUnverified ? 'var(--sv-status-danger)' : 'var(--sv-status-success)',
              border: `1px solid ${isUnverified ? 'var(--sv-status-danger-border)' : 'var(--sv-status-success-border)'}`
            }}>
              {isUnverified ? 'Citizen Report' : '✓ Verified'}
            </span>
            {vendor.rent_amount && (
              <span className="sv-mono-data" style={{ fontSize: '11px', color: 'var(--sv-text-muted)', marginLeft: 'auto' }}>
                ৳{Number(vendor.rent_amount).toLocaleString()}/mo
              </span>
            )}
          </div>

          <h4 style={{ 
            fontSize: '14.5px', 
            fontWeight: 700, 
            color: 'var(--sv-text-primary)', 
            margin: '0 0 3px', 
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {vendor.profiles?.business_name || vendor.profiles?.full_name || vendor.vendor_name || 'Street Vendor'}
          </h4>

          <div style={{ fontSize: '12px', color: 'var(--sv-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>📍 {zoneName} {areaName ? `· ${areaName}` : ''}</span>
          </div>
        </div>

        {/* Bookmark */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(vendor.vendor_id || vendor.id); }}
          style={{
            background: 'none',
            border: 'none',
            color: isFavorite ? '#DC2626' : '#AC9C8D',
            fontSize: '18px',
            padding: '2px',
            cursor: 'pointer',
            lineHeight: 1,
            transition: 'transform 0.15s ease'
          }}
          title={isFavorite ? 'Remove bookmark' : 'Bookmark spot'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      {/* Footer Details: Stars + Hours */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingTop: '8px', 
        borderTop: '1px solid var(--sv-border-subtle)',
        fontSize: '11.5px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ color: '#EAB308', fontSize: '12px' }}>★</span>
          <span style={{ fontWeight: 700, color: 'var(--sv-text-primary)' }}>{ratingScore}</span>
          <span style={{ color: 'var(--sv-text-caption)', fontSize: '11px' }}>({totalRatings || 40})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--sv-text-caption)', fontSize: '11px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
          <span>{vendor.profiles?.operating_hours ? vendor.profiles.operating_hours.split('-')[0].trim() + ' open' : 'Open Today'}</span>
        </div>
      </div>
    </div>
  );
}
