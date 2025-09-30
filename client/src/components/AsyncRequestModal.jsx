import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { apiRetry, handleApiError, throttle } from '../utils/apiUtils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  Eye,
  X,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://69.62.114.202:5000'

const AsyncRequestModal = ({ isOpen, onClose, store, endpoint }) => {
  const [loading, setLoading] = useState(false)
  const [requestData, setRequestData] = useState(null)
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const [expectedResults, setExpectedResults] = useState(100)
  const [notes, setNotes] = useState('')
  const [pollInterval, setPollInterval] = useState(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRequestData(null)
      setResults([])
      setStatus('idle')
      setNotes('')
    } else {
      // Clear polling when modal closes
      if (pollInterval) {
        clearInterval(pollInterval)
        setPollInterval(null)
      }
    }
  }, [isOpen])

  // Start polling for results when request is created
  useEffect(() => {
    if (requestData && ['pending', 'processing'].includes(status)) {
      const interval = setInterval(() => {
        checkRequestStatus()
      }, 5000) // Check every 5 seconds
      
      setPollInterval(interval)
      
      return () => clearInterval(interval)
    }
  }, [requestData, status])

  const createAsyncRequest = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await apiRetry(async () => {
        return await axios.post(
          `${API_BASE_URL}/api/webhook/async-request`,
          {
            storeId: store._id,
            endpoint: {
              url: endpoint.url,
              method: endpoint.method,
              description: endpoint.description
            },
            expectedResults: parseInt(expectedResults),
            notes
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      })

      setRequestData(response.data.data)
      setStatus('pending')
      toast.success('Asenkron sorğu yaradıldı. Nəticələr gəldikcə göstəriləcək.')
      
    } catch (error) {
      console.error('Error creating async request:', error)
      const errorInfo = handleApiError(error, 'Asenkron sorğu yaradılarkən xəta baş verdi')
      toast.error(errorInfo.message)
    } finally {
      setLoading(false)
    }
  }

  // Throttled version of checkRequestStatus to prevent excessive polling
  const throttledCheckRequestStatus = throttle(async () => {
    if (!requestData) return

    try {
      const token = localStorage.getItem('token')
      const response = await apiRetry(async () => {
        return await axios.get(
          `${API_BASE_URL}/api/webhook/async-request/${requestData.requestId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      })

      const data = response.data.data
      setStatus(data.status)
      setResults(data.results || [])
      
      // Stop polling if completed or failed
      if (['completed', 'failed'].includes(data.status)) {
        if (pollInterval) {
          clearInterval(pollInterval)
          setPollInterval(null)
        }
        
        if (data.status === 'completed') {
          toast.success(`Asenkron sorğu tamamlandı! ${data.totalResults} nəticə alındı.`)
        } else if (data.status === 'failed') {
          toast.error('Asenkron sorğu uğursuz oldu.')
        }
      }
      
    } catch (error) {
      console.error('Error checking request status:', error)
      // Don't show error toast for polling failures to avoid spam
    }
  }, 2000) // Throttle to maximum once every 2 seconds

  const checkRequestStatus = throttledCheckRequestStatus

  const cancelRequest = async () => {
    if (!requestData) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        `${API_BASE_URL}/api/webhook/async-request/${requestData.requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setStatus('failed')
      if (pollInterval) {
        clearInterval(pollInterval)
        setPollInterval(null)
      }
      toast.success('Asenkron sorğu ləğv edildi')
      
    } catch (error) {
      console.error('Error canceling request:', error)
      toast.error(error.response?.data?.message || 'Sorğu ləğv edilərkən xəta baş verdi')
    }
  }

  const getStatusIcon = () => {
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

  const getStatusText = () => {
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
        return 'Hazır'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Asenkron Sorğu - {endpoint?.description || endpoint?.url}
          </DialogTitle>
          <DialogDescription>
            Bu endpoint uzun müddət cavab verə bilər. Sorğu yaradın və nəticələr gəldikcə burada görəcəksiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!requestData ? (
            // Request creation form
            <div className="space-y-4">
              <div>
                <Label htmlFor="expectedResults">Gözlənilən nəticə sayı</Label>
                <Input
                  id="expectedResults"
                  type="number"
                  value={expectedResults}
                  onChange={(e) => setExpectedResults(e.target.value)}
                  min="1"
                  max="10000"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Qeydlər (isteğe bağlı)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bu sorğu haqqında qeydləriniz..."
                  rows={3}
                />
              </div>
            </div>
          ) : (
            // Request status and results
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="font-medium">Status: {getStatusText()}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Sorğu ID: {requestData.requestId}
                </div>
              </div>

              {/* Progress */}
              {requestData && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nəticələr: {results.length}</span>
                    <span>Gözlənilən: {expectedResults}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((results.length / expectedResults) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Results */}
              {results.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Nəticələr:</h4>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    {results.map((result, index) => (
                      <div key={index} className="p-3 border-b last:border-b-0">
                        <div className="text-sm text-gray-600 mb-1">
                          {new Date(result.receivedAt).toLocaleString()}
                        </div>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                        {result.metadata && (
                          <div className="text-xs text-gray-500 mt-1">
                            Metadata: {JSON.stringify(result.metadata)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Webhook URL */}
              {requestData && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-1">
                    Webhook URL:
                  </div>
                  <code className="text-xs text-blue-600 break-all">
                    {requestData.webhookUrl}
                  </code>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!requestData ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Ləğv et
              </Button>
              <Button onClick={createAsyncRequest} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Asenkron Sorğu Yarat
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Bağla
              </Button>
              {['pending', 'processing'].includes(status) && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={checkRequestStatus}
                    disabled={loading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Yenilə
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={cancelRequest}
                  >
                    Ləğv et
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AsyncRequestModal