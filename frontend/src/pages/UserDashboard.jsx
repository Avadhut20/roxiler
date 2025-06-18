import React, { useState, useMemo } from 'react';
import { Search, User, Lock, LogOut, Star, Edit3, MapPin, Store } from 'lucide-react';
import { useEffect } from 'react';
import axios from 'axios';

const UserDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    if (!user) {
        window.location.href = '/login'; // Redirect to login if no user found
    }


  const [stores, setStores] = useState([]);
  useEffect(() => {
  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/stores', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.data;
      setStores(data);
      console.log('Stores fetched:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  fetchStores();
}, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [editingRating, setEditingRating] = useState(null);
  const [tempRating, setTempRating] = useState(0);

  // Filter stores based on search term
  const filteredStores = useMemo(() => {
    return stores.filter(store =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stores, searchTerm]);

  const handlePasswordUpdate = async (e) => {
  e.preventDefault();

  const { current, new: newPassword, confirm } = passwordForm;

  // Check if new and confirm passwords match
  if (newPassword !== confirm) {
    alert('New passwords do not match!');
    return;
  }

  // Check length and complexity
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/;

  if (!passwordRegex.test(newPassword)) {
    alert(
      'Password must be 8-16 characters long, include at least one uppercase letter and one special character (!@#$%^&*).'
    );
    return;
  }

  try {
    const token = localStorage.getItem('token');
    console.log("Updating password for user:", user.id);
    await axios.put(
      'http://localhost:8000/api/user/password',
      {
        current,
        new: newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert('Password updated successfully!');
    setShowPasswordModal(false);
    setPasswordForm({ current: '', new: '', confirm: '' });
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to update password');
    console.error(error);
  }
};



 const handleRatingSubmit = async (storeId, rating) => {
  const token = localStorage.getItem('token');

  try {
    const response = await axios.post(
      'http://localhost:8000/api/ratings',
      { storeId, rating },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Rating submitted:', response.data);
    const { averageRating, totalRatings, userRating } = response.data.data;

    // 🔁 Update local store list with latest values from backend
    setStores(prevStores =>
      prevStores.map(store =>
        store.id === storeId
          ? {
              ...store,
              overallRating: parseFloat(averageRating),
              totalRatings,
              userRating,
            }
          : store
      )
    );

    setEditingRating(null);
    setTempRating(0);
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to submit rating');
    console.error(error);
  }
};


  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      // Simulate logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      alert('Logged out successfully!');
        window.location.href = '/login'; // Redirect to login page


    }
  };

  const StarRating = ({ rating, onRatingChange, editable = false, size = 'w-5 h-5' }) => {
    const [hoveredStar, setHoveredStar] = useState(0);
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} cursor-pointer transition-colors duration-150 ${
              star <= (hoveredStar || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
            onMouseEnter={() => editable && setHoveredStar(star)}
            onMouseLeave={() => editable && setHoveredStar(0)}
            onClick={() => editable && onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Store className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">User Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
              </div>
              
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                <Lock className="w-4 h-4" />
                <span>Change Password</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stores by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Store Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    {store.name}
                  </h3>
                </div>
                
                <div className="flex items-start space-x-2 mb-4">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600 leading-relaxed">{store.address}</p>
                </div>
                
                <div className="space-y-4">
                  {/* Overall Rating */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Overall Rating</span>
                    <div className="flex items-center space-x-2">
                      <StarRating rating={Math.round(store.overallRating)} />
                      <span className="text-sm text-gray-600">
                        {store.overallRating} ({store.totalRatings})
                      </span>
                    </div>
                  </div>
                  
                  {/* User Rating */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Your Rating</span>
                      {store.userRating && (
                        <button
                          onClick={() => {
                            setEditingRating(store.id);
                            setTempRating(store.userRating);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                    
                    {editingRating === store.id ? (
                      <div className="space-y-3">
                        <StarRating
                          rating={tempRating}
                          onRatingChange={setTempRating}
                          editable
                          size="w-6 h-6"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRatingSubmit(store.id, tempRating)}
                            disabled={tempRating === 0}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors duration-200"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => {
                              setEditingRating(null);
                              setTempRating(0);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        {store.userRating ? (
                          <StarRating rating={store.userRating} />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <StarRating rating={0} />
                            <span className="text-xs text-gray-500">Not rated</span>
                          </div>
                        )}
                        
                        {!store.userRating && (
                          <button
                            onClick={() => {
                              setEditingRating(store.id);
                              setTempRating(1);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
                          >
                            Rate Store
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No stores found matching your search.</p>
          </div>
        )}
      </main>

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200"
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;