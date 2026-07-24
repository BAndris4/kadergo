import React from "react";
import { BriefcaseIcon, UserGroupIcon } from "@heroicons/react/24/outline";

interface StatsGridProps {
  fopCount: number;
  workerCount: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ fopCount, workerCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
      {/* Deep Teal Banner Card */}
      <div className="relative overflow-hidden flex items-center justify-between p-7.5 rounded-[28px] bg-[#133b47] text-white shadow-xl shadow-[#133b47]/20 border border-[#0f313c]">
        <div className="flex items-center gap-5 z-10">
          <div className="w-15 h-15 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
            <BriefcaseIcon className="w-8 h-8 text-[#f8a44c] stroke-[2.2]" />
          </div>
          <div>
            <div className="text-4xl font-black font-heading text-white">{fopCount}</div>
            <div className="text-sm font-bold text-[#b0ced4] mt-0.5">Зареєстровані ФОП</div>
          </div>
        </div>

        
        {/* Decorative background circle */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full border-[22px] border-white/5 pointer-events-none" />
      </div>

      {/* Soft Cream Banner Card */}
      <div className="relative overflow-hidden flex items-center justify-between p-7.5 rounded-[28px] bg-[#fdf3e7] border-2 border-[#f6dfc7] text-[#133b47] shadow-lg shadow-black/5">
        <div className="flex items-center gap-5 z-10">
          <div className="w-15 h-15 rounded-2xl bg-[#f8a44c]/20 flex items-center justify-center">
            <UserGroupIcon className="w-8 h-8 text-[#133b47] stroke-[2.2]" />
          </div>
          <div>
            <div className="text-4xl font-black font-heading text-[#133b47]">{workerCount}</div>
            <div className="text-sm font-bold text-[#57727c] mt-0.5">Всього працівників</div>
          </div>
        </div>

      </div>
    </div>
  );
};
