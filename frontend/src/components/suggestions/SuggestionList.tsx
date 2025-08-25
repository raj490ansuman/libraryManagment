import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, message, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, LikeOutlined, LikeFilled, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Suggestion, 
  getSuggestions, 
  createSuggestion, 
  voteForSuggestion,
  updateSuggestionStatus,
  deleteSuggestion
} from '../../api/suggestionService';

const { confirm } = Modal;

const { TextArea } = Input;
const { Option } = Select;

const SuggestionList: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [userVotes, setUserVotes] = useState<Record<number, boolean>>({});
  const [form] = Form.useForm();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [filterStatus] = useState<string>('all');

  useEffect(() => {
    fetchSuggestions();
  }, [filterStatus]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const data = await getSuggestions();
      // Filter by status if not 'all'
      const filtered = filterStatus === 'all' 
        ? data 
        : data.filter(s => s.status === filterStatus);
      
      // Update user votes state
      const votes: Record<number, boolean> = {};
      filtered.forEach(suggestion => {
        votes[suggestion.id] = suggestion.votes?.some(vote => vote.userId === user?.id) || false;
      });
      setUserVotes(votes);
      
      setSuggestions(filtered);
    } catch (error) {
      message.error('Failed to fetch suggestions');
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (suggestionId: number) => {
    if (!user) {
      message.warning('Please log in to vote');
      return;
    }
    
    try {
      const { voted } = await voteForSuggestion(suggestionId);
      // Update the UI based on the vote status
      setUserVotes(prev => ({
        ...prev,
        [suggestionId]: voted
      }));
      
      // Update the vote count immediately for better UX
      setSuggestions(prev => 
        prev.map(s => 
          s.id === suggestionId 
            ? { 
                ...s, 
                voteCount: voted ? s.voteCount + 1 : Math.max(0, s.voteCount - 1) 
              } 
            : s
        )
      );
    } catch (error) {
      message.error('Failed to process vote');
      console.error('Error voting:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      await createSuggestion({
        title: values.title,
        author: values.author,
        reason: values.reason
      });
      message.success('Suggestion submitted successfully!');
      setIsModalVisible(false);
      form.resetFields();
      fetchSuggestions();
    } catch (error: any) {
      if (error.response?.data?.error === 'This book has already been suggested') {
        message.warning('This book has already been suggested!');
      } else {
        message.error('Failed to submit suggestion');
      }
      console.error('Error submitting suggestion:', error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'orange', text: 'Pending' },
      APPROVED: { color: 'blue', text: 'Approved' },
      REJECTED: { color: 'red', text: 'Rejected' },
      PURCHASED: { color: 'green', text: 'Purchased' }
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: Suggestion, b: Suggestion) => a.title.localeCompare(b.title),
    },
    {
      title: 'Author',
      dataIndex: 'author',
      key: 'author',
      sorter: (a: Suggestion, b: Suggestion) => a.author.localeCompare(b.author),
    },
    {
      title: 'Suggested By',
      key: 'user',
      render: (record: Suggestion) => record.user?.name || 'Unknown',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: 'All', value: 'all' },
        { text: 'Pending', value: 'PENDING' },
        { text: 'Approved', value: 'APPROVED' },
        { text: 'Rejected', value: 'REJECTED' },
        { text: 'Purchased', value: 'PURCHASED' },
      ],
      onFilter: (value: any, record: Suggestion) => 
        value === 'all' ? true : record.status === value,
    },
    {
      title: 'Votes',
      key: 'votes',
      render: (record: Suggestion) => (
        <Space>
          <Button 
            type="text" 
            icon={userVotes[record.id] ? <LikeFilled style={{ color: '#1890ff' }} /> : <LikeOutlined />}
            onClick={() => handleVote(record.id)}
          >
            {record.voteCount}
          </Button>
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: Suggestion, b: Suggestion) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  // Add admin-only columns
  if (isAdmin) {
    columns.splice(4, 0, {
      title: 'Action',
      key: 'action',
      render: (record: Suggestion) => (
        <Space size="middle">
          <Select
            defaultValue={record.status}
            style={{ width: 120, marginRight: 8 }}
            onChange={(value) => handleStatusChange(record.id, value)}
          >
            <Option value="PENDING">Pending</Option>
            <Option value="APPROVED">Approve</Option>
            <Option value="REJECTED">Reject</Option>
            <Option value="PURCHASED">Purchased</Option>
          </Select>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record.id);
            }}
            title="Delete suggestion"
          />
        </Space>
      ),
    });
  }

  const handleStatusChange = async (suggestionId: number, status: string) => {
    try {
      await updateSuggestionStatus(suggestionId, status as any);
      message.success('Suggestion status updated');
      fetchSuggestions();
    } catch (error) {
      message.error('Failed to update suggestion status');
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = (suggestionId: number) => {
    confirm({
      title: 'Are you sure you want to delete this suggestion?',
      icon: <ExclamationCircleFilled />,
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'No, keep it',
      onOk: async () => {
        try {
          await deleteSuggestion(suggestionId);
          message.success('Suggestion deleted successfully');
          fetchSuggestions();
        } catch (error) {
          message.error('Failed to delete suggestion');
          console.error('Error deleting suggestion:', error);
        }
      },
    });
  };

  return (
    <div className="suggestion-list">
      <Card 
        title="Book Suggestions" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsModalVisible(true)}
          >
            Suggest a Book
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={suggestions} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Suggest a New Book"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okText="Submit Suggestion"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Book Title"
            rules={[{ required: true, message: 'Please enter the book title' }]}
          >
            <Input placeholder="Enter book title" />
          </Form.Item>
          
          <Form.Item
            name="author"
            label="Author"
            rules={[{ required: true, message: 'Please enter the author name' }]}
          >
            <Input placeholder="Enter author name" />
          </Form.Item>
          
          <Form.Item
            name="reason"
            label="Why do you recommend this book? (Optional)"
          >
            <TextArea rows={4} placeholder="Tell us why you think we should add this book to our collection" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SuggestionList;
