import Avatar from '@/components/Avatar';

export default function Header() {
  const admin = {
    name: 'Sudip Kumar Prasad',
    avatar: '/sudip_avatar.png', // placeholder avatar placed in public folder
  };

  return (
    <header className="flex items-center justify-between p-4 bg-slate-900 text-white">
      <h1 className="text-xl font-bold">Background Verification Platform</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{admin.name}</span>
        <Avatar src={admin.avatar} size={48} />
      </div>
    </header>
  );
}
