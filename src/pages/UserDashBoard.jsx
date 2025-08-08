import { useParams } from 'react-router-dom';
import DebugDexieData from "../dixie/DebugDexieData";

function UserDashboard() {
  const { userId } = useParams();


  return (
    <>
      <h1>User Dashboard for {userId}</h1>;
      <DebugDexieData />
    </>
  );
}


export default UserDashboard;


