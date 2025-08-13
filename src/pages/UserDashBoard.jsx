import { useParams } from 'react-router-dom';

function UserDashboard() {
  const { userId } = useParams();


  return (
    <>
      <h1>User Dashboard for {userId}</h1>
    </>
  );
}


export default UserDashboard;


