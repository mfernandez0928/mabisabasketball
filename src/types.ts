export type PaymentMethod = 'cash' | 'gcash';

export interface Event {
  id: string;
  date: string;
  location: string;
  totalSlots: number;
  filledSlots: number;
  entranceFee: string;
}

export interface SocialPost {
  id: string;
  authorName: string;
  authorPhotoUrl?: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface PlayerStats {
  id: string;
  name: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  gamesPlayed: number;
  mvps: number;
  wins: number;
  image: string;
}

export interface GamePlayerStats {
  name: string;
  pts: number;
  ast: number;
  reb: number;
  stl: number;
  blk: number;
}

export interface GameResult {
  id: string;
  date: string;
  teamWhite: {
    name?: string;
    score: number;
    players: GamePlayerStats[];
  };
  teamBlue: {
    name?: string;
    score: number;
    players: GamePlayerStats[];
  };
  mvpId: string;
  location: string;
}

export interface Award {
  id: string;
  type: 'Player of the Night' | 'Hustle Player';
  playerName: string;
  photoUrl: string;
  stats: {
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
  };
  caption: string;
  gameDate: string;
}

export interface PendingPayment {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  positions: number[];
  paymentMethod: 'CASH' | 'GCASH';
  screenshotUrl?: string;
  timestamp: string;
}

export interface UpcomingGame {
  id: string;
  date: string;
  location: string;
  mapUrl: string;
  totalSlots: number;
  filledSlots: number;
  entranceFee: string;
  cashPrize?: string;
  timeRange?: string;
  reservedPlayers: { 
    firstName: string; 
    lastName: string; 
    age: number; 
    positions: number[] 
  }[];
  pendingReservations?: { 
    id: string;
    firstName: string; 
    lastName: string; 
    age: number; 
    positions: number[];
    timestamp: string;
  }[];
  pendingPayments?: PendingPayment[];
}

export interface AppData {
  players: PlayerStats[];
  games: GameResult[];
  upcomingGame: UpcomingGame;
  socialMessages: { user: string; msg: string; time: string }[];
  socialPosts: SocialPost[];
  mvpDescription?: string;
  awards?: Award[];
}
