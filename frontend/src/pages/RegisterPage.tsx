import { Form, Input, Button, message, Card, Typography } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { AnimatedBackground } from "../components/AnimatedBackground";

const { Title, Text } = Typography;

export const RegisterPage = () => {
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      await api.post("/users/register", values);
      message.success(
        "Account created successfully! Please login with your credentials."
      );
      navigate("/login");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || "Registration failed. Please try again.";
      message.error(`${errorMsg}`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <AnimatedBackground />

      <Card style={{ width: 400, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ color: "#1890ff", marginBottom: 8 }}>
            Library Management
          </Title>
          <Text type="secondary">Create your account</Text>
        </div>

        <Form name="register" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="name"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Full Name"
              size="large"
            />
          </Form.Item>

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
            rules={[
              { required: true, message: "Please enter your password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Register
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center" }}>
            <Text type="secondary">
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#1890ff" }}>
                Login here
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};
