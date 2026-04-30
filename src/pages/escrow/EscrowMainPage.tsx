import { Link } from 'react-router-dom'
import { Shield, FileText, ArrowRight } from 'lucide-react'

export default function EscrowMainPage() {
  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Shield className="text-primary-600" size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2"> </h1>
        <p className="text-gray-600 text-sm">
                 .
        </p>
      </div>

      <div className="space-y-4">
        <Link to="/escrow/apply">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-primary-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1"> </h2>
                  <p className="text-sm text-gray-600">
                      
                  </p>
                </div>
              </div>
              <ArrowRight className="text-gray-400" size={20} />
            </div>
          </div>
        </Link>

        <Link to="/escrow/list">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1"> </h2>
                  <p className="text-sm text-gray-600">
                      
                  </p>
                </div>
              </div>
              <ArrowRight className="text-gray-400" size={20} />
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-3"> </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">·</span>
            <span>  .</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">·</span>
            <span>  .</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">·</span>
            <span>  .</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
