import React from 'react';
import {
  Smartphone,
  Share2,
  Globe,
  Send,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Store,
} from 'lucide-react';

interface PlatformIconProps {
  platform: string;
  size?: number;
  showLabel?: boolean;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  size = 16,
  showLabel = false,
}) => {
  const norm = (platform || '').toLowerCase().replace(/[\s-_]/g, '');

  let icon = <Globe size={size} />;
  let label = platform;
  let color = '#38bdf8';

  if (norm.includes('twitter') || norm === 'x') {
    icon = <Twitter size={size} />;
    label = 'Twitter / X';
    color = '#1d9bf0';
  } else if (norm.includes('instagram')) {
    icon = <Instagram size={size} />;
    label = 'Instagram';
    color = '#e1306c';
  } else if (norm.includes('facebook')) {
    icon = <Facebook size={size} />;
    label = 'Facebook';
    color = '#1877f2';
  } else if (norm.includes('telegram')) {
    icon = <Send size={size} />;
    label = 'Telegram';
    color = '#229ed9';
  } else if (norm.includes('youtube')) {
    icon = <Youtube size={size} />;
    label = 'YouTube';
    color = '#ff0000';
  } else if (norm.includes('linkedin')) {
    icon = <Linkedin size={size} />;
    label = 'LinkedIn';
    color = '#0a66c2';
  } else if (norm.includes('google') || norm.includes('play')) {
    icon = <Store size={size} />;
    label = 'Google Play';
    color = '#00e676';
  } else if (norm.includes('apple') || norm.includes('ios')) {
    icon = <Smartphone size={size} />;
    label = 'Apple App Store';
    color = '#a2aaad';
  } else if (norm.includes('apk')) {
    icon = <Smartphone size={size} />;
    label = 'Third-Party APK';
    color = '#f59e0b';
  } else {
    icon = <Share2 size={size} />;
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color }}>
      {icon}
      {showLabel && <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{label}</span>}
    </span>
  );
};
