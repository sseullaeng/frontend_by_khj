import { useNavigate } from 'react-router-dom'
import { ClipboardList, FilePlus } from 'lucide-react'

export default function EscrowHubPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">거래 대행</h1>
      <p className="text-gray-500 text-sm mb-10">
        타 플랫폼 거래도 쓸랭이 안전하게 대행해 드립니다.
      </p>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/escrow/apply')}
          className="flex items-center gap-5 p-6 bg-white border-2 border-primary-500 rounded-2xl hover:bg-primary-50 transition-colors text-left group"
        >
          <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors shrink-0">
            <FilePlus size={28} className="text-primary-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 mb-1">대행 신청</p>
            <p className="text-sm text-gray-500">
              상대방과 함께 대행 서비스를 신청합니다.
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate('/escrow/list')}
          className="flex items-center gap-5 p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-colors text-left group"
        >
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors shrink-0">
            <ClipboardList size={28} className="text-gray-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 mb-1">신청 목록</p>
            <p className="text-sm text-gray-500">
              신청하거나 진행 중인 대행 서비스를 확인합니다.
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
