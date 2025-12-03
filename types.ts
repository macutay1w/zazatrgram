export enum UserTier {
  BRONZE = 'Bronz', // < 200
  SILVER = 'Gümüş', // 200 - 499
  GOLD = 'Altın', // 500 - 699
  PLATINUM = 'Platin', // 700 - 999
  DIAMOND = 'Elmas', // 1000 - 1499
  VERIFIED = 'Mavi Rozet' // 1500+
}

export interface User {
  id: string;
  username: string;
  name: string; // Real/Display name
  email: string;
  avatar: string;
  points: number;
  postCount: number;
  tier: UserTier;
  joinedAt: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  userTier: UserTier;
  type: 'image' | 'video';
  src: string; // URL or Base64
  description: string;
  tags: string[];
  likes: number;
  comments: number;
  timestamp: number;
  isExternalLink: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  avatar: string;
}

export interface Room {
  id: string;
  name: string;
  viewers: number;
  currentMedia: string | null;
  host: string;
}

export type ViewState = 'feed' | 'search' | 'leaderboard' | 'profile' | 'live' | 'downloads' | 'auth';