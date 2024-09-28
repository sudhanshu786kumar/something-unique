import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const NearbyUsersList = ({ nearbyUsers, onAddUser, onClose }) => (
  <div className="absolute inset-0 bg-white dark:bg-gray-800 z-10 p-4">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">Add Users to Chat</h3>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
    <ul className="space-y-2">
      {nearbyUsers.map(user => (
        <li key={user.id} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
          <span>{user.name}</span>
          <button 
            onClick={() => onAddUser(user.id)} 
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            Add
          </button>
        </li>
      ))}
    </ul>
  </div>
);

export default NearbyUsersList;
