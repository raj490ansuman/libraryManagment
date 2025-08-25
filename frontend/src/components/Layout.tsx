import { Layout as AntLayout, Menu, Button, Typography, message } from "antd";
import {
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  MenuOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { ReactNode, useState, useEffect } from "react";
import api from "../api/api";
import "./MobileOptimizations.css";

const { Header, Sider, Content } = AntLayout;
const { Title, Text } = Typography;

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export const Layout = ({ children, title }: LayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(window.innerWidth <= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle body scroll lock
  useEffect(() => {
    if (isMobile && !collapsed) {
      document.body.classList.add('body-lock');
    } else {
      document.body.classList.remove('body-lock');
    }
    return () => document.body.classList.remove('body-lock');
  }, [isMobile, collapsed]);

  useEffect(() => {
    fetchUserProfile();
    
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/users/profile");
      setUser(response.data);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/users/logout");
      message.success("Logged out successfully.");
    } catch {
      message.info("Session ended.");
    }
    navigate("/login");
  };

  const menuItems = [
    {
      key: "dashboard",
      icon: <HomeOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      key: "books",
      icon: <BookOutlined />,
      label: "Browse Books",
      onClick: () => navigate("/books"),
    },
    {
      key: "my-borrowings",
      icon: <ClockCircleOutlined />,
      label: "My Borrowings",
      onClick: () => navigate("/my-borrowings"),
    },
    {
      key: "my-reservations",
      icon: <CheckCircleOutlined />,
      label: "My Reservations",
      onClick: () => navigate("/my-reservations"),
    },
    {
      key: "suggestions",
      icon: <BookOutlined />,
      label: "Book Suggestions",
      onClick: () => navigate("/suggestions"),
    },
  ];

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      {/* Mobile backdrop */}
      <div 
        className={`mobile-backdrop ${isMobile && !collapsed ? 'visible' : ''}`}
        onClick={() => setCollapsed(true)}
      />
      
      <Sider 
        width={250} 
        theme="dark"
        breakpoint="lg"
        collapsedWidth={isMobile ? 0 : 80}
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1001,
          transform: isMobile && collapsed ? 'translateX(-100%)' : 'translateX(0)',
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid #303030",
            overflow: "hidden",
          }}
        >
          <Title level={4} style={{ color: "white", margin: 0, whiteSpace: "nowrap" }}>
            {collapsed ? "LMS" : "Library Management"}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            padding: 16,
          }}
        >
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: "white", width: "100%" }}
          >
            {!collapsed && "Logout"}
          </Button>
        </div>
      </Sider>

      <AntLayout className="content-wrapper" style={{ 
        marginLeft: isMobile ? 0 : (collapsed ? 80 : 250),
        transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
        filter: isMobile && !collapsed ? 'blur(3px)' : 'none',
        opacity: isMobile && !collapsed ? 0.8 : 1,
        pointerEvents: isMobile && !collapsed ? 'none' : 'auto',
        transform: isMobile && !collapsed ? 'scale(0.98)' : 'none'
      }}>
        <Header
          style={{
            background: "#fff",
            padding: isMobile ? "0 12px" : "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 1,
            width: "100%",
            height: isMobile ? "56px" : "64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16 }}>
            <Button
              className="mobile-menu-button"
              type="text"
              icon={collapsed ? <MenuOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ 
                fontSize: isMobile ? '14px' : '16px',
                width: isMobile ? 48 : 64, 
                height: isMobile ? 48 : 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
              {title}
            </Title>
          </div>
          <div className="user-info" style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 8,
            maxWidth: isMobile ? '150px' : 'none'
          }}>
            <UserOutlined style={{ fontSize: isMobile ? '14px' : '16px' }} />
            {loading ? (
              <Text type="secondary">Loading...</Text>
            ) : user ? (
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                fontSize: isMobile ? '14px' : '16px'
              }}>
                {isMobile ? user.name : `Welcome, ${user.name}! (${user.role})`}
              </span>
            ) : (
              <span>Welcome back!</span>
            )}
          </div>
        </Header>

        <Content
          style={{
            margin: isMobile ? "8px" : "24px",
            marginTop: isMobile ? "12px" : "24px",
            background: "#f5f5f5",
            padding: isMobile ? "12px" : "24px",
            borderRadius: 8,
            minHeight: 280,
            overflow: "auto",
            maxWidth: "100%",
            transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          <div style={{
            maxWidth: "100%",
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
          }}>
            {children}
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
