/**
 * Input Validation Schemas using Zod
 * All form inputs are validated here before submission to prevent XSS and injection attacks.
 */

import { z } from 'zod';
import { APP_CONFIG } from '../config';

// Sanitize string inputs: trim and remove potentially dangerous content
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim();
};

// Scope of Work Validation
export const scopeOfWorkSchema = z.object({
  description: z
    .string()
    .min(10, 'Please describe the issue in at least 10 characters')
    .max(APP_CONFIG.MAX_SCOPE_LENGTH, `Description must be under ${APP_CONFIG.MAX_SCOPE_LENGTH} characters`)
    .transform(sanitizeString)
    .refine(
      (val) => !/<script|javascript:|on\w+=/i.test(val),
      'Description contains invalid characters'
    ),
  category: z
    .string()
    .min(1, 'Please select a service category')
    .transform(sanitizeString),
  photos: z
    .array(z.any())
    .min(1, 'At least one photo is required')
    .max(APP_CONFIG.MAX_PHOTOS, `Maximum ${APP_CONFIG.MAX_PHOTOS} photos allowed`),
});

// Contact Information Validation
export const contactInfoSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters')
    .transform(sanitizeString)
    .refine(
      (val) => /^[a-zA-Z\s\-'.]+$/.test(val),
      'Name contains invalid characters'
    ),
  email: z
    .string()
    .email('Please enter a valid email address')
    .transform((val) => val.toLowerCase().trim())
    .refine(
      (val) => val.length <= 254,
      'Email is too long'
    ),
  phone: z
    .string()
    .min(10, 'Please enter a valid phone number')
    .max(15, 'Phone number is too long')
    .transform(sanitizeString)
    .refine(
      (val) => /^[\d\s\-\+\(\)]+$/.test(val),
      'Phone number contains invalid characters'
    ),
  zip: z
    .string()
    .length(5, 'ZIP code must be 5 digits')
    .refine(
      (val) => /^\d{5}$/.test(val),
      'ZIP code must be 5 digits'
    ),
});

// Combined submission form schema
export const submissionSchema = z.object({
  scope: scopeOfWorkSchema,
  contact: contactInfoSchema,
});

/**
 * Validate scope of work input
 * @param {Object} data - { description, category, photos }
 * @returns {Object} Validated data or throws ZodError
 */
export const validateScopeOfWork = (data) => {
  try {
    return { success: true, data: scopeOfWorkSchema.parse(data) };
  } catch (error) {
    return { success: false, errors: error.flatten().fieldErrors };
  }
};

/**
 * Validate contact information
 * @param {Object} data - { name, email, phone, zip }
 * @returns {Object} Validated data or throws ZodError
 */
export const validateContactInfo = (data) => {
  try {
    return { success: true, data: contactInfoSchema.parse(data) };
  } catch (error) {
    return { success: false, errors: error.flatten().fieldErrors };
  }
};

/**
 * Validate complete submission
 * @param {Object} data - { scope, contact }
 * @returns {Object} Validated data or throws ZodError
 */
export const validateSubmission = (data) => {
  try {
    return { success: true, data: submissionSchema.parse(data) };
  } catch (error) {
    return { success: false, errors: error.flatten().fieldErrors };
  }
};

/**
 * Package submission request object for OpenRouter backend
 * @param {Object} formData - Combined scope and contact data
 * @param {Array} photos - Photo objects from MultiPhotoCapture
 * @returns {Object} Formatted request object
 */
export const packageSubmissionRequest = (formData, photos = []) => {
  const validatedScope = scopeOfWorkSchema.safeParse({
    description: formData.description,
    category: formData.category,
    photos,
  });

  const validatedContact = contactInfoSchema.safeParse({
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    zip: formData.zip,
  });

  if (!validatedScope.success) {
    throw new Error('Invalid scope data: ' + JSON.stringify(validatedScope.error.flatten().fieldErrors));
  }

  if (!validatedContact.success) {
    throw new Error('Invalid contact data: ' + JSON.stringify(validatedContact.error.flatten().fieldErrors));
  }

  return {
    scope: {
      description: validatedScope.data.description,
      category: validatedScope.data.category,
      photoCount: photos.length,
    },
    contact: {
      name: validatedContact.data.name,
      email: validatedContact.data.email,
      phone: validatedContact.data.phone,
      zip: validatedContact.data.zip,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    },
  };
};

export default {
  validateScopeOfWork,
  validateContactInfo,
  validateSubmission,
  packageSubmissionRequest,
};