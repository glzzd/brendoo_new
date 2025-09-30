import React, { useState, useMemo } from 'react';
import StockDetailModal from './StockDetailModal';

const StockList = ({ stocks, onDelete, onRefresh }) => {
  const [selectedStock, setSelectedStock] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortField, setSortField] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_stock: {
        label: 'Stokda Var',
        className: 'bg-green-100 text-green-800 border-green-200',
        symbol: '✓'
      },
      low_stock: {
        label: 'Az Stok',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        symbol: '⚠'
      },
      out_of_stock: {
        label: 'Stokda Yoxdur',
        className: 'bg-red-100 text-red-800 border-red-200',
        symbol: '✗'
      }
    };

    const config = statusConfig[status] || statusConfig.out_of_stock;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        <span className="text-xs">{config.symbol}</span>
        {config.label}
      </span>
    );
  };

  const formatPrice = (price, currency) => {
    const currencySymbol = currency === 'AZN' ? '₼' : currency || 'AZN';
    return `${price?.toFixed(2)} ${currencySymbol}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvailableSizes = (sizes) => {
    if (!sizes || sizes.length === 0) return 'Boyut yok';
    const availableSizes = sizes.filter(size => size.onStock).map(size => size.sizeName);
    return availableSizes.length > 0 ? availableSizes.join(', ') : 'Hiçbiri';
  };

  const handleViewDetails = (stock) => {
    setSelectedStock(stock);
    setShowDetailModal(true);
  };

  // Sort fonksiyonu
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Sıralama değiştiğinde ilk sayfaya dön
  };

  // Sıralanmış ve sayfalanmış veriler
  const { paginatedStocks, totalPages, totalItems } = useMemo(() => {
    if (!stocks || stocks.length === 0) return { paginatedStocks: [], totalPages: 0, totalItems: 0 };

    // Sıralama
    const sortedStocks = [...stocks].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Özel sıralama durumları
      if (sortField === 'price') {
        aValue = a.discountedPrice || a.price || 0;
        bValue = b.discountedPrice || b.price || 0;
      } else if (sortField === 'priceInRubles') {
        aValue = a.priceInRubles || 0;
        bValue = b.priceInRubles || 0;
      } else if (sortField === 'updatedAt' || sortField === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    // Sayfalama
    const totalItems = sortedStocks.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedStocks = sortedStocks.slice(startIndex, endIndex);

    return { paginatedStocks, totalPages, totalItems };
  }, [stocks, sortField, sortDirection, currentPage, itemsPerPage]);

  // Sort ikonu render fonksiyonu
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <span className="text-gray-300 text-sm">↑</span>;
    }
    return sortDirection === 'asc' ? 
      <span className="text-gray-600 text-sm">↑</span> : 
      <span className="text-gray-600 text-sm">↓</span>;
  };

  if (!stocks || stocks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-gray-400">📦</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Hələ məhsul yoxdur</h3>
        <p className="text-gray-500">İlk məhsulunuzu əlavə etmək üçün məhsul əlavə edin.</p>
      </div>
    );
  }

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-sm border overflow-hidden mx-16" 
        style={{ 
          width: 'calc(100vw - 8rem)', 
          maxWidth: 'calc(100vw - 8rem)'
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Məhsul
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('brand')}
                >
                  <div className="flex items-center gap-2">
                    Marka & Kateqoriya
                    {renderSortIcon('brand')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-2">
                    Qiymət
                    {renderSortIcon('price')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('priceInRubles')}
                >
                  <div className="flex items-center gap-2">
                    Rubl Qiyməti
                    {renderSortIcon('priceInRubles')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ölçülər
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('stockStatus')}
                >
                  <div className="flex items-center gap-2">
                    Vəziyyət
                    {renderSortIcon('stockStatus')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center gap-2">
                    Yenilənmə
                    {renderSortIcon('updatedAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Əməliyyatlar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedStocks.map((stock) => (
                <tr key={stock._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {stock.images && stock.images.length > 0 ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover border"
                            src={stock.images[0]}
                            alt={stock.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border"
                          style={{ display: stock.images && stock.images.length > 0 ? 'none' : 'flex' }}
                        >
                          <span className="text-xl text-gray-400">📦</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2 max-w-xs">
                          {stock.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {stock.store}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                        <span className="text-xs">🏷️</span>
                        {stock.brand}
                      </span>
                      <span className="text-sm text-gray-500">{stock.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                        <span className="text-xs">💰</span>
                        {formatPrice(stock.price, stock.currency)}
                      </span>
                      {stock.discountedPrice && (
                        <span className="text-sm text-green-600">
                          İndirimli: {formatPrice(stock.discountedPrice, stock.currency)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                        <span className="text-xs">🪙</span>
                        {stock.priceInRubles ? `${stock.priceInRubles.toFixed(2)} RUB` : 'Hesaplanmadı'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getAvailableSizes(stock.sizes)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Cəmi: {stock.sizes?.length || 0} ölçü
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(stock.stockStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <span className="text-xs">📅</span>
                      {formatDate(stock.updatedAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(stock)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                        title="Detayları Görüntüle"
                      >
                        <span className="text-sm">✏️</span>
                      </button>
                      {stock.productUrl && (
                        <a
                          href={stock.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                          title="Məhsul Səhifəsini Aç"
                        >
                          <span className="text-sm">🔗</span>
                        </a>
                      )}
                      <button
                        onClick={() => onDelete(stock._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                        title="Sil"
                      >
                        <span className="text-sm">🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                    {' - '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
                    {' / '}
                    <span className="font-medium">{totalItems}</span>
                    {' sonuç gösteriliyor'}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Önceki</span>
                      ←
                    </button>
                    
                    {/* Sayfa numaraları */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Sonraki</span>
                      →
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stock Detail Modal */}
      {showDetailModal && selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedStock(null);
          }}
          onUpdate={onRefresh}
        />
      )}
    </>
  );
};

export default StockList;