import React from 'react'
import { Link } from 'react-router-dom'

const PublicLayout = ({ children }) => {
  return (
    <div className=" bg-gradient-to-br from-blue-50 via-white to-purple-50">
    
      
      <main className="flex-1">
        {children}
      </main>
      
    
    </div>
  )
}

export default PublicLayout