import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import ChatPageContent from '../components/ChatPageContent';
import Layout from '../components/Layout';
import { authOptions } from '../api/auth/[...nextauth]/route';

const ChatPage = async ({ searchParams }) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/dashboard');
  }

  const users = searchParams.users ? JSON.parse(searchParams.users) : [];

  // Validate users data
  const validUsers = users.filter(user => 
    typeof user === 'object' && 
    user !== null && 
    typeof user.id === 'string' && 
    typeof user.name === 'string'
  );

  return (
    <Layout>
      <ChatPageContent initialSelectedUsers={validUsers} />
    </Layout>
  );
};

export default ChatPage;
