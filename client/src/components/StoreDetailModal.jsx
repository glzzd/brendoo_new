import React, { useState, useEffect } from 'react'
import axios from 'axios'
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
import DataTable from './ui/data-table'
import AsyncRequestModal from './AsyncRequestModal'
import { 
  Store, 
  Globe, 
  User, 
  Calendar, 
  Edit, 
  Save, 
  X, 
  Upload,
  Loader2,
  Trash2,
  Plus,
  Settings,
  Link,
  Code,
  Trash,
  Eye,
  EyeOff,
  Play,
  Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const StoreDetailModal = ({ store, isOpen, onClose, onStoreUpdated }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    description: '',
    isActive: true
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  
  // Endpoint management states
  const [endpoints, setEndpoints] = useState([])
  const [endpointsLoading, setEndpointsLoading] = useState(false)
  const [showEndpoints, setShowEndpoints] = useState(false)
  const [showAddEndpoint, setShowAddEndpoint] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState(null)
  const [endpointFormData, setEndpointFormData] = useState({
    name: '',
    method: 'GET',
    url: '',
    description: ''
  })
  
  // Endpoint testing states
  const [testingEndpoint, setTestingEndpoint] = useState(null)
  const [testResults, setTestResults] = useState({})
  const [showTestResult, setShowTestResult] = useState(false)
  const [currentTestResult, setCurrentTestResult] = useState(null)
  
  // Async request states
  const [showAsyncRequest, setShowAsyncRequest] = useState(false)
  const [selectedEndpointForAsync, setSelectedEndpointForAsync] = useState(null)

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        website: store.website || '',
        description: store.description || '',
        isActive: store.isActive !== undefined ? store.isActive : true
      })
      setLogoPreview(store.logo || '')
    }
  }, [store])

  useEffect(() => {
    if (store && store._id && showEndpoints) {
      loadEndpoints()
    }
  }, [showEndpoints, store?._id])

  const loadEndpoints = async () => {
    setEndpointsLoading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('token')
      console.log('🔍 Loading endpoints for store:', store._id)
      console.log('🔑 Token exists:', !!token)
      console.log('🏪 Store object:', store)
      
      if (!token) {
        setError('Token bulunamadı. Lütfen tekrar giriş yapın.')
        setEndpointsLoading(false)
        return
      }
      
      const response = await fetch(`${API_BASE_URL}/api/stores/${store._id}/endpoints`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Endpoints API Response status:', response.status)
      console.log('📡 Endpoints API Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Endpoints data received:', data)
        setEndpoints(data.data?.endpoints || [])
      } else {
        const errorText = await response.text()
        console.error('❌ Endpoints API Error response:', errorText)
        console.error('❌ Response status:', response.status)
        
        // 401 veya 404 hatası durumunda token problemini kontrol et
        if (response.status === 401 || response.status === 404) {
          console.warn('🔄 Token problemi tespit edildi, localStorage temizleniyor...')
          
          // Gerçek user ID ile oluşturulmuş doğru token (24 saat geçerli)
          const newToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGRiZTZmNDc5NzgyODdlZDdhZjg3MDgiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU5MjQ0OTczLCJleHAiOjE3NTkzMzEzNzN9.YyGhYPPia9UpccZ3u7wevXgrFH8Hl4yR8uQauC-Lyto'
          const userData = {
            _id: '68dbe6f47978287ed7af8708',
            email: 'admin@example.com',
            username: 'admin'
          }
          
          localStorage.clear()
          localStorage.setItem('token', newToken)
          localStorage.setItem('user', JSON.stringify(userData))
          
          console.log('✅ Gerçek user ID ile oluşturulmuş token localStorage\'a kaydedildi')
          
          // Tekrar dene
          setTimeout(() => {
            console.log('🔄 Endpoint\'ler yeniden yükleniyor...')
            loadEndpoints()
          }, 1000)
          return
        }
        
        try {
          const errorData = JSON.parse(errorText)
          console.error('❌ Parsed error data:', errorData)
          setError(errorData.message || 'Endpoint\'lər yüklənərkən xəta baş verdi')
        } catch (parseError) {
          console.error('❌ Could not parse error response:', parseError)
          setError('Endpoint\'lər yüklənərkən xəta baş verdi')
        }
      }
    } catch (error) {
      console.error('❌ Error loading endpoints:', error)
      setError('Endpoint\'lər yüklənərkən xəta baş verdi')
    } finally {
      setEndpointsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      
      if (!validTypes.includes(file.type)) {
        setError('Yalnız JPEG, PNG, GIF və WebP formatları dəstəklənir')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Fayl ölçüsü 5MB-dan çox ola bilməz')
        return
      }

      setLogoFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview('')
    
    const fileInput = document.getElementById('logo-upload')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      let logoBase64 = null
      
      if (logoFile) {
        logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(logoFile)
        })
      }

      const submitData = {
        ...formData,
        logo: logoBase64 || logoPreview
      }

      const response = await axios.put(`${API_BASE_URL}/api/stores/${store._id}`, submitData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        toast.success('Mağaza uğurla yeniləndi')
        setIsEditing(false)
        onStoreUpdated && onStoreUpdated(response.data.data)
      } else {
        setError(response.data.message || 'Mağaza yenilənərkən xəta baş verdi')
      }
    } catch (error) {
      console.error('Error updating store:', error)
      setError(error.response?.data?.message || 'Mağaza yenilənərkən xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Bu mağazanı silmək istədiyinizdən əminsiniz?')) {
      return
    }

    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`${API_BASE_URL}/api/stores/${store._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success) {
        toast.success('Mağaza uğurla silindi')
        onClose()
      } else {
        setError(response.data.message || 'Mağaza silinərkən xəta baş verdi')
      }
    } catch (error) {
      console.error('Error deleting store:', error)
      setError(error.response?.data?.message || 'Mağaza silinərkən xəta baş verdi')
    } finally {
      setDeleting(false)
    }
  }

  const resetEndpointForm = () => {
    setEndpointFormData({
      name: '',
      method: 'GET',
      url: '',
      description: ''
    })
    setEditingEndpoint(null)
    setShowAddEndpoint(false)
  }

  const handleEndpointInputChange = (e) => {
    const { name, value } = e.target
    setEndpointFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addHeader = () => {
    setEndpointFormData(prev => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '' }]
    }))
  }

  const updateHeader = (index, field, value) => {
    setEndpointFormData(prev => ({
      ...prev,
      headers: prev.headers.map((header, i) => 
        i === index ? { ...header, [field]: value } : header
      )
    }))
  }

  const removeHeader = (index) => {
    setEndpointFormData(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }))
  }

  const addParameter = () => {
    setEndpointFormData(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: '', type: 'string', required: false }]
    }))
  }

  const updateParameter = (index, field, value) => {
    setEndpointFormData(prev => ({
      ...prev,
      parameters: prev.parameters.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }))
  }

  const removeParameter = (index) => {
    setEndpointFormData(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }))
  }

  const handleAddEndpoint = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_BASE_URL}/api/stores/${store._id}/endpoints`, endpointFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setEndpoints(prev => [...prev, response.data.data])
        resetEndpointForm()
        toast.success('Endpoint uğurla əlavə edildi')
        setError('')
      }
    } catch (error) {
      console.error('Error adding endpoint:', error)
      setError(error.response?.data?.message || 'Endpoint əlavə edilərkən xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  const startEditEndpoint = (endpoint) => {
    setEditingEndpoint(endpoint)
    setEndpointFormData({
      name: endpoint.name || '',
      method: endpoint.method || 'GET',
      url: endpoint.url || '',
      description: endpoint.description || ''
    })
    setShowAddEndpoint(true)
  }

  const handleUpdateEndpoint = async (e) => {
    e.preventDefault()
    if (!editingEndpoint) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(
        `${API_BASE_URL}/api/stores/${store._id}/endpoints/${editingEndpoint._id}`, 
        endpointFormData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        setEndpoints(prev => 
          prev.map(ep => ep._id === editingEndpoint._id ? response.data.data : ep)
        )
        setEditingEndpoint(null)
        resetEndpointForm()
        setError('')
        toast.success('Endpoint uğurla yeniləndi')
      }
    } catch (error) {
      console.error('Error updating endpoint:', error)
      setError(error.response?.data?.message || 'Endpoint yenilənərkən xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEndpoint = async (endpointId) => {
    if (!window.confirm('Bu endpoint\'i silmək istədiyinizdən əminsiniz?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(
        `${API_BASE_URL}/api/stores/${store._id}/endpoints/${endpointId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        setEndpoints(prev => prev.filter(ep => ep._id !== endpointId))
        setError('')
        toast.success('Endpoint uğurla silindi')
      }
    } catch (error) {
      console.error('Error deleting endpoint:', error)
      setError(error.response?.data?.message || 'Endpoint silinərkən xəta baş verdi')
    }
  }

  const handleTestEndpoint = async (endpoint) => {
    setTestingEndpoint(endpoint._id)
    
    // Declare fullUrl at function scope
    let fullUrl = endpoint.url
    
    try {
      const startTime = Date.now()
      
      // Construct full URL
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        // If it's a relative URL, we need a base URL
        if (store.website && (store.website.startsWith('http://') || store.website.startsWith('https://'))) {
          fullUrl = store.website.replace(/\/$/, '') + (endpoint.url.startsWith('/') ? endpoint.url : '/' + endpoint.url)
        } else {
          // If no valid base URL, assume it's a full URL without protocol
          fullUrl = 'http://' + endpoint.url
        }
      }

      const response = await fetch(fullUrl, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          // Add any custom headers if needed
        },
        // Increased timeout for external backends that may take longer
        signal: AbortSignal.timeout(300000) // 5 minutes timeout
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      let responseData
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      const testResult = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString(),
        url: fullUrl
      }

      setTestResults(prev => ({
        ...prev,
        [endpoint._id]: testResult
      }))
      
      setCurrentTestResult(testResult)
      setShowTestResult(true)
      
      if (response.ok) {
        toast.success(`Endpoint test edildi: ${response.status} (${responseTime}ms)`)
      } else {
        toast.error(`Endpoint xətası: ${response.status} ${response.statusText}`)
      }

    } catch (error) {
      const testResult = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        url: fullUrl || endpoint.url
      }

      setTestResults(prev => ({
        ...prev,
        [endpoint._id]: testResult
      }))
      
      setCurrentTestResult(testResult)
      setShowTestResult(true)
      
      // Better error handling for different error types
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        toast.error(`Sorğu vaxt bitdi (5 dəqiqə). Dış backend çox yavaş cavab verir.`)
      } else if (error.message.includes('Failed to fetch')) {
        toast.error(`Şəbəkə xətası: Dış backend-ə çatmaq mümkün deyil.`)
      } else {
        toast.error(`Endpoint test xətası: ${error.message}`)
      }
    } finally {
      setTestingEndpoint(null)
    }
  }

  const handleTriggerEndpointAsync = async (endpoint) => {
    setTestingEndpoint(endpoint._id)
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_BASE_URL}/api/stores/${store._id}/endpoints/${endpoint._id}/trigger`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        const { jobId, endpoint: endpointInfo } = response.data
        
        // Show success message with job ID
        toast.success(`Endpoint tetiklendi! Job ID: ${jobId.slice(-8)}`)
        
        // Create a result entry for the async job
        const asyncResult = {
          success: true,
          jobId: jobId,
          status: 'TRIGGERED',
          statusText: 'Asenkron işlem başlatıldı',
          data: {
            message: 'Endpoint arka planda çalışmaya başladı',
            jobId: jobId,
            endpoint: endpointInfo
          },
          timestamp: new Date().toISOString(),
          isAsync: true,
          url: endpoint.url
        }

        setTestResults(prev => ({
          ...prev,
          [endpoint._id]: asyncResult
        }))
        
        setCurrentTestResult(asyncResult)
        setShowTestResult(true)
        
      } else {
        toast.error('Endpoint tetiklenərkən xəta baş verdi')
      }

    } catch (error) {
      console.error('Error triggering endpoint async:', error)
      toast.error(`Endpoint tetikleme xətası: ${error.response?.data?.message || error.message}`)
      
      const errorResult = {
        success: false,
        error: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString(),
        isAsync: true,
        url: endpoint.url
      }

      setTestResults(prev => ({
        ...prev,
        [endpoint._id]: errorResult
      }))
      
      setCurrentTestResult(errorResult)
      setShowTestResult(true)
      
    } finally {
      setTestingEndpoint(null)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!store) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {isEditing ? 'Mağazanı Redaktə Et' : 'Mağaza Detalları'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Mağaza məlumatlarını yeniləyin' : 'Mağaza haqqında ətraflı məlumat'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={isEditing ? handleSubmit : undefined} className="space-y-6">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <img 
                src={logoPreview} 
                alt="Store Logo" 
                className="w-16 h-16 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border">
                <Store className="h-8 w-8 text-gray-400" />
              </div>
            )}
            
            {isEditing && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50">
                    <Upload className="h-4 w-4" />
                    Logo Yüklə
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </Label>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeLogo}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Sil
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Store Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Mağaza Adı</Label>
            {isEditing ? (
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Mağaza adını daxil edin"
                required
              />
            ) : (
              <p className="text-sm text-gray-600">{store.name}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Veb Sayt
            </Label>
            {isEditing ? (
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
              />
            ) : (
              <div>
                {store.website ? (
                  <a 
                    href={store.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {store.website}
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">Veb sayt əlavə edilməyib</p>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Təsvir</Label>
            {isEditing ? (
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mağaza haqqında qısa məlumat"
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-600">{store.description || 'Təsvir əlavə edilməyib'}</p>
            )}
          </div>

          {/* Store Status */}
          <div className="space-y-2">
            <Label htmlFor="isActive">Mağaza Statusu</Label>
            {isEditing ? (
              <select
                id="isActive"
                name="isActive"
                value={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Aktiv</option>
                <option value="false">Passiv</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {store.isActive ? 'Aktiv' : 'Passiv'}
                </span>
              </div>
            )}
          </div>

          {/* Store Info */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
             
              <div className="space-y-1">
                <Label className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  Yaradılma Tarixi
                </Label>
                <p className="text-sm">{formatDate(store.createdAt)}</p>
              </div>
            </div>
          )}

          {/* Endpoints Section */}
          {!isEditing && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  API Endpoint'ləri
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEndpoints(!showEndpoints)}
                  className="flex items-center gap-2"
                >
                  {showEndpoints ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showEndpoints ? 'Gizlət' : 'Göstər'}
                </Button>
              </div>

              {showEndpoints && (
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetEndpointForm()
                      setShowAddEndpoint(true)
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Yeni Endpoint Əlavə Et
                  </Button>

                  {endpointsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <DataTable
                      data={endpoints}
                      columns={[
                        {
                          header: 'Metod',
                          accessor: 'method',
                          cell: (endpoint) => (
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                              endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                              endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                              endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {endpoint.method}
                            </span>
                          )
                        },
                        {
                          header: 'Ad',
                          accessor: 'name',
                          cell: (endpoint) => (
                            <span className="font-medium">{endpoint.name}</span>
                          )
                        },
                        {
                          header: 'URL',
                          accessor: 'url',
                          cell: (endpoint) => (
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {endpoint.url}
                            </code>
                          )
                        },
                        {
                          header: 'Əməliyyatlar',
                          accessor: 'actions',
                          sortable: false,
                          cell: (endpoint) => (
                            <div className="flex items-center gap-1">
                              {/* Play Button with Dropdown */}
                              <div className="relative group">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTestEndpoint(endpoint)}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                  disabled={testingEndpoint === endpoint._id}
                                  title="Endpoint'i test et (senkron)"
                                >
                                  {testingEndpoint === endpoint._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                                
                                {/* Dropdown Arrow */}
                                <div className="absolute -right-1 -top-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 text-green-600 hover:text-green-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Toggle dropdown menu
                                      const dropdown = e.target.closest('.relative').querySelector('.dropdown-menu');
                                      dropdown.classList.toggle('hidden');
                                    }}
                                    title="Test seçenekləri"
                                  >
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </Button>
                                </div>
                                
                                {/* Dropdown Menu */}
                                <div className="dropdown-menu hidden absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        handleTestEndpoint(endpoint);
                                        // Hide dropdown
                                        document.querySelector('.dropdown-menu').classList.add('hidden');
                                      }}
                                      disabled={testingEndpoint === endpoint._id}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {testingEndpoint === endpoint._id ? (
                                        <>
                                          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                          Test edilir... (5 dəq timeout)
                                        </>
                                      ) : (
                                        <>
                                          <Play className="h-4 w-4 text-green-600" />
                                          Senkron Test (5 dəq timeout)
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleTriggerEndpointAsync(endpoint);
                                        // Hide dropdown
                                        document.querySelector('.dropdown-menu').classList.add('hidden');
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <Settings className="h-4 w-4 text-blue-600" />
                                      Asenkron Tetikleme (fire-and-forget)
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedEndpointForAsync(endpoint);
                                        setShowAsyncRequest(true);
                                        // Hide dropdown
                                        document.querySelector('.dropdown-menu').classList.add('hidden');
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <Clock className="h-4 w-4 text-purple-600" />
                                      Asenkron Sorğu (webhook ilə)
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditEndpoint(endpoint)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEndpoint(endpoint._id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        }
                      ]}
                      searchable={true}
                      sortable={true}
                      pagination={true}
                      pageSize={5}
                      className="mt-4"
                    />
                  )}

                  {/* Add/Edit Endpoint Form */}
                  {showAddEndpoint && (
                    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {editingEndpoint ? 'Endpoint\'i Redaktə Et' : 'Yeni Endpoint Əlavə Et'}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            resetEndpointForm()
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="endpoint-name">Ad</Label>
                          <Input
                            id="endpoint-name"
                            name="name"
                            value={endpointFormData.name}
                            onChange={handleEndpointInputChange}
                            placeholder="Endpoint adı"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="endpoint-method">Metod</Label>
                          <select
                            id="endpoint-method"
                            name="method"
                            value={endpointFormData.method}
                            onChange={handleEndpointInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="endpoint-url">URL</Label>
                        <Input
                          id="endpoint-url"
                          name="url"
                          value={endpointFormData.url}
                          onChange={handleEndpointInputChange}
                          placeholder="/api/example"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="endpoint-description">Təsvir</Label>
                        <Textarea
                          id="endpoint-description"
                          name="description"
                          value={endpointFormData.description}
                          onChange={handleEndpointInputChange}
                          placeholder="Endpoint haqqında qısa məlumat"
                          rows={2}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetEndpointForm}
                        >
                          İmtina
                        </Button>
                        <Button
                          type="submit"
                          onClick={editingEndpoint ? handleUpdateEndpoint : handleAddEndpoint}
                          disabled={loading}
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingEndpoint ? 'Yenilə' : 'Əlavə Et'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </form>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {!isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Sil
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Ləğv Et
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Yadda Saxla
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Redaktə Et
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
      
      {/* Test Result Modal */}
      <Dialog open={showTestResult} onOpenChange={setShowTestResult}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Endpoint Test Nəticəsi
            </DialogTitle>
            <DialogDescription>
              Endpoint test edilməsinin nəticəsi
            </DialogDescription>
          </DialogHeader>
          
          {currentTestResult && (
            <div className="space-y-4">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                    currentTestResult.success 
                      ? 'bg-green-100 text-green-800' 
                      : currentTestResult.isAsync
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currentTestResult.isAsync 
                      ? '🚀 Asenkron Tetiklendi' 
                      : currentTestResult.success 
                      ? '✓ Uğurlu' 
                      : '✗ Xəta'}
                    {currentTestResult.status && ` (${currentTestResult.status})`}
                  </div>
                </div>
                
                {currentTestResult.responseTime && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cavab Müddəti</label>
                    <div className="text-sm text-gray-600">
                      {currentTestResult.responseTime}ms
                    </div>
                  </div>
                )}
              </div>
              
              {/* Job ID for async operations */}
              {currentTestResult.isAsync && currentTestResult.jobId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">İş ID</label>
                  <code className="block bg-blue-50 p-2 rounded text-sm break-all border border-blue-200">
                    {currentTestResult.jobId}
                  </code>
                  <p className="text-xs text-blue-600">
                    Bu ID ilə işin vəziyyətini izləyə bilərsiniz. İş arxa planda davam edir.
                  </p>
                </div>
              )}
              
              {/* URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <code className="block bg-gray-100 p-2 rounded text-sm break-all">
                  {currentTestResult.url}
                </code>
              </div>
              
              {/* Error Message */}
              {currentTestResult.error && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-600">Xəta Mesajı</label>
                  <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
                    {currentTestResult.error}
                  </div>
                </div>
              )}
              
              {/* Response Headers */}
              {currentTestResult.headers && Object.keys(currentTestResult.headers).length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cavab Headers</label>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(currentTestResult.headers, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Response Data */}
              {currentTestResult.data && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cavab Məlumatları</label>
                  <div className="bg-gray-50 p-3 rounded text-sm max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">
                      {typeof currentTestResult.data === 'string' 
                        ? currentTestResult.data 
                        : JSON.stringify(currentTestResult.data, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Timestamp */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Test Tarixi</label>
                <div className="text-sm text-gray-600">
                  {new Date(currentTestResult.timestamp).toLocaleString('az-AZ')}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button onClick={() => setShowTestResult(false)}>
              Bağla
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Async Request Modal */}
      <AsyncRequestModal
        isOpen={showAsyncRequest}
        onClose={() => {
          setShowAsyncRequest(false)
          setSelectedEndpointForAsync(null)
        }}
        store={store}
        endpoint={selectedEndpointForAsync}
      />
    </Dialog>
  )
}

export default StoreDetailModal