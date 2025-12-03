import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Search, User, Play, Download, Plus, 
  LogOut, Award, Tv, MessageSquare, Heart, Share2, 
  Menu, X, Image as ImageIcon, Film, Loader2, CheckCircle2, BadgeCheck, Users, Search as SearchIcon,
  PictureInPicture, Gauge
} from 'lucide-react';
import { User as UserType, Post, ViewState, UserTier, Room, ChatMessage } from './types';
import { store, MOCK_ROOMS } from './services/mockStore';
import { generateTagsForContent, chatInRoom } from './services/geminiService';

// --- Utility Components ---

const TierBadge = ({ tier }: { tier: UserTier }) => {
  const colors = {
    [UserTier.BRONZE]: 'text-orange-400 border-orange-400 bg-orange-950/30',
    [UserTier.SILVER]: 'text-slate-300 border-slate-300 bg-slate-800/50',
    [UserTier.GOLD]: 'text-yellow-400 border-yellow-400 bg-yellow-950/30',
    [UserTier.PLATINUM]: 'text-cyan-300 border-cyan-300 bg-cyan-950/30',
    [UserTier.DIAMOND]: 'text-purple-400 border-purple-400 bg-purple-950/30',
    [UserTier.VERIFIED]: 'text-blue-400 border-blue-400 bg-blue-950/30',
  };

  return (
    <span className={`px-2 py-0.5 text-[10px] md:text-xs font-medium border rounded-full flex items-center gap-1 whitespace-nowrap ${colors[tier]}`}>
      {tier === UserTier.VERIFIED && <BadgeCheck className="w-3 h-3" />}
      {tier}
    </span>
  );
};

// --- Custom Video Player ---

const VideoPlayer = ({ src, poster }: { src: string, poster?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(false);

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiP error:", error);
    }
  };

  const changeSpeed = () => {
    if (!videoRef.current) return;
    const speeds = [0.5, 1.0, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    videoRef.current.playbackRate = nextSpeed;
    setPlaybackSpeed(nextSpeed);
  };

  return (
    <div 
      className="relative group w-full h-full bg-black flex justify-center items-center"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video 
        ref={videoRef}
        controls 
        src={src} 
        poster={poster}
        className="w-full h-full object-contain max-h-[500px]" 
      />
      
      {/* Custom Overlay Controls */}
      <div className={`absolute top-4 right-4 flex gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={changeSpeed}
          className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold border border-white/20 flex items-center gap-1 transition-all"
          title="Oynatma Hızı"
        >
          <Gauge className="w-3 h-3" />
          {playbackSpeed}x
        </button>
        
        <button 
          onClick={togglePiP}
          className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md p-1.5 rounded-lg border border-white/20 transition-all"
          title="Pencere İçinde Pencere"
        >
          <PictureInPicture className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// --- Views ---

const AuthView = ({ onLogin }: { onLogin: (u: UserType) => void }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form States
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'register') {
      // Registration Logic
      if (!formData.username || !formData.name || !formData.password || !formData.confirmPassword) {
        return alert("Lütfen tüm alanları doldurun.");
      }
      if (formData.password !== formData.confirmPassword) {
        return alert("Şifreler eşleşmiyor.");
      }
      if (formData.password.length < 6) {
        return alert("Şifre en az 6 karakter olmalıdır.");
      }

      const result = store.register(formData.username, formData.name, formData.password);
      if (result.success) {
        alert(result.message);
        setMode('login'); // Redirect to login page
        setFormData({ ...formData, password: '', confirmPassword: '' });
      } else {
        alert(result.message);
      }

    } else {
      // Login Logic
      if (!formData.username || !formData.password) {
        return alert("Kullanıcı adı ve şifre gereklidir.");
      }
      
      const result = store.login(formData.username, formData.password);
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        alert(result.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-950 to-black p-4">
      <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-800 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mb-4">
            <Play className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">SocialStream TR</h1>
          <p className="text-slate-400 mt-2">Paylaş, Etkileşime Gir, Yüksel.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/50 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Giriş Yap
          </button>
          <button 
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'register' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Kullanıcı Adı</label>
            <input 
              name="username"
              type="text" 
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="kullanici_adi"
            />
          </div>

          {mode === 'register' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-slate-300 mb-1">Ad Soyad (Görünecek İsim)</label>
              <input 
                name="name"
                type="text" 
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Şifre</label>
            <input 
              name="password"
              type="password" 
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••"
            />
          </div>

          {mode === 'register' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-slate-300 mb-1">Şifre Tekrar</label>
              <input 
                name="confirmPassword"
                type="password" 
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••"
              />
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 mt-6"
          >
            {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>
      </div>
    </div>
  );
};

const PostCard = ({ post, onDownload, onTagClick }: { post: Post, onDownload: (p: Post) => void, onTagClick: (tag: string) => void }) => {
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 mb-6 shadow-lg">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={post.userAvatar} alt={post.username} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800" />
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {post.username}
              {post.userTier === UserTier.VERIFIED && <BadgeCheck className="w-3 h-3 text-blue-400" />}
            </h3>
            <TierBadge tier={post.userTier} />
          </div>
        </div>
        <span className="text-xs text-slate-500">{new Date(post.timestamp).toLocaleDateString()}</span>
      </div>

      <div className="w-full bg-black flex justify-center items-center min-h-[300px]">
        {post.type === 'video' ? (
          <VideoPlayer src={post.src} poster="https://picsum.photos/800/450" />
        ) : (
          <img src={post.src} alt={post.description} className="w-full h-full object-contain max-h-[500px]" />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-4">
            <button className="text-slate-300 hover:text-red-400 transition-colors flex items-center gap-1">
              <Heart className="w-6 h-6" /> <span className="text-sm">{post.likes}</span>
            </button>
            <button className="text-slate-300 hover:text-indigo-400 transition-colors flex items-center gap-1">
              <MessageSquare className="w-6 h-6" /> <span className="text-sm">{post.comments}</span>
            </button>
            <button className="text-slate-300 hover:text-green-400 transition-colors">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
          <button onClick={() => onDownload(post)} className="text-slate-300 hover:text-indigo-400 transition-colors">
            <Download className="w-6 h-6" />
          </button>
        </div>
        <p className="text-sm text-slate-200 mb-2"><span className="font-bold mr-2">{post.username}</span>{post.description}</p>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag, i) => (
            <button 
              key={i} 
              onClick={() => onTagClick(tag)}
              className="text-xs text-indigo-400 cursor-pointer hover:underline hover:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const UploadModal = ({ isOpen, onClose, currentUser, onUploadComplete }: any) => {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const generateTags = async () => {
    if (!description && !file) return alert("Lütfen önce bir dosya seçin veya açıklama yazın.");
    setLoading(true);
    
    let base64 = undefined;
    if (file && file.type.startsWith('image')) {
      base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const newTags = await generateTagsForContent(description || "yeni içerik", base64);
    setTags(newTags);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if ((!file && !url) || !description) return alert("Lütfen gerekli alanları doldurun.");

    setLoading(true);
    let src = url;
    let type: 'video' | 'image' = 'image';

    if (activeTab === 'file' && file) {
      // Create a blob URL for the session
      src = URL.createObjectURL(file);
      type = file.type.startsWith('video') ? 'video' : 'image';
    } else if (url) {
      // Simple heuristic for link type
      type = url.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image';
    }

    const newPost: Post = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      userTier: currentUser.tier,
      type,
      src,
      description,
      tags,
      likes: 0,
      comments: 0,
      timestamp: Date.now(),
      isExternalLink: activeTab === 'link'
    };

    store.addPost(newPost);
    setLoading(false);
    onUploadComplete();
    setFile(null);
    setUrl('');
    setDescription('');
    setTags([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
          <h2 className="text-xl font-bold">Yeni Gönderi Paylaş</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-2 p-1 bg-slate-800 rounded-lg">
            <button 
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'file' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Dosya Yükle
            </button>
            <button 
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'link' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Bağlantı Paylaş
            </button>
          </div>

          {activeTab === 'file' ? (
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors relative">
               <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,video/*" />
               <div className="flex flex-col items-center gap-2 pointer-events-none">
                 {file ? (
                   <>
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                    <span className="text-sm font-medium text-white">{file.name}</span>
                   </>
                 ) : (
                   <>
                    <div className="flex gap-2">
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                      <Film className="w-8 h-8 text-slate-500" />
                    </div>
                    <span className="text-sm text-slate-400">Video veya Fotoğraf sürükleyin</span>
                   </>
                 )}
               </div>
            </div>
          ) : (
             <input 
              type="url" 
              placeholder="https://..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}

          <div>
            <textarea 
              placeholder="Açıklama yaz..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
            ></textarea>
            <button 
              onClick={generateTags}
              disabled={loading}
              className="mt-2 text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "✨ Yapay Zeka ile Etiketle"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span key={i} className="bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded-md text-xs border border-indigo-800 flex items-center gap-1">
                #{tag}
                <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-white"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
          >
            {loading ? 'Yükleniyor...' : 'Paylaş (+10 Puan)'}
          </button>
        </div>
      </div>
    </div>
  );
};

const LiveRoom = ({ room, currentUser, onLeave }: { room: Room, currentUser: UserType, onLeave: () => void }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new message
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      text: input,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, msg]);
    setInput('');

    // Simulate Bot Response
    const botResponse = await chatInRoom(messages.map(m => `${m.username}: ${m.text}`), input);
    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      userId: 'bot',
      username: 'RoomBot',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=bot',
      text: botResponse,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, botMsg]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col md:flex-row h-[100dvh]">
      <div className="flex-1 bg-black flex flex-col relative">
        <div className="p-4 flex justify-between items-center absolute top-0 w-full bg-gradient-to-b from-black/80 to-transparent z-10">
          <div className="flex flex-col">
            <h2 className="font-bold text-lg text-white">{room.name}</h2>
            <span className="text-xs text-red-500 font-bold flex items-center gap-1">● CANLI</span>
          </div>
          <button onClick={onLeave} className="bg-slate-800/80 text-white px-4 py-2 rounded-full text-xs hover:bg-red-900/80 backdrop-blur-md transition-colors border border-slate-700">
            Odadan Ayrıl
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center bg-slate-900 relative">
           {/* Placeholder for video player - In a real app this would be an iframe or video element syncing via websockets */}
           <div className="text-center p-8 z-0">
             <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl shadow-red-900/50">
               <Play className="w-10 h-10 fill-white text-white ml-1" />
             </div>
             <p className="text-slate-400 mb-2">Şu an oynatılıyor:</p>
             <h3 className="text-2xl font-bold text-white tracking-tight">{room.currentMedia}</h3>
           </div>
        </div>
      </div>
      
      <div className="w-full md:w-96 bg-slate-950 border-l border-slate-800 flex flex-col h-[40vh] md:h-full">
        <div className="p-3 border-b border-slate-800 font-semibold flex justify-between bg-slate-900">
          <span>Sohbet</span>
          <span className="text-xs text-green-400 flex items-center gap-1 bg-green-900/20 px-2 py-1 rounded-full">● {room.viewers} İzleyici</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(m => (
            <div key={m.id} className="flex gap-3 items-start animate-fade-in">
              <img src={m.avatar} className="w-8 h-8 rounded-full border border-slate-700" />
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-400 block mb-0.5">{m.username}</span>
                <p className="text-sm bg-slate-800 p-2.5 rounded-r-xl rounded-bl-xl text-slate-200 inline-block">{m.text}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
          <input 
            className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-500"
            placeholder="Mesaj yaz..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} className="p-2.5 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20">
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-xl transition-all flex md:flex-col items-center gap-3 md:gap-1 w-full md:w-auto ${active ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: `w-6 h-6 ${active ? 'fill-current' : ''}` })}
    <span className="text-xs font-medium md:text-[10px]">{label}</span>
  </button>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(store.getCurrentUser());
  const [currentView, setCurrentView] = useState<ViewState>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState<'content' | 'people'>('content');
  const [searchResults, setSearchResults] = useState<{ users: UserType[], posts: Post[] }>({ users: [], posts: [] });

  useEffect(() => {
    if (currentUser) {
      setPosts(store.getPosts());
    }
  }, [currentUser, currentView]);

  useEffect(() => {
    if (searchQuery) {
      setSearchResults(store.search(searchQuery));
    }
  }, [searchQuery]);

  const handleLogin = (user: UserType) => {
    setCurrentUser(user);
    setCurrentView('feed');
  };

  const handleLogout = () => {
    store.logout();
    setCurrentUser(null);
  };

  const refreshPosts = () => {
    setPosts(store.getPosts());
    // Refresh user data (points update)
    const updatedUser = store.getCurrentUser();
    if (updatedUser) setCurrentUser(updatedUser);
  };

  const handleDownload = (post: Post) => {
    store.addDownload(post);
    alert('İçerik İndirilenler klasörüne eklendi.');
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setCurrentView('search');
    setSearchTab('content');
  };

  if (!currentUser) {
    return <AuthView onLogin={handleLogin} />;
  }

  if (activeRoom) {
    return <LiveRoom room={activeRoom} currentUser={currentUser} onLeave={() => setActiveRoom(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 md:pb-0 md:pl-20">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-900/90 backdrop-blur-md z-40 border-b border-slate-800 p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">SocialStream</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-500/30">{currentUser.points} P</span>
          <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-slate-700" />
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-xl shadow-indigo-900/50 hover:bg-indigo-500 transition-all active:scale-95 border border-indigo-400/50"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Sidebar / Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full md:w-20 md:h-full bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 z-40 flex md:flex-col justify-around md:justify-start md:pt-8 items-center md:gap-6 pb-safe md:pb-0">
        <div className="hidden md:block mb-4">
           <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 cursor-pointer" onClick={() => setCurrentView('feed')}>
             <Play className="w-6 h-6 text-white fill-white" />
           </div>
        </div>
        
        <NavButton active={currentView === 'feed'} onClick={() => setCurrentView('feed')} icon={<Home />} label="Akış" />
        <NavButton active={currentView === 'leaderboard'} onClick={() => setCurrentView('leaderboard')} icon={<Award />} label="Popüler" />
        <NavButton active={currentView === 'search'} onClick={() => setCurrentView('search')} icon={<Search />} label="Ara" />
        <NavButton active={currentView === 'live'} onClick={() => setCurrentView('live')} icon={<Tv />} label="Odalar" />
        <NavButton active={currentView === 'downloads'} onClick={() => setCurrentView('downloads')} icon={<Download />} label="İndir" />
        <NavButton active={currentView === 'profile'} onClick={() => setCurrentView('profile')} icon={<User />} label="Profil" />

        <div className="hidden md:flex flex-col gap-4 mt-auto mb-8 w-full items-center">
           <button onClick={() => setIsUploadOpen(true)} className="p-3 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20"><Plus /></button>
           <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-red-400 transition-colors"><LogOut /></button>
        </div>
      </nav>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        currentUser={currentUser}
        onUploadComplete={refreshPosts}
      />

      {/* Main Content Area */}
      <main className="pt-20 md:pt-8 px-4 max-w-4xl mx-auto min-h-screen">
        
        {currentView === 'feed' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6 hidden md:block">Akış</h2>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onDownload={handleDownload} onTagClick={handleTagClick} />
            ))}
          </div>
        )}

        {currentView === 'search' && (
          <div className="space-y-6">
             <div className="sticky top-16 md:top-0 bg-slate-950 z-30 pb-4 pt-2">
               <div className="relative mb-4">
                  <SearchIcon className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Etiket, video veya kişi ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white shadow-sm"
                    autoFocus
                  />
               </div>
               
               {/* Search Tabs */}
               <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                 <button 
                   onClick={() => setSearchTab('content')}
                   className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${searchTab === 'content' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                 >
                   <Film className="w-4 h-4" /> İçerik & Etiket
                 </button>
                 <button 
                   onClick={() => setSearchTab('people')}
                   className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${searchTab === 'people' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                 >
                   <Users className="w-4 h-4" /> Kişiler
                 </button>
               </div>
             </div>
             
             {searchQuery ? (
               <div className="space-y-8 animate-fade-in">
                  {searchTab === 'people' && (
                    <div>
                      {searchResults.users.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">Kullanıcı bulunamadı.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {searchResults.users.map(u => (
                            <div key={u.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center text-center hover:border-indigo-500 transition-colors cursor-pointer">
                              <img src={u.avatar} className="w-16 h-16 rounded-full mb-3 border-2 border-slate-800" />
                              <span className="font-bold block text-white">{u.username}</span>
                              <div className="mt-2">
                                <TierBadge tier={u.tier} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {searchTab === 'content' && (
                    <div>
                     {searchResults.posts.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">İçerik bulunamadı.</p>
                     ) : (
                        searchResults.posts.map(post => (
                          <PostCard key={post.id} post={post} onDownload={handleDownload} onTagClick={handleTagClick} />
                        ))
                     )}
                    </div>
                  )}
               </div>
             ) : (
               <div className="text-center text-slate-500 py-12">
                 <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                 <p>Aramaya başlamak için yukarıya yazın.</p>
               </div>
             )}
          </div>
        )}

        {currentView === 'leaderboard' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="bg-yellow-500/20 p-2 rounded-lg"><Award className="text-yellow-500 w-6 h-6" /></div>
              En Popüler İnsanlar
            </h2>
            {store.getUsers().length === 0 ? (
               <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center text-slate-500">
                  <Award className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                  <p>Henüz kimse popüler değil. İlk siz olun!</p>
               </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                {store.getUsers().sort((a, b) => b.points - a.points).slice(0, 10).map((user, idx) => (
                  <div key={user.id} className="flex items-center p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors last:border-0">
                    <span className={`w-8 font-bold text-lg ${idx < 3 ? 'text-yellow-400' : 'text-slate-500'}`}>#{idx + 1}</span>
                    <img src={user.avatar} className="w-12 h-12 rounded-full mr-4 border border-slate-700" />
                    <div className="flex-1">
                      <h3 className="font-bold flex items-center gap-2 text-white">
                        {user.username}
                        {user.tier === UserTier.VERIFIED && <BadgeCheck className="w-4 h-4 text-blue-400" />}
                      </h3>
                      <TierBadge tier={user.tier} />
                    </div>
                    <div className="text-right">
                      <span className="block font-mono font-bold text-indigo-400">{user.points} P</span>
                      <span className="text-xs text-slate-500">{user.postCount} Gönderi</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'live' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
               <div className="bg-red-500/20 p-2 rounded-lg"><Tv className="text-red-500 w-6 h-6" /></div>
               Canlı Odalar
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {MOCK_ROOMS.map(room => (
                <div key={room.id} className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-indigo-500 transition-all cursor-pointer group shadow-lg" onClick={() => setActiveRoom(room)}>
                   <div className="flex justify-between items-start mb-4">
                     <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs font-bold animate-pulse flex items-center gap-1">● CANLI</span>
                     <span className="text-slate-400 text-sm flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-full"><User className="w-3 h-3" /> {room.viewers}</span>
                   </div>
                   <h3 className="text-xl font-bold mb-1 group-hover:text-indigo-400 transition-colors text-white">{room.name}</h3>
                   <p className="text-sm text-slate-500 mb-4">Yayınlayan: <span className="text-slate-300">{room.host}</span></p>
                   <div className="bg-black/50 p-3 rounded-lg flex items-center gap-3 border border-slate-800">
                      <Play className="w-5 h-5 text-indigo-400" />
                      <span className="text-sm truncate opacity-80 text-slate-200">{room.currentMedia}</span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'downloads' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
               <div className="bg-green-500/20 p-2 rounded-lg"><Download className="text-green-500 w-6 h-6" /></div>
               İndirilenler
            </h2>
            {store.getDownloads().length === 0 ? (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center text-slate-500">
                <Download className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Henüz bir şey indirmediniz.</p>
              </div>
            ) : (
               <div className="grid gap-4">
                 {store.getDownloads().map(post => (
                   <div key={post.id} className="flex gap-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="w-24 h-24 bg-black rounded-lg overflow-hidden flex-shrink-0">
                        {post.type === 'video' ? (
                          <video src={post.src} className="w-full h-full object-cover" />
                        ) : (
                          <img src={post.src} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white line-clamp-1">{post.description}</p>
                        <p className="text-sm text-slate-500 mb-2">@{post.username}</p>
                        <div className="flex gap-2">
                          <button onClick={() => window.open(post.src, '_blank')} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                            Dosyayı Aç
                          </button>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {currentView === 'profile' && (
           <div className="animate-fade-in">
             <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 mb-8 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-900/50 via-purple-900/50 to-indigo-900/50"></div>
                <img src={currentUser.avatar} className="w-32 h-32 rounded-full border-4 border-slate-900 mx-auto relative z-10 shadow-xl bg-slate-800" />
                <h2 className="text-2xl font-bold mt-4 flex justify-center items-center gap-2 text-white">
                   {currentUser.name || currentUser.username}
                   {currentUser.tier === UserTier.VERIFIED && <BadgeCheck className="w-6 h-6 text-blue-400" />}
                </h2>
                <p className="text-slate-400 text-sm">@{currentUser.username}</p>
                <div className="flex justify-center mt-2 mb-6">
                   <TierBadge tier={currentUser.tier} />
                </div>
                
                <div className="grid grid-cols-3 gap-4 border-t border-slate-800 pt-6">
                   <div className="flex flex-col">
                     <span className="text-2xl font-bold text-white">{currentUser.postCount}</span>
                     <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Gönderi</span>
                   </div>
                   <div className="flex flex-col border-l border-r border-slate-800">
                     <span className="text-2xl font-bold text-indigo-400">{currentUser.points}</span>
                     <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Puan</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-2xl font-bold text-white">{new Date(parseInt(currentUser.joinedAt)).getFullYear()}</span>
                     <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Üyelik</span>
                   </div>
                </div>
             </div>
             
             <h3 className="font-bold text-xl mb-4 text-white">Gönderilerim</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.filter(p => p.userId === currentUser.id).map(post => (
                  <PostCard key={post.id} post={post} onDownload={handleDownload} onTagClick={handleTagClick} />
                ))}
                {posts.filter(p => p.userId === currentUser.id).length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-500">
                    <p>Henüz gönderi paylaşmadınız.</p>
                  </div>
                )}
             </div>
           </div>
        )}

      </main>
    </div>
  );
}