import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import DataTable from './ui/data-table'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  Eye,
  X,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiRetry, handleApiError, debounce } from '../utils/apiUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const AsyncRequestList = ({ isOpen, onClose }) => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    storeId: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    if (isOpen) {
      fetchRequests()
    }
  }, [isOpen, filters, pagination.page])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.storeId && { storeId: filters.storeId })
      })

      const response = await apiRetry(async () => {
        return await axios.get(
          `${API_BASE_URL}/api/webhook/async-requests?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      })

      const data = response.data.data
      setRequests(data.docs || [])
      setPagination(prev => ({
        ...prev,
        total: data.totalDocs || 0,
        totalPages: data.totalPages || 0
      }))

    } catch (error) {
      console.error('Error fetching async requests:', error)
      const errorInfo = handleApiError(error, 'Asenkron sorğular alınarkən xəta baş verdi')
      toast.error(errorInfo.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiRetry(async () => {
        return await axios.get(
          `${API_BASE_URL}/api/webhook/async-request/${requestId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      })

      const updatedRequest = response.data.data
      setRequests(prev => prev.map(req => 
        req.requestId === requestId ? updatedRequest : req
      ))

      if (selectedRequest && selectedRequest.requestId === requestId) {
        setSelectedRequest(updatedRequest)
      }

      toast.success('Sorğu məlumatları yeniləndi')

    } catch (error) {
      console.error('Error refreshing request:', error)
      const errorInfo = handleApiError(error, 'Sorğu yenilənərkən xəta baş verdi')
      toast.error(errorInfo.message)
    }
  }

  const cancelRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token')
      await apiRetry(async () => {
        return await axios.delete(
          `${API_BASE_URL}/api/webhook/async-request/${requestId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      })

      // Update the request in the list
      setRequests(prev => prev.map(req => 
        req.requestId === requestId 
          ? { ...req, status: 'failed', notes: 'İstifadəçi tərəfindən ləğv edildi' }
          : req
      ))

      toast.success('Asenkron sorğu ləğv edildi')

    } catch (error) {
      console.error('Error canceling request:', error)
      const errorInfo = handleApiError(error, 'Sorğu ləğv edilərkən xəta baş verdi')
      toast.error(errorInfo.message)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Gözləyir'
      case 'processing':
        return 'Emal olunur'
      case 'completed':
        return 'Tamamlandı'
      case 'failed':
        return 'Uğursuz'
      default:
        return 'Naməlum'
    }
  }

  const columns = [
    {
      header: 'Status',
      accessor: 'status',
      cell: (request) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(request.status)}
          <span className="text-sm">{getStatusText(request.status)}</span>
        </div>
      )
    },
    {
      header: 'Mağaza',
      accessor: 'storeId',
      cell: (request) => (
        <span className="text-sm">{request.storeId?.name || 'N/A'}</span>
      )
    },
    {
      header: 'Endpoint',
      accessor: 'endpoint',
      cell: (request) => (
        <div className="text-sm">
          <div className="font-medium">{request.endpoint?.description || 'N/A'}</div>
          <code className="text-xs text-gray-500">{request.endpoint?.url}</code>
        </div>
      )
    },
    {
      header: 'Nəticələr',
      accessor: 'results',
      cell: (request) => (
        <div className="text-sm">
          <span className="font-medium">{request.totalResults || 0}</span>
          {request.expectedResults && (
            <span className="text-gray-500"> / {request.expectedResults}</span>
          )}
        </div>
      )
    },
    {
      header: 'Tarix',
      accessor: 'initiatedAt',
      cell: (request) => (
        <div className="text-sm text-gray-600">
          {new Date(request.initiatedAt).toLocaleString('az-AZ')}
        </div>
      )
    },
    {
      header: 'Əməliyyatlar',
      accessor: 'actions',
      sortable: false,
      cell: (request) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRequest(request)
              setShowDetails(true)
            }}
            className="h-8 w-8 p-0"
            title="Detalları gör"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshRequest(request.requestId)}
            className="h-8 w-8 p-0"
            title="Yenilə"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {['pending', 'processing'].includes(request.status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cancelRequest(request.requestId)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              title="Ləğv et"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Asenkron Sorğular
            </DialogTitle>
            <DialogDescription>
              Yaratdığınız asenkron sorğuları və onların nəticələrini buradan izləyə bilərsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Axtarış..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="max-w-sm"
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Bütün statuslar</option>
                <option value="pending">Gözləyir</option>
                <option value="processing">Emal olunur</option>
                <option value="completed">Tamamlandı</option>
                <option value="failed">Uğursuz</option>
              </select>
              <Button
                variant="outline"
                onClick={fetchRequests}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Yenilə
              </Button>
            </div>

            {/* Data Table */}
            <DataTable
              data={requests}
              columns={columns}
              loading={loading}
              emptyMessage="Heç bir asenkron sorğu tapılmadı"
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Cəmi {pagination.total} nəticə
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page <= 1}
                  >
                    Əvvəlki
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Növbəti
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Details Modal */}
      {selectedRequest && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getStatusIcon(selectedRequest.status)}
                Asenkron Sorğu Detalları
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sorğu ID</label>
                  <div className="text-sm text-gray-600 font-mono">
                    {selectedRequest.requestId}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedRequest.status)}
                    <span className="text-sm">{getStatusText(selectedRequest.status)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Mağaza</label>
                  <div className="text-sm text-gray-600">
                    {selectedRequest.storeId?.name || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Nəticələr</label>
                  <div className="text-sm text-gray-600">
                    {selectedRequest.totalResults || 0}
                    {selectedRequest.expectedResults && ` / ${selectedRequest.expectedResults}`}
                  </div>
                </div>
              </div>

              {/* Endpoint Info */}
              <div>
                <label className="text-sm font-medium">Endpoint</label>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div className="font-medium">{selectedRequest.endpoint?.description}</div>
                  <code className="text-xs text-gray-600">{selectedRequest.endpoint?.url}</code>
                </div>
              </div>

              {/* Webhook URL */}
              <div>
                <label className="text-sm font-medium">Webhook URL</label>
                <code className="block bg-gray-50 p-2 rounded text-xs break-all">
                  {selectedRequest.webhookUrl}
                </code>
              </div>

              {/* Results */}
              {selectedRequest.results && selectedRequest.results.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Nəticələr</label>
                  <div className="max-h-60 overflow-y-auto border rounded">
                    {selectedRequest.results.map((result, index) => (
                      <div key={index} className="p-3 border-b last:border-b-0">
                        <div className="text-xs text-gray-500 mb-1">
                          {new Date(result.receivedAt).toLocaleString('az-AZ')}
                        </div>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <label className="text-sm font-medium">Qeydlər</label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default AsyncRequestList