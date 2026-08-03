import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { path: '/', label: '推荐', icon: '🎯' },
  { path: '/merchants', label: '商家', icon: '🏪' },
  { path: '/history', label: '记录', icon: '📋' },
  { path: '/calories', label: '热量', icon: '🔥' },
  { path: '/settings', label: '设置', icon: '⚙️' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部标题 */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-gray-800">🍽️ 饮食规划助手</h1>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-20">
        <Outlet />
      </main>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-lg mx-auto flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
