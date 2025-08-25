import { List, Typography, Avatar, Card } from 'antd';
import './ActivityFeed.css';
import { BookOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import api from '../api/api';

const { Text } = Typography;

interface Activity {
  id: number;
  type: string;
  bookId: number;
  bookTitle: string;
  details: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'CHECKOUT':
      return <BookOutlined style={{ color: '#1890ff' }} />;
    case 'RETURN':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'RESERVATION':
      return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    case 'SUGGESTION':
      return <BookOutlined style={{ color: '#722ed1' }} />;
    default:
      return <UserOutlined />;
  }
};

const getActivityDescription = (activity: Activity) => {
  const userName = activity.user?.name || 'A user';
  const bookTitle = activity.bookTitle ? `"${activity.bookTitle}"` : 'a book';
  
  switch (activity.type) {
    case 'CHECKOUT':
      return `${userName} borrowed ${bookTitle}`;
    case 'RETURN':
      return `${userName} returned ${bookTitle}`;
    case 'RESERVATION':
      return `${userName} reserved ${bookTitle}`;
    case 'SUGGESTION':
      return activity.details || `${userName} suggested ${bookTitle}`;
    case 'SYSTEM':
      return activity.details;
    default:
      return activity.details || 'Activity completed';
  }
};

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.get('/activities');
        setActivities(response.data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <Card 
      title="Recent Activity" 
      styles={{
        body: {
          flex: 1,
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
      style={{ 
        height: 300,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ 
        height: '100%',
        overflowY: 'auto',
        padding: '0 16px'
      }}>
        <List
          loading={loading}
          itemLayout="horizontal"
          dataSource={activities}
          renderItem={(activity) => (
            <List.Item 
              style={{
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
              className="activity-item"
            >
              <List.Item.Meta
                avatar={
                  <Avatar style={{ 
                    backgroundColor: '#f0f2f5',
                    color: activity.type === 'CHECKOUT' ? '#1890ff' : 
                           activity.type === 'RETURN' ? '#52c41a' : 
                           activity.type === 'RESERVATION' ? '#faad14' : '#8c8c8c'
                  }}>
                    {getActivityIcon(activity.type)}
                  </Avatar>
                }
                title={
                  <div style={{ lineHeight: 1.4 }}>
                    <div>{getActivityDescription(activity)}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(activity.createdAt).toLocaleString()}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </Card>
  );
};
