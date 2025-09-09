'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiMail, 
  FiUsers, 
  FiSettings, 
  FiShield, 
  FiTrash2, 
  FiEdit3,
  FiCamera,
  FiSave,
  FiX,
  FiCheck,
  FiStar,
  FiCalendar,
  FiActivity,
  FiHeart
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || 'Max',
    lastName: user?.lastName || 'Mustermann',
    username: user?.username || 'max_koch',
    email: user?.email || 'max@beispiel.com',
    bio: 'Leidenschaftlicher Hobbykoch und KI-Enthusiast 👨‍🍳',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [dietaryPreferences, setDietaryPreferences] = useState(['Vegetarisch', 'Glutenfrei']);
  const [cookingSkill, setCookingSkill] = useState('Mittel');
  const [aiProvider, setAiProvider] = useState('OpenAI GPT-4o');

  // Mock user statistics
  const userStats = {
    recipesGenerated: 47,
    favoriteRecipes: 23,
    totalCookingTime: '124 Stunden',
    memberSince: 'März 2024',
    currentStreak: 12
  };

  const handleProfileSave = () => {
    // TODO: Implement API call to update profile
    setIsEditingProfile(false);
    toast.success('Profil erfolgreich aktualisiert! 🎉');
  };

  const handlePasswordSave = () => {
    // TODO: Implement API call to change password
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsEditingPassword(false);
    toast.success('Passwort erfolgreich geändert! 🔐');
  };

  const handleDeleteAccount = () => {
    // TODO: Implement API call to delete account
    toast.success('Account wird gelöscht...');
    setIsDeleteModalOpen(false);
    // Redirect to logout
    logout();
  };

  const handlePreferenceToggle = (preference: string) => {
    setDietaryPreferences(prev =>
      prev.includes(preference)
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="container py-16 lg:py-20">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 rounded-full text-sm font-semibold mb-6"
              variants={itemVariants}
            >
              👤 Mein Profil
            </motion.div>
            
            <motion.div
              className="flex flex-col items-center mb-6"
              variants={itemVariants}
            >
              {/* Profile Avatar */}
              <div className="relative mb-4">
                <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl lg:text-5xl font-bold text-white border-4 border-white/30">
                  {profileData.firstName[0]}{profileData.lastName[0]}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white text-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  <FiCamera size={16} />
                </button>
              </div>
              
              <motion.h1 
                className="text-4xl lg:text-5xl font-bold mb-2 leading-tight"
                variants={itemVariants}
              >
                {profileData.firstName} {profileData.lastName}
              </motion.h1>
              
              <motion.p 
                className="text-xl text-primary-light leading-relaxed"
                variants={itemVariants}
              >
                @{profileData.username}
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container py-16 lg:py-20">
        <motion.div 
          className="max-w-4xl mx-auto space-y-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Profile Information */}
          <motion.div 
            className="card p-8 shadow-lg border border-outline/20"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                  <FiUser />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Profil-Informationen</h2>
                  <p className="text-on-surface-variant">Verwalte deine persönlichen Daten</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="btn btn-outline px-4 py-2"
              >
                {isEditingProfile ? <FiX className="mr-2" /> : <FiEdit3 className="mr-2" />}
                {isEditingProfile ? 'Abbrechen' : 'Bearbeiten'}
              </button>
            </div>

            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Vorname</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Nachname</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Benutzername</label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">E-Mail</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface transition-all"
                  />
                </div>
                <button
                  onClick={handleProfileSave}
                  className="btn btn-primary px-6 py-3 shadow-lg hover:shadow-xl transition-all"
                >
                  <FiSave className="mr-2" />
                  Änderungen speichern
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-on-surface-variant">Name</label>
                      <p className="text-lg font-semibold">{profileData.firstName} {profileData.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-on-surface-variant">Benutzername</label>
                      <p className="text-lg font-semibold">@{profileData.username}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-on-surface-variant">E-Mail</label>
                      <p className="text-lg font-semibold">{profileData.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-on-surface-variant">Status</label>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-success rounded-full"></span>
                        <span className="text-success font-semibold">Verifiziert</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-2">Bio</label>
                  <p className="text-on-surface leading-relaxed">{profileData.bio}</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* User Statistics */}
          <motion.div 
            className="card p-8 shadow-lg border border-outline/20"
            variants={itemVariants}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                <FiActivity />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Meine Statistiken</h2>
                <p className="text-on-surface-variant">Deine Aktivität auf einen Blick</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { label: 'Rezepte generiert', value: userStats.recipesGenerated, icon: '🍳', color: 'from-primary to-primary-dark' },
                { label: 'Favoriten', value: userStats.favoriteRecipes, icon: '❤️', color: 'from-error to-red-600' },
                { label: 'Koch-Streak', value: `${userStats.currentStreak} Tage`, icon: '🔥', color: 'from-warning to-orange-500' },
                { label: 'Kochzeit', value: userStats.totalCookingTime, icon: '⏱️', color: 'from-info to-blue-600' },
                { label: 'Mitglied seit', value: userStats.memberSince, icon: '📅', color: 'from-success to-emerald-600' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3 shadow-lg`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-bold text-on-surface">{stat.value}</p>
                  <p className="text-sm text-on-surface-variant">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Cooking Preferences */}
          <motion.div 
            className="card p-8 shadow-lg border border-outline/20"
            variants={itemVariants}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                🥗
              </div>
              <div>
                <h2 className="text-2xl font-bold">Koch-Präferenzen</h2>
                <p className="text-on-surface-variant">Personalisiere deine Rezepte</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Dietary Preferences */}
              <div>
                <h3 className="font-semibold mb-3">Ernährungsvorlieben</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Vegetarisch', 'Vegan', 'Glutenfrei', 'Laktosefrei', 'Low Carb', 'Keto', 'Paleo', 'Mediterran'].map(preference => (
                    <button
                      key={preference}
                      onClick={() => handlePreferenceToggle(preference)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all duration-300 hover:scale-105 ${
                        dietaryPreferences.includes(preference)
                          ? 'bg-primary text-white border-primary shadow-lg'
                          : 'bg-surface-variant/30 border-outline/30 hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      {preference}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cooking Skill */}
              <div>
                <h3 className="font-semibold mb-3">Koch-Erfahrung</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'Anfänger', emoji: '👶', desc: 'Erste Schritte' },
                    { value: 'Mittel', emoji: '👨‍🍳', desc: 'Erfahren' },
                    { value: 'Profi', emoji: '🏆', desc: 'Experte' }
                  ].map(level => (
                    <button
                      key={level.value}
                      onClick={() => setCookingSkill(level.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all duration-300 hover:scale-105 ${
                        cookingSkill === level.value
                          ? 'bg-primary text-white border-primary shadow-lg'
                          : 'bg-surface-variant/30 border-outline/30 hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      <div className="text-2xl mb-2">{level.emoji}</div>
                      <div className="font-semibold">{level.value}</div>
                      <div className={`text-xs ${cookingSkill === level.value ? 'text-white/90' : 'text-on-surface-variant'}`}>
                        {level.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Provider */}
              <div>
                <h3 className="font-semibold mb-3">Bevorzugter KI-Provider</h3>
                <div className="space-y-3">
                  {[
                    { name: 'OpenAI GPT-4o', desc: 'Hochwertige und kreative Rezepte', icon: '🧠' },
                    { name: 'DeepSeek', desc: 'Schnelle und effiziente Generierung', icon: '⚡' },
                    { name: 'Grok AI', desc: 'Innovative und überraschende Rezepte', icon: '🚀' }
                  ].map(provider => (
                    <button
                      key={provider.name}
                      onClick={() => setAiProvider(provider.name)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 hover:scale-[1.02] ${
                        aiProvider === provider.name
                          ? 'bg-primary text-white border-primary shadow-lg'
                          : 'bg-surface-variant/30 border-outline/30 hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <div className="font-semibold">{provider.name}</div>
                          <div className={`text-sm ${aiProvider === provider.name ? 'text-white/90' : 'text-on-surface-variant'}`}>
                            {provider.desc}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security Settings */}
          <motion.div 
            className="card p-8 shadow-lg border border-outline/20"
            variants={itemVariants}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                <FiShield />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Sicherheit</h2>
                <p className="text-on-surface-variant">Passwort und Account-Einstellungen</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Change Password */}
              <div className="border-b border-outline/20 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Passwort ändern</h3>
                    <p className="text-sm text-on-surface-variant">Halte dein Passwort sicher und aktuell</p>
                  </div>
                  <button
                    onClick={() => setIsEditingPassword(!isEditingPassword)}
                    className="btn btn-outline px-4 py-2"
                  >
                    {isEditingPassword ? 'Abbrechen' : 'Ändern'}
                  </button>
                </div>

                {isEditingPassword && (
                  <div className="space-y-4">
                    <input
                      type="password"
                      placeholder="Aktuelles Passwort"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Neues Passwort"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Neues Passwort bestätigen"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-outline/30 bg-surface-variant/30 focus:border-primary focus:bg-surface transition-all"
                    />
                    <button
                      onClick={handlePasswordSave}
                      className="btn btn-primary px-6 py-3 shadow-lg hover:shadow-xl transition-all"
                    >
                      <FiSave className="mr-2" />
                      Passwort speichern
                    </button>
                  </div>
                )}
              </div>

              {/* Delete Account */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-error">Account löschen</h3>
                    <p className="text-sm text-on-surface-variant">Diese Aktion kann nicht rückgängig gemacht werden</p>
                  </div>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="btn bg-error text-white hover:bg-error/90 px-4 py-2"
                  >
                    <FiTrash2 className="mr-2" />
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="card p-8 max-w-md mx-4 shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="text-error" size={32} />
              </div>
              <h3 className="text-xl font-bold text-error mb-2">Account löschen?</h3>
              <p className="text-on-surface-variant">
                Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Rezepte und Daten werden permanent gelöscht.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 btn btn-outline py-3"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 btn bg-error text-white hover:bg-error/90 py-3"
              >
                Löschen
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}