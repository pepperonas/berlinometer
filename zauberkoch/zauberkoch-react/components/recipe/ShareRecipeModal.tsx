'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShare2, FiCopy, FiMail, FiMessageCircle, FiX, FiCheck, FiLink, FiEye, FiUsers, FiTrendingUp } from 'react-icons/fi';
import { FaWhatsapp, FaFacebook, FaTwitter, FaPinterest, FaTelegram } from 'react-icons/fa';
import toast from 'react-hot-toast';
import type { Recipe } from '@/types';

interface ShareRecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ShareData {
  shareCode: string;
  shareUrl: string;
  viewCount: number;
  created: Date;
}

const socialPlatforms = [
  {
    name: 'WhatsApp',
    icon: FaWhatsapp,
    color: 'bg-green-500',
    getUrl: (url: string, title: string) => 
      `https://wa.me/?text=${encodeURIComponent(`🍳 ${title}\n\nSchau dir dieses leckere Rezept an: ${url}`)}`
  },
  {
    name: 'Facebook',
    icon: FaFacebook,
    color: 'bg-blue-600',
    getUrl: (url: string, title: string) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(`🍳 ${title}`)}`
  },
  {
    name: 'Twitter',
    icon: FaTwitter,
    color: 'bg-blue-400',
    getUrl: (url: string, title: string) => 
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`🍳 ${title}`)}&hashtags=ZauberKoch,Rezept,Kochen`
  },
  {
    name: 'Pinterest',
    icon: FaPinterest,
    color: 'bg-red-600',
    getUrl: (url: string, title: string, description: string) => 
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(`🍳 ${title} - ${description}`)}`
  },
  {
    name: 'Telegram',
    icon: FaTelegram,
    color: 'bg-blue-500',
    getUrl: (url: string, title: string) => 
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`🍳 ${title}`)}`
  }
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.75,
    y: 50
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      duration: 0.5,
      bounce: 0.3
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.75,
    y: 50,
    transition: { duration: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

export function ShareRecipeModal({ recipe, isOpen, onClose }: ShareRecipeModalProps) {
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  useEffect(() => {
    if (isOpen && recipe) {
      generateShareLink();
    }
  }, [isOpen, recipe]);

  const generateShareLink = async () => {
    if (!recipe) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/recipes/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ recipeId: recipe.id }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen des Share-Links');
      }

      const data = await response.json();
      setShareData({
        shareCode: data.shareCode,
        shareUrl: `${window.location.origin}/shared/${data.shareCode}`,
        viewCount: data.viewCount || 0,
        created: new Date(data.created)
      });
    } catch (error: any) {
      console.error('Error generating share link:', error);
      toast.error(error.message || 'Fehler beim Erstellen des Share-Links');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'url' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
        toast.success('Link kopiert! 📋');
      } else {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2000);
        toast.success('Embed-Code kopiert! 📋');
      }
    } catch (err) {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const openSocialShare = (platform: typeof socialPlatforms[0]) => {
    if (!shareData || !recipe) return;
    
    const url = platform.getUrl(shareData.shareUrl, recipe.title, recipe.description || '');
    window.open(url, '_blank', 'width=600,height=400');
  };

  const sendEmail = () => {
    if (!shareData || !recipe) return;
    
    const subject = encodeURIComponent(`🍳 ${recipe.title} - Ein leckeres Rezept für dich!`);
    const body = encodeURIComponent(
      `Hallo!\n\nIch habe ein tolles Rezept gefunden, das ich gerne mit dir teilen möchte:\n\n${recipe.title}\n${recipe.description || ''}\n\nSchau es dir hier an: ${shareData.shareUrl}\n\nViel Spaß beim Kochen!\n\nGeneriert mit ZauberKoch`
    );
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const getEmbedCode = () => {
    if (!shareData) return '';
    
    return `<iframe src="${shareData.shareUrl}/embed" width="400" height="600" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`;
  };

  if (!isOpen || !recipe) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      >
        <motion.div
          className="bg-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <FiShare2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Rezept teilen</h2>
                  <p className="text-primary-light">Teile "{recipe.title}" mit anderen</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-on-surface-variant">Erstelle Share-Link...</p>
              </div>
            ) : shareData ? (
              <>
                {/* Share Statistics */}
                <motion.div 
                  className="grid grid-cols-3 gap-4"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="text-center p-4 bg-surface-variant/30 rounded-xl">
                    <FiEye className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="font-bold text-lg">{shareData.viewCount}</div>
                    <div className="text-sm text-on-surface-variant">Aufrufe</div>
                  </div>
                  <div className="text-center p-4 bg-surface-variant/30 rounded-xl">
                    <FiUsers className="w-6 h-6 text-success mx-auto mb-2" />
                    <div className="font-bold text-lg">∞</div>
                    <div className="text-sm text-on-surface-variant">Öffentlich</div>
                  </div>
                  <div className="text-center p-4 bg-surface-variant/30 rounded-xl">
                    <FiTrendingUp className="w-6 h-6 text-info mx-auto mb-2" />
                    <div className="font-bold text-lg">24/7</div>
                    <div className="text-sm text-on-surface-variant">Verfügbar</div>
                  </div>
                </motion.div>

                {/* Share URL */}
                <motion.div 
                  className="space-y-3"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-semibold text-on-surface">
                    <FiLink className="inline mr-2" />
                    Direkter Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareData.shareUrl}
                      readOnly
                      className="flex-1 px-4 py-3 bg-surface-variant/50 border border-outline/30 rounded-xl text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(shareData.shareUrl, 'url')}
                      className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                      {copiedUrl ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                      {copiedUrl ? 'Kopiert!' : 'Kopieren'}
                    </button>
                  </div>
                </motion.div>

                {/* Social Media Sharing */}
                <motion.div 
                  className="space-y-3"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-sm font-semibold text-on-surface">
                    <FiShare2 className="inline mr-2" />
                    Auf Social Media teilen
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    {socialPlatforms.map((platform) => (
                      <button
                        key={platform.name}
                        onClick={() => openSocialShare(platform)}
                        className={`${platform.color} text-white p-3 rounded-xl hover:opacity-90 transition-opacity flex flex-col items-center gap-2`}
                        title={`Auf ${platform.name} teilen`}
                      >
                        <platform.icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{platform.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Email Sharing */}
                <motion.div 
                  className="space-y-3"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-sm font-semibold text-on-surface">
                    <FiMail className="inline mr-2" />
                    Per E-Mail teilen
                  </h3>
                  <button
                    onClick={sendEmail}
                    className="w-full p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20 rounded-xl hover:bg-secondary/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center">
                        <FiMail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium">E-Mail mit Rezept senden</div>
                        <div className="text-sm text-on-surface-variant">Öffnet deinen Standard-E-Mail-Client</div>
                      </div>
                    </div>
                  </button>
                </motion.div>

                {/* Embed Code */}
                <motion.div 
                  className="space-y-3"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-sm font-semibold text-on-surface">
                    <FiMessageCircle className="inline mr-2" />
                    Embed-Code für Websites
                  </h3>
                  <div className="flex items-start gap-2">
                    <textarea
                      value={getEmbedCode()}
                      readOnly
                      className="flex-1 px-4 py-3 bg-surface-variant/50 border border-outline/30 rounded-xl text-sm font-mono resize-none"
                      rows={3}
                    />
                    <button
                      onClick={() => copyToClipboard(getEmbedCode(), 'embed')}
                      className="px-4 py-3 bg-secondary text-white rounded-xl hover:bg-secondary-dark transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      {copiedEmbed ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                      {copiedEmbed ? 'Kopiert!' : 'Kopieren'}
                    </button>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Füge diesen Code in deine Website ein, um das Rezept als Widget anzuzeigen.
                  </p>
                </motion.div>

                {/* Privacy Notice */}
                <motion.div 
                  className="p-4 bg-info/10 border border-info/20 rounded-xl"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.5 }}
                >
                  <h4 className="font-semibold text-info mb-2 flex items-center gap-2">
                    <FiUsers className="w-4 h-4" />
                    Datenschutz-Hinweis
                  </h4>
                  <p className="text-sm text-info/80">
                    Das geteilte Rezept ist öffentlich zugänglich und kann von jedem mit dem Link eingesehen werden. 
                    Persönliche Informationen werden nicht geteilt. Du kannst den Share-Link jederzeit über deine 
                    Rezept-Einstellungen deaktivieren.
                  </p>
                </motion.div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-error">Fehler beim Erstellen des Share-Links. Bitte versuche es erneut.</p>
                <button
                  onClick={generateShareLink}
                  className="mt-4 btn btn-primary"
                >
                  Erneut versuchen
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ShareRecipeModal;