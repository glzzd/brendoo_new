import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Plus, Loader2, Upload, X } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const AddStoreModal = ({ onStoreAdded }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    description: '',
    logo: null
  })
  const [logoPreview, setLogoPreview] = useState(null)
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          logo: 'Zəhmət olmasa düzgün şəkil faylı seçin'
        }))
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: 'Fayl ölçüsü 5MB-dan kiçik olmalıdır'
        }))
        return
      }
      
      setFormData(prev => ({
        ...prev,
        logo: file
      }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target.result)
      }
      reader.readAsDataURL(file)
      
      // Clear error
      if (errors.logo) {
        setErrors(prev => ({
          ...prev,
          logo: ''
        }))
      }
    }
  }

  const removeLogo = () => {
    setFormData(prev => ({
      ...prev,
      logo: null
    }))
    setLogoPreview(null)
    // Clear file input
    const fileInput = document.getElementById('logo-upload')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Mağaza adı tələb olunur'
    }
    
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Düzgün website URL-i daxil edin (http:// və ya https:// ilə başlamalıdır)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      
      // Convert logo file to base64 if exists
      let logoBase64 = ''
      if (formData.logo) {
        logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(formData.logo)
        })
      }
      
      const submitData = {
        name: formData.name,
        website: formData.website || '',
        description: formData.description || '',
        logo: logoBase64
      }
      
      const response = await fetch(`${API_BASE_URL}/api/stores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })
      
      // Check if response is ok first
      if (!response.ok) {
        let errorMessage = 'Mağaza əlavə edilərkən xəta baş verdi'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError)
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      // Parse successful response
      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        console.error('Error parsing success response:', jsonError)
        throw new Error('Mağaza əlavə edildi lakin cavab oxuna bilmədi')
      }
      
      // Reset form
      setFormData({
        name: '',
        website: '',
        description: '',
        logo: null
      })
      setLogoPreview(null)
      
      // Clear file input
      const fileInput = document.getElementById('logo-upload')
      if (fileInput) {
        fileInput.value = ''
      }
      
      // Close modal
      setOpen(false)
      
      // Notify parent component
      if (onStoreAdded) {
        onStoreAdded(result.data)
      }
      
    } catch (error) {
      console.error('Error adding store:', error)
      setErrors({ submit: error.message })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      logo: null
    })
    setLogoPreview(null)
    setErrors({})
    
    // Clear file input
    const fileInput = document.getElementById('logo-upload')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Mağaza Əlavə Et
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Mağaza Əlavə Et</DialogTitle>
          <DialogDescription>
            Yeni mağaza əlavə etmək üçün aşağıdakı məlumatları doldurun.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Logo</Label>
            <div className="flex items-center space-x-4">
              {logoPreview ? (
                <div className="relative">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload').click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {logoPreview ? 'Logoyu Dəyiş' : 'Logo Seç'}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG və ya GIF (Maksimum 5MB)
                </p>
              </div>
            </div>
            {errors.logo && <p className="text-sm text-red-500">{errors.logo}</p>}
          </div>

          {/* Mağaza Adı */}
          <div className="space-y-2">
            <Label htmlFor="name">Mağaza Adı *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Mağaza adını daxil edin"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          
          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className={errors.website ? 'border-red-500' : ''}
            />
            {errors.website && <p className="text-sm text-red-500">{errors.website}</p>}
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Mağaza haqqında açıklama yazınız..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>
          
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Ləğv Et
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Əlavə edilir...
                </>
              ) : (
                'Mağaza Əlavə Et'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddStoreModal