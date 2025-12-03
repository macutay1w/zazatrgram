import { User, Post, UserTier, Room } from '../types';

// Constants
const STORAGE_KEY_USERS = 'socialstream_users';
const STORAGE_KEY_POSTS = 'socialstream_posts';
const STORAGE_KEY_CURRENT_USER = 'socialstream_current_user';

// Clean slate for popularity list as requested - Empty array to start fresh
const MOCK_USERS: any[] = []; 

const MOCK_POSTS: Post[] = [
  {
    id: '101', userId: '1', username: 'admin', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', userTier: UserTier.VERIFIED,
    type: 'image', src: 'https://picsum.photos/id/237/800/600', description: 'Hoş geldiniz! İlk paylaşım.', tags: ['merhaba', 'socialstream'],
    likes: 120, comments: 5, timestamp: Date.now() - 100000, isExternalLink: true
  }
];

export const MOCK_ROOMS: Room[] = [
  { id: 'room1', name: 'Bilim Kurgu Gecesi', viewers: 12, currentMedia: 'Interstellar Trailer', host: 'Admin' },
  { id: 'room2', name: 'Komik Videolar', viewers: 45, currentMedia: 'Cat Fails Compilation', host: 'pro_gamer' },
  { id: 'room3', name: 'Müzik Odası', viewers: 8, currentMedia: 'LoFi Radio', host: 'dj_master' },
];

// Helper to determine tier
const calculateTier = (count: number): UserTier => {
  if (count >= 1500) return UserTier.VERIFIED;
  if (count >= 1000) return UserTier.DIAMOND;
  if (count >= 700) return UserTier.PLATINUM;
  if (count >= 500) return UserTier.GOLD;
  if (count >= 200) return UserTier.SILVER;
  return UserTier.BRONZE;
};

// Store Service
export const store = {
  getUsers: (): User[] => {
    const stored = localStorage.getItem(STORAGE_KEY_USERS);
    // Return users without passwords for public consumption
    return stored ? JSON.parse(stored).map((u: any) => {
        const { password, ...user } = u; 
        return user;
    }) : MOCK_USERS;
  },

  // Internal helper to get users with passwords
  _getUsersWithAuth: (): any[] => {
    const stored = localStorage.getItem(STORAGE_KEY_USERS);
    return stored ? JSON.parse(stored) : MOCK_USERS;
  },
  
  saveUser: (user: User) => {
    const users = store._getUsersWithAuth();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      // Preserve password when updating other fields
      // We assume the incoming 'user' object might not have the password, so we keep the old one
      const existingUser = users[index];
      users[index] = { ...existingUser, ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    
    // Update current user session if applicable
    const currentUser = store.getCurrentUser();
    if (currentUser && user.id === currentUser.id) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    }
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  },

  register: (username: string, name: string, password: string): { success: boolean, message: string } => {
    const users = store._getUsersWithAuth();
    
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, message: 'Bu kullanıcı adı zaten alınmış.' };
    }

    const newUser = {
        id: Date.now().toString(),
        username,
        name,
        password, // Storing password simply for this mock. Real apps must hash!
        email: `${username}@socialstream.tr`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        points: 0,
        postCount: 0,
        tier: UserTier.BRONZE,
        joinedAt: Date.now().toString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    return { success: true, message: 'Kayıt başarılı! Lütfen giriş yapın.' };
  },

  login: (username: string, password: string): { success: boolean, user?: User, message: string } => {
    const users = store._getUsersWithAuth();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
        return { success: false, message: 'Kullanıcı bulunamadı.' };
    }

    if (user.password !== password) {
        return { success: false, message: 'Hatalı şifre.' };
    }

    // Remove password before saving to session
    const { password: _, ...safeUser } = user;
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(safeUser));
    return { success: true, user: safeUser, message: 'Giriş başarılı.' };
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  },

  getPosts: (): Post[] => {
    const stored = localStorage.getItem(STORAGE_KEY_POSTS);
    return stored ? JSON.parse(stored) : MOCK_POSTS;
  },

  addPost: (post: Post) => {
    const posts = store.getPosts();
    posts.unshift(post); // Add to top
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));

    // Update User Stats
    const user = store.getCurrentUser();
    if (user) {
      user.postCount += 1;
      user.points += 10; // 10 points per post
      user.tier = calculateTier(user.postCount);
      store.saveUser(user);
    }
  },

  getDownloads: (): Post[] => {
    const stored = localStorage.getItem('socialstream_downloads');
    return stored ? JSON.parse(stored) : [];
  },

  addDownload: (post: Post) => {
    const downloads = store.getDownloads();
    if (!downloads.find(d => d.id === post.id)) {
      downloads.push(post);
      localStorage.setItem('socialstream_downloads', JSON.stringify(downloads));
    }
  },

  search: (query: string): { users: User[], posts: Post[] } => {
    const q = query.toLowerCase();
    const allUsers = store.getUsers();
    const allPosts = store.getPosts();

    return {
      users: allUsers.filter(u => 
        u.username.toLowerCase().includes(q) || 
        (u.name && u.name.toLowerCase().includes(q))
      ),
      posts: allPosts.filter(p => 
        p.description.toLowerCase().includes(q) || 
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    };
  }
};