
import { Providers } from '../providers'
import Dashboard from './Dashboard'
import EnableLocation from '../components/EnableLocation';
import useGeolocation from '../hooks/useGeolocation';
export default function Page() {
  const location = useGeolocation;
 console.log(location)
  return (
    <Providers>
    
        <Dashboard />
      {/* ) : (
       <EnableLocation/>
      )} */}
    </Providers>
  );
}