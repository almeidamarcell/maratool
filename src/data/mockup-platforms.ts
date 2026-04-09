export interface ChatPlatformConfig {
  id: string
  name: string
  colors: {
    bg: string
    bgDark: string
    headerBg: string
    headerBgDark: string
    outgoing: string
    outgoingDark: string
    incoming: string
    incomingDark: string
    accent: string
    text: string
    textDark: string
    timestamp: string
  }
  layout: {
    bubbleRadius: string
    bubbleMaxWidth: string
    avatarShape: string
    showReadReceipts: boolean
    timestampPosition: string
  }
  font: {
    family: string
    messageSize: string
    timestampSize: string
  }
  statusBarStyle: string
  defaultPeople: Array<{ id: number; name: string; color: string }>
  defaultMessages: Array<{
    id: number
    text: string
    sender: number
    outgoing: boolean
    time: string
  }>
  downloadFilename?: string
}

export const whatsapp: ChatPlatformConfig = {
  id: 'whatsapp',
  name: 'WhatsApp',
  colors: {
    bg: '#e5ddd5',
    bgDark: '#0b141a',
    headerBg: '#075e54',
    headerBgDark: '#1f2c34',
    outgoing: '#d9fdd3',
    outgoingDark: '#005c4b',
    incoming: '#ffffff',
    incomingDark: '#1f2c34',
    accent: '#128c7e',
    text: '#111b21',
    textDark: '#e9edef',
    timestamp: '#667781',
  },
  layout: {
    bubbleRadius: '8px',
    bubbleMaxWidth: '75%',
    avatarShape: 'circle',
    showReadReceipts: true,
    timestampPosition: 'inline-end',
  },
  font: {
    family: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
    messageSize: '14.2px',
    timestampSize: '11px',
  },
  statusBarStyle: 'light',
  defaultPeople: [
    { id: 1, name: 'Sarah', color: '#128c7e' },
    { id: 2, name: 'You', color: '#25d366' },
  ],
  defaultMessages: [
    { id: 1, text: 'Hey! Did you see the new design mockups?', sender: 1, outgoing: false, time: '14:15' },
    { id: 2, text: 'Yes! They look amazing. The new color scheme is perfect.', sender: 2, outgoing: true, time: '14:16' },
    { id: 3, text: 'Right?? The team really nailed it this time', sender: 1, outgoing: false, time: '14:16' },
    { id: 4, text: 'I especially love the dark mode version. Very clean.', sender: 2, outgoing: true, time: '14:17' },
    { id: 5, text: 'Want to hop on a call to discuss the implementation?', sender: 1, outgoing: false, time: '14:18' },
    { id: 6, text: 'Sure, give me 10 minutes. Just finishing up something.', sender: 2, outgoing: true, time: '14:18' },
    { id: 7, text: 'No rush! Take your time', sender: 1, outgoing: false, time: '14:19' },
  ],
}

export const imessage: ChatPlatformConfig = {
  id: 'imessage',
  name: 'iMessage',
  colors: {
    bg: '#FFFFFF',
    bgDark: '#000000',
    headerBg: '#F6F6F6',
    headerBgDark: '#1C1C1E',
    outgoing: '#007AFF',
    outgoingDark: '#0A84FF',
    incoming: '#E5E5EA',
    incomingDark: '#26252A',
    accent: '#007AFF',
    text: '#000000',
    textDark: '#FFFFFF',
    timestamp: '#8E8E93',
  },
  layout: {
    bubbleRadius: '18px',
    bubbleMaxWidth: '75%',
    avatarShape: 'circle',
    showReadReceipts: false,
    timestampPosition: 'below',
  },
  font: {
    family: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
    messageSize: '16px',
    timestampSize: '11px',
  },
  statusBarStyle: 'dark',
  defaultPeople: [
    { id: 1, name: 'Alex', color: '#007AFF' },
    { id: 2, name: 'You', color: '#34C759' },
  ],
  defaultMessages: [
    { id: 1, text: 'Hey, are we still on for tonight?', sender: 1, outgoing: false, time: '18:32' },
    { id: 2, text: 'Yes! What time works for you?', sender: 2, outgoing: true, time: '18:33' },
    { id: 3, text: 'How about 7:30? That new place downtown', sender: 1, outgoing: false, time: '18:33' },
    { id: 4, text: 'Perfect, I know exactly which one you mean', sender: 2, outgoing: true, time: '18:34' },
    { id: 5, text: 'Should I invite Maya too?', sender: 1, outgoing: false, time: '18:35' },
    { id: 6, text: 'Definitely! The more the merrier', sender: 2, outgoing: true, time: '18:35' },
    { id: 7, text: 'Done. See you there!', sender: 1, outgoing: false, time: '18:36' },
  ],
  downloadFilename: 'imessage-mockup.png',
}

export const instagramDm: ChatPlatformConfig = {
  id: 'instagram-dm',
  name: 'Instagram',
  colors: {
    bg: '#FFFFFF',
    bgDark: '#000000',
    headerBg: '#FFFFFF',
    headerBgDark: '#121212',
    outgoing: '#3797F0',
    outgoingDark: '#3797F0',
    incoming: '#EFEFEF',
    incomingDark: '#262626',
    accent: '#E1306C',
    text: '#262626',
    textDark: '#F5F5F5',
    timestamp: '#8E8E93',
  },
  layout: {
    bubbleRadius: '22px',
    bubbleMaxWidth: '75%',
    avatarShape: 'circle',
    showReadReceipts: false,
    timestampPosition: 'below',
  },
  font: {
    family: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
    messageSize: '15px',
    timestampSize: '11px',
  },
  statusBarStyle: 'dark',
  defaultPeople: [
    { id: 1, name: 'Jordan', color: '#E1306C' },
    { id: 2, name: 'You', color: '#3797F0' },
  ],
  defaultMessages: [
    { id: 1, text: 'Loved your latest post!', sender: 1, outgoing: false, time: '20:15' },
    { id: 2, text: 'Thanks! Took that photo in Lisbon', sender: 2, outgoing: true, time: '20:16' },
    { id: 3, text: 'No way, I was just there last month', sender: 1, outgoing: false, time: '20:16' },
    { id: 4, text: 'We should totally go together next time', sender: 2, outgoing: true, time: '20:17' },
    { id: 5, text: 'Absolutely! DM me when you plan your next trip', sender: 1, outgoing: false, time: '20:18' },
    { id: 6, text: 'Deal. Following you now so I don\'t forget', sender: 2, outgoing: true, time: '20:18' },
  ],
  downloadFilename: 'instagram-dm-mockup.png',
}

export interface AiChatPlatformConfig {
  id: string
  name: string
  downloadFilename: string
  defaultModel: string
  colors: {
    bg: string
    bgDark: string
    userMsgBg: string
    userMsgBgDark: string
    text: string
    textDark: string
    accent: string
    inputBg: string
    inputBgDark: string
    border: string
  }
  defaultMessages: Array<{
    id: number
    role: 'user' | 'assistant'
    text: string
  }>
}

export const chatgpt: AiChatPlatformConfig = {
  id: 'chatgpt',
  name: 'ChatGPT',
  downloadFilename: 'chatgpt-mockup.png',
  defaultModel: 'ChatGPT 4o',
  colors: {
    bg: '#FFFFFF',
    bgDark: '#212121',
    userMsgBg: '#F7F7F8',
    userMsgBgDark: '#2F2F2F',
    text: '#0D0D0D',
    textDark: '#ECECEC',
    accent: '#10A37F',
    inputBg: '#F4F4F4',
    inputBgDark: '#2F2F2F',
    border: '#ECECEC',
  },
  defaultMessages: [
    { id: 1, role: 'user', text: 'Can you explain how JavaScript closures work?' },
    { id: 2, role: 'assistant', text: 'A closure is a function that remembers the variables from the place where it was defined, regardless of where it is executed later.\n\nWhen you create a function inside another function, the inner function has access to:\n\n1. Its own variables\n2. The outer function\'s variables\n3. Global variables\n\nThe key insight is that even after the outer function has returned, the inner function still has access to those outer variables. The variables aren\'t destroyed \u2014 they\'re "closed over" by the inner function.' },
    { id: 3, role: 'user', text: 'Can you show me a simple example?' },
    { id: 4, role: 'assistant', text: 'Here\'s a classic example:\n\nfunction createCounter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\nconsole.log(counter()); // 3\n\nThe inner function closes over the count variable. Each call to counter() increments and returns the same count \u2014 even though createCounter() has already finished executing.' },
  ],
}

export interface DiscordPlatformConfig {
  id: string
  name: string
  channelName: string
  channelTopic: string
  downloadFilename: string
  defaultPeople: Array<{ id: number; name: string; color: string; avatar: string }>
  defaultMessages: Array<{
    id: number
    text: string
    sender: number
    time: string
  }>
}

export const discord: DiscordPlatformConfig = {
  id: 'discord',
  name: 'Discord',
  channelName: 'dev-general',
  channelTopic: 'General development discussion',
  downloadFilename: 'discord-chat-mockup.png',
  defaultPeople: [
    { id: 1, name: 'noctis_dev', color: '#5865F2', avatar: '' },
    { id: 2, name: 'luna_writes', color: '#57F287', avatar: '' },
    { id: 3, name: 'kael_ops', color: '#FEE75C', avatar: '' },
  ],
  defaultMessages: [
    { id: 1, text: 'just pushed the auth refactor to main', sender: 1, time: 'Today at 3:42 PM' },
    { id: 2, text: 'nice, I\'ll pull and run the tests', sender: 2, time: 'Today at 3:43 PM' },
    { id: 3, text: 'heads up — the env vars changed, check the README', sender: 1, time: 'Today at 3:43 PM' },
    { id: 4, text: 'got it, updating my .env now', sender: 2, time: 'Today at 3:44 PM' },
    { id: 5, text: 'are we still doing the deploy at 5?', sender: 3, time: 'Today at 3:45 PM' },
    { id: 6, text: 'yeah, I\'ll handle the migration script first', sender: 1, time: 'Today at 3:45 PM' },
  ],
}

export interface PostPlatformConfig {
  id: string
  name: string
  downloadFilename: string
  defaultAuthor: {
    name: string
    displayName: string
    verified: boolean
    avatar: string
  }
  defaultContent: string
  defaultMetrics: {
    likes: number
    comments: number
    shares: number
    bookmarks: number
  }
  defaultTimestamp: string
}

export const instagramPost: PostPlatformConfig = {
  id: 'instagram-post',
  name: 'Instagram',
  downloadFilename: 'instagram-post-mockup.png',
  defaultAuthor: {
    name: 'designstudio',
    displayName: 'Design Studio',
    verified: false,
    avatar: '',
  },
  defaultContent: 'Excited to share our latest product launch. Months of work, finally out in the world. Link in bio.',
  defaultMetrics: {
    likes: 1243,
    comments: 48,
    shares: 12,
    bookmarks: 89,
  },
  defaultTimestamp: '2h',
}

export const xPost: PostPlatformConfig = {
  id: 'x-post',
  name: 'X (Twitter)',
  downloadFilename: 'x-post-mockup.png',
  defaultAuthor: {
    name: 'techbuilder',
    displayName: 'Tech Builder',
    verified: true,
    avatar: '',
  },
  defaultContent: 'Just shipped the feature we\'ve been working on for 3 months. 10x faster search, real-time sync, and a completely redesigned dashboard.\n\nThe best part? It\'s free for all existing users.',
  defaultMetrics: {
    likes: 2400,
    comments: 186,
    shares: 342,
    bookmarks: 891,
  },
  defaultTimestamp: '10:30 AM · Apr 9, 2026',
}

export interface EmailPlatformConfig {
  id: string
  name: string
  downloadFilename: string
  defaultFrom: { name: string; email: string; avatar: string; color: string }
  defaultTo: string
  defaultSubject: string
  defaultBody: string
  defaultDate: string
  defaultLabels: string[]
}

export const gmail: EmailPlatformConfig = {
  id: 'gmail',
  name: 'Gmail',
  downloadFilename: 'gmail-mockup.png',
  defaultFrom: { name: 'Sarah Chen', email: 'sarah.chen@company.com', avatar: '', color: '#4285F4' },
  defaultTo: 'me',
  defaultSubject: 'Q2 Planning Meeting Notes',
  defaultBody: 'Hi team,\n\nHere are the key takeaways from our Q2 planning session:\n\n1. Product launch timeline moved to June 15\n2. Design review scheduled for next Thursday\n3. Engineering sprints will be 2 weeks instead of 3\n\nPlease review the attached doc and add any comments by Friday.\n\nBest,\nSarah',
  defaultDate: 'Apr 9, 2026, 10:23 AM',
  defaultLabels: ['Inbox'],
}

export const platforms: Record<string, ChatPlatformConfig> = {
  whatsapp,
  imessage,
  instagramDm,
}
