import React, { useState } from 'react';
import { X, Edit, Save, Package, ExternalLink, Calendar, Tag, DollarSign } from 'lucide-react';

const StockDetailModal = ({ stock, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: stock.name || '',
    brand: stock.brand || '',
    price: stock.price || '',
    currency: stock.currency || 'AZN',
    priceInRubles: stock.priceInRubles || '',
    discountedPrice: stock.discountedPrice || '',
    description: stock.description || '',
    productUrl: stock.productUrl || '',
    store: stock.store || '',
    category: stock.category || '',
    sizes: stock.sizes || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSizeToggle = (index) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = {
      ...newSizes[index],
      onStock: !newSizes[index].onStock
    };
    setFormData(prev => ({
      ...prev,
      sizes: newSizes
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const updateData = {
        ...formData,
        price: parseFloat(formData.price),
        priceInRubles: formData.priceInRubles ? parseFloat(formData.priceInRubles) : null,
        discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : null
      };

      const response = await fetch(`/api/stock/${stock._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ürün güncellenemedi');
      }

      setIsEditing(false);
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_stock: { label: 'Stokta Var', className: 'bg-green-100 text-green-800' },
      low_stock: { label: 'Az Stok', className: 'bg-yellow-100 text-yellow-800' },
      out_of_stock: { label: 'Stokta Yok', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.out_of_stock;
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Ürün Detayları</h2>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1 rounded transition-colors"
              >
                <Edit className="w-4 h-4" />
                Düzenle
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={loading}
                className="text-green-600 hover:text-green-700 flex items-center gap-1 px-3 py-1 rounded transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Images */}
          {stock.images && stock.images.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Ürün Görselleri</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stock.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${stock.name} ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Adı
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 font-medium">{stock.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marka
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center gap-1">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{stock.brand}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qiymət
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900 font-medium">
                    {stock.price?.toFixed(2)} {stock.currency === 'AZN' ? '₼' : stock.currency}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valyuta
              </label>
              {isEditing ? (
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="AZN">AZN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="RUB">RUB</option>
                </select>
              ) : (
                <p className="text-gray-900">{stock.currency}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endirimli Qiymət
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  name="discountedPrice"
                  value={formData.discountedPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">
                  {stock.discountedPrice ? `${stock.discountedPrice.toFixed(2)} ${stock.currency === 'AZN' ? '₼' : stock.currency}` : 'Yoxdur'}
                </p>
              )}
            </div>
          </div>

          {/* Store and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mağaza
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="store"
                  value={formData.store}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{stock.store || 'Göstərilməyib'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kateqoriya
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{stock.category || 'Göstərilməyib'}</p>
              )}
            </div>
          </div>

          {/* Product URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Məhsul URL-si
            </label>
            {isEditing ? (
              <input
                type="url"
                name="productUrl"
                value={formData.productUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="flex items-center gap-2">
                {stock.productUrl ? (
                  <a
                    href={stock.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Məhsul səhifəsini aç
                  </a>
                ) : (
                  <span className="text-gray-500">URL göstərilməyib</span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Təsvir
            </label>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{stock.description || 'Təsvir yoxdur'}</p>
            )}
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ölçülər və Stok Vəziyyəti
            </label>
            {stock.sizes && stock.sizes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {formData.sizes.map((size, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      size.onStock
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{size.sizeName}</span>
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleSizeToggle(index)}
                          className={`w-4 h-4 rounded border-2 ${
                            size.onStock
                              ? 'bg-green-500 border-green-500'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {size.onStock && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ) : (
                        <span className={`text-xs font-medium ${
                          size.onStock ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {size.onStock ? 'Stokda' : 'Yoxdur'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Ölçü məlumatı yoxdur</p>
            )}
          </div>

          {/* Status and Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stok Vəziyyəti
              </label>
              {getStatusBadge(stock.stockStatus)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yaradılma Tarixi
              </label>
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{formatDate(stock.createdAt)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Son Yenilənmə
              </label>
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{formatDate(stock.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;