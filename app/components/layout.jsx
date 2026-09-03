'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/registry', icon: '≡', label: 'NDC Registry' },
  { href: '/products', icon: '■', label: 'Products' },
  { href: '/packages', icon: '◫', label: 'Packages' },
  { href: '/audit', icon: '◎', label: 'Audit Trail' },
];

export default function Layout({ children, current }) {
  const [user, setUser] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const allNavItems = [
    ...navItems,
    ...(user?.role === 'Admin' ? [{ href: '/admin', icon: '⚙', label: 'Admin' }] : [])
  ];

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'));
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user?.name })
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.message || 'Failed to logout');
        return;
      }
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout');
    }
  };

  if (!user) return null;

  const sidebarWidth = collapsed ? '72px' : '252px';

  return (
    <div style={s.root}>
      <aside style={{ ...s.sidebar, width: sidebarWidth }}>
        <div style={s.brand}>
          <div style={{ ...s.brandTop, ...(collapsed ? s.brandTopCollapsed : {}) }}>
            {!collapsed && <img src="/sunpharma.png" alt="Sun Pharma" style={s.brandImg} />}
            {collapsed && <div style={s.brandMark}>S</div>}
            <button
              style={s.collapseBtn}
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? '☰' : '‹'}
            </button>
          </div>
          {!collapsed && (
            <>
              <div style={s.brandDivider} />
              <div style={s.brandSub}>NDC Management</div>
            </>
          )}
        </div>

        <nav style={s.nav}>
          {!collapsed && <div style={s.navLabel}>MAIN MENU</div>}
          {allNavItems.map((item) => {
            const isActive = current === item.href || current?.startsWith(item.href + '/');
            const isHovered = hovered === item.href;
            return (
              <div
                key={item.href}
                onClick={() => router.push(item.href)}
                onMouseEnter={() => setHovered(item.href)}
                onMouseLeave={() => setHovered(null)}
                title={collapsed ? item.label : undefined}
                style={{
                  ...s.navItem,
                  ...(collapsed ? s.navItemCollapsed : {}),
                  ...(isActive ? s.navActive : {}),
                  ...(isHovered && !isActive ? s.navHover : {}),
                }}
              >
                <div style={{ ...s.iconBox, ...(isActive ? s.iconBoxActive : {}) }}>
                  {item.icon}
                </div>
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && <div style={s.activeDot} />}
              </div>
            );
          })}
        </nav>

        <div style={s.footer}>
          {collapsed ? (
            <div style={s.avatarCollapsed} title={`${user?.name} (${user?.role})`}>
              {user?.name?.charAt(0) || 'U'}
            </div>
          ) : (
            <div style={s.userCard}>
              <div style={s.avatar}>{user?.name?.charAt(0) || 'U'}</div>
              <div style={s.userInfo}>
                <div style={s.userName}>{user?.name}</div>
                <div style={s.userRole}>{user?.role}</div>
              </div>
              <button style={s.logoutIcon} onClick={handleLogout} title="Sign out">
                ↪ Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <div style={{ ...s.main, marginLeft: sidebarWidth }}>{children}</div>
    </div>
  );
}

const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#F7F5F1', fontFamily: 'Segoe UI, system-ui, sans-serif' },
  sidebar: {
    background: '#FFFFFF',
    borderRight: '1px solid #EDE8E0',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    zIndex: 100,
    transition: 'width 0.15s ease',
    overflow: 'hidden',
  },
  brand: { padding: '16px 16px 14px', borderBottom: '1px solid #EDE8E0' },
  brandTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  brandTopCollapsed: { flexDirection: 'column', gap: '10px' },
  brandImg: { height: '48px', objectFit: 'contain' },
  brandMark: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#E8650A',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontWeight: '800',
    flexShrink: 0,
  },
  collapseBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid #EDE8E0',
    background: '#FAF8F5',
    color: '#777',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandDivider: { width: '100%', height: '1px', background: '#F0EBE2', margin: '12px 0 8px' },
  brandSub: { fontSize: '11px', fontWeight: '600', color: '#C4520A', letterSpacing: '0.8px', textTransform: 'uppercase' },

  nav: { flex: 1, padding: '16px 12px', overflowY: 'auto' },
  navLabel: { fontSize: '10px', fontWeight: '700', color: '#CCCCCC', letterSpacing: '1.2px', padding: '0 10px', marginBottom: '8px', textTransform: 'uppercase' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 10px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#777',
    cursor: 'pointer',
    marginBottom: '2px',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  navItemCollapsed: { justifyContent: 'center', padding: '10px 0' },
  navHover: { background: '#FAF8F5', color: '#1A1A1A' },
  navActive: { background: '#FFF0E6', color: '#C4520A', fontWeight: '600' },
  iconBox: {
    width: '28px',
    height: '28px',
    borderRadius: '7px',
    background: '#F5F3EF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    color: '#AAA',
    flexShrink: 0,
  },
  iconBoxActive: { background: '#FFDFC8', color: '#C4520A' },
  activeDot: { width: '5px', height: '5px', borderRadius: '50%', background: '#C4520A', position: 'absolute', right: '10px' },

  footer: { padding: '12px', borderTop: '1px solid #EDE8E0' },
  userCard: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: '#FAF8F5', border: '1px solid #EDE8E0' },
  avatar: { width: '34px', height: '34px', borderRadius: '50%', background: '#E8650A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 },
  avatarCollapsed: { width: '34px', height: '34px', borderRadius: '50%', background: '#E8650A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', margin: '0 auto', cursor: 'default' },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: '13px', fontWeight: '600', color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: '11px', color: '#999' },
  logoutIcon: { background: 'transparent', border: 'none', fontSize: '15px', color: '#C4520A', cursor: 'pointer', padding: '4px', flexShrink: 0 },

  main: { flex: 1, minHeight: '100vh', transition: 'margin-left 0.15s ease' },
};