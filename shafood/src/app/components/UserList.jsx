export default function UserList({ users }) {
  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Nearby Users</h2>
      <ul className="divide-y divide-gray-200">
        {users.map((user) => (
          <li key={user.id} className="py-4 flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">Lat: {user.lat.toFixed(6)}, Lng: {user.lng.toFixed(6)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
