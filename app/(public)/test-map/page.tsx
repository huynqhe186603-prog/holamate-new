import { VietMapEmbed } from '@/components/shared/VietMapEmbed'

// Tọa độ trung tâm khu vực Hòa Lạc (Đại học Quốc gia HN)
const HOA_LAC_LAT = 21.0128
const HOA_LAC_LNG = 105.5277

export default function TestMapPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Test VietMap</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Khu vực Hòa Lạc — Đại học Quốc gia Hà Nội
      </p>

      {/* Full area map */}
      <div className="rounded-2xl overflow-hidden border border-neutral-200 aspect-[16/9] mb-8">
        <VietMapEmbed
          latitude={HOA_LAC_LAT}
          longitude={HOA_LAC_LNG}
          zoom={14}
          title="Khu vực Hòa Lạc"
        />
      </div>

      {/* Marker test */}
      <h2 className="text-base font-semibold text-neutral-800 mb-3">
        Test marker — điểm cụ thể
      </h2>
      <div className="rounded-2xl overflow-hidden border border-neutral-200 h-64">
        <VietMapEmbed
          latitude={21.0135}
          longitude={105.5255}
          zoom={17}
          title="Điểm hẹn mẫu"
        />
      </div>

      <div className="mt-6 rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-xs text-neutral-500 space-y-1">
        <p><span className="font-medium text-neutral-700">SDK:</span> @vietmap/vietmap-gl-js</p>
        <p><span className="font-medium text-neutral-700">Style:</span> tm (Street / Default)</p>
        <p><span className="font-medium text-neutral-700">Tọa độ:</span> {HOA_LAC_LAT}, {HOA_LAC_LNG}</p>
      </div>
    </div>
  )
}
