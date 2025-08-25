import { useState } from "react";
import { Form, Input, Button, message, Card, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { AnimatedBackground } from "./AnimatedBackground";
import { useAuth } from "../contexts/AuthContext";

const { Title, Text } = Typography;

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      await login(values.email, values.password);
      message.success("Welcome back! You've been successfully logged in.");
      
      // Call the onLoginSuccess callback if provided
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error ||
        "Login failed. Please check your credentials.";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <AnimatedBackground />
      <Card 
        style={{ 
          width: "90%",
          maxWidth: 400, 
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ color: "#1890ff", marginBottom: 8 }}>
            Library Management
          </Title>
          <Text type="secondary">Welcome back</Text>
        </div>

        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
          <div style={{ display: "flex", justifyContent: "center" }}>
    <Button
      type="primary"
      htmlType="submit"
      size="large"
      loading={loading}
    >
      {loading ? "Logging in..." : "Log In"}
    </Button>
  </div>
          </Form.Item>

          <div style={{ textAlign: "center" }}>
            <Text type="secondary">
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "#1890ff" }}>
                Register here
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};
