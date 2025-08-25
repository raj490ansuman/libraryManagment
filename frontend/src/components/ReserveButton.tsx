import { Button, message } from "antd";
import { BookOutlined } from "@ant-design/icons";
import api from "../api/api";

interface ReserveButtonProps {
  bookId: number;
  onReserved?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export const ReserveButton = ({ bookId, onReserved, style, className }: ReserveButtonProps) => {
  const handleReserve = async () => {
    try {
      await api.post(`/reservations/${bookId}`);
      message.success(
        "Book reserved successfully! You'll be notified when it's available."
      );
      if (onReserved) onReserved();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to reserve book";
      message.error(`${errorMsg}`);
    }
  };

  return (
    <Button 
      type="default" 
      onClick={handleReserve} 
      icon={<BookOutlined />}
      style={style}
      className={className}
    >
      Reserve
    </Button>
  );
};
