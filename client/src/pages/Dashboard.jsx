import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { User, Mail, Calendar, Settings } from 'lucide-react'

const Dashboard = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Xoş gəlmisiniz, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-gray-600 mt-2">
            İdarə panelinizdə son fəaliyyətlərinizi görə bilərsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                İstifadəçi Məlumatları
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.username}</div>
              <p className="text-xs text-muted-foreground">
                İstifadəçi adınız
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                E-poçt Ünvanı
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sm">{user?.email}</div>
              <p className="text-xs text-muted-foreground">
                Qeydiyyat e-poçtunuz
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Son Giriş
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sm">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('az-AZ') : 'İlk giriş'}
              </div>
              <p className="text-xs text-muted-foreground">
                Son fəaliyyət tarixi
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil Məlumatları</CardTitle>
              <CardDescription>
                Hesab məlumatlarınızı buradan idarə edə bilərsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Ad</label>
                  <p className="text-gray-900">{user?.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Soyad</label>
                  <p className="text-gray-900">{user?.lastName}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">İstifadəçi adı</label>
                <p className="text-gray-900">{user?.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">E-poçt</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Profili Redaktə Et
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tez Əməliyyatlar</CardTitle>
              <CardDescription>
                Tez-tez istifadə etdiyiniz əməliyyatlar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <User className="w-4 h-4 mr-2" />
                Profil Parametrləri
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Sistem Parametrləri
              </Button>
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleLogout}
              >
                Çıxış Et
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard