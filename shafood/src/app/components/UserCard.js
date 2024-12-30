const UserCard = ({ user, ...props }) => {
  return (
    <div className="...">
      <div className="relative">
        {user.image ? (
          <img 
            src={user.image} 
            alt={user.name} 
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = generateRandomAvatar(user.email); // Fallback
            }}
          />
        ) : (
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faUser} className="text-orange-500" />
          </div>
        )}
        {/* ... rest of the component */}
      </div>
    </div>
  );
};

export default UserCard; 