import React, { useState, useCallback } from 'react';
import './ScopeInputs.css';
import AIChat from './AIChat';

// Zod validation imported from centralized validator
import { validateContactInfo } from '../utils/validator';

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
      {/* AI Chat Integration - Replaces all form sections */}
      <AIChat 
        photos={[]}
        formData={formData}
        onSubmit={() => {}}
      />
    </div>
  );
}