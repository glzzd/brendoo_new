import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Package, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import StockList from '../components/StockList';
import StockStats from '../components/StockStats';

const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setSearchLoading(true);
    }
    fetchStocks();
    fetchStats();
  }, [debouncedSearchTerm, filterStatus]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://69.62.114.202:5000'
  const fetchStocks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filterStatus !== 'all') params.append('stockStatus', filterStatus);
      
      // Tüm ürünleri getirmek için yüksek limit ayarla
      params.append('limit', '1000');
      params.append('page', '1');
      
      console.log('🔍 Fetching stocks with params:', params.toString());
      console.log('🔑 Token exists:', !!token);
      
      const response = await fetch(`${API_BASE_URL}/api/stock?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Stock API Response status:', response.status);
      console.log('📡 Stock API Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Stock API Error response:', errorText);
        throw new Error('Stok verileri alınamadı');
      }

      const responseText = await response.text();
      console.log('📄 Raw response text:', responseText.substring(0, 200) + '...');
      
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Parsed JSON data:', data);
        console.log('📊 Backend pagination info:', data.pagination);
        // API'den gelen response yapısı: { success: true, data: [...], pagination: {...} }
        setStocks(data.data || []);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('❌ Response that failed to parse:', responseText);
        throw new Error('Sunucudan geçersiz yanıt alındı');
      }
    } catch (err) {
      console.error('❌ Stock fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('📊 Fetching stock stats...');
      
      const response = await fetch('/api/stock/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 Stats API Response status:', response.status);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('📊 Raw stats response:', responseText.substring(0, 200) + '...');
        
        try {
          const data = JSON.parse(responseText);
          console.log('✅ Parsed stats data:', data);
          
          // API'den gelen data yapısını kontrol et ve doğru şekilde set et
          if (data.success && data.data && data.data.overview) {
            setStats({
              totalProducts: data.data.overview.totalProducts || 0,
              inStock: data.data.overview.inStock || 0,
              lowStock: data.data.overview.lowStock || 0,
              outOfStock: data.data.overview.outOfStock || 0
            });
          } else {
            console.warn('⚠️ Unexpected stats data structure:', data);
            setStats({
              totalProducts: 0,
              inStock: 0,
              lowStock: 0,
              outOfStock: 0
            });
          }
        } catch (parseError) {
          console.error('❌ Stats JSON Parse Error:', parseError);
          console.error('❌ Stats response that failed to parse:', responseText);
          // Hata durumunda default değerler set et
          setStats({
            totalProducts: 0,
            inStock: 0,
            lowStock: 0,
            outOfStock: 0
          });
        }
      } else {
        console.error('❌ Stats API returned non-OK status:', response.status);
        // Hata durumunda default değerler set et
        setStats({
          totalProducts: 0,
          inStock: 0,
          lowStock: 0,
          outOfStock: 0
        });
      }
    } catch (err) {
      console.error('❌ Stats fetch error:', err);
      // Hata durumunda default değerler set et
      setStats({
        totalProducts: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0
      });
    }
  };

  const handleDeleteStock = async (stockId) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/stock/${stockId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchStocks();
        fetchStats();
      } else {
        throw new Error('Ürün silinemedi');
      }
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return 'text-green-600';
      case 'low_stock': return 'text-yellow-600';
      case 'out_of_stock': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_stock': return <CheckCircle className="w-4 h-4" />;
      case 'low_stock': return <AlertTriangle className="w-4 h-4" />;
      case 'out_of_stock': return <AlertTriangle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ margin: 0, padding: 0 }}>
      {/* Header */}
      <div className="mb-4 px-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Stok İdarəetməsi
            </h1>
            <p className="text-gray-600 mt-1">Mağaza stoklarınızı görüntüləyin və idarə edin</p>
          </div>
        </div>

        {/* Stats Cards */}
        <StockStats stats={stats} />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-4 mx-16">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Məhsul adı, marka, kateqoriya, mağaza axtar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
            >
              <option value="all">Bütün Vəziyyətlər</option>
              <option value="in_stock">Stokda Var</option>
              <option value="low_stock">Az Stok</option>
              <option value="out_of_stock">Stokda Yoxdur</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 mx-16">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {/* Stock List */}
      <StockList 
        stocks={stocks} 
        onDelete={handleDeleteStock}
        onRefresh={fetchStocks}
      />
    </div>
  );
};

export default Stock;