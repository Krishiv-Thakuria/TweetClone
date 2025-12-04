/**
 * Formats a date to show time in user's local timezone
 * Shows time for today, or date + time for older messages
 */
export function formatMessageTimestamp(date: Date): string {
  const now = new Date();
  const messageDate = new Date(date);
  
  // Check if message is from today
  const isToday =
    messageDate.getDate() === now.getDate() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getFullYear() === now.getFullYear();
  
  // Check if message is from yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    messageDate.getDate() === yesterday.getDate() &&
    messageDate.getMonth() === yesterday.getMonth() &&
    messageDate.getFullYear() === yesterday.getFullYear();
  
  // Check if message is from this year
  const isThisYear = messageDate.getFullYear() === now.getFullYear();
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  
  if (isToday) {
    // Just show time for today's messages
    return new Intl.DateTimeFormat('en-US', timeOptions).format(messageDate);
  } else if (isYesterday) {
    // Show "Yesterday" + time
    return `Yesterday ${new Intl.DateTimeFormat('en-US', timeOptions).format(messageDate)}`;
  } else if (isThisYear) {
    // Show month, day + time
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      ...timeOptions,
    }).format(messageDate);
  } else {
    // Show full date + time for older messages
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...timeOptions,
    }).format(messageDate);
  }
}




