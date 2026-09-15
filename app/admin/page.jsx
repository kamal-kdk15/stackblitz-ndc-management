'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/layout.jsx';

const adminSections = [
  {
    href: '/admin/users',
    icon: '♙',
    title: 'User Management',
    description: 'Create, edit, deactivate, and manage system accounts.',
  },
  {
    href: '/admin/sessions',
    icon: '⚿',
    title: 'Active Sessions',
    description: 'Monitor signed-in users and force sign-out when required.',
  },
  {
    href: '/admin/config',
    icon: '⚙',
    title: 'System Config',
    description: 'Manage labeler code and NDC generation configuration.',
  },
];

export default function AdminHubPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    admins: 0,
    activeSessions: 0,
  });

  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          if (data.user.role !== 'Admin') {
            router.push('/dashboard');
            return;
          }

          setUser(data.user);
          fetchStats();
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'));
  }, []);

  async function fetchStats() {
    try {
      const [usersRes, sessionsRes] = await Promise.all([
        fetch('/api/admin/users', { cache: 'no-store' }),
        fetch('/api/admin/sessions', { cache: 'no-store' }),
      ]);

      const usersData = await usersRes.json();
      const sessionsData = await sessionsRes.json();

      const userList = usersData.success ? usersData.data : [];
      const sessionList = sessionsData.success ? sessionsData.data : [];
     console.log('Fetched users:', userList);

      setUsers(userList);
      setSessions(sessionList);

     setStats({
  totalUsers: userList.length,

  activeUsers: userList.filter((u) => u.isActive).length,

  admins: userList.filter(
    (u) => String(u.role || '').toUpperCase() === 'ADMIN'
  ).length,

  activeSessions: sessionList.length,
});
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  }

const spocCount = users.filter(
  (u) => String(u.role || '').toUpperCase() === 'SPOC'
).length;

  const viewerCount = users.filter(
    (u) => String(u.role || '').toUpperCase() === 'VIEWER'
  ).length;

  const inactiveUsers = stats.totalUsers - stats.activeUsers;

  const activePercent =
    stats.totalUsers > 0
      ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
      : 0;

  const adminPercent =
    stats.totalUsers > 0
      ? Math.round((stats.admins / stats.totalUsers) * 100)
      : 0;

  const spocPercent =
    stats.totalUsers > 0
      ? Math.round((spocCount / stats.totalUsers) * 100)
      : 0;

  const viewerPercent =
    stats.totalUsers > 0
      ? Math.round((viewerCount / stats.totalUsers) * 100)
      : 0;

  const recentUsers = [...users]
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      return dateB - dateA;
    })
    .slice(0, 5);

  /*
   * Build a simple 7-day user creation chart.
   * No chart library needed.
   */
  const activityDays = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = users.filter((u) => {
      const created = new Date(u.created_at || u.createdAt || 0);
      return created >= date && created < nextDate;
    }).length;

    activityDays.push({
      label: date.toLocaleDateString('en-US', {
        weekday: 'short',
      }),
      count,
    });
  }

  const maxActivity = Math.max(
    ...activityDays.map((day) => day.count),
    1
  );

  if (!user) return null;

  return (
    <Layout current="/admin">
      <div style={s.page}>

        {/* HEADER */}
        <div style={s.pageHead}>
          <div>
            <div style={s.eyebrow}>SYSTEM ADMINISTRATION</div>

            <h1 style={s.pageTitle}>Admin Dashboard</h1>

            <p style={s.pageSub}>
              Monitor users, sessions, and system activity across NDC Management.
            </p>
          </div>

          <button
            style={s.refreshBtn}
            onClick={fetchStats}
          >
            ↻ Refresh
          </button>
        </div>


        {/* KPI CARDS */}
        <div style={s.statsRow}>

          <div
            style={s.statCard}
            onClick={() => router.push('/admin/users')}
          >
            <div style={s.statTop}>
              <span style={s.statLabel}>TOTAL USERS</span>
              <span style={s.statIcon}>♙</span>
            </div>

            <div style={s.statNum}>
              {stats.totalUsers}
            </div>

            <div style={s.statBottom}>
              System accounts
            </div>
          </div>


          <div
            style={s.statCard}
        onClick={() => router.push('/admin/users?status=active')}
          >
            <div style={s.statTop}>
              <span style={s.statLabel}>ACTIVE USERS</span>
              <span style={s.statusDot}></span>
            </div>

            <div style={{ ...s.statNum, color: '#2D6A4F' }}>
              {stats.activeUsers}
            </div>

            <div style={s.statBottom}>
              {activePercent}% of all users active
            </div>
          </div>


          <div
            style={s.statCard}
          onClick={() => router.push('/admin/users?role=Admin')}
          >
            <div style={s.statTop}>
              <span style={s.statLabel}>ADMINISTRATORS</span>
              <span style={s.statIcon}>⚙</span>
            </div>

            <div style={{ ...s.statNum, color: '#C4520A' }}>
              {stats.admins}
            </div>

            <div style={s.statBottom}>
              {adminPercent}% of user accounts
            </div>
          </div>


          <div
            style={s.statCard}
            onClick={() => router.push('/admin/sessions')}
          >
            <div style={s.statTop}>
              <span style={s.statLabel}>ACTIVE SESSIONS</span>
              <span style={s.liveBadge}>LIVE</span>
            </div>

            <div style={s.statNum}>
              {stats.activeSessions}
            </div>

            <div style={s.statBottom}>
              Currently signed in
            </div>
          </div>

        </div>


        {/* MAIN ANALYTICS */}
        <div style={s.analyticsGrid}>

          {/* USER ACTIVITY */}
          <div style={s.panel}>

            <div style={s.panelHead}>
              <div>
                <div style={s.panelTitle}>
                  User Creation Activity
                </div>

                <div style={s.panelSub}>
                  New accounts created over the last 7 days
                </div>
              </div>

              <div style={s.periodLabel}>
                LAST 7 DAYS
              </div>
            </div>


            <div style={s.chartArea}>

              <div style={s.chartYAxis}>
                <span>{maxActivity}</span>
                <span>{Math.ceil(maxActivity / 2)}</span>
                <span>0</span>
              </div>

              <div style={s.chart}>

                <div style={s.gridLine}></div>
                <div style={{ ...s.gridLine, top: '50%' }}></div>
                <div style={{ ...s.gridLine, top: '100%' }}></div>

                <div style={s.bars}>
                  {activityDays.map((day, index) => {
                    const height =
                      day.count === 0
                        ? 4
                        : Math.max(
                            (day.count / maxActivity) * 100,
                            8
                          );

                    return (
                      <div
                        key={index}
                        style={s.barColumn}
                      >
                        <div style={s.barValue}>
                          {day.count > 0 ? day.count : ''}
                        </div>

                        <div
                          style={{
                            ...s.bar,
                            height: `${height}%`,
                          }}
                        ></div>

                        <div style={s.barLabel}>
                          {day.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>

          </div>


          {/* ROLE DISTRIBUTION */}
          <div style={s.panel}>

            <div style={s.panelHead}>
              <div>
                <div style={s.panelTitle}>
                  User Distribution
                </div>

                <div style={s.panelSub}>
                  Accounts by system role
                </div>
              </div>
            </div>


            <div style={s.roleContent}>

              <div style={s.roleCenter}>
                <div style={s.roleTotal}>
                  {stats.totalUsers}
                </div>

                <div style={s.roleTotalLabel}>
                  USERS
                </div>
              </div>


              <div style={s.roleList}>

                <RoleRow
                  label="Admin"
                  count={stats.admins}
                  percent={adminPercent}
                />

                <RoleRow
                  label="Spoc"
                  count={spocCount}
                  percent={spocPercent}
                />

                <RoleRow
                  label="Viewer"
                  count={viewerCount}
                  percent={viewerPercent}
                />

              </div>

            </div>

          </div>

        </div>


        {/* SECOND ROW */}
        <div style={s.bottomGrid}>

          {/* RECENT USERS */}
          <div style={s.panel}>

            <div style={s.panelHead}>
              <div>
                <div style={s.panelTitle}>
                  Recent Users
                </div>

                <div style={s.panelSub}>
                  Recently created system accounts
                </div>
              </div>

              <button
                style={s.viewBtn}
                onClick={() => router.push('/admin/users')}
              >
                View all →
              </button>
            </div>


            <div>

              {recentUsers.length === 0 ? (
                <div style={s.empty}>
                  No users available.
                </div>
              ) : (
                recentUsers.map((item, index) => (

                  <div
                    key={item.id || index}
                    style={{
                      ...s.userRow,
                      borderBottom:
                        index === recentUsers.length - 1
                          ? 'none'
                          : '1px solid #F3EFE9',
                    }}
                  >

                    <div style={s.userLeft}>

                      <div style={s.avatar}>
                        {(item.name || item.username || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <div style={s.userName}>
                          {item.name ||
                            item.username ||
                            'Unknown User'}
                        </div>

                        <div style={s.userEmail}>
                          {item.email || 'No email available'}
                        </div>

                      </div>

                    </div>


                    <div style={s.userRight}>

                      <span
                        style={{
                          ...s.roleBadge,
                          ...(item.role === 'Admin'
                            ? s.adminBadge
                            : item.role === 'Spoc'
                              ? s.spocBadge
                              : s.viewerBadge),
                        }}
                      >
                        {item.role || 'User'}
                      </span>

                      <span
                        style={{
                          ...s.activeBadge,
                          color: item.isActive
                            ? '#2D6A4F'
                            : '#999',
                        }}
                      >
                        ● {item.isActive ? 'Active' : 'Inactive'}
                      </span>

                    </div>

                  </div>

                ))
              )}

            </div>

          </div>


          {/* SYSTEM STATUS */}
          <div style={s.panel}>

            <div style={s.panelHead}>
              <div>
                <div style={s.panelTitle}>
                  System Status
                </div>

                <div style={s.panelSub}>
                  Current application health
                </div>
              </div>
            </div>


            <div style={s.statusList}>

              <StatusRow
                label="User Management"
                detail={`${stats.totalUsers} accounts`}
              />

              <StatusRow
                label="Authentication"
                detail={`${stats.activeSessions} active sessions`}
              />

              <StatusRow
                label="Session Management"
                detail="Operational"
              />

              <StatusRow
                label="NDC Management"
                detail="Operational"
              />

            </div>


            <div style={s.systemFooter}>
              <span style={s.greenDot}></span>

              All monitored services operational
            </div>

          </div>

        </div>


        {/* QUICK ACTIONS */}
        <div style={s.sectionHeader}>
          <div>
            <div style={s.sectionLabel}>
              Administration
            </div>

            <div style={s.sectionSub}>
              Manage system configuration and access
            </div>
          </div>
        </div>


        <div style={s.actionGrid}>

          {adminSections.map((section) => (

            <div
              key={section.href}
              style={s.actionCard}
              onClick={() => router.push(section.href)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#E8650A';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#EDE8E0';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >

              <div style={s.actionIcon}>
                {section.icon}
              </div>

              <div style={s.actionContent}>

                <div style={s.actionTitle}>
                  {section.title}
                </div>

                <div style={s.actionDesc}>
                  {section.description}
                </div>

              </div>

              <div style={s.actionArrow}>
                →
              </div>

            </div>

          ))}

        </div>

      </div>
    </Layout>
  );
}


/* ------------------------------------------------ */
/* SMALL COMPONENTS */
/* ------------------------------------------------ */

function RoleRow({ label, count, percent }) {
  return (
    <div style={s.roleRow}>

      <div style={s.roleRowTop}>
        <span style={s.roleLabel}>
          {label}
        </span>

        <span style={s.roleCount}>
          {count}
        </span>
      </div>

      <div style={s.roleTrack}>
        <div
          style={{
            ...s.roleFill,
            width: `${percent}%`,
          }}
        ></div>
      </div>

    </div>
  );
}


function StatusRow({ label, detail }) {
  return (
    <div style={s.statusRow}>

      <div style={s.statusLeft}>

        <span style={s.greenDot}></span>

        <span style={s.statusLabel}>
          {label}
        </span>

      </div>

      <span style={s.statusDetail}>
        {detail}
      </span>

    </div>
  );
}


/* ------------------------------------------------ */
/* STYLES */
/* ------------------------------------------------ */

const s = {

  page: {
    padding: '30px 32px 40px',
  },

  pageHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid #EDE8E0',
  },

  eyebrow: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#C4520A',
    letterSpacing: '1px',
    marginBottom: '7px',
  },

  pageTitle: {
    fontSize: '25px',
    fontWeight: '700',
    color: '#1A1A1A',
    margin: '0 0 5px',
    letterSpacing: '-0.4px',
  },

  pageSub: {
    fontSize: '13px',
    color: '#999',
    margin: 0,
  },

  refreshBtn: {
    padding: '8px 13px',
    background: 'white',
    border: '1px solid #EDE8E0',
    borderRadius: '7px',
    color: '#666',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },


  /* KPI */

  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },

  statCard: {
    background: 'white',
    border: '1px solid #EDE8E0',
    borderRadius: '10px',
    padding: '16px 18px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  statTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '13px',
  },

  statLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: '0.5px',
  },

  statIcon: {
    fontSize: '14px',
    color: '#C4520A',
  },

  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#2D6A4F',
    display: 'inline-block',
  },

  liveBadge: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#2D6A4F',
    background: '#EEF7F1',
    padding: '3px 6px',
    borderRadius: '4px',
    letterSpacing: '0.4px',
  },

  statNum: {
    fontSize: '27px',
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: '1',
    marginBottom: '7px',
  },

  statBottom: {
    fontSize: '11px',
    color: '#AAA',
  },


  /* PANELS */

  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },

  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '16px',
    marginBottom: '28px',
  },

  panel: {
    background: 'white',
    border: '1px solid #EDE8E0',
    borderRadius: '10px',
    overflow: 'hidden',
  },

  panelHead: {
    padding: '15px 18px',
    borderBottom: '1px solid #F0EBE2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  panelTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1A1A1A',
  },

  panelSub: {
    fontSize: '11px',
    color: '#AAA',
    marginTop: '4px',
  },

  periodLabel: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: '0.5px',
  },


  /* BAR CHART */

  chartArea: {
    height: '210px',
    display: 'flex',
    padding: '18px 18px 12px',
  },

  chartYAxis: {
    width: '25px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingBottom: '24px',
    fontSize: '9px',
    color: '#BBB',
    textAlign: 'right',
  },

  chart: {
    flex: 1,
    position: 'relative',
    marginLeft: '8px',
    marginBottom: '8px',
  },

  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderTop: '1px solid #F3EFE9',
  },

  bars: {
    position: 'absolute',
    inset: '0 0 0 0',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: '10px',
  },

  barColumn: {
    height: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },

  bar: {
    width: '24px',
    minHeight: '4px',
    background: '#E8650A',
    borderRadius: '4px 4px 2px 2px',
    marginBottom: '7px',
    transition: 'height 0.3s ease',
  },

  barValue: {
    height: '14px',
    fontSize: '9px',
    color: '#999',
    marginBottom: '2px',
  },

  barLabel: {
    fontSize: '9px',
    color: '#AAA',
  },


  /* ROLES */

  roleContent: {
    padding: '22px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '25px',
    minHeight: '167px',
  },

  roleCenter: {
    width: '105px',
    height: '105px',
    borderRadius: '50%',
    border: '9px solid #FFF0E6',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  roleTotal: {
    fontSize: '25px',
    fontWeight: '800',
    color: '#1A1A1A',
  },

  roleTotalLabel: {
    fontSize: '8px',
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: '0.5px',
  },

  roleList: {
    flex: 1,
  },

  roleRow: {
    marginBottom: '13px',
  },

  roleRowTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
  },

  roleLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#555',
  },

  roleCount: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#1A1A1A',
  },

  roleTrack: {
    height: '5px',
    background: '#F1EDE7',
    borderRadius: '3px',
    overflow: 'hidden',
  },

  roleFill: {
    height: '100%',
    background: '#E8650A',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },


  /* USERS */

  userRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
  },

  userLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: '#FFF0E6',
    color: '#C4520A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
  },

  userName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#1A1A1A',
  },

  userEmail: {
    fontSize: '10px',
    color: '#AAA',
    marginTop: '2px',
  },

  userRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  roleBadge: {
    fontSize: '9px',
    fontWeight: '700',
    padding: '4px 7px',
    borderRadius: '4px',
  },

  adminBadge: {
    background: '#FFF0E6',
    color: '#C4520A',
  },

  spocBadge: {
    background: '#F4F0EA',
    color: '#806B56',
  },

  viewerBadge: {
    background: '#F1F3F4',
    color: '#777',
  },

  activeBadge: {
    fontSize: '10px',
    fontWeight: '600',
  },

  viewBtn: {
    border: 'none',
    background: 'transparent',
    color: '#E8650A',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  empty: {
    padding: '30px 18px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#AAA',
  },


  /* SYSTEM */

  statusList: {
    padding: '6px 18px',
  },

  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #F3EFE9',
  },

  statusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
  },

  greenDot: {
    width: '7px',
    height: '7px',
    background: '#2D6A4F',
    borderRadius: '50%',
    display: 'inline-block',
  },

  statusLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#444',
  },

  statusDetail: {
    fontSize: '10px',
    color: '#AAA',
  },

  systemFooter: {
    margin: '8px 18px 16px',
    padding: '9px 10px',
    background: '#F5F8F5',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    fontSize: '10px',
    color: '#527260',
    fontWeight: '600',
  },


  /* QUICK ACTIONS */

  sectionHeader: {
    marginBottom: '12px',
  },

  sectionLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
  },

  sectionSub: {
    fontSize: '11px',
    color: '#AAA',
    marginTop: '3px',
  },

  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },

  actionCard: {
    background: 'white',
    border: '1px solid #EDE8E0',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  actionIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    background: '#FFF0E6',
    color: '#C4520A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '17px',
    flexShrink: 0,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: '3px',
  },

  actionDesc: {
    fontSize: '10px',
    lineHeight: '1.45',
    color: '#AAA',
  },

  actionArrow: {
    fontSize: '15px',
    color: '#BBB',
  },
};