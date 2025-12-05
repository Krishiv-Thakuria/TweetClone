import { useState, useEffect } from 'react';

export function usePersona() {
  const [twitterProfileUrl, setTwitterProfileUrl] = useState<string>('');
  const [personaStyle, setPersonaStyle] = useState<string>('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const [activeCloneName, setActiveCloneName] = useState<string | null>(null);
  const [loadingImageError, setLoadingImageError] = useState(false);

  useEffect(() => {
    const savedTwitterProfileUrl = localStorage.getItem('chat_twitter_profile_url');
    const savedPersonaStyle = localStorage.getItem('chat_persona_style');
    const savedProfilePictureUrl = localStorage.getItem('chat_profile_picture_url');

    if (savedTwitterProfileUrl) setTwitterProfileUrl(savedTwitterProfileUrl);
    if (savedPersonaStyle) setPersonaStyle(savedPersonaStyle);
    if (savedProfilePictureUrl) setProfilePictureUrl(savedProfilePictureUrl);
  }, []);

  useEffect(() => {
    if (twitterProfileUrl) {
      localStorage.setItem('chat_twitter_profile_url', twitterProfileUrl);
    } else {
      localStorage.removeItem('chat_twitter_profile_url');
    }
  }, [twitterProfileUrl]);

  useEffect(() => {
    if (personaStyle) {
      localStorage.setItem('chat_persona_style', personaStyle);
    } else {
      localStorage.removeItem('chat_persona_style');
    }
  }, [personaStyle]);

  useEffect(() => {
    if (profilePictureUrl) {
      localStorage.setItem('chat_profile_picture_url', profilePictureUrl);
    } else {
      localStorage.removeItem('chat_profile_picture_url');
    }
  }, [profilePictureUrl]);

  return {
    twitterProfileUrl,
    setTwitterProfileUrl,
    personaStyle,
    setPersonaStyle,
    profilePictureUrl,
    setProfilePictureUrl,
    activeCloneName,
    setActiveCloneName,
    loadingImageError,
    setLoadingImageError,
  };
}

