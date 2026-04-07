import React, { useState, useCallback } from 'react';
import './ScopeInputs.css';
import AIChat from './AIChat';
import { ENDPOINTS } from '../config';

// Zod validation imported from centralized validator
import { validateContactInfo } from '../utils/validator';

/**
 * ScopeInputs Component - Clean minimal form for issue description
 * Mobile-first with 44x44px touch targets and 12px border radius
 * Uses Zod validation for input sanitization
 * Includes ZIP code validation with regional cost lookup
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
  const [regionalCosts, setRegionalCosts] = useState(null);
  const [isFetchingCosts, setIsFetchingCosts] = useState(false);
  const [zipValidated, setZipValidated] = useState(false);

  // ZIP code regex pattern (5-digit or ZIP+4)
  const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

  // Validate ZIP code format
  const validateZipCode = (zip) => {
    return ZIP_REGEX.test(zip);
  };

  // Fetch regional costs from backend API
  const fetchRegionalCosts = useCallback(async (zipCode) => {
    if (!validateZipCode(zipCode)) {
      setErrors((prev) => ({ ...prev, zip: 'Invalid ZIP code format' }));
      setZipValidated(false);
      return;
    }

    setIsFetchingCosts(true);
    try {
      const response = await fetch(ENDPOINTS.REGIONAL_COSTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip_code: zipCode,
          category: formData.category || 'general',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setRegionalCosts(data);
      setZipValidated(true);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.zip;
        return newErrors;
      });
    } catch (error) {
      console.error('[ScopeInputs] Failed to fetch regional costs:', error);
      setErrors((prev) => ({ ...prev, zip: 'Unable to fetch regional pricing' }));
      setZipValidated(false);
    } finally {
      setIsFetchingCosts(false);
    }
  }, [formData.category]);

  // Handle ZIP code change with debounced validation
  const handleZipChange = useCallback((e) => {
    const { value } = e.target;
    const sanitizedValue = value.replace(/[^\d-]/g, '').slice(0, 10);
    const newData = { ...formData, zip: sanitizedValue };
    setFormData(newData);
    setZipValidated(false);
    setRegionalCosts(null);

    if (errors.zip) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.zip;
        return newErrors;
      });
    }

    if (onChange) onChange(newData);
  }, [formData, onChange, errors]);

  // Handle ZIP code blur - trigger validation and cost fetch
  const handleZipBlur = useCallback((e) => {
    const { value } = e.target;
    setTouched((prev) => ({ ...prev, zip: true }));

    if (value && validateZipCode(value)) {
      fetchRegionalCosts(value);
    } else if (value) {
      setErrors((prev) => ({ ...prev, zip: 'Enter a valid 5-digit ZIP code' }));
      setZipValidated(false);
    }
  }, [fetchRegionalCosts]);

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
    const result = validateContactInfo({ 
      name: fieldName === 'name' ? value : formData.name, 
      email: fieldName === 'email' ? value : formData.email, 
      phone: fieldName === 'phone' ? value : formData.phone, 
      zip: fieldName === 'zip' ? value : formData.zip 
    });
    
    if (!result.success && result.errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: result.errors[fieldName][0] }));
      if (onError) onError(result.errors);
      return false;
    }
    return true;
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
    
    const contactResult = validateContactInfo({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      zip: formData.zip,
    });
    
    if (!contactResult.success) {
      const allErrors = {};
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
      {/* ZIP Code Validation Field - Required for accurate regional pricing */}
      <div className="form-flow">
        <div className="zip-code-field">
          <label htmlFor="zip-input" className="zip-label">
            Project ZIP Code
            {zipValidated && (
              <span className="validation-badge valid">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Regional pricing applied
              </span>
            )}
            {isFetchingCosts && (
              <span className="validation-badge loading">
                <span className="spinner" />
                Fetching rates...
              </span>
            )}
          </label>
          <input
            id="zip-input"
            type="text"
            name="zip"
            className={`zip-input ${errors.zip ? 'error' : ''} ${zipValidated ? 'valid' : ''}`}
            placeholder="e.g., 23219"
            value={formData.zip}
            onChange={handleZipChange}
            onBlur={handleZipBlur}
            maxLength={10}
            inputMode="numeric"
            pattern="[0-9]{5}(-[0-9]{4})?"
            aria-describedby={errors.zip ? 'zip-error' : undefined}
            aria-invalid={!!errors.zip}
          />
          {errors.zip && (
            <p id="zip-error" className="error-message" role="alert">
              {errors.zip}
            </p>
          )}
          {regionalCosts && (
            <div className="regional-cost-info">
              <span>Material multiplier: {regionalCosts.material_multiplier.toFixed(2)}x</span>
              <span>Labor multiplier: {regionalCosts.labor_multiplier.toFixed(2)}x</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Integration - Replaces all form sections */}
      <AIChat 
        photos={[]}
        formData={formData}
        onSubmit={() => {}}
      />
    </div>
  );
}
