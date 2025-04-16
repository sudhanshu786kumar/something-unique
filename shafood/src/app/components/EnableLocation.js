import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const EnableLocation = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-orange-100 to-red-100 dark:from-gray-800 dark:to-black text-center">
    <div className="mb-6">
      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 dark:text-orange-400 text-6xl animate-bounce" />
    </div>
    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
      Location Services Disabled
    </h1>
    <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
      Please enable location services to access nearby features and improve your experience.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-lg"
    >
      Retry
    </button>
  </div>
  )
}

export default EnableLocation