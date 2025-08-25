import { useState, useEffect } from "react";
import { Table, Button, message, Card, Tag, Typography, Space } from "antd";
import { 
  UndoOutlined
} from "@ant-design/icons";
import api from "../api/api";
import { Layout } from "../components/Layout";

const { Text } = Typography;

interface Borrowing {
  id: number;
  book: {
    id: number;
    title: string;
    author: string;
  };
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
}

export const MyBorrowingsPage = () => {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBorrowings();
  }, []);

  const fetchBorrowings = async () => {
    try {
      const response = await api.get("/borrowings/my-borrowings");
      setBorrowings(response.data);
    } catch (err) {
      message.error({
        content: "❌ Failed to load your borrowings. Please try again.",
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (bookId: number) => {
    const borrowing = borrowings.find(b => b.book.id === bookId);
    const bookTitle = borrowing?.book.title || "Book";
    try {
      await api.post(`/borrowings/return/${bookId}`);
      message.success({
        content: ` Successfully returned "${bookTitle}"! Thank you for using our library.`,
        duration: 5,
      });
      fetchBorrowings();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to return book";
      message.error({
        content: ` ${errorMsg}`,
        duration: 4,
      });
    }
  };

  const columns = [
    {
      title: "Book",
      key: "book",
      render: (record: Borrowing) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{record.book.title}</div>
          <Text type="secondary">by {record.book.author}</Text>
        </div>
      ),
    },
    {
      title: "Borrowed Date",
      dataIndex: "borrowedAt",
      key: "borrowedAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date: string, record: Borrowing) => {
        const dueDate = new Date(date);
        const now = new Date();
        const isOverdue = dueDate < now && !record.returnedAt;
        
        return (
          <Space>
            <span>{dueDate.toLocaleDateString()}</span>
            {isOverdue && <Tag color="red">Overdue</Tag>}
          </Space>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (record: Borrowing) => {
        if (record.returnedAt) {
          return <Tag color="green">Returned</Tag>;
        }
        
        const dueDate = new Date(record.dueDate);
        const now = new Date();
        if (dueDate < now) {
          return <Tag color="red">Overdue</Tag>;
        }
        
        return <Tag color="blue">Borrowed</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (record: Borrowing) => {
        if (record.returnedAt) {
          return <Text type="secondary">Already returned</Text>;
        }
        
        return (
          <Button
            type="primary"
            icon={<UndoOutlined />}
            onClick={() => handleReturnBook(record.book.id)}
          >
            Return Book
          </Button>
        );
      },
    },
  ];

  return (
    <Layout title="My Borrowings" selectedKey="my-borrowings">
      <Card>
        <Table
          dataSource={borrowings}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} borrowings`
          }}
        />
      </Card>
    </Layout>
  );
};
