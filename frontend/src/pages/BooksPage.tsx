import { useEffect, useState } from "react";
import { Table, Button, message, Card, Tag, Typography, Input, Space } from "antd";
import { 
  SearchOutlined,
  PlusOutlined
} from "@ant-design/icons";
import api from "../api/api";
import { ReserveButton } from "../components/ReserveButton";
import { Layout } from "../components/Layout";

const { Text } = Typography;
const { Search } = Input;

interface Book {
  id: number;
  title: string;
  author: string;
  status: string;
}

export const BooksPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await api.get("/books");
      setBooks(res.data);
      setFilteredBooks(res.data);
    } catch (err) {
      message.error("Failed to load books. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const borrowBook = async (id: number) => {
    const book = books.find(b => b.id === id);
    const bookTitle = book?.title || "Book";
    try {
      await api.post(`/borrowings/borrow/${id}`);
      message.success(`Successfully borrowed "${bookTitle}"! You can return it within 7 days.`);
      fetchBooks();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to borrow book";
      message.error(`${errorMsg}`);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value.trim()) {
      setFilteredBooks(books);
      return;
    }
    console.log(searchText);
    
    const filtered = books.filter(book => 
      book.title.toLowerCase().includes(value.toLowerCase()) ||
      book.author.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredBooks(filtered);

  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const getColumns = () => {
    const baseColumns = [
      {
        title: "Book",
        key: "book",
        render: (record: Book) => (
          <div>
            <div style={{ fontWeight: "bold", fontSize: isMobile ? "14px" : "16px" }}>{record.title}</div>
            <Text type="secondary" style={{ fontSize: isMobile ? "12px" : "14px" }}>by {record.author}</Text>
            {isMobile && (
              <div style={{ marginTop: 8 }}>
                {record.status === "available" ? (
                  <Tag color="green" style={{ fontSize: "12px" }}>Available</Tag>
                ) : record.status === "borrowed" ? (
                  <Tag color="blue" style={{ fontSize: "12px" }}>Borrowed</Tag>
                ) : (
                  <Tag color="default" style={{ fontSize: "12px" }}>{record.status}</Tag>
                )}
              </div>
            )}
          </div>
        ),
      },
    ];

    if (!isMobile) {
      baseColumns.push(
        {
          title: "Status",
          key: "status",
          render: (record: Book) => {
            const status = record.status;
            if (status === "available") {
              return <Tag color="green" style={{ fontSize: "12px" }}>Available</Tag>;
            } else if (status === "borrowed") {
              return <Tag color="blue" style={{ fontSize: "12px" }}>Borrowed</Tag>;
            }
            return <Tag color="default" style={{ fontSize: "12px" }}>{status}</Tag>;
          },
        }
      );
    }

    baseColumns.push({
      title: "Action",
      key: "action",
      render: (record: Book) => (
        <Space direction={isMobile ? "vertical" : "horizontal"} size={isMobile ? 8 : "small"} style={{ width: "100%" }}>
          <Button
            type="primary"
            onClick={() => borrowBook(record.id)}
            disabled={record.status !== "available"}
            icon={<PlusOutlined />}
            size={isMobile ? "middle" : "middle"}
            style={{ width: isMobile ? "100%" : "auto" }}
          >
            Borrow
          </Button>

          {record.status === "borrowed" && (
            <ReserveButton 
              bookId={record.id} 
              onReserved={() => fetchBooks()} 
              style={{ width: isMobile ? "100%" : "auto" }}
            />
          )}
        </Space>
      ),
    });

    return baseColumns;
  };

  return (
    <Layout title="Browse Books" selectedKey="books">
      <Card bodyStyle={{ padding: isMobile ? 12 : 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="Search books by title or author..."
            allowClear
            enterButton={<SearchOutlined />}
            size={isMobile ? "middle" : "large"}
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: "100%", maxWidth: isMobile ? "100%" : 400 }}
          />
        </div>
        
        <Table
          dataSource={filteredBooks}
          columns={getColumns()}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: isMobile ? 5 : 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            simple: isMobile,
            showTotal: isMobile ? undefined : (total, range) => 
              `${range[0]}-${range[1]} of ${total} books`
          }}
          scroll={{ x: isMobile ? 'max-content' : undefined }}
        />
      </Card>
    </Layout>
  );
};
