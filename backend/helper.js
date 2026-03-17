export const sessionMessagesByClient = new Map();
// saving user response history
export function getMessagesHistoryByClient(socketId, systemPrompt) {
   const existingHistory = sessionMessagesByClient.get(socketId);
   if(existingHistory) {
      trimHistory(existingHistory);
      return existingHistory;
   }

   const newHistory = [
    {
      role: "assistant",
      content: systemPrompt,
    },
  ];

  sessionMessagesByClient.set(socketId, newHistory);
  return newHistory;
}

function trimHistory(messageHistory, maxLength = 20) {
  if (messageHistory.length <= maxLength) return messageHistory;
  // OpenAI requires: Every {"role": "tool"} message must immediately follow its matching {"role": "assistant", "tool_calls": [...]} with the correct tool_call_id
  // Work BACKWARDS from end, keeping complete tool pairs
  let trimmed = [];
  let i = messageHistory.length;
  
  while (trimmed.length < maxLength && i > 0) {
    const msg = messageHistory[i-1];
    trimmed.unshift(msg);
    
    // If this was 'tool', MUST keep prior 'assistant' with matching tool_calls
    if (msg.role === 'tool') {
      if (i-2 >= 0 && messageHistory[i-2].role === 'assistant' && messageHistory[i-2].tool_calls) {
        trimmed.unshift(messageHistory[i-2]);  // Keep matching pair
        i -= 2;
      } else {
        console.warn('Orphaned tool message dropped');
      }
    } else {
      i--;
    }
  }
  
  return trimmed.slice(0, maxLength);
}

export function validateMessages(messages) {
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'tool') {
      const prev = messages[i-1];
      if (!prev?.role === 'assistant' || !prev.tool_calls || 
          prev.tool_calls[0].id !== messages[i].tool_call_id) {
        console.error('Invalid tool message at index', i, messages[i]);
        // Reset to safe state: system + user only
        return [messages[0], messages[messages.length-1]];
      }
    }
  }
  return messages;
}