export interface PersonaResponse {
  twitterProfileUrl: string;
  personaStyle: string;
  profilePictureUrl: string | null;
  displayName: string | null;
  error?: string;
}

export async function createPersona(twitterProfileUrl: string): Promise<PersonaResponse> {
  const res = await fetch('/api/persona', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ twitterProfileUrl }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    const error = typeof data?.error === 'string' ? data.error : 'Failed to create persona';
    throw new Error(error);
  }

  return {
    twitterProfileUrl: data.twitterProfileUrl,
    personaStyle: data.personaStyle || '',
    profilePictureUrl: data.profilePictureUrl || null,
    displayName: data.displayName || null,
  };
}

