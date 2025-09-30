import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { 
  Store, 
  Search, 
  Grid3X3, 
  List, 
  Plus, 
  MapPin, 
  Globe, 
  Phone, 
  Mail,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock
} from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { apiRetry, handleApiError, debounce } from '../utils/apiUtils'
import AddStoreModal from '../components/AddStoreModal'
import StoreDetailModal from '../components/StoreDetailModal'
import AsyncRequestList from '../components/AsyncRequestList'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const Stores = () => {
  const { user } = useAuth()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalStores: 0,
    limit: 5,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [selectedStore, setSelectedStore] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAsyncRequests, setShowAsyncRequests] = useState(false)

  // Fetch stores from API with retry mechanism
  const fetchStores = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // For grid view, fetch all stores without pagination
      // For table view, use pagination with limit=5
      let endpoint
      if (viewMode === 'grid') {
        endpoint = `${API_BASE_URL}/api/stores`
      } else {
        endpoint = `${API_BASE_URL}/api/stores?page=${page}&limit=5`
      }
      
      const response = await apiRetry(async () => {
        return await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      })

      if (response.data.success) {
        setStores(response.data.data)
        // Only set pagination for table view
        if (viewMode === 'table' && response.data.pagination) {
          setPagination(response.data.pagination)
        }
      } else {
        const errorInfo = handleApiError(new Error('API response not successful'), 'Mağazalar yüklənərkən xəta baş verdi')
        setError(errorInfo.message)
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
      const errorInfo = handleApiError(error, 'Mağazalar yüklənərkən xəta baş verdi')
      setError(errorInfo.message)
      toast.error(errorInfo.message)
    } finally {
      setLoading(false)
    }
  }, [viewMode])

  // Debounced version of fetchStores for search/filter operations
  const debouncedFetchStores = useCallback(
    debounce(fetchStores, 500),
    [fetchStores]
  )

  useEffect(() => {
    fetchStores()
  }, [viewMode]) // Re-fetch when view mode changes

  // Handle store added
  const handleStoreAdded = (newStore) => {
    // Refresh the first page to show the new store
    fetchStores(1)
  }

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchStores(newPage)
  }

  // Handle store detail view
  const handleStoreDetail = (store) => {
    setSelectedStore(store)
    setShowDetailModal(true)
  }

  // Handle store updated
  const handleStoreUpdated = (updatedStore) => {
    if (updatedStore === null) {
      // Store was deleted, remove from list and close modal
      setStores(prevStores => 
        prevStores.filter(store => store._id !== selectedStore._id)
      )
      setShowDetailModal(false)
      setSelectedStore(null)
    } else {
      // Store was updated, update in list
      setStores(prevStores => 
        prevStores.map(store => 
          store._id === updatedStore._id ? updatedStore : store
        )
      )
      setSelectedStore(updatedStore)
    }
  }

  // Filter stores based on search term
  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Grid View Component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredStores.map((store) => (
        <Card key={store._id} className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                {store.logo ? (
                  <img src={store.logo} alt={store.name} className="w-8 h-8 rounded" />
                ) : (
                  <Store className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold truncate">{store.name}</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  {store.website && (
                    <span className="flex items-center">
                      <Globe className="w-3 h-3 mr-1" />
                      <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        {store.website.replace(/^https?:\/\//, '')}
                      </a>
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {store.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{store.description}</p>
            )}
            
            <div className="space-y-2">
              {store.website && (
                <div className="flex items-center text-sm text-gray-500">
                  <Globe className="w-4 h-4 mr-2" />
                  <a 
                    href={store.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {store.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              
              {store.contact?.phone && (
                <div className="flex items-center text-sm text-gray-500">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{store.contact.phone}</span>
                </div>
              )}
              
              {store.contact?.email && (
                <div className="flex items-center text-sm text-gray-500">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="truncate">{store.contact.email}</span>
                </div>
              )}
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  <span>{store.createdBy?.firstName} {store.createdBy?.lastName}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{formatDate(store.createdAt)}</span>
                </div>
              </div>
              
              {/* Detail Button for Grid View */}
              <div className="mt-3 pt-2 border-t border-gray-100">
                <Button
                  onClick={() => handleStoreDetail(store)}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Detay
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Table View Component
  const TableView = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mağaza
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Website
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Yaradıcı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarix
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Əməliyyatlar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStores.map((store) => (
              <tr key={store._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      {store.logo ? (
                        <img src={store.logo} alt={store.name} className="w-6 h-6 rounded" />
                      ) : (
                        <Store className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{store.name}</div>
                      {store.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {store.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {store.website && (
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-2 text-gray-400" />
                        <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {store.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {store.createdBy?.firstName} {store.createdBy?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    @{store.createdBy?.username}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(store.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStoreDetail(store)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Detay
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Mağazalar yüklənir...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mağazalar</h1>
            <p className="text-gray-600 mt-1">Bütün mağazalarınızı görün və idarə edin</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAsyncRequests(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Asenkron Sorğular
            </Button>
            <AddStoreModal onStoreAdded={handleStoreAdded} />
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Mağaza axtar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Content */}
        {filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Axtarış nəticəsi tapılmadı' : 'Hələ mağaza yoxdur'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Başqa açar sözlər ilə axtarış edin' 
                : 'İlk mağazanızı yaratmaq üçün "Yeni Mağaza" düyməsini basın'
              }
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? <GridView /> : <TableView />}
            
            {/* Pagination - Only show for table view */}
            {viewMode === 'table' && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Toplam <span className="font-medium">{pagination.totalStores}</span> mağaza, 
                  sayfa <span className="font-medium">{pagination.currentPage}</span> / <span className="font-medium">{pagination.totalPages}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Öncəki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="flex items-center gap-2"
                  >
                    Sonrakı
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Store Detail Modal */}
      {showDetailModal && selectedStore && (
        <StoreDetailModal
          store={selectedStore}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedStore(null)
          }}
          onStoreUpdated={handleStoreUpdated}
        />
      )}

      {/* Async Request List Modal */}
      {showAsyncRequests && (
        <AsyncRequestList
          isOpen={showAsyncRequests}
          onClose={() => setShowAsyncRequests(false)}
        />
      )}
    </div>
  )
}

export default Stores