import { Link } from 'react-router-dom';
import { BriefcaseIcon } from 'lucide-react';

/**
 * Top navigation bar shown on all pages.
 */
export default function NavBar() {
  return (
    <nav className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900 hover:text-gray-700">
          <BriefcaseIcon className="w-5 h-5" />
          Recruit Talent
        </Link>
      </div>
    </nav>
  );
}
