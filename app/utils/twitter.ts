export async function getTwitterProfilePictureUrl(
  profileUrl: string
): Promise<string | null> {
  try {
    const token = process.env.TWITTER_BEARER_TOKEN;
    if (!token) {
      console.warn('TWITTER_BEARER_TOKEN is not set; cannot fetch profile picture.');
      return null;
    }

    const trimmed = profileUrl.trim();
    const handleMatch = trimmed.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)/i);
    const username = handleMatch?.[1];

    if (!username) {
      console.warn('Could not extract Twitter handle from URL:', profileUrl);
      return null;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    // Get user data from username - include user.fields to get profile_image_url
    const userRes = await fetch(`https://api.x.com/2/users/by/username/${username}?user.fields=profile_image_url`, {
      headers,
    });

    if (!userRes.ok) {
      console.error('Failed to resolve Twitter user by username:', username, userRes.status);
      return null;
    }

    const userJson: any = await userRes.json();
    const profileImageUrl = userJson?.data?.profile_image_url;
    
    if (!profileImageUrl) {
      console.warn('No profile image URL found for Twitter username:', username);
      return null;
    }

    // Replace _normal with _400x400 for better quality
    return profileImageUrl.replace('_normal', '_400x400');
  } catch (err) {
    console.error('Error while fetching Twitter profile picture:', err);
    return null;
  }
}

export async function getRecentTweetsFromProfileUrl(
  profileUrl: string,
  maxTweets: number = 120
): Promise<string[]> {
  try {
    const token = process.env.TWITTER_BEARER_TOKEN;
    if (!token) {
      console.warn('TWITTER_BEARER_TOKEN is not set; cannot fetch tweets.');
      return [];
    }

    const trimmed = profileUrl.trim();
    const handleMatch = trimmed.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)/i);
    const username = handleMatch?.[1];

    if (!username) {
      console.warn('Could not extract Twitter handle from URL:', profileUrl);
      return [];
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    // Get user id from username
    const userRes = await fetch(`https://api.x.com/2/users/by/username/${username}`, {
      headers,
    });

    if (!userRes.ok) {
      console.error('Failed to resolve Twitter user by username:', username, userRes.status);
      return [];
    }

    const userJson: any = await userRes.json();
    const userId = userJson?.data?.id;
    if (!userId) {
      console.error('No user id found for Twitter username:', username);
      return [];
    }

    const tweets: string[] = [];
    let paginationToken: string | undefined = undefined;

    while (tweets.length < maxTweets) {
      const remaining = maxTweets - tweets.length;
      const pageSize = Math.min(remaining, 100); // Twitter API v2 max_results cap

      const url = new URL(`https://api.x.com/2/users/${userId}/tweets`);
      url.searchParams.set('max_results', pageSize.toString());
      // Focus on original tweets for style; skip obvious retweets and replies
      url.searchParams.set('exclude', 'retweets,replies');
      // Include tweet fields if needed later (e.g., created_at) – for now we only use text
      if (paginationToken) {
        url.searchParams.set('pagination_token', paginationToken);
      }

      const tweetsRes = await fetch(url.toString(), { headers });

      if (!tweetsRes.ok) {
        console.error('Failed to fetch tweets for user id:', userId, tweetsRes.status);
        break;
      }

      const tweetsJson: any = await tweetsRes.json();
      const pageTweets: string[] =
        tweetsJson?.data?.map((t: any) => t?.text).filter((t: string | undefined) => !!t) || [];

      tweets.push(...pageTweets);

      paginationToken = tweetsJson?.meta?.next_token;
      if (!paginationToken || pageTweets.length === 0) {
        break;
      }
    }

    // Light cleanup: drop extremely short tweets that are likely just links/mentions
    const cleaned = tweets
      .map((t) => t?.toString() || '')
      .map((t) => t.replace(/\s+/g, ' ').trim())
      .filter((t) => t.length > 0 && t.replace(/[@#]/g, '').length > 10);

    return cleaned;
  } catch (err) {
    console.error('Error while fetching recent tweets:', err);
    return [];
  }
}


