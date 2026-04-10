import React, { useState, useEffect } from 'react';

export default function ContractorMatch({ zip, category, estimate_id }) {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch contractors from our FastAPI endpoint
    const fetchContractors = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/contractors/match?zip=${zip}&category=${category}&estimate_id=${estimate_id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setContractors(data || []); // Adjust based on actual API response structure
        setLoading(false);
      } catch (err) {
        console.error('Error fetching contractors:', err);
        setError('Failed to load contractors. Please try again.');
        setLoading(false);
      }
    };

    if (zip && category) {
      fetchContractors();
    }
  }, [zip, category, estimate_id]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (contractors.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500">Searching wider area...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {contractors.map((contractor, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow transform hover:-translate-y-1"
          >
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{contractor.name || 'Unknown Contractor'}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    {/* Star rating */}
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star} 
                          width="14" 
                          height="14" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="1.5"
                          className={star <= (contractor.rating || 0) ? 'text-amber-400' : 'text-gray-300'}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      ))}
                      <span className="ml-1 text-xs text-gray-500">
                        {(contractor.rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    // Handle contact now action
                    alert(`Contacting ${contractor.name || 'this contractor'}...`);
                  }}
                  className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                >
                  Contact Now
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {contractor.specialty || 'General Contractor'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
