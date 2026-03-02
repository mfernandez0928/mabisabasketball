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

export interface UpcomingGame {
  id: string;
  date: string;
  location: string;
  mapUrl: string;
  totalSlots: number;
  filledSlots: number;
  entranceFee: string;
  timeRange?: string;
  reservedPlayers: {
    firstName: string;
    lastName: string;
    age: number;
    positions: number[];
  }[];
  pendingReservations?: {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    positions: number[];
    timestamp: string;
  }[];
}

export interface AppData {
  players: PlayerStats[];
  games: GameResult[];
  upcomingGame: UpcomingGame;
  socialMessages: { user: string; msg: string; time: string }[];
  socialPosts: {
    id: string;
    user: string;
    msg: string;
    time: string;
    image?: string;
    url: string;
  }[];
  mvpDescription?: string;
}
