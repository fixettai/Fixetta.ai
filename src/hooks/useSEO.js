/**
 * useSEO - Dynamic SEO hook for React components
 * Updates document title, meta description, and canonical URL at runtime.
 * Also injects JSON-LD schema for LocalBusiness or Service pages.
 *
 * Usage:
 *   useSEO({
 *     title: 'Drywall Repair in Richmond, VA | Fixetta',
 *     description: 'Expert drywall repair cost estimates in Richmond, VA...',
 *     canonical: '/services/drywall-repair',
 *     schema: { type: 'Service', name: 'Drywall Repair' }
 *   });
 */

import { useEffect } from 'react';

export function useSEO({
  title,
  description,
  canonical,
  schema = null,
}) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update or create meta description
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    // Update or create canonical link
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }

    // Inject JSON-LD schema
    if (schema) {
      // Remove existing dynamic schema if present
      const existing = document.getElementById('dynamic-schema');
      if (existing) existing.remove();

      const script = document.createElement('script');
      script.id = 'dynamic-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    // Cleanup on unmount: restore defaults
    return () => {
      const dynamicSchema = document.getElementById('dynamic-schema');
      if (dynamicSchema) dynamicSchema.remove();
    };
  }, [title, description, canonical, schema]);
}

/**
 * Helper: Build Service schema for a specific service page.
 * @param {object} options
 * @param {string} options.serviceName - e.g., "Drywall Repair"
 * @param {string} options.description - Service description
 * @param {string} options.url - Service page URL
 * @param {string} [options.areaServed="Richmond, Virginia"]
 * @returns {object} JSON-LD Service schema
 */
export function buildServiceSchema({
  serviceName,
  description,
  url,
  areaServed = 'Richmond, Virginia',
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: serviceName,
    description,
    url,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Fixetta',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Richmond',
        addressRegion: 'VA',
        addressCountry: 'US',
      },
      areaServed: {
        '@type': 'City',
        name: areaServed,
      },
    },
  };
}

export default useSEO;