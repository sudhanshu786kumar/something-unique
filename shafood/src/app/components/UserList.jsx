export default function UserList({ users }) {
  return (
    <div className="space-y-4">
      {users.length === 0 ? (
        <p className="text-gray-500">No nearby users found.</p>
      ) : (
        users.map((user) => (
          <div key={user.id} className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
            <div>
              <h4 className="text-lg font-semibold">{user.name}</h4>
              <p className="text-sm text-gray-600">
                {user.isOrdering ? 'Currently ordering' : 'Available to order'}
              </p>
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded">
              Invite to Order
            </button>
          </div>
        ))
      )}
    </div>
  );
}
