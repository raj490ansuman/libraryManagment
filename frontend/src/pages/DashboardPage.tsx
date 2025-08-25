import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Button, message } from "antd";
import { 
  BookOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { Layout } from "../components/Layout";

// const { Title } = Typography;

interface DashboardStats {
  totalBooks: number;
  borrowedBooks: number;
  activeReservations: number;
  overdueBooks: number;
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    borrowedBooks: 0,
    activeReservations: 0,
    overdueBooks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [booksRes, borrowingsRes, reservationsRes] = await Promise.all([
        api.get("/books"),
        api.get("/borrowings/my-borrowings"),
        api.get("/reservations")
      ]);

      const totalBooks = booksRes.data.length;
      const borrowedBooks = borrowingsRes.data.filter((b: any) => !b.returnedAt).length;
      const activeReservations = reservationsRes.data.length;
      const overdueBooks = borrowingsRes.data.filter((b: any) => {
        if (b.returnedAt) return false;
        const dueDate = new Date(b.dueDate);
        const now = new Date();
        return dueDate < now;
      }).length;

      setStats({
        totalBooks,
        borrowedBooks,
        activeReservations,
        overdueBooks
      });
    } catch (err) {
      message.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Dashboard">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Books"
              value={stats.totalBooks}
              prefix={<BookOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Borrowed Books"
              value={stats.borrowedBooks}
              prefix={<ClockCircleOutlined />}
              loading={loading}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Reservations"
              value={stats.activeReservations}
              prefix={<CheckCircleOutlined />}
              loading={loading}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overdue Books"
              value={stats.overdueBooks}
              prefix={<ClockCircleOutlined />}
              loading={loading}
              valueStyle={{ color: stats.overdueBooks > 0 ? "#ff4d4f" : "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions" style={{ height: 300 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Button 
                type="primary" 
                size="large" 
                icon={<BookOutlined />}
                onClick={() => navigate("/books")}
              >
                Browse All Books
              </Button>
              <Button 
                size="large" 
                icon={<ClockCircleOutlined />}
                onClick={() => navigate("/my-borrowings")}
              >
                View My Borrowings
              </Button>
              <Button 
                size="large" 
                icon={<CheckCircleOutlined />}
                onClick={() => navigate("/my-reservations")}
              >
                View My Reservations
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" style={{ height: 300 }}>
            <div style={{ color: "#666", textAlign: "center", padding: "40px 0" }}>
              <BookOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
              <p>No recent activity</p>
            </div>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};
