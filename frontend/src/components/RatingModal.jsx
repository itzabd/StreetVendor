import { useState } from 'react';

const QUICK_TAGS = [
  '😋 Delicious Taste',
  '🧼 Clean & Hygienic',
  '⚡ Fast Service',
  '💰 Fair & Affordable',
  '❤️ Friendly Vendor',
  '🔥 Must-Try Special'
];

const STAR_LABELS = {
  1: '😞 1 Star · Disappointing',
  2: '😐 2 Stars · Fair / Average',
  3: '🙂 3 Stars · Good Food',
  4: '😊 4 Stars · Very Good / Fresh',
  5: '🤩 5 Stars · Absolutely Amazing!'
};

export default function RatingModal({ vendor, existingRating, onClose, onSubmitRating }) {
  const [stars, setStars] = useState(existingRating?.stars || 5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState(existingRating?.tags || ['😋 Delicious Taste']);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!vendor) return null;

  const vendorName = vendor.profiles?.business_name || vendor.profiles?.full_name || vendor.vendor_name || 'Street Stall';
  const spotNumber = vendor.spots?.spot_number || vendor.spot_number || 'STALL';
  const zoneName = vendor.spots?.zones?.name || vendor.zone_name || 'Dhaka';

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const vendorId = vendor.vendor_id || vendor.id;
    onSubmitRating(vendorId, stars, selectedTags, comment);
    setIsSubmitting(false);
    onClose();
  };

  const activeStarCount = hoveredStar || stars;

  return (
    <div 
      className="sv-auth-backdrop" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ zIndex: 1200 }}
    >
      <div 
        className="sv-glass-auth-card" 
        style={{ maxWidth: '440px', padding: '24px 22px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em', marginBottom: '6px' }}>
              <span>⭐</span>
              <span>COMMUNITY REVIEW</span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E4A4A', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              Rate {vendorName}
            </h3>
            <div style={{ fontSize: '11.5px', color: '#7A7268', marginTop: '2px' }}>
              📍 Spot #{spotNumber} · {zoneName}
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="sv-modal-close-btn"
            title="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating Selector */}
          <div style={{ textAlign: 'center', padding: '14px 10px', background: '#FAFAF8', borderRadius: '16px', border: '1px solid #E5E0D8', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#5A524A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              How was your experience?
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
              {[1, 2, 3, 4, 5].map((starVal) => (
                <button
                  key={starVal}
                  type="button"
                  onMouseEnter={() => setHoveredStar(starVal)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setStars(starVal)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '32px',
                    cursor: 'pointer',
                    color: starVal <= activeStarCount ? '#F59E0B' : '#D1D5DB',
                    transform: starVal <= activeStarCount ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    padding: '2px 4px',
                    lineHeight: 1
                  }}
                  title={`${starVal} Star`}
                >
                  ★
                </button>
              ))}
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E4A4A', minHeight: '20px' }}>
              {STAR_LABELS[activeStarCount] || 'Select stars'}
            </div>
          </div>

          {/* Quick Compliment Tags */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#1E4A4A', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              What did you like? (Tap to select)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {QUICK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      fontSize: '11.5px',
                      padding: '5px 11px',
                      borderRadius: '50px',
                      border: `1.5px solid ${isSelected ? '#1E4A4A' : '#D1C7BD'}`,
                      background: isSelected ? '#1E4A4A' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#322D29',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Short Comment */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#1E4A4A', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Add a quick tip or recommendation (Optional)
            </label>
            <textarea
              rows="2"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Try their spicy fuchka or special masala tea! Best around 5pm."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '12px',
                border: '1.5px solid #D1C7BD',
                fontSize: '12px',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline-dark"
              style={{ flex: 1, borderRadius: '50px', fontSize: '12.5px', fontWeight: 600, padding: '10px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                flex: 2,
                borderRadius: '50px',
                fontSize: '13px',
                fontWeight: 700,
                padding: '10px',
                background: 'linear-gradient(135deg, #1E4A4A 0%, #2A6666 100%)',
                boxShadow: '0 4px 14px rgba(30, 74, 74, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>⭐</span>
              <span>{existingRating ? 'Update Rating' : 'Submit Rating'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
