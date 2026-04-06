import React, { useState } from 'react';
import './ScopeInputs.css';
import { validateScopeOfWork, validateContactInfo } from '../utils/validator';

/**
 * ScopeInputs Component - Form for scope of work and contact information
 * Uses Zod validation for input sanitization
 * Mobile-first with neomorphic design, 44x44px minimum touch targets
 */
export default function ScopeInputs({
  initialData = {},
  categories = [
    { key: 'plumbing', label: 'Plumbing', icon: '🔧' },
    { key: 'electrical', label: 'Electric', icon: '⚡' },
    { key: 'furniture', label: 'Assembly', icon: '🪑' },
    { key: 'moving', label: 'Moving', icon: '📦' },
    { key: 'painting', label: 'Painting', icon: '🎨' },
    { key: 'drywall', label: 'Drywall', icon: '🪟' },
    { key: 'roof', label: 'Roofing', icon: '🏠' },
    { key: 'default', label: 'Other', icon: '✨' },
  ],
  onSubmit,
  onError,
}) {
  const [formData, setFormData] = useState({
    description: initialData.description || '',
    category: initialData.category || '',
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    zip: initialData.zip || '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error on change if field was touched
    if (touched[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle blur for validation
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  // Validate single field
  const validateField = (fieldName, value) => {
    let result;
    if (['description', 'category'].includes(fieldName)) {
      result = validateScopeOfWork({ 
        description: formData.description || value, 
        category: formData.category || value, 
        photos: [] 
      });
    } else {
      result = validateContactInfo({ 
        name: formData.name || value, 
        email: formData.email || value, 
        phone: formData.phone || value, 
        zip: formData.zip || value 
      });
    }
    
    if (!result.success && result.errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: result.errors[fieldName][0] }));
      return false;
    }
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    return true;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);
    
    // Validate all fields
    const scopeResult = validateScopeOfWork({
      description: formData.description,
      category: formData.category,
      photos: [],
    });
    
    const contactResult = validateContactInfo({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      zip: formData.zip,
    });
    
    if (!scopeResult.success || !contactResult.success) {
      const allErrors = {};
      if (scopeResult.errors) {
        Object.entries(scopeResult.errors).forEach(([key, msgs]) => {
          allErrors[key] = msgs[0];
        });
      }
      if (contactResult.errors) {
        Object.entries(contactResult.errors).forEach(([key, msgs]) => {
          allErrors[key] = msgs[0];
        });
      }
      setErrors(allErrors);
      if (onError) onError(allErrors);
      return;
    }
    
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form className="scope-inputs-form" onSubmit={handleSubmit} noValidate>
      {/* Scope of Work Section */}
      <section className="form-section neo-inset" aria-label="Scope of Work">
        <h2 className="form-section-title">Scope of Work</h2>
        
        {/* Category Selection */}
        <div className="form-group">
          <label htmlFor="category" className="form-label">Service Category</label>
          <div className="category-grid" role="radiogroup" aria-label="Select a service category">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`category-chip neo-btn ${formData.category === cat.key ? 'selected' : ''}`}
                onClick={() => {
                  setFormData((prev) => ({ ...prev, category: cat.key }));
                  validateField('category', cat.key);
                }}
                aria-pressed={formData.category === cat.key}
                style={{ minHeight: 44 }}
              >
                <span className="category-icon" aria-hidden="true">{cat.icon}</span>
                <span className="category-label">{cat.label}</span>
              </button>
            ))}
          </div>
          {errors.category && touched.category && (
            <span className="form-error" role="alert">{errors.category}</span>
          )}
        </div>

        {/* Description Textarea */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">Describe the Issue</label>
          <textarea
            id="description"
            name="description"
            className={`form-textarea neo-input ${errors.description ? 'has-error' : ''}`}
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., Leaking pipe under kitchen sink, water dripping..."
            maxLength={2000}
            rows={4}
            aria-describedby={errors.description ? 'description-error' : undefined}
            aria-invalid={!!errors.description}
          />
          <div className="char-counter">{formData.description.length}/2000</div>
          {errors.description && touched.description && (
            <span className="form-error" id="description-error" role="alert">{errors.description}</span>
          )}
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="form-section neo-inset" aria-label="Contact Information">
        <h2 className="form-section-title">Contact Information</h2>
        
        {/* Name */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            className={`form-input neo-input ${errors.name ? 'has-error' : ''}`}
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="John Doe"
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={!!errors.name}
            style={{ minHeight: 44 }}
          />
          {errors.name && touched.name && (
            <span className="form-error" id="name-error" role="alert">{errors.name}</span>
          )}
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            className={`form-input neo-input ${errors.email ? 'has-error' : ''}`}
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="john@example.com"
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
            style={{ minHeight: 44 }}
          />
          {errors.email && touched.email && (
            <span className="form-error" id="email-error" role="alert">{errors.email}</span>
          )}
        </div>

        {/* Phone */}
        <div className="form-group">
          <label htmlFor="phone" className="form-label">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className={`form-input neo-input ${errors.phone ? 'has-error' : ''}`}
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="(555) 123-4567"
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            aria-invalid={!!errors.phone}
            style={{ minHeight: 44 }}
          />
          {errors.phone && touched.phone && (
            <span className="form-error" id="phone-error" role="alert">{errors.phone}</span>
          )}
        </div>

        {/* ZIP Code */}
        <div className="form-group">
          <label htmlFor="zip" className="form-label">ZIP Code</label>
          <input
            type="text"
            id="zip"
            name="zip"
            className={`form-input neo-input ${errors.zip ? 'has-error' : ''}`}
            value={formData.zip}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="23219"
            maxLength={5}
            pattern="\d{5}"
            aria-describedby={errors.zip ? 'zip-error' : undefined}
            aria-invalid={!!errors.zip}
            style={{ minHeight: 44 }}
          />
          {errors.zip && touched.zip && (
            <span className="form-error" id="zip-error" role="alert">{errors.zip}</span>
          )}
        </div>
      </section>
    </form>
  );
}