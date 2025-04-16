import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Sidebar from '../components/Layout/Sidebar';
import MobileMenu from '../components/Layout/MobileMenu';
import ProtectedRoute from '../src/components/ProtectedRoute';
import { FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../src/context/AuthContext';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import ResultsModal from '../components/Results/ResultsModal';
import ConfirmationModal from '../components/UI/ConfirmationModal';

export default function PropertiesPage() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [isDeletingProperty, setIsDeletingProperty] = useState(false);
  const [error, setError] = useState(null);
  const [visibleProperties, setVisibleProperties] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProperty, setModalProperty] = useState(null);
  const [modalResults, setModalResults] = useState(null);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        if (!user) {
          setIsLoadingProperties(false);
          return;
        }
        const session = localStorage.getItem('session');
        if (!session) {
          setIsLoadingProperties(false);
          return;
        }
        const response = await fetch('/api/properties/list', {
          headers: { 'Authorization': `Bearer ${session}` }
        });
        if (!response.ok) throw new Error('Failed to fetch properties');
        const data = await response.json();
        setProperties(data.properties);
      } catch (error) {
        setProperties([]);
      } finally {
        setIsLoadingProperties(false);
      }
    };
    if (!authLoading) fetchProperties();
  }, [user, authLoading]);

  const handleSelectProperty = (propertyId, isSelected) => {
    if (isSelected) {
      setSelectedProperties(prev => [...prev, propertyId]);
    } else {
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
    }
  };

  const handleSelectAllProperties = (isSelected) => {
    if (isSelected) {
      const visiblePropertyIds = properties
        .slice(0, visibleProperties)
        .map(p => p.propertyId || p.id)
        .filter(Boolean);
      setSelectedProperties(visiblePropertyIds);
    } else {
      setSelectedProperties([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedProperties.length === 0) return;
    setIsBulkDelete(true);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteProperty = async (propertyId, e) => {
    if (e) e.stopPropagation();
    setPropertyToDelete(propertyId);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteProperty = async () => {
    const propertiesToDelete = isBulkDelete ? selectedProperties : [propertyToDelete];
    if (propertiesToDelete.length === 0) return;
    setIsDeletingProperty(true);
    try {
      const session = localStorage.getItem('session');
      if (!session) throw new Error('No session found');
      for (const propertyId of propertiesToDelete) {
        await fetch(`/api/properties/delete?propertyId=${propertyId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${session}` }
        });
      }
      setProperties(prev => prev.filter(p => !propertiesToDelete.includes(p.propertyId || p.id)));
      setShowDeleteConfirmation(false);
      setPropertyToDelete(null);
      setSelectedProperties([]);
      setIsBulkDelete(false);
    } catch (error) {
      setError({ message: 'Failed to delete properties', details: error.message });
    } finally {
      setIsDeletingProperty(false);
    }
  };

  const cancelDeleteProperty = () => {
    setShowDeleteConfirmation(false);
    setPropertyToDelete(null);
    setIsBulkDelete(false);
  };

  // View modal logic
  const handleViewProperty = async (property) => {
    setIsLoadingModal(true);
    setModalProperty(property);
    setIsModalOpen(true);
    try {
      const session = localStorage.getItem('session');
      if (!session) throw new Error('No session found');
      const propertyId = property.propertyId || property.id;
      const response = await fetch(`/api/properties/content?propertyId=${propertyId}`, {
        headers: { 'Authorization': `Bearer ${session}` }
      });
      if (!response.ok) throw new Error('Failed to fetch property content');
      const { data } = await response.json();
      const captionText = data.caption || data.propertyData?.caption || property.caption || (data.propertyData?.raw?.caption) || '';
      setModalResults({
        propertyId: propertyId,
        bannerbear: {
          status: data.status || 'completed',
          images: data.images || [],
          image_urls: data.image_urls || {},
          zip_url: data.zip_url,
          uid: data.bannerbear?.uid
        },
        caption: captionText,
        captionOptions: data.captionOptions || {},
        propertyData: {
          property: {
            ...data.propertyData?.property,
            address: data.propertyData?.property?.address || property.address || '',
            price: data.propertyData?.property?.price || property.price || '',
            bedrooms: data.propertyData?.property?.bedrooms || property.bedrooms || '',
            bathrooms: data.propertyData?.property?.bathrooms || property.bathrooms || ''
          }
        }
      });
    } catch (error) {
      setModalResults(null);
    } finally {
      setIsLoadingModal(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalProperty(null);
    setModalResults(null);
    setIsLoadingModal(false);
  };

  const propertiesToShow = properties.slice(0, visibleProperties);
  const hasMoreProperties = properties.length > visibleProperties;
  const allVisibleSelected = propertiesToShow.every(property => {
    const propertyId = property.propertyId || property.id;
    return propertyId && selectedProperties.includes(propertyId);
  });
  const loadMoreProperties = () => setVisibleProperties(v => v + 20);

  return (
    <ProtectedRoute>
      <div className="dashboard">
        <Head>
          <title>Properties - Trofai</title>
        </Head>
        <MobileMenu activePage="properties" />
        <Sidebar activePage="properties" />
        <div className="dashboard-container">
          <DashboardHeader />
          <main className="main">
            <div className="content">
              <div className="dashboard-header">
                <h1 className="title">Properties</h1>
                <p className="subtitle">See all your generated property listings here.</p>
              </div>
              <div className="history-section">
                <div className="history-header">
                  <h2 className="history-title">History</h2>
                  {selectedProperties.length > 0 && (
                    <button
                      className={`bulk-delete-button ${isDeletingProperty ? 'loading' : ''}`}
                      onClick={handleBulkDelete}
                      disabled={isDeletingProperty}
                    >
                      {isDeletingProperty ? (
                        <>
                          <span className="delete-spinner"></span>
                          Deleting...
                        </>
                      ) : (
                        <>Delete Selected ({selectedProperties.length})</>
                      )}
                    </button>
                  )}
                </div>
                <div className="history-table-container">
                  {isLoadingProperties ? (
                    <div className="text-center py-4">Loading property history...</div>
                  ) : properties.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🏠</div>
                      <h3>No properties yet</h3>
                      <p>Convert your first property listing to see it here.</p>
                    </div>
                  ) : (
                    <>
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th className="checkbox-cell">
                              <label className="checkbox-container">
                                <input
                                  type="checkbox"
                                  checked={propertiesToShow.length > 0 && allVisibleSelected}
                                  onChange={e => handleSelectAllProperties(e.target.checked)}
                                />
                                <span className="checkmark"></span>
                              </label>
                            </th>
                            <th>Property</th>
                            <th>Price</th>
                            <th>Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {propertiesToShow.map(property => {
                            let formattedDate = 'Invalid Date';
                            try {
                              const date = property.createdAt ? new Date(property.createdAt) : new Date();
                              if (!isNaN(date.getTime())) {
                                formattedDate = date.toLocaleDateString();
                              }
                            } catch (e) {}
                            const propertyId = property.propertyId || property.id;
                            if (!propertyId) return null;
                            const isSelected = selectedProperties.includes(propertyId);
                            return (
                              <tr key={propertyId} className={`history-row ${isSelected ? 'selected' : ''}`}>
                                <td className="checkbox-cell">
                                  <label className="checkbox-container">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={e => handleSelectProperty(propertyId, e.target.checked)}
                                    />
                                    <span className="checkmark"></span>
                                  </label>
                                </td>
                                <td className="property-cell">
                                  <span className="property-title">{property.address || 'Property'}</span>
                                </td>
                                <td className="price-cell">
                                  <span className="property-price">{property.price || ''}</span>
                                </td>
                                <td className="date-cell">
                                  <span className="property-date">{formattedDate}</span>
                                </td>
                                <td className="action-cell">
                                  <div className="action-buttons">
                                    <button className="view-button" onClick={() => handleViewProperty(property)}>
                                      View
                                    </button>
                                    <button
                                      onClick={e => handleDeleteProperty(propertyId, e)}
                                      className={`delete-button ${isDeletingProperty ? 'loading' : ''}`}
                                      title={isDeletingProperty ? 'Deletion in progress...' : 'Delete property'}
                                      disabled={isDeletingProperty}
                                    >
                                      {isDeletingProperty && propertyToDelete === propertyId ? (
                                        <span className="loading-spinner"></span>
                                      ) : (
                                        <FiTrash2 />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {hasMoreProperties && (
                        <div className="load-more-container">
                          <button className="load-more-button" onClick={loadMoreProperties}>
                            Load More
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
        <ResultsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          results={modalResults}
          isLoading={isLoadingModal}
        />
        <ConfirmationModal
          isOpen={showDeleteConfirmation}
          onCancel={cancelDeleteProperty}
          onConfirm={confirmDeleteProperty}
          title={isBulkDelete ? 'Delete Multiple Properties' : 'Delete Property'}
          message={isBulkDelete
            ? `Are you sure you want to delete ${selectedProperties.length} properties? This action cannot be undone.`
            : 'Are you sure you want to delete this property? This action cannot be undone.'}
          isLoading={isDeletingProperty}
        />
        <style jsx>{`
          .dashboard {
            min-height: 100vh;
            background: linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
          }
          .dashboard-container {
            margin-left: 240px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .main {
            flex: 1;
            padding: 2rem;
          }
          .content {
            max-width: 1200px;
            margin: 0 auto;
          }
          .dashboard-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          .title {
            margin: 0;
            line-height: 1.15;
            font-size: 3.5rem;
            font-weight: 900;
            color: #111;
          }
          .subtitle {
            line-height: 1.5;
            font-size: 1.2rem;
            margin: 1rem 0 1.5rem;
            color: #333;
          }
          .history-section {
            margin-top: 2rem;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
          }
          .empty-state {
            text-align: center;
            padding: 4rem 1rem;
            background: #f8fafc;
            border-radius: 12px;
            border: 2px dashed #e2e8f0;
          }
          .empty-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          .history-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0;
          }
          .bulk-delete-button {
            padding: 0.5rem 1rem;
            background: #fff5f5;
            color: #e53e3e;
            border: 2px solid #e53e3e;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .bulk-delete-button:hover {
            background: #fed7d7;
          }
          .bulk-delete-button.loading {
            background: #fed7d7;
            opacity: 0.9;
            cursor: wait;
          }
          .delete-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(229, 62, 62, 0.3);
            border-radius: 50%;
            border-top-color: #e53e3e;
            animation: spin 1s linear infinite;
          }
          .history-table-container {
            overflow-x: auto;
          }
          .history-table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
          }
          .history-table th {
            text-align: left;
            padding: 1rem;
            font-weight: 600;
            color: #4a5568;
            border-bottom: 2px solid #e2e8f0;
          }
          .history-table td {
            padding: 1rem;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          .checkbox-cell {
            width: 40px;
            text-align: center;
          }
          .checkbox-container {
            display: block;
            position: relative;
            padding-left: 25px;
            cursor: pointer;
            user-select: none;
            height: 20px;
            width: 20px;
            margin: 0 auto;
          }
          .checkbox-container input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;
          }
          .checkmark {
            position: absolute;
            top: 0;
            left: 0;
            height: 20px;
            width: 20px;
            background-color: #eee;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .checkbox-container:hover input ~ .checkmark {
            background-color: #ccc;
          }
          .checkbox-container input:checked ~ .checkmark {
            background-color: #62d76b;
            border-color: #62d76b;
          }
          .checkmark:after {
            content: "";
            position: absolute;
            display: none;
          }
          .checkbox-container input:checked ~ .checkmark:after {
            display: block;
          }
          .checkbox-container .checkmark:after {
            left: 7px;
            top: 3px;
            width: 5px;
            height: 10px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
          }
          .history-row {
            transition: background-color 0.15s ease;
          }
          .history-row:hover {
            background-color: #f7fafc;
          }
          .history-row.selected {
            background-color: #f0fff4;
          }
          .history-row.selected:hover {
            background-color: #e6ffed;
          }
          .property-title {
            font-weight: 600;
            color: #1a1a1a;
            display: block;
          }
          .property-price {
            color: #2d3748;
            font-weight: 500;
          }
          .property-date {
            color: #718096;
            font-size: 0.9rem;
          }
          .action-cell {
            width: 160px;
            text-align: center;
          }
          .action-buttons {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            align-items: center;
          }
          .view-button {
            padding: 0.5rem 1rem;
            background: #62d76b;
            color: #1a1a1a;
            border: 2px solid #1a1a1a;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
            position: relative;
            overflow: hidden;
          }
          .view-button:hover {
            background: #56c15f;
            box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
            transform: translateY(-1px);
          }
          .view-button:active, .view-button.clicked {
            transform: translateY(2px);
            box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
            background: #4caf50;
          }
          .view-button.clicked::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 120%;
            height: 120%;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: ripple 0.3s ease-out;
          }
          .delete-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: transparent;
            color: #e53e3e;
            border: 2px solid #e53e3e;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
            position: relative;
            overflow: hidden;
          }
          .delete-button:hover {
            background: #fff5f5;
            transform: translateY(-1px);
          }
          .delete-button:active {
            background: #fed7d7;
            transform: translateY(1px);
          }
          .delete-button.loading {
            background: #fee2e2;
            cursor: wait;
            opacity: 0.7;
          }
          .delete-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .delete-button:disabled:hover {
            background: transparent;
            transform: none;
          }
          .delete-button::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            background: rgba(229, 62, 62, 0.1);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          .delete-button:active::after {
            animation: delete-ripple 0.3s ease-out;
          }
          @keyframes delete-ripple {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
          }
          .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(229, 62, 62, 0.3);
            border-radius: 50%;
            border-top-color: #e53e3e;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          .load-more-container {
            margin-top: 1.5rem;
            text-align: center;
          }
          .load-more-button {
            padding: 0.75rem 1.5rem;
            background: white;
            color: #1a1a1a;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .load-more-button:hover {
            background: #f7fafc;
            border-color: #cbd5e0;
          }
          @keyframes ripple {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
          }
          @media (max-width: 768px) {
            .history-section {
              padding: 1rem;
            }
            .history-table th,
            .history-table td {
              padding: 0.75rem 0.5rem;
            }
            .action-cell {
              width: 100px;
            }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
} 