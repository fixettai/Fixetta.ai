import React, { useState, useCallback } from 'react';
import './ScopeInputs.css';

// Zod validation imported from centralized validator
import { validateScopeOfWork, validateContactInfo } from '../utils/validator';

const CATEGORIES = [
  { key: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { key: 'electrical', label: 'Electric', icon: '⚡' },
  { key: 'furniture', label: 'Assembly', icon: '🪑' },
  { key: 'drywall', label: 'Drywall', icon: '🪟' },
  { key: 'painting', label: 'Painting', icon: '🎨' },
  { key: 'roof', label: 'Roofing', icon: '🏠' },
];

/**
 * ScopeInputs Component - Clean minimal form for issue description
 * Mobile-first with 44x44px touch targets and 12px border radius
 * Uses Zod validation for input sanitization
 */
export default function ScopeInputs({
  initialData = {},
  onChange,
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

  // Handle input change with validation feedback
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    
    // Clear error on field change if it was previously invalid
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (onChange) onChange(newData);
  }, [formData, onChange, errors]);

  // Handle blur for field-level validation
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateSingleField(name, value);
  }, [formData, touched]);

  // Validate a single field
  const validateSingleField = (fieldName, value) => {
    let result;
    if (['description', 'category'].includes(fieldName)) {
      result = validateScopeOfWork({ 
        description: fieldName === 'description' ? value : formData.description, 
        category: fieldName === 'category' ? value : formData.category, 
        photos: [] 
      });
    } else {
      result = validateContactInfo({ 
        name: fieldName === 'name' ? value : formData.name, 
        email: fieldName === 'email' ? value : formData.email, 
        phone: fieldName === 'phone' ? value : formData.phone, 
        zip: fieldName === 'zip' ? value : formData.zip 
      });
    }
    
    if (!result.success && result.errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: result.errors[fieldName][0] }));
      if (onError) onError(result.errors);
      return false;
    }
    return true;
  };

  // Handle category selection
  const handleCategorySelect = (key) => {
    const newData = { ...formData, category: key };
    setFormData(newData);
    setTouched((prev) => ({ ...prev, category: true }));
    
    // Validate category
    const result = validateScopeOfWork({ 
      description: formData.description, 
      category: key, 
      photos: [] 
    });
    
    if (!result.success && result.errors.category) {
      setErrors((prev) => ({ ...prev, category: result.errors.category[0] }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.category;
        return newErrors;
      });
    }
    
    if (onChange) onChange(newData);
  };

  // Expose validation for external use (e.g., submit button)
  React.useImperativeHandle(onChange?.ref, () => ({
    validate: () => validateForm(),
    getData: () => formData,
    getErrors: () => errors,
  }), [formData, errors]);

  // Validate the entire form
  const validateForm = () => {
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);
    
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
      return { success: false, errors: allErrors };
    }
    
    return { success: true, data: formData };
  };

  return (
    <div className="scope-inputs" role="form" aria-label="Describe your issue">
      {/* Category Selection */}
      <section className="form-section">
        <label className="form-label">What needs fixing?</label>
        <div className="category-grid" role="radiogroup" aria-label="Select a service category">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`category-chip ${formData.category === cat.key ? 'selected' : ''} ${errors.category && touched.category ? 'error' : ''}`}
              onClick={() => handleCategorySelect(cat.key)}
              aria-pressed={formData.category === cat.key}
            >
              <span className="category-icon" aria-hidden="true">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
            </button>
          ))}
        </div>
        {errors.category && touched.category && (
          <span className="form-error" role="alert">{errors.category}</span>
        )}
      </section>

      {/* Description */}
      <section className="form-section">
        <label htmlFor="description" className="form-label">Describe the issue</label>
        <textarea
          id="description"
          name="description"
          className={`form-input ${errors.description ? 'has-error' : ''}`}
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g., Leaking pipe under kitchen sink..."
          maxLength={2000}
          rows={4}
          aria-describedby={errors.description ? 'description-error' : 'description-counter'}
          aria-invalid={!!errors.description}
        />
        <div className="input-footer">
          {errors.description && touched.description ? (
            <span className="form-error" id="description-error" role="alert">{errors.description}</span>
          ) : (
            <span className="char-counter" id="description-counter">{formData.description.length}/2000</span>
          )}
        </div>
      </section>

      {/* Contact Info - Collapsible */}
      <section className="form-section">
        <label className="form-label">Contact info</label>
        
        <input
          type="text"
          name="name"
          className={`form-input ${errors.name ? 'has-error' : ''}`}
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Full Name"
          aria-describedby={errors.name ? 'name-error' : undefined}
          aria-invalid={!!errors.name}
        />
        {errors.name && touched.name && (
          <span className="form-error" id="name-error" role="alert">{errors.name}</span>
        )}

        <input
          type="email"
          name="email"
          className={`form-input ${errors.email ? 'has-error' : ''}`}
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Email address"
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={!!errors.email}
        />
        {errors.email && touched.email && (
          <span className="form-error" id="email-error" role="alert">{errors.email}</span>
        )}

        <input
          type="tel"
          name="phone"
          className={`form-input ${errors.phone ? 'has-error' : ''}`}
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Phone number"
          aria-describedby={errors.phone ? 'phone-error' : undefined}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && touched.phone && (
          <span className="form-error" id="phone-error" role="alert">{errors.phone}</span>
        )}

        <input
          type="text"
          name="zip"
          className={`form-input ${errors.zip ? 'has-error' : ''}`}
          value={formData.zip}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="ZIP code"
          maxLength={5}
          pattern="\d{5}"
          inputMode="numeric"
          aria-describedby={errors.zip ? 'zip-error' : undefined}
          aria-invalid={!!errors.zip}
        />
        {errors.zip && touched.zip && (
          <span className="form-error" id="zip-error" role="alert">{errors.zip}</span>
        )}
      </section>
    </div>
  );
}