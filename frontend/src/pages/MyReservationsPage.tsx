import { useState, useEffect } from "react";
import { Table, Button, message, Card, Tag, Typography } from "antd";
import { 
  BookOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { Layout } from "../components/Layout";

const { Title, Text } = Typography;

interface Reservation {
  id: number;
  book: {
    id: number;
    title: string;
    author: string;
    status: string;
  };
  createdAt: string;
  queuePosition: number;
}

export const MyReservationsPage = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await api.get("/reservations");
      setReservations(response.data);
    } catch (err) {
      message.error({
        content: "Failed to load your reservations. Please try again.",
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    const reservation = reservations.find(r => r.id === reservationId);
    const bookTitle = reservation?.book.title || "Book";
    try {
      await api.delete(`/reservations/${reservationId}`);
      message.success({
        content: `Reservation for "${bookTitle}" has been canceled successfully.`,
        duration: 5,
      });
      fetchReservations();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to cancel reservation";
      message.error({
        content: `${errorMsg}`,
        duration: 4,
      });
    }
  };

  const columns = [
    {
      title: "Book",
      key: "book",
      render: (record: Reservation) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{record.book.title}</div>
          <Text type="secondary">by {record.book.author}</Text>
        </div>
      ),
    },
    {
      title: "Book Status",
      key: "bookStatus",
      render: (record: Reservation) => {
        const status = record.book.status;
        if (status === "available") {
          return <Tag color="green">Available</Tag>;
        } else if (status === "borrowed") {
          return <Tag color="blue">Borrowed</Tag>;
        }
        return <Tag color="default">{status}</Tag>;
      },
    },
    {
      title: "Reserved Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Position in Queue",
      key: "position",
      render: (record: Reservation) => (
        <Tag color={record.queuePosition === 1 ? "green" : "blue"}>
          {record.queuePosition}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record: Reservation) => (
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleCancelReservation(record.id)}
        >
          Cancel Reservation
        </Button>
      ),
    },
  ];

  return (
    <Layout title="My Reservations">
      <Card>
        {reservations.length === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <BookOutlined style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }} />
            <Title level={4} type="secondary">No Reservations</Title>
            <Text type="secondary">
              You haven't made any reservations yet. 
              <br />
              Browse books to make your first reservation!
            </Text>
            <br />
            <Button 
              type="primary" 
              onClick={() => navigate("/books")}
              style={{ marginTop: 16 }}
            >
              Browse Books
            </Button>
          </div>
        ) : (
          <Table
            dataSource={reservations}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} reservations`
            }}
          />
        )}
      </Card>
    </Layout>
  );
};
